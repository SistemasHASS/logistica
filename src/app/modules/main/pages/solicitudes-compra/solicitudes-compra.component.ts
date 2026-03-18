import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import {
  SolicitudCompra,
  DetalleSolicitudCompra,
  Usuario,
  Requerimiento,
  DetalleRequerimiento,
  Almacen,
  ItemComodity,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-solicitudes-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  templateUrl: './solicitudes-compra.component.html',
  styleUrls: ['./solicitudes-compra.component.scss'],
})
export class SolicitudesCompraComponent implements OnInit {
  // Listas principales
  solicitudesCompra: SolicitudCompra[] = [];
  requerimientosAprobados: Requerimiento[] = [];
  almacenes: Almacen[] = [];
  items: ItemComodity[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Solicitud actual
  solicitud: SolicitudCompra | null = null;
  detalleSolicitud: DetalleSolicitudCompra[] = [];

  // Usuario
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

  // Selección
  requerimientosSeleccionados: Requerimiento[] = [];
  allSelected = false;

  // Filtros
  filtroEstado: string = 'TODAS';
  filtroTipo: string = 'TODAS';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalGeneradas = 0;
  totalEnviadas = 0;
  totalAprobadas = 0;
  totalEnCotizacion = 0;

  // Modal detalle
  modalDetalleAbierto = false;
  solicitudDetalle: SolicitudCompra | null = null;

  // Modales para agregar items
  modalAgregarItemsAbierto = false;
  modalItemsDisponiblesAbierto = false;
  modalMaestroItemsAbierto = false;
  modalDetalleRequerimientoAbierto = false;
  
  // Opciones para agregar items
  requerimientosPorAlmacen: Requerimiento[] = [];
  itemsMaestro: any[] = [];
  itemSeleccionado: any = null;
  
  // Para detalle de requerimiento
  requerimientoSeleccionado: any = null;
  detallesRequerimiento: DetalleRequerimiento[] = [];
  
  // Formulario para item manual
  itemManual: DetalleSolicitudCompra = this.nuevoDetalle();
  
  // Filtros
  filtroCodigoItem: string = '';
  filtroDescripcionItem: string = '';

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarMaestras();
    await this.cargarSolicitudes();
    await this.cargarRequerimientosAprobados();
    this.actualizarContadores();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarMaestras() {
    this.almacenes = await this.dexieService.showAlmacenes();
    this.items = await this.dexieService.showItemComoditys();
  }

  // Método para cargar items cuando cambia el almacén
  async onAlmacenChange() {
    if (!this.solicitud?.almacen) {
      this.requerimientosPorAlmacen = [];
      return;
    }

    await this.cargarRequerimientosPorAlmacen();
  }

  // Método para verificar si el almacén está en la lista (evita error de TypeScript)
  isAlmacenInList(almacen: string): boolean {
    if (!almacen) return false;
    return this.almacenes.some(a => a.almacen === almacen);
  }

  // Método para obtener el nombre del almacén a partir del código
  getNombreAlmacen(codigo: string): string {
    if (!codigo) return '';
    const almacen = this.almacenes.find(a => a.idalmacen == codigo);
    return almacen ? almacen.almacen : codigo;
  }

  async cargarSolicitudes() {
    this.solicitudesCompra = await this.dexieService.showSolicitudesCompra();
    this.actualizarContadores();
  }

  async cargarRequerimientosAprobados() {
    console.log('🔍 Cargando requerimientos aprobados...');
    const todosRequerimientos = await this.dexieService.showRequerimiento();
    console.log('✅ Total requerimientos cargados:', todosRequerimientos.length);
    
    // Si no hay requerimientos, mostrar mensaje informativo
    if (todosRequerimientos.length === 0) {
      console.log('⚠️ No hay requerimientos en IndexedDB');
      console.log('💡 Nota: Los requerimientos deben sincronizarse desde otro módulo de la aplicación');
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos disponibles. Asegúrese de sincronizar los datos desde el módulo correspondiente.',
        'info'
      );
    } else {
      // Mostrar los primeros 5 requerimientos para depurar
      console.log('📋 Muestra de requerimientos:', todosRequerimientos.slice(0, 5).map(r => ({
        id: r.idrequerimiento,
        estado: r.estado,
        despachado: r.despachado,
        glosa: r.glosa
      })));
      
      // Filtrar solo requerimientos aprobados y no despachados
      this.requerimientosAprobados = todosRequerimientos.filter(
        (r: Requerimiento) => r.estado === 1 && !r.despachado
      );
      
      console.log('✅ Requerimientos aprobados filtrados:', this.requerimientosAprobados.length);
      
      // Si no hay aprobados, mostrar cuántos hay por cada estado
      if (this.requerimientosAprobados.length === 0) {
        const porEstado = todosRequerimientos.reduce((acc: any, r) => {
          acc[r.estado] = (acc[r.estado] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Requerimientos por estado:', porEstado);
        
        // Mostrar mensaje si no hay aprobados
        this.alertService.showAlert(
          'Información',
          'No hay requerimientos aprobados disponibles para generar solicitudes de compra.',
          'info'
        );
      }
    }
  }

  actualizarContadores() {
    this.totalGeneradas = this.solicitudesCompra.filter(
      (s) => s.estado === 'GENERADA'
    ).length;
    this.totalEnviadas = this.solicitudesCompra.filter(
      (s) => s.estado === 'ENVIADA'
    ).length;
    this.totalAprobadas = this.solicitudesCompra.filter(
      (s) => s.estado === 'APROBADA'
    ).length;
    this.totalEnCotizacion = this.solicitudesCompra.filter(
      (s) => s.estado === 'EN_COTIZACION'
    ).length;
  }

  nuevaSolicitud(): SolicitudCompra {
    return {
      numeroSolicitud: '',
      fecha: new Date().toISOString(),
      tipo: 'CONSOLIDADA',
      almacen: '',
      usuarioSolicita: this.usuario.documentoidentidad || '',
      nombreSolicita: this.usuario.nombre || '',
      estado: 'GENERADA',
      detalle: [],
      prioridad: 'NORMAL',
    };
  }

  nuevoDetalle(): DetalleSolicitudCompra {
    return {
      id: 0,
      solicitudCompraId: 0,
      codigo: '',
      descripcion: '',
      cantidad: 0,
      cantidadAprobada: 0,
      cantidadAtendida: 0,
      unidadMedida: 'UND',
      estado: 'PENDIENTE',
    };
  }

  nuevaSolicitudCompra() {
    this.solicitud = this.nuevaSolicitud();
    this.detalleSolicitud = [];
    this.requerimientosSeleccionados = [];
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async generarSolicitudDesdeRequerimientos() {
    if (this.requerimientosSeleccionados.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar al menos un requerimiento aprobado.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      // Generar número de solicitud
      const numeroSolicitud = this.generarNumeroSolicitud();

      // Consolidar detalles de todos los requerimientos seleccionados
      const detallesConsolidados: DetalleSolicitudCompra[] = [];
      const idsRequerimientos: string[] = [];

      for (const req of this.requerimientosSeleccionados) {
        idsRequerimientos.push(req.idrequerimiento);

        // Obtener detalles del requerimiento
        const detalles = await this.dexieService.showDetallesByRequerimiento(
          req.idrequerimiento
        );

        for (const det of detalles) {
          // Buscar si ya existe el mismo código en la consolidación
          const existente = detallesConsolidados.find(
            (d) => d.codigo === det.codigo
          );

          const um = this.items.find((i) => i.codigo === det.codigo)?.um;

          if (existente) {
            // Sumar cantidad
            existente.cantidad += det.cantidad;
            existente.cantidadAprobada += det.cantidad;
            existente.requerimientosOrigen += `,${req.idrequerimiento}`;
          } else {
            // Agregar nuevo
            detallesConsolidados.push({
              id: 0,
              solicitudCompraId: 0,
              codigo: det.codigo,
              descripcion: det.producto,
              cantidad: det.cantidad,
              cantidadAprobada: det.cantidad,
              cantidadAtendida: 0,
              unidadMedida: um || 'UND',
              proyecto: det.proyecto,
              ceco: det.ceco,
              turno: det.turno,
              labor: det.labor,
              requerimientosOrigen: req.idrequerimiento,
              estado: 'PENDIENTE',
            });
          }
        }
      }

      // Crear solicitud usando el método nuevaSolicitud() para asegurar todos los campos
      const nuevaSolicitud = this.nuevaSolicitud();
      nuevaSolicitud.numeroSolicitud = numeroSolicitud;
      nuevaSolicitud.almacen = this.requerimientosSeleccionados[0].almacen;
      nuevaSolicitud.detalle = detallesConsolidados;
      nuevaSolicitud.requerimientosOrigen = idsRequerimientos.join(',');
      
      // Asegurar que los campos opcionales se establezcan explícitamente
      nuevaSolicitud.prioridad = 'NORMAL';
      nuevaSolicitud.moneda = 'PEN';
      
      console.log('🔍 Solicitud a guardar:', {
        numeroSolicitud: nuevaSolicitud.numeroSolicitud,
        tipo: nuevaSolicitud.tipo,
        estado: nuevaSolicitud.estado,
        prioridad: nuevaSolicitud.prioridad,
        almacen: nuevaSolicitud.almacen
      });

      // Guardar en Dexie
      await this.dexieService.saveSolicitudCompra(nuevaSolicitud);
      
      console.log('✅ Solicitud guardada exitosamente');

      // Guardar detalles
      for (const det of detallesConsolidados) {
        await this.dexieService.detalleSolicitudCompra.add(det);
      }

      // Recargar para verificar
      await this.cargarSolicitudes();
      
      // Verificar que se guardó correctamente
      const solicitudGuardada = this.solicitudesCompra.find(s => s.numeroSolicitud === numeroSolicitud);
      if (solicitudGuardada) {
        console.log('✅ Verificación de solicitud guardada:', {
          numeroSolicitud: solicitudGuardada.numeroSolicitud,
          tipo: solicitudGuardada.tipo,
          estado: solicitudGuardada.estado,
          prioridad: solicitudGuardada.prioridad,
          moneda: solicitudGuardada.moneda
        });
      }

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        `Solicitud de Compra ${numeroSolicitud} generada correctamente.`,
        'success'
      );

      // Recargar datos
      await this.cargarSolicitudes();
      this.requerimientosSeleccionados = [];
      
      // Forzar detección de cambios de Angular
      this.cdr.detectChanges();
      
      // Limpiar selección de requerimientos
      this.allSelected = false;
    } catch (error) {
      console.error('Error al generar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al generar la solicitud de compra.',
        'error'
      );
    }
  }

  generarNumeroSolicitud(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `SC-${año}${mes}${dia}-${hora}${min}${seg}`;
  }

  editarSolicitud(index: number) {
    const solicitud = this.solicitudesFiltradas()[index];
    if (!solicitud) return;
  
    // Debug: Verificar el valor del almacén
    console.log('Almacen en solicitud:', solicitud.almacen);
    console.log('Almacenes disponibles:', this.almacenes.map(a => a.almacen));

    const almacen = this.getNombreAlmacen(solicitud.almacen);
    console.log('Nombre de almacen:', almacen);
    this.solicitud = { ...solicitud };
    this.detalleSolicitud = [...(solicitud.detalle || [])];
    this.modoEdicion = true;
    this.editIndex = index;
    this.mostrarFormulario = true;

    // Forzar detección de cambios después de un breve momento
    setTimeout(() => {
      console.log('Almacen después de asignar:', this.solicitud?.almacen);
    }, 100);
  }

  async eliminarSolicitud(index: number) {
    const solicitud = this.solicitudesFiltradas()[index];
    if (!solicitud) return;

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Está seguro de eliminar esta solicitud de compra?',
      'warning'
    );

    if (!confirmacion) return;

    try {
      // Eliminar de Dexie
      await this.dexieService.solicitudesCompra.delete(solicitud.id!);

      // Eliminar detalles
      const detalles = await this.dexieService.detalleSolicitudCompra
        .where('solicitudCompraId')
        .equals(solicitud.id!)
        .toArray();

      for (const det of detalles) {
        await this.dexieService.detalleSolicitudCompra.delete(det.id);
      }

      this.alertService.showAlert(
        'Éxito',
        'Solicitud eliminada correctamente.',
        'success'
      );

      await this.cargarSolicitudes();
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar la solicitud.',
        'error'
      );
    }
  }

  async guardarSolicitud() {
    if (!this.solicitud || !this.solicitud.almacen) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar un almacén.',
        'warning'
      );
      return;
    }

