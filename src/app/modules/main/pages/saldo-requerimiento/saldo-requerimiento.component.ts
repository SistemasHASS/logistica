import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SaldoRequerimientoService } from '../../services/saldo-requerimiento.service';
import { NotificationService } from '@/app/shared/services/notification.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Usuario } from 'src/app/shared/interfaces/Tables';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

// Interfaces for type safety
interface Saldo {
  idSaldo: number;  // Changed to number to match service expectations
  item: string;
  descripcion: string;
  cantidadPendiente: number;
  estadoSaldo: string;
  requerimientoOrigen: string;
  familia: string;
  seleccionado?: boolean;
  idRequerimientoCompra?: number;
}

interface GrupoConsolidado {
  familia: string;
  item: string;
  descripcion?: string;
  cantidad: number;
  detalles: Saldo[];
}

@Component({
  selector: 'app-saldo-requerimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DialogModule,
    CheckboxModule,
  ],
  templateUrl: './saldo-requerimiento.component.html',
  styleUrls: ['./saldo-requerimiento.component.scss'],
})
export class SaldoRequerimientoComponent implements OnInit {
  loading = false;
  saldos: Saldo[] = [];
  filtroTexto = '';
  mostrarModal = false;
  listaConsolidada: GrupoConsolidado[] = [];
  private searchSubject = new Subject<string>();
  private selectionDebounce = new Map<number, boolean>(); // Track debounced selections

  usuario: Usuario = {
    id: '',
    sociedad: 0,
    idempresa: '',
    ruc: '',
    razonSocial: '',
    idProyecto: '',
    proyecto: '',
    documentoidentidad: '',
    usuario: '',
    clave: '',
    nombre: '',
    idrol: '',
    rol: '',
  };