    if (this.detalleSolicitud.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un detalle a la solicitud.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (!this.modoEdicion && this.solicitud) {
        this.solicitud.numeroSolicitud = this.generarNumeroSolicitud();
      }

      if (this.solicitud) {
        this.solicitud.detalle = [...this.detalleSolicitud];
        await this.dexieService.saveSolicitudCompra(this.solicitud);
      }

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Solicitud guardada correctamente.',
        'success'
      );

      this.mostrarFormulario = false;
      await this.cargarSolicitudes();
    } catch (error) {
      console.error('Error al guardar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la solicitud.',
        'error'
      );
    }
  }

  cancelarFormulario() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar? Se perderán los cambios no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  verDetalle(solicitud: SolicitudCompra) {
    console.log('🔍 Abriendo detalle de solicitud:', {
      numeroSolicitud: solicitud.numeroSolicitud,
      tipo: solicitud.tipo,
      estado: solicitud.estado,
      prioridad: solicitud.prioridad,
      moneda: solicitud.moneda,
      almacen: solicitud.almacen
    });
    
    this.solicitudDetalle = solicitud;
    this.modalDetalleAbierto = true;
    
    // Forzar detección de cambios
    setTimeout(() => {
      console.log('🔍 Verificación de solicitudDetalle en el modal:', this.solicitudDetalle);
      this.cdr.detectChanges();
    }, 100);
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.solicitudDetalle = null;
  }

  async enviarSolicitud(solicitud: SolicitudCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar esta solicitud de compra para aprobación?',
      'info'
    );

    if (!confirmacion) return;

    try {
      solicitud.estado = 'ENVIADA';
      solicitud.fechaEnvio = new Date().toISOString();
      await this.dexieService.saveSolicitudCompra(solicitud);

      this.alertService.showAlert(
        'Éxito',
        'Solicitud enviada correctamente.',
        'success'
      );

      await this.cargarSolicitudes();
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al enviar la solicitud.',
        'error'
      );
    }
  }

  // Selección múltiple
  toggleSeleccionRequerimiento(req: Requerimiento) {
    const index = this.requerimientosSeleccionados.findIndex(
      (r) => r.idrequerimiento === req.idrequerimiento
    );

    if (index > -1) {
      this.requerimientosSeleccionados.splice(index, 1);
    } else {
      this.requerimientosSeleccionados.push(req);
    }
  }

  estaSeleccionado(req: Requerimiento): boolean {
    return this.requerimientosSeleccionados.some(
      (r) => r.idrequerimiento === req.idrequerimiento
    );
  }

  toggleSeleccionarTodos() {
    if (this.allSelected) {
      this.requerimientosSeleccionados = [];
    } else {
      this.requerimientosSeleccionados = [...this.requerimientosAprobados];
    }
    this.allSelected = !this.allSelected;
  }

  // Filtros
  solicitudesFiltradas(): SolicitudCompra[] {
    let filtradas = [...this.solicitudesCompra];

    if (this.filtroEstado !== 'TODAS') {
      filtradas = filtradas.filter((s) => s.estado === this.filtroEstado);
    }

    if (this.filtroTipo !== 'TODAS') {
      filtradas = filtradas.filter((s) => s.tipo === this.filtroTipo);
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (s) => new Date(s.fecha) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter(
        (s) => new Date(s.fecha) <= new Date(this.filtroFechaFin)
      );
    }

    return filtradas;
  }

  limpiarFiltros() {
    this.filtroEstado = 'TODAS';
    this.filtroTipo = 'TODAS';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  // Utilidades
  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      GENERADA: 'badge-info',
      ENVIADA: 'badge-warning',
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      EN_COTIZACION: 'badge-primary',
      ORDEN_GENERADA: 'badge-dark',
    };
    return clases[estado] || 'badge-secondary';
  }

  obtenerClasePrioridad(prioridad: string): string {
    const clases: { [key: string]: string } = {
      NORMAL: 'badge-secondary',
      URGENTE: 'badge-warning',
      CRITICA: 'badge-danger',
    };
    return clases[prioridad || 'NORMAL'] || 'badge-secondary';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  calcularMontoTotal(detalle: DetalleSolicitudCompra[]): number {
    return detalle.reduce((sum, d) => sum + (d.montoReferencial || 0), 0);
  }

  // =====================================================================
  // MÉTODOS PARA AGREGAR ITEMS (TRES OPCIONES)
  // =====================================================================

  abrirModalAgregarItems() {
    console.log('🔍 Abriendo modal agregar items...');
    this.modalAgregarItemsAbierto = true;
    console.log('✅ Modal agregar items abierto:', this.modalAgregarItemsAbierto);
  }

  cerrarModalAgregarItems() {
    this.modalAgregarItemsAbierto = false;
    this.modalItemsDisponiblesAbierto = false;
    this.modalMaestroItemsAbierto = false;
    this.filtroCodigoItem = '';
    this.filtroDescripcionItem = '';
  }

  // Opción 1: Items por almacén desde requerimientos
  async cargarRequerimientosPorAlmacen() {
    if (!this.solicitud?.almacen) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar un almacén primero.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();
      
      // Limpiar requerimientos previos para evitar duplicación
      this.requerimientosPorAlmacen = [];
      
      // Cargar todos los requerimientos aprobados del almacén
      const todosRequerimientos = await this.dexieService.showRequerimiento();
      const reqsFiltrados = todosRequerimientos.filter(
        (r: Requerimiento) => 
          r.estado === 1 && 
          !r.despachado && 
          r.almacen === this.solicitud!.almacen
      );

      // Cargar detalles de cada requerimiento
      for (const req of reqsFiltrados) {
        const detalles = await this.dexieService.showDetallesByRequerimiento(req.idrequerimiento);
        const reqConDetalles = {
          ...req,
          detalles: detalles
        };
        this.requerimientosPorAlmacen.push(reqConDetalles);
      }

      this.alertService.cerrarModalCarga();
      this.modalItemsDisponiblesAbierto = true;
    } catch (error) {
      this.alertService.cerrarModalCarga();
      console.error('Error al cargar requerimientos:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar los requerimientos del almacén.',
        'error'
      );
    }
  }

  // Agregar item desde requerimiento
  agregarItemDesdeRequerimiento(detalle: DetalleRequerimiento) {
    // Verificar si ya existe
    const existente = this.detalleSolicitud.find(d => d.codigo === detalle.codigo);
    
    if (existente) {
      existente.cantidad += detalle.cantidad;
    } else {
      this.detalleSolicitud.push({
        id: 0,
        solicitudCompraId: 0,
        codigo: detalle.codigo,
        descripcion: detalle.descripcion,
        cantidad: detalle.cantidad,
        cantidadAprobada: detalle.cantidad,
        cantidadAtendida: 0,
        unidadMedida: 'UND', // Valor por defecto ya que DetalleRequerimiento no tiene unidadMedida
        proyecto: detalle.proyecto,
        ceco: detalle.ceco,
        turno: detalle.turno,
        labor: detalle.labor,
        requerimientosOrigen: detalle.idrequerimiento,
        estado: 'PENDIENTE',
      });
    }
    
    this.alertService.showAlert(
      'Éxito',
      'Item agregado correctamente.',
      'success'
    );
  }

  // Opción 2: Agregar item manualmente
  abrirModalItemManual() {
    this.itemManual = this.nuevoDetalle();
    this.modalMaestroItemsAbierto = true;
  }

  async agregarItemManual() {
    if (!this.itemManual.codigo) {
      this.alertService.showAlert('Atención', 'Ingrese el código del item.', 'warning');
      return;
    }

    if (!this.itemManual.descripcion) {
      this.alertService.showAlert('Atención', 'Ingrese la descripción del item.', 'warning');
      return;
    }

    if (this.itemManual.cantidad <= 0) {
      this.alertService.showAlert('Atención', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }

    // Verificar si ya existe
    const existente = this.detalleSolicitud.find(d => d.codigo === this.itemManual.codigo);
    
    if (existente) {
      this.alertService.showAlert(
        'Atención',
        'El código ya existe en el detalle.',
        'warning'
      );
      return;
    }

    this.detalleSolicitud.push({ ...this.itemManual });
    
    this.alertService.showAlert(
      'Éxito',
      'Item agregado correctamente.',
      'success'
    );

    this.itemManual = this.nuevoDetalle();
  }

  // Opción 3: Buscar en maestro de items
  async buscarItemsMaestro() {
    try {
      this.alertService.mostrarModalCarga();
      
      // Simular búsqueda en maestro (deberías llamar a un servicio real)
      // Por ahora, mostramos items de ejemplo
      this.itemsMaestro = [
        { codigo: '001', descripcion: 'Item de ejemplo 1', unidadMedida: 'UND' },
        { codigo: '002', descripcion: 'Item de ejemplo 2', unidadMedida: 'KG' },
        { codigo: '003', descripcion: 'Item de ejemplo 3', unidadMedida: 'LTS' },
        { codigo: '004', descripcion: 'Item de ejemplo 4', unidadMedida: 'MTR' },
        { codigo: '005', descripcion: 'Item de ejemplo 5', unidadMedida: 'CAJ' },
      ];

      // Si tienes un servicio real, descomenta esta línea:
      // this.itemsMaestro = await this.maestrasService.getItemsMaestro();

      this.alertService.cerrarModalCarga();
      this.modalMaestroItemsAbierto = true;
    } catch (error) {
      this.alertService.cerrarModalCarga();
      console.error('Error al buscar items:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar los items del maestro.',
        'error'
      );
    }
  }

  // Agregar item desde maestro
  agregarItemDesdeMaestro(item: any) {
    // Verificar si ya existe
    const existente = this.detalleSolicitud.find(d => d.codigo === item.codigo);
    
    if (existente) {
      this.alertService.showAlert(
        'Atención',
        'El código ya existe en el detalle.',
        'warning'
      );
      return;
    }

    this.detalleSolicitud.push({
      id: 0,
      solicitudCompraId: 0,
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidad: 1,
      cantidadAprobada: 1,
      cantidadAtendida: 0,
      unidadMedida: item.unidadMedida || 'UND',
      estado: 'PENDIENTE',
    });
    
    this.alertService.showAlert(
      'Éxito',
      'Item agregado correctamente.',
      'success'
    );
  }

  // Eliminar item del detalle
  eliminarItemDelDetalle(index: number) {
    this.detalleSolicitud.splice(index, 1);
    this.alertService.showAlert(
      'Éxito',
      'Item eliminado correctamente.',
      'success'
    );
  }

  // Filtrar items
  get itemsFiltrados() {
    return this.itemsMaestro.filter(item => {
      const coincideCodigo = item.codigo.toLowerCase().includes(this.filtroCodigoItem.toLowerCase());
      const coincideDescripcion = item.descripcion.toLowerCase().includes(this.filtroDescripcionItem.toLowerCase());
      return coincideCodigo && coincideDescripcion;
    });
  }

  // Método para obtener detalles de un requerimiento (evita error de TypeScript)
  getDetallesRequerimiento(req: any): DetalleRequerimiento[] {
    if (!req.detalles) return [];
    
    // Filtrar items duplicados por código
    const detallesUnicos = req.detalles.filter((item: DetalleRequerimiento, index: number, self: DetalleRequerimiento[]) => 
      self.findIndex(t => t.codigo === item.codigo) === index
    );
    
    return detallesUnicos;
  }

  // Método para obtener unidad de medida (evita error de TypeScript)
  getUnidadMedida(det: any): string {
    return det.unidadMedida || 'UND';
  }

  // Método para ver detalle de requerimiento
  async verDetalleRequerimiento(req: any) {
    try {
      this.alertService.mostrarModalCarga();
      this.requerimientoSeleccionado = req;
      
      // Cargar los detalles del requerimiento
      this.detallesRequerimiento = await this.dexieService.showDetallesByRequerimiento(req.idrequerimiento);
      
      this.alertService.cerrarModalCarga();
      this.modalDetalleRequerimientoAbierto = true;
    } catch (error) {
      this.alertService.cerrarModalCarga();
      console.error('Error al cargar detalles del requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar los detalles del requerimiento.',
        'error'
      );
    }
  }

  // Cerrar modal de detalle de requerimiento
  cerrarModalDetalleRequerimiento() {
    this.modalDetalleRequerimientoAbierto = false;
    this.requerimientoSeleccionado = null;
    this.detallesRequerimiento = [];
  }

  // Método para ver la orden generada desde una solicitud de compra
  async verOrdenGenerada(solicitud: SolicitudCompra) {
    try {
      // Buscar la orden de compra asociada a esta solicitud
      const ordenes = await this.dexieService.showOrdenesCompra();
      const orden = ordenes.find(o => o.solicitudCompraId === solicitud.id);
      
      if (orden) {
        this.alertService.showAlert(
          'Información',
          `Orden de Compra ${orden.numeroOrden} generada el ${this.formatearFecha(orden.fecha)}\n\n` +
          `Proveedor: ${orden.nombreProveedor}\n` +
          `Monto Total: ${orden.moneda} ${orden.montoTotal.toFixed(2)}\n` +
          `Estado: ${orden.estado}`,
          'info'
        );
        
        // Opcional: Navegar al módulo de órdenes de compra
        // this.router.navigate(['/ordenes-compra']);
      } else {
        this.alertService.showAlert(
          'Error',
          'No se encontró la orden de compra asociada a esta solicitud.',
          'error'
        );
      }
    } catch (error) {
      console.error('Error al buscar orden generada:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al buscar la orden de compra.',
        'error'
      );
    }
  }
}