  constructor(
    private saldoService: SaldoRequerimientoService,
    private dexieService: DexieService,
    private alertService: AlertService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      // The filtering is handled by the getter
    });
    
    await this.cargarUsuario();
    await this.cargarSaldos();
    await this.cargarItemsTemporales();
    
    // Verificar si viene por notificación de stock disponible
    const referrer = document.referrer;
    const esPorStock = referrer.includes('/main/') || window.location.search.includes('stock');
    
    // Mostrar notificación si hay saldos pendientes
    console.log('🔍 Verificando saldos:', { 
      cantidad: this.saldosFiltrados.length, 
      esPorStock 
    });
    
    if (this.saldosFiltrados.length > 0) {
      setTimeout(() => {
        console.log('📢 Mostrando notificación de saldos pendientes');
        if (esPorStock) {
          this.notificationService.success(
            '¡Stock Disponible! 📦',
            `Hay ${this.saldosFiltrados.length} ítems con stock disponible para consolidar.`,
            10000
          );
        } else {
          this.notificationService.info(
            'Saldos Pendientes',
            `Tienes ${this.saldosFiltrados.length} saldos pendientes por consolidar.`,
            8000
          );
        }
      }, 1000);
    } else if (esPorStock) {
      setTimeout(() => {
        console.log('📢 Mostrando notificación sin novedades');
        this.notificationService.info(
          'Sin Novedades',
          'No hay ítems con stock disponible en este momento.',
          5000
        );
      }, 1000);
    }
  }

  async cargarUsuario() {
    try {
      const usuarioActual = await this.dexieService.showUsuario();
      if (usuarioActual) {
        this.usuario = usuarioActual;
        console.log('Usuario cargado:', this.usuario);
      } else {
        console.warn('⚠️ No se encontró usuario en UserService.');
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario:', error);
    }
  }

  async cargarSaldos() {
    try {
      this.loading = true;
      const dni = this.usuario?.documentoidentidad?.trim();

      if (!dni) {
        this.alertService.showAlert(
          'Error',
          'No se encontró DNI del usuario',
          'error',
        );
        return;
      }

      console.log('DNI enviado:', dni);
      const response = await this.saldoService.listarMisSaldos(dni);
      this.saldos = Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error al cargar saldos:', error);
      this.alertService.showAlert('Error', 'No se pudo cargar saldos', 'error');
      this.saldos = [];
    } finally {
      this.loading = false;
    }
  }

  // Search with debounce
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  async cargarItemsTemporales() {
    try {
      const itemsTemporales = await this.dexieService.obtenerItemsTemporalesConsolidacion();
      
      // Marcar los saldos que están en la tabla temporal
      this.saldos.forEach(saldo => {
        saldo.seleccionado = itemsTemporales.some(item => item.idDetalle === saldo.idSaldo);
      });
      
      // Actualizar la lista consolidada con los items temporales
      const saldosSeleccionados = this.saldos.filter(s => s.seleccionado);
      this.listaConsolidada = this.agruparPorFamilia(saldosSeleccionados);
    } catch (error) {
      console.error('Error al cargar items temporales:', error);
    }
  }

  async seleccionarSaldo(saldo: Saldo) {
    // Check if this selection is already being processed
    if (this.selectionDebounce.has(saldo.idSaldo)) {
      return;
    }
    
    // Mark as processing
    this.selectionDebounce.set(saldo.idSaldo, true);
    
    try {
      if (saldo.seleccionado) {
        // Check if already exists before adding
        const existe = await this.dexieService.itemsTemporales
          .where('idDetalle')
          .equals(saldo.idSaldo)
          .first();
        
        if (!existe) {
          // Agregar a tabla temporal
          await this.dexieService.agregarItemTemporalConsolidacion({
            idDetalle: saldo.idSaldo, // Use idDetalle as expected by the table
            item: saldo.item,
            descripcion: saldo.descripcion,
            familia: saldo.familia,
            categoria: '', // Optional field
            cantidad: saldo.cantidadPendiente,
            unidad: 'UNIDAD', // Default unit
            tipoRequerimiento: 'CONSUMO', // Since it comes from a consumption requirement
            requerimientoOrigen: saldo.requerimientoOrigen,
            fechaCreacion: new Date().toISOString().split('T')[0],
            estadoDetalleConsolidacion: saldo.estadoSaldo,
            codigoItem: saldo.item,
            seleccionado: true
          });
        }
      } else {
        // Eliminar de tabla temporal
        await this.dexieService.eliminarItemTemporalConsolidacion(saldo.idSaldo);
      }
      
      // Actualizar lista consolidada
      const seleccionados = this.saldos.filter(s => s.seleccionado);
      this.listaConsolidada = this.agruparPorFamilia(seleccionados);
    } catch (error) {
      console.error('Error en seleccionarSaldo:', error);
      // Revert checkbox state on error
      saldo.seleccionado = !saldo.seleccionado;
    } finally {
      // Remove from debounce map after a short delay
      setTimeout(() => {
        this.selectionDebounce.delete(saldo.idSaldo);
      }, 300);
    }
  }

  get saldosFiltrados() {
    const visibles = this.saldos.filter((x) => x.estadoSaldo !== 'CONSOLIDADO');

    if (!this.filtroTexto) return visibles;

    return visibles.filter(
      (x) =>
        x.item?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        x.requerimientoOrigen
          ?.toLowerCase()
          .includes(this.filtroTexto.toLowerCase()),
    );
  }

  getEstadoClase(estado: string) {
    switch (estado) {
      case 'PENDIENTE':
        return 'badge pendiente-decision';
      case 'ESPERANDO_STOCK':
        return 'badge esperando-stock';
      case 'ATENDIDO':
        return 'badge atendido';
      case 'PARCIAL':
        return 'badge parcial';
      default:
        return 'badge';
    }
  }

  haySeleccionados(): boolean {
    return this.saldos.some((s) => s.seleccionado);
  }

  abrirModalConsolidacion() {
    const seleccionados = this.saldos.filter((s) => s.seleccionado);
    if (seleccionados.length === 0) {
      this.alertService.showAlert('Advertencia', 'Debe seleccionar al menos un saldo', 'warning');
      return;
    }
    this.listaConsolidada = this.agruparPorFamilia(seleccionados);
    this.mostrarModal = true;
  }

  agruparPorFamilia(items: Saldo[]) {
    const mapa: { [key: string]: GrupoConsolidado } = {};

    items.forEach((item) => {
      const key = `${item.familia}_${item.item}`;

      if (!mapa[key]) {
        mapa[key] = {
          familia: item.familia,
          item: item.item,
          descripcion: item.descripcion,
          cantidad: 0,
          detalles: [],
        };
      }

      mapa[key].cantidad += item.cantidadPendiente;
      mapa[key].detalles.push(item);
    });

    return Object.values(mapa);
  }

  async confirmarAtencion(saldo: Saldo) {
    console.log('Confirmar atención:', saldo);
    try {
      const ok = await this.alertService.showConfirm(
        'Confirmar',
        '¿Desea esperar atención del saldo pendiente?',
        'question',
      );

      if (!ok) return;

      await this.saldoService.confirmarAtencionSaldo(saldo.idSaldo);

      this.alertService.showAlert(
        'OK',
        'Saldo marcado como espera de stock',
        'success',
      );
      await this.cargarSaldos();
    } catch (error) {
      console.error('Error al confirmar atención:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo actualizar saldo',
        'error',
      );
    }
  }

  async cerrarSaldo(saldo: Saldo) {
    try {
      const ok = await this.alertService.showConfirm(
        'Cerrar saldo',
        '¿Seguro que desea cerrar el saldo pendiente?',
        'question',
      );

      if (!ok) return;

      const respuesta = await this.saldoService.cerrarSaldo(saldo.idSaldo);
      
      // Verificar si se cerró el requerimiento completo
      if (respuesta && respuesta.resultado && respuesta.resultado[0]) {
        const resultado = respuesta.resultado[0];
        if (resultado.estadoSolicitud && resultado.estadoSolicitud.includes('Requerimiento cerrado')) {
          // El requerimiento fue cerrado completamente, mostrar mensaje especial
          this.alertService.showAlertAcept(
            'Requerimiento cerrado',
            'El requerimiento original ha sido cerrado y ya no aparecerá en la lista de despachos.',
            'success',
          );
        } else {
          this.alertService.showAlert(
            'OK',
            'Saldo cerrado correctamente',
            'success',
          );
        }
      }
      
      await this.cargarSaldos();
    } catch (error) {
      console.error('Error al cerrar saldo:', error);
      this.alertService.showAlert('Error', 'No se pudo cerrar saldo', 'error');
    }
  }

  async confirmarConsolidacion() {
    const detalles = this.listaConsolidada.flatMap((x) => x.detalles);

    try {
      // 1️⃣ Crear detalles primero para poder incluirlos en la solicitud
      const detallesSolicitud: any[] = [];
      
      for (const grupo of this.listaConsolidada) {
        const detalle = {
          // Don't set id - let Dexie auto-increment
          solicitudCompraId: 0, // Will be updated after saving the solicitud
          codigo: grupo.item,
          descripcion: grupo.descripcion || '',
          cantidad: grupo.cantidad,
          cantidadAprobada: grupo.cantidad,
          cantidadAtendida: 0,
          unidadMedida: 'UNIDAD',
          estado: 'PENDIENTE',
          familia: grupo.familia,
          requerimientosOrigen: grupo.detalles.map(d => d.requerimientoOrigen).join(', ')
        };
        detallesSolicitud.push(detalle);
      }
      
      // 2️⃣ Guardar Solicitud de Compra en Dexie
      const solicitudCompra = {
        numeroSolicitud: `RC-${new Date().getTime()}`,
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'CONSOLIDADA' as const,
        almacen: 'ALMACEN_PRINCIPAL',
        usuarioSolicita: this.usuario.usuario,
        nombreSolicita: this.usuario.nombre,
        estado: 'GENERADA' as const,
        observaciones: `Generado desde consolidación de ${detalles.length} saldos pendientes`,
        detalle: detallesSolicitud,
        requerimientosOrigen: detalles.map(d => d.requerimientoOrigen).join(', '),
        prioridad: 'NORMAL' as const,
        moneda: 'PEN'
      };
      
      const idSolicitud = await this.dexieService.saveSolicitudCompra(solicitudCompra);
      
      // 3️⃣ Update solicitudCompraId in detalles and save them
      for (const detalle of detallesSolicitud) {
        detalle.solicitudCompraId = idSolicitud;
        // Create a copy without the detalle array to avoid circular reference
        const { ...detalleToSave } = detalle;
        await this.dexieService.detalleSolicitudCompra.add(detalleToSave);
      }

      // 4️⃣ Cerrar los requerimientos de consumo originales
      for (const detalle of detalles) {
        try {
          await this.saldoService.cerrarSaldo(detalle.idSaldo);
        } catch (error) {
          console.error(`Error al cerrar saldo ${detalle.idSaldo}:`, error);
        }
      }

      // 5️⃣ Limpiar tabla temporal
      await this.dexieService.limpiarListaTemporal();

      // 6️⃣ Mostrar mensaje de éxito
      this.alertService.showAlertAcept(
        'Requerimiento de compra creado',
        'El requerimiento de compra ha sido creado exitosamente. Los requerimientos de consumo originales han sido cerrados.',
        'success',
      );

      // 7️⃣ Navegar al módulo de requerimientos con datos prellenados
      const requerimientoData = {
        tipo: 'COMPRA',
        descripcion: 'REQUERIMIENTO DE COMPRA CONSOLIDADO',
        detalles: this.listaConsolidada.map(grupo => ({
          codigo: grupo.item,
          descripcion: grupo.descripcion,
          cantidad: grupo.cantidad,
          familia: grupo.familia,
          requerimientosOrigen: grupo.detalles.map(d => d.requerimientoOrigen).join(', ')
        }))
      };

      // Guardar datos en sessionStorage para que el componente de requerimientos los use
      sessionStorage.setItem('requerimientoConsolidado', JSON.stringify(requerimientoData));

      // 7️⃣ Mostrar éxito y navegar
      this.alertService.showAlert(
        'Éxito',
        'Solicitud de Compra creada. Redirigiendo a Requerimientos...',
        'success',
      );

      // Navegar al módulo de requerimientos
      this.router.navigate(['/main/requerimientos']);

    } catch (error) {
      console.error('Error en confirmarConsolidacion:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo guardar la consolidación',
        'error',
      );
    }
  }
}
