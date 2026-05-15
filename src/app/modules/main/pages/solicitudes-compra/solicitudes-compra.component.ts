import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { SolicitudCompraService } from '@/app/services/solicitud-compra.service';
import { AprobacionSCService } from '@/app/services/aprobacion-sc.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import {
  SolicitudCompra,
  DetalleSolicitudCompra,
  SolicitudCompraAdjunto,
  Usuario,
  Requerimiento,
  DetalleRequerimiento,
  Almacen,
  Fundo,
  ItemComodity,
} from '@/app/shared/interfaces/Tables';
import { AdjuntosModalComponent } from '@/app/shared/components/adjuntos-modal/adjuntos-modal.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

@Component({
  selector: 'app-solicitudes-compra',
  standalone: true,
  imports: [
    NumeroRequerimientoPipe,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TooltipModule,
    BadgeModule,
    AdjuntosModalComponent
  ],
  templateUrl: './solicitudes-compra.component.html',
  styleUrls: ['./solicitudes-compra.component.scss'],
})
export class SolicitudesCompraComponent implements OnInit {
  // Listas principales
  solicitudesCompra: SolicitudCompra[] = []; // Tab 1: Solicitudes locales (Dexie)
  solicitudesProcesadas: any[] = []; // Tab 2: Solicitudes procesadas (Backend)
  requerimientosAprobados: Requerimiento[] = [];
  almacenes: Almacen[] = [];
  fundos: Fundo[] = [];
  items: ItemComodity[] = [];
  
  // Datos maestros para conversión de códigos a nombres
  proyectos: any[] = [];
  labores: any[] = [];
  cecos: any[] = [];
  formasPago: any[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Tabs
  tabActivo: 'locales' | 'procesadas' = 'locales';

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

  // Contadores Tab 1 (Locales - Dexie)
  totalGeneradasLocal = 0;
  totalEnviadasLocal = 0;

  // Contadores Tab 2 (Procesadas - Backend)
  totalEnviadas = 0;
  totalAprobadas = 0;
  totalEnCotizacion = 0;
  totalOrdenGenerada = 0;

  // Modal detalle (Tab 1: Mis Solicitudes)
  modalDetalleAbierto = false;
  solicitudDetalle: SolicitudCompra | null = null;
  adjuntosDetalle: SolicitudCompraAdjunto[] = [];

  // Modal detalle (Tab 2: Solicitudes Procesadas)
  modalDetalleProcesadaAbierto = false;
  solicitudProcesadaDetalle: any = null;

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
  
  // Adjuntos
  adjuntos: SolicitudCompraAdjunto[] = [];
  mostrarModalAdjuntos: boolean = false;
  
  // Filtros
  filtroCodigoItem: string = '';
  filtroDescripcionItem: string = '';

  // Estado de conexión y sincronización
  tieneConexion: boolean = true;
  sincronizando: boolean = false;

  constructor(
    private dexieService: DexieService,
    private solicitudCompraService: SolicitudCompraService,
    private aprobacionSCService: AprobacionSCService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarMaestras();
    await this.cargarSolicitudesLocales();
    this.actualizarContadoresLocales();

    // Verificar conexión primero para que cargarRequerimientosAprobados pueda sincronizar
    await this.verificarConexionYSincronizar();

    // Cargar requerimientos COMPRA aprobados (con sincronización backend si hay conexión)
    await this.cargarRequerimientosAprobados();

    // Cargar solicitudes procesadas si hay conexión
    if (this.tieneConexion) {
      await this.cargarSolicitudesProcesadas();
    }
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarMaestras() {
    this.almacenes = await this.dexieService.showAlmacenes();
    this.fundos = await this.dexieService.showFundos();
    this.items = await this.dexieService.showItemComoditys();
    this.proyectos = await this.dexieService.showProyectos();
    this.labores = await this.dexieService.showLabores();
    this.cecos = await this.dexieService.showCecos();
    // Formas de pago (puedes agregar el método en DexieService si no existe)
    // this.formasPago = await this.dexieService.showFormasPago();
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

  // Método para obtener el nombre del fundo a partir del código
  getNombreFundo(codigo: string | number): string {
    if (codigo === null || codigo === undefined || codigo === '') return '';
    const codigoStr = String(codigo);
    const fundo = this.fundos.find(
      f => String(f.fundo) === codigoStr || String(f.id) === codigoStr
    );
    return fundo ? fundo.nombreFundo : codigoStr;
  }

  // Método para obtener el nombre de la moneda
  getNombreMoneda(codigo: string): string {
    if (!codigo) return '';
    const monedas: { [key: string]: string } = {
      'LO': 'Soles',
      'EX': 'Dólares',
      'PEN': 'Soles',
      'USD': 'Dólares'
    };
    return monedas[codigo] || codigo;
  }

  // Método para obtener el nombre del proyecto
  getNombreProyecto(codigo: string): string {
    if (!codigo) return 'N/A';
    console.log('Poryectos: ',this.proyectos);
    const proyecto = this.proyectos.find(p => p.ruc+p.ceco+p.afe === codigo || p.id === codigo);
    return proyecto ? proyecto.proyectoio : codigo;
  }

  // Método para obtener el nombre del proyecto2
  getNombreProyecto2(codigo: string): string {
    if (!codigo) return 'N/A';
    console.log('Poryectos: ',this.proyectos);
    const proyecto = this.proyectos.find(p => p.ruc+p.afe === codigo || p.id === codigo);
    return proyecto ? proyecto.proyectoio : codigo;
  }
  // Método para obtener el nombre de la labor
  getNombreLabor(codigo: string): string {
    if (!codigo) return 'N/A';
    console.log('Labores: ',this.labores);
    const labor = this.labores.find(l => l.id.slice(5) === codigo || l.labor === codigo);
    return labor ? labor.labor : codigo;
  }

  // Método para obtener el nombre del centro de costo
  getNombreCeco(codigo: string): string {
    if (!codigo) return 'N/A';
    const ceco = this.cecos.find(c => c.costcenter === codigo || c.localname === codigo);
    return ceco ? ceco.localname : codigo;
  }

  // Método para obtener el nombre de la forma de pago
  getNombreFormaPago(codigo: string): string {
    if (!codigo) return 'N/A';
    // Mapeo común de formas de pago
    const formasPago: { [key: string]: string } = {
      '001': 'Contado',
      '002': 'Crédito 30 días',
      '003': 'Crédito 60 días',
      '004': 'Crédito 90 días'
    };
    return formasPago[codigo] || codigo;
  }

  async cargarSolicitudesLocales() {
    this.solicitudesCompra = await this.dexieService.showSolicitudesCompra();
    this.actualizarContadoresLocales();
  }

  async cargarSolicitudesProcesadas() {
    if (!this.tieneConexion) {
      console.warn('⚠️ Sin conexión - No se pueden cargar solicitudes procesadas');
      return;
    }

    try {
      console.log('🔄 Cargando solicitudes procesadas desde backend...');
      console.log('📤 RUC enviado:', this.usuario.ruc);
      
      const response = await this.solicitudCompraService.listarSolicitudesProcesadas(this.usuario.ruc);
      console.log('📥 Respuesta completa del backend:', response);
      console.log('📋 Tipo de response:', typeof response);
      console.log('📋 Es array?', Array.isArray(response));
      
      // El backend devuelve directamente el array de solicitudes
      if (response && Array.isArray(response)) {
        this.solicitudesProcesadas = response;
        console.log('✅ Solicitudes procesadas cargadas:', this.solicitudesProcesadas.length);
        console.log('📊 Primera solicitud:', this.solicitudesProcesadas[0]);
        console.log('🎯 Tab activo:', this.tabActivo);
        
        this.actualizarContadoresProcesadas();
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('🔄 Detección de cambios forzada');
      } else {
        console.warn('⚠️ Response no es un array:', response);
        this.solicitudesProcesadas = [];
        console.log('ℹ️ No hay solicitudes procesadas');
      }
    } catch (error) {
      console.error('❌ Error al cargar solicitudes procesadas:', error);
      console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
      this.solicitudesProcesadas = [];
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar las solicitudes procesadas desde el servidor.',
        'error'
      );
    }
  }

  async cargarRequerimientosAprobados() {
    console.log('🔍 Cargando requerimientos compra aprobados...');

    // Si hay conexión, sincronizar desde el backend primero
    if (this.tieneConexion && this.usuario.ruc) {
      try {
        const remoto = await this.solicitudCompraService.listarRequerimientosCompraAprobados(
          this.usuario.ruc,
          this.usuario.documentoidentidad
        );
        const lista: any[] = Array.isArray(remoto) ? remoto : [];
        if (lista.length > 0) {
          const reqs: Requerimiento[] = lista.map((r: any) => ({
            ...r,
            estado: 1,
            despachado: r.despachado ?? false,
            disabled: false,
            checked: false,
            eliminado: 0,
            detalle: typeof r.detalle === 'string' ? JSON.parse(r.detalle || '[]') : (r.detalle || [])
          }));
          await this.dexieService.saveRequerimientos(reqs);
          console.log('✅ Requerimientos COMPRA aprobados sincronizados desde backend:', reqs.length);
        }
      } catch (err) {
        console.warn('⚠️ No se pudo sincronizar del backend, usando IndexedDB local:', err);
      }
    }

    const todosRequerimientos = await this.dexieService.showRequerimiento();
    console.log('📦 Total en IndexedDB:', todosRequerimientos.length);

    // Filtrar requerimientos de COMPRA aprobados (estados = 'APROBADO')
    this.requerimientosAprobados = todosRequerimientos.filter(
      (r: Requerimiento) => (r as any).estados === 'APROBADO' && !r.despachado
    );

    console.log('✅ Requerimientos COMPRA aprobados disponibles:', this.requerimientosAprobados.length);

    if (this.requerimientosAprobados.length === 0 && todosRequerimientos.length > 0) {
      const porEstado = todosRequerimientos.reduce((acc: any, r: any) => {
        acc[r.estados || r.estado] = (acc[r.estados || r.estado] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Requerimientos por estados:', porEstado);
    }
  }

  actualizarContadoresLocales() {
    this.totalGeneradasLocal = this.solicitudesCompra.filter(
      (s) => s.estado === 'GENERADA'
    ).length;
    this.totalEnviadasLocal = this.solicitudesCompra.filter(
      (s) => s.estado === 'ENVIADA'
    ).length;
  }

  actualizarContadoresProcesadas() {
    this.totalEnviadas = this.solicitudesProcesadas.filter(
      (s: any) => s.idestado === 'ENVIADA'
    ).length;
    this.totalAprobadas = this.solicitudesProcesadas.filter(
      (s: any) => s.idestado === 'APROBADA'
    ).length;
    this.totalEnCotizacion = this.solicitudesProcesadas.filter(
      (s: any) => s.idestado === 'EN_COTIZACION'
    ).length;
    this.totalOrdenGenerada = this.solicitudesProcesadas.filter(
      (s: any) => s.idestado === 'ORDEN_GENERADA'
    ).length;
  }

  cambiarTab(tab: 'locales' | 'procesadas') {
    console.log('🔄 Cambiando a tab:', tab);
    this.tabActivo = tab;
    console.log('✅ Tab activo ahora es:', this.tabActivo);
    console.log('📊 Solicitudes procesadas actuales:', this.solicitudesProcesadas.length);
    console.log('🌐 Tiene conexión:', this.tieneConexion);
    
    if (tab === 'procesadas' && this.tieneConexion && this.solicitudesProcesadas.length === 0) {
      console.log('🔄 Cargando solicitudes procesadas porque el array está vacío...');
      this.cargarSolicitudesProcesadas();
    } else if (tab === 'procesadas') {
      console.log('ℹ️ No se cargan solicitudes procesadas. Razones:');
      console.log('  - Tiene conexión:', this.tieneConexion);
      console.log('  - Solicitudes ya cargadas:', this.solicitudesProcesadas.length);
    }
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
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
    this.adjuntos = [];
    this.requerimientosSeleccionados = [];
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  // =====================================================================
  // MÉTODOS PARA ADJUNTOS
  // =====================================================================

  abrirModalAdjuntos() {
    this.mostrarModalAdjuntos = true;
  }

  onAdjuntosConfirmados(adjuntos: SolicitudCompraAdjunto[]) {
    this.adjuntos = adjuntos;
    this.mostrarModalAdjuntos = false;
    console.log('✅ Adjuntos confirmados:', this.adjuntos.length);
  }

  onAdjuntosCancelados() {
    this.mostrarModalAdjuntos = false;
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

        // Obtener detalles: primero del campo embebido, luego fallback a Dexie
        const detalleEmbebido: any[] = Array.isArray((req as any).detalle) ? (req as any).detalle : [];
        const detalles: any[] = detalleEmbebido.length > 0
          ? detalleEmbebido
          : await this.dexieService.showDetallesByRequerimiento(req.idrequerimiento);

        for (const det of detalles) {
          // Buscar si ya existe el mismo código en la consolidación
          const existente = detallesConsolidados.find(
            (d) => d.codigo === det.codigo
          );

          const um = this.items.find((i) => i.codigo === det.codigo)?.um;

          if (existente) {
            // Sumar cantidad
            existente.cantidad += det.cantidad;
            existente.cantidadAprobada = (existente.cantidadAprobada || 0) + det.cantidad;
            existente.requerimientosOrigen = (existente.requerimientosOrigen || '') + `,${req.idrequerimiento}`;
          } else {
            // ✅ CORRECCIÓN: Obtener proyecto, ceco, turno y labor del ENCABEZADO del requerimiento
            // Los detalles individuales pueden tener sus propios valores, pero si no los tienen,
            // usar los del encabezado del requerimiento
            const reqAny = req as any;
            const detAny = det as any;
            detallesConsolidados.push({
              id: 0,
              solicitudCompraId: 0,
              codigo: detAny.codigo || detAny.idproducto || '',
              descripcion: detAny.producto || detAny.iddescripcion || detAny.descripcion || detAny.codigo || '',
              cantidad: detAny.cantidad ?? 0,
              cantidadAprobada: detAny.cantidad ?? 0,
              cantidadAtendida: 0,
              unidadMedida: um || detAny.unidadMedida || detAny.unidad || detAny.idunidad || 'UND',
              proyecto: detAny.proyecto || detAny.idproyecto || reqAny.proyecto || '',
              ceco: detAny.ceco || detAny.idcentrocosto || reqAny.ceco || '',
              turno: detAny.turno || detAny.idturno || reqAny.turno || '',
              labor: detAny.labor || detAny.idlabor || reqAny.labor || '',
              requerimientosOrigen: req.idrequerimiento,
              estado: 'PENDIENTE',
            });
          }
        }
      }

      // Crear solicitud usando el método nuevaSolicitud() para asegurar todos los campos
      const nuevaSolicitud = this.nuevaSolicitud();
      nuevaSolicitud.numeroSolicitud = numeroSolicitud;
      
      // ✅ CORRECCIÓN: Asegurar que el almacén tenga el formato correcto
      const almacenReq = this.requerimientosSeleccionados[0].almacen || '';
      console.log('🔍 Almacén del requerimiento:', almacenReq);
      
      // Si el almacén es solo un número (ej: "001"), buscar el código completo
      if (almacenReq && almacenReq.length <= 3 && !isNaN(Number(almacenReq))) {
        // Buscar en la lista de almacenes
        const almacenCompleto = this.almacenes.find(a => a.almacen === almacenReq);
        nuevaSolicitud.almacen = almacenCompleto?.idalmacen || almacenReq;
        console.log('🔍 Almacén corregido de', almacenReq, 'a', nuevaSolicitud.almacen);
      } else {
        nuevaSolicitud.almacen = almacenReq;
      }
      
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
      await this.cargarSolicitudesLocales();
      
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

      // ✅ Actualizar estado de cada requerimiento a CONSOLIDADO
      const reqsParaConsolidar = [...this.requerimientosSeleccionados];
      for (const req of reqsParaConsolidar) {
        try {
          // Actualizar en backend si hay conexión
          if (this.tieneConexion) {
            await this.solicitudCompraService.actualizarEstadoRequerimiento(
              req.idrequerimiento,
              'CONSOLIDADO',
              this.usuario.documentoidentidad || ''
            );
          }
          // Actualizar en Dexie local
          const reqLocal = await this.dexieService.requerimientos
            .where('idrequerimiento').equals(req.idrequerimiento).first();
          if (reqLocal?.id) {
            await this.dexieService.requerimientos.update(reqLocal.id, { estados: 'CONSOLIDADO' });
          }
        } catch (err) {
          console.warn('⚠️ No se pudo actualizar estado del requerimiento:', req.idrequerimiento, err);
        }
      }

      // Recargar tabla de requerimientos aprobados (los consolidados ya no aparecen)
      await this.cargarRequerimientosAprobados();

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        `Solicitud de Compra ${numeroSolicitud} generada correctamente.`,
        'success'
      );

      // Recargar datos
      await this.cargarSolicitudesLocales();
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

      await this.cargarSolicitudesLocales();
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
        
        // 🔍 DEBUG: Verificar que el detalle tenga proyecto y ceco antes de guardar
        console.log('🔍 Guardando solicitud con detalle:', this.solicitud.detalle);
        if (this.solicitud.detalle.length > 0) {
          console.log('🔍 Primer item del detalle a guardar:', {
            codigo: this.solicitud.detalle[0].codigo,
            descripcion: this.solicitud.detalle[0].descripcion,
            proyecto: this.solicitud.detalle[0].proyecto,
            ceco: this.solicitud.detalle[0].ceco,
            turno: (this.solicitud.detalle[0] as any).turno,
            labor: (this.solicitud.detalle[0] as any).labor
          });
        }
        
        const idSolicitud = await this.dexieService.saveSolicitudCompra(this.solicitud);
        
        // Guardar adjuntos si existen
        if (this.adjuntos.length > 0 && idSolicitud) {
          for (const adjunto of this.adjuntos) {
            adjunto.idSolicitud = idSolicitud;
            adjunto.usuarioCreacion = this.usuario.documentoidentidad;
            adjunto.fechaCreacion = new Date().toISOString();
            adjunto.activo = true;
            await this.dexieService.solicitudCompraAdjuntos.add(adjunto);
          }
          console.log(`✅ ${this.adjuntos.length} adjuntos guardados para solicitud ${this.solicitud.numeroSolicitud}`);
        }
      }

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Solicitud guardada correctamente.',
        'success'
      );

      this.mostrarFormulario = false;
      await this.cargarSolicitudesLocales();
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

  async verDetalle(solicitud: SolicitudCompra) {
    console.log('🔍 Abriendo detalle de solicitud:', {
      numeroSolicitud: solicitud.numeroSolicitud,
      tipo: solicitud.tipo,
      estado: solicitud.estado,
      prioridad: solicitud.prioridad,
      moneda: solicitud.moneda,
      almacen: solicitud.almacen
    });
    
    // 🔍 DEBUG: Verificar los campos del detalle
    console.log('🔍 Detalle de la solicitud:', solicitud.detalle);
    if (solicitud.detalle && solicitud.detalle.length > 0) {
      console.log('🔍 Primer item del detalle:', solicitud.detalle[0]);
      console.log('🔍 Campos del primer item:', {
        codigo: solicitud.detalle[0].codigo,
        descripcion: solicitud.detalle[0].descripcion,
        proyecto: solicitud.detalle[0].proyecto,
        ceco: solicitud.detalle[0].ceco,
        turno: (solicitud.detalle[0] as any).turno,
        labor: (solicitud.detalle[0] as any).labor
      });
    }
    
    this.solicitudDetalle = solicitud;
    this.modalDetalleAbierto = true;
    
    // Cargar adjuntos si la solicitud tiene ID
    if (solicitud.id) {
      try {
        this.adjuntosDetalle = await this.dexieService.solicitudCompraAdjuntos
          .where('idSolicitud')
          .equals(solicitud.id)
          .and(adj => adj.activo === true)
          .toArray();
        console.log(`📎 ${this.adjuntosDetalle.length} adjuntos cargados para solicitud ${solicitud.numeroSolicitud}`);
      } catch (error) {
        console.error('Error al cargar adjuntos:', error);
        this.adjuntosDetalle = [];
      }
    } else {
      this.adjuntosDetalle = [];
    }
    
    // Forzar detección de cambios
    setTimeout(() => {
      console.log('🔍 Verificación de solicitudDetalle en el modal:', this.solicitudDetalle);
      this.cdr.detectChanges();
    }, 100);
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.solicitudDetalle = null;
    this.adjuntosDetalle = [];
  }

  descargarAdjunto(adjunto: SolicitudCompraAdjunto) {
    if (!adjunto.rutaArchivo) {
      this.alertService.showAlert(
        'Error',
        'No se puede descargar el archivo. Ruta no disponible.',
        'error'
      );
      return;
    }

    const link = document.createElement('a');
    link.href = adjunto.rutaArchivo;
    link.download = adjunto.nombreArchivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.alertService.showAlert(
      'Descargando',
      adjunto.nombreArchivo,
      'success'
    );
  }

  async enviarSolicitud(solicitud: SolicitudCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar esta solicitud de compra para aprobación?',
      'info'
    );

    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      // 1. SIEMPRE guardar en Dexie primero (modo offline)
      solicitud.estado = 'ENVIADA';
      solicitud.fechaEnvio = new Date().toISOString();
      solicitud.sincronizado = false; // Marcar como no sincronizado inicialmente
      await this.dexieService.saveSolicitudCompra(solicitud);
      console.log('✅ Solicitud guardada en Dexie con estado ENVIADA');

      // 2. Intentar enviar al backend si hay conexión
      if (this.tieneConexion) {
        try {
          console.log('🔄 Intentando sincronizar con backend:', solicitud.numeroSolicitud);
          
          // Preparar datos para el backend
          const solicitudBackend = {
            numeroSolicitud: solicitud.numeroSolicitud,
            tipo: solicitud.tipo,
            almacen: solicitud.almacen,
            usuarioSolicita: solicitud.usuarioSolicita,
            nombreSolicita: solicitud.nombreSolicita,
            prioridad: solicitud.prioridad,
            observaciones: solicitud.observaciones,
            empresa: this.usuario.ruc, // RUC de la empresa
            detalle: solicitud.detalle?.map(d => ({
              codigo: d.codigo,
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              unidadMedida: d.unidadMedida,
              proyecto: d.proyecto,
              ceco: d.ceco
            }))
          };

          console.log('📤 Enviando al backend:', solicitudBackend);

          // Crear en backend
          const respuesta = await this.solicitudCompraService.crearSolicitud(solicitudBackend);
          console.log('✅ Solicitud creada en backend:', respuesta);

          if (respuesta && respuesta.idSolicitud) {
            // Actualizar estado a ENVIADA en backend
            await this.solicitudCompraService.actualizarEstado(
              respuesta.idSolicitud,
              'ENVIADA',
              this.usuario.documentoidentidad
            );
            console.log('✅ Estado actualizado en backend');

            // Marcar como sincronizado en Dexie
            solicitud.sincronizado = true;
            await this.dexieService.saveSolicitudCompra(solicitud);
            console.log('✅ Solicitud marcada como sincronizada en Dexie');

            // Enviar adjuntos al backend si existen
            if (solicitud.id) {
              await this.enviarAdjuntosAlBackend(solicitud.id, respuesta.idSolicitud);
            }

            // Asignar aprobadores automáticamente
            try {
              const montoTotal = solicitud.detalle?.reduce((sum, d) => sum + (d.cantidad * (d.precioReferencial || 0)), 0) || 0;
              
              const asignacionData = {
                idSolicitud: respuesta.idSolicitud,
                numeroSolicitud: solicitud.numeroSolicitud,
                ruc: this.usuario.ruc,
                idarea: null,
                tipoSolicitud: solicitud.tipo,
                montoTotal: montoTotal,
                usuarioSolicitante: this.usuario.documentoidentidad,
                nombreSolicitante: this.usuario.nombre
              };

              const respuestaAprobacion = await this.aprobacionSCService.asignarAprobadores(asignacionData);
              console.log('✅ Aprobadores asignados:', respuestaAprobacion);
            } catch (errorAprobacion) {
              console.warn('⚠️ Error al asignar aprobadores:', errorAprobacion);
            }

            this.alertService.cerrarModalCarga();
            this.alertService.showAlert(
              'Éxito',
              'Solicitud enviada correctamente al sistema y asignada para aprobación.',
              'success'
            );
          } else {
            throw new Error('No se recibió idSolicitud del backend');
          }
        } catch (errorBackend) {
          console.error('❌ Error al enviar al backend:', errorBackend);
          console.error('Detalles del error:', {
            message: errorBackend instanceof Error ? errorBackend.message : 'Error desconocido',
            solicitud: solicitud.numeroSolicitud
          });
          
          // Mantener sincronizado = false
          solicitud.sincronizado = false;
          await this.dexieService.saveSolicitudCompra(solicitud);
          
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Error de Sincronización',
            `No se pudo sincronizar la solicitud ${solicitud.numeroSolicitud} con el servidor.\n\nError: ${errorBackend instanceof Error ? errorBackend.message : 'Error desconocido'}\n\nLa solicitud está guardada localmente. Use el botón "Sincronizar" para reintentar.`,
            'error'
          );
        }
      } else {
        // Sin conexión, solo Dexie
        console.log('⚠️ Sin conexión - Solicitud guardada solo en Dexie');
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Modo Offline',
          'Solicitud guardada localmente. Se sincronizará automáticamente cuando haya conexión.',
          'info'
        );
      }

      await this.cargarSolicitudesLocales();
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al procesar la solicitud.',
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
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.requerimientosSeleccionados = [...this.requerimientosAprobados];
    } else {
      this.requerimientosSeleccionados = [];
    }
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
          (r as any).estados === 'APROBADO' &&
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
  agregarItemDesdeRequerimiento(detalle: DetalleRequerimiento, requerimiento?: any) {
    // Verificar si ya existe
    const existente = this.detalleSolicitud.find(d => d.codigo === detalle.codigo);
    
    if (existente) {
      existente.cantidad += detalle.cantidad;
    } else {
      // ✅ CORRECCIÓN: Obtener proyecto, ceco, turno y labor del ENCABEZADO del requerimiento
      const detAny = detalle as any;
      const reqAny = requerimiento || {};
      
      this.detalleSolicitud.push({
        id: 0,
        solicitudCompraId: 0,
        codigo: detalle.codigo,
        descripcion: detalle.descripcion,
        cantidad: detalle.cantidad,
        cantidadAprobada: detalle.cantidad,
        cantidadAtendida: 0,
        unidadMedida: 'UND', // Valor por defecto ya que DetalleRequerimiento no tiene unidadMedida
        proyecto: detAny.proyecto || reqAny.proyecto || '',
        ceco: detAny.ceco || reqAny.ceco || '',
        turno: detAny.turno || reqAny.turno || '',
        labor: detAny.labor || reqAny.labor || '',
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

      // Primero usar el detalle embebido en el objeto (viene del backend sincronizado)
      const detalleEmbebido: any[] = Array.isArray(req.detalle) ? req.detalle : [];

      if (detalleEmbebido.length > 0) {
        // Mapear al formato DetalleRequerimiento
        this.detallesRequerimiento = detalleEmbebido.map((d: any) => ({
          id: d.id ?? 0,
          idrequerimiento: req.idrequerimiento,
          codigo: d.codigo || d.idproducto || '',
          producto: d.producto || d.iddescripcion || d.descripcion || d.codigo || '',
          descripcion: d.descripcion || d.iddescripcion || d.producto || '',
          cantidad: d.cantidad ?? 0,
          unidad: d.unidad || d.idunidad || '',
          unidadMedida: d.unidadMedida || d.unidad || d.idunidad || 'UND',
          proyecto: d.proyecto || d.idproyecto || '',
          ceco: d.ceco || d.idcentrocosto || '',
          turno: d.turno || d.idturno || '',
          labor: d.labor || d.idlabor || '',
          esActivoFijo: d.esActivoFijo ?? false,
          activoFijo: d.activoFijo || '',
          estado: d.estado || 'PENDIENTE',
        }));
      } else {
        // Fallback: buscar en tabla Dexie separada
        this.detallesRequerimiento = await this.dexieService.showDetallesByRequerimiento(req.idrequerimiento);
      }

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

  /**
   * Enviar adjuntos al backend
   */
  async enviarAdjuntosAlBackend(idSolicitudLocal: number, idSolicitudBackend: number) {
    try {
      // Obtener adjuntos de Dexie
      const adjuntos = await this.dexieService.solicitudCompraAdjuntos
        .where('idSolicitud')
        .equals(idSolicitudLocal)
        .and(adj => adj.activo === true)
        .toArray();

      if (adjuntos.length === 0) {
        console.log('ℹ️ No hay adjuntos para enviar');
        return;
      }

      console.log(`📎 Enviando ${adjuntos.length} adjuntos al backend...`);

      // Enviar cada adjunto al backend
      for (const adjunto of adjuntos) {
        try {
          const adjuntoBackend = {
            idSolicitud: idSolicitudBackend,
            nombreArchivo: adjunto.nombreArchivo,
            rutaArchivo: adjunto.rutaArchivo || '',
            tipoArchivo: adjunto.tipoArchivo || '',
            tamanoArchivo: adjunto.tamanoArchivo || 0,
            descripcion: adjunto.descripcion || '',
            usuarioCreacion: this.usuario.documentoidentidad,
            contenidoBase64: adjunto.contenidoBase64 || ''
          };

          await this.solicitudCompraService.guardarAdjunto(adjuntoBackend);
          console.log(`✅ Adjunto enviado: ${adjunto.nombreArchivo}`);
        } catch (errorAdjunto) {
          console.error(`❌ Error al enviar adjunto ${adjunto.nombreArchivo}:`, errorAdjunto);
        }
      }

      console.log('✅ Todos los adjuntos enviados al backend');
    } catch (error) {
      console.error('❌ Error al enviar adjuntos:', error);
    }
  }

  // ============================================
  // MÉTODOS DE SINCRONIZACIÓN HÍBRIDA
  // ============================================

  /**
   * Verificar conexión con el backend y sincronizar
   */
  async verificarConexionYSincronizar() {
    try {
      console.log('🔄 Verificando conexión con el backend...');
      this.tieneConexion = await this.solicitudCompraService.verificarConexion();
      
      if (this.tieneConexion) {
        console.log('✅ Conexión establecida con el backend');
        await this.sincronizarConBackend();
      } else {
        console.warn('⚠️ Sin conexión con el backend - Modo offline');
      }
    } catch (error) {
      console.error('Error al verificar conexión:', error);
      this.tieneConexion = false;
    }
  }

  /**
   * Sincronizar solicitudes de Dexie con el backend
   */
  async sincronizarConBackend() {
    if (this.sincronizando || !this.tieneConexion) return;

    try {
      this.sincronizando = true;
      console.log('🔄 Iniciando sincronización con backend...');

      // Obtener solicitudes de Dexie
      const solicitudesLocales = await this.dexieService.showSolicitudesCompra();
      
      // Filtrar solo las que están ENVIADAS (pendientes de sincronizar)
      const solicitudesPendientes = solicitudesLocales.filter(s => s.estado === 'ENVIADA');
      
      if (solicitudesPendientes.length === 0) {
        console.log('✅ No hay solicitudes pendientes de sincronizar');
        this.sincronizando = false;
        return;
      }

      console.log(`📊 Sincronizando ${solicitudesPendientes.length} solicitudes...`);

      for (const solicitud of solicitudesPendientes) {
        try {
          console.log(`🔄 Sincronizando: ${solicitud.numeroSolicitud}`);
          
          // Preparar datos para el backend
          const solicitudBackend = {
            numeroSolicitud: solicitud.numeroSolicitud,
            tipo: solicitud.tipo,
            almacen: solicitud.almacen,
            usuarioSolicita: solicitud.usuarioSolicita,
            nombreSolicita: solicitud.nombreSolicita,
            prioridad: solicitud.prioridad,
            observaciones: solicitud.observaciones,
            empresa: this.usuario.ruc, // RUC de la empresa
            detalle: solicitud.detalle?.map(d => ({
              codigo: d.codigo,
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              unidadMedida: d.unidadMedida,
              proyecto: d.proyecto,
              ceco: d.ceco
            }))
          };

          // Crear en backend
          const respuesta = await this.solicitudCompraService.crearSolicitud(solicitudBackend);
          
          console.log('📦 Respuesta del backend:', respuesta);
          console.log('📦 Tipo de respuesta:', typeof respuesta);
          console.log('📦 Claves de respuesta:', respuesta ? Object.keys(respuesta) : 'null');
          
          // Parsear respuesta según el patrón del backend
          let idSolicitud = null;
          let yaExiste = false;
          
          if (respuesta) {
            // Verificar si es un error de duplicado (legacy)
            if (respuesta.error && typeof respuesta.error === 'string' && 
                respuesta.error.includes('UNIQUE KEY') && 
                respuesta.error.includes(solicitud.numeroSolicitud)) {
              console.log(`⚠️ Solicitud duplicada detectada (error): ${solicitud.numeroSolicitud}`);
              yaExiste = true;
            } 
            // Verificar si el backend indica que ya existe (nuevo flag)
            else if (respuesta.yaExiste === 1 || respuesta.yaExiste === true) {
              console.log(`⚠️ Solicitud ya existe en backend: ${solicitud.numeroSolicitud}`);
              yaExiste = true;
              idSolicitud = respuesta.idSolicitud || respuesta.id || respuesta.idsolicitud;
            }
            // Parsear respuesta normal
            else if (typeof respuesta === 'string') {
              try {
                const parsed = JSON.parse(respuesta);
                idSolicitud = parsed.idSolicitud || parsed.id || parsed.idsolicitud;
              } catch (e) {
                console.error('Error parseando respuesta string:', e);
              }
            } else if (typeof respuesta === 'object') {
              // Intentar diferentes posibles nombres de campo
              idSolicitud = respuesta.idSolicitud || 
                           respuesta.id || 
                           respuesta.idsolicitud ||
                           respuesta.IdSolicitud ||
                           respuesta.IDSOLICITUD;
            }
          }
          
          console.log('🔑 idSolicitud extraído:', idSolicitud);
          console.log('🔍 Ya existe:', yaExiste);
          
          // Si es duplicado y no tenemos ID, buscar en el backend
          if (yaExiste && !idSolicitud) {
            try {
              const solicitudesProcesadas = await this.solicitudCompraService.listarSolicitudesProcesadas(this.usuario.ruc);
              const existente = solicitudesProcesadas.find((s: any) => s.serie === solicitud.numeroSolicitud);
              
              if (existente && existente.idSolicitud) {
                idSolicitud = existente.idSolicitud;
                console.log(`✅ Encontrado ID de solicitud duplicada: ${idSolicitud}`);
              }
            } catch (error) {
              console.error('Error buscando solicitud duplicada:', error);
            }
          }
          
          if (idSolicitud) {
            // Actualizar estado en backend
            await this.solicitudCompraService.actualizarEstado(
              idSolicitud,
              'ENVIADA',
              this.usuario.documentoidentidad
            );
            
            // Marcar como sincronizado en Dexie
            solicitud.sincronizado = true;
            solicitud.idSolicitud = idSolicitud; // Guardar el ID del backend
            await this.dexieService.saveSolicitudCompra(solicitud);
            
            console.log(`✅ Sincronizada: ${solicitud.numeroSolicitud} (ID Backend: ${idSolicitud})`);
          } else {
            console.error(`❌ No se recibió idSolicitud para: ${solicitud.numeroSolicitud}`);
            console.error('Respuesta completa:', JSON.stringify(respuesta, null, 2));
          }
        } catch (error) {
          console.error(`❌ Error sincronizando ${solicitud.numeroSolicitud}:`, error);
          console.error('Detalles del error:', {
            message: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }

      console.log('✅ Sincronización completada');
      this.sincronizando = false;
    } catch (error) {
      console.error('Error en sincronización:', error);
      this.sincronizando = false;
    }
  }

  /**
   * Sincronización manual (botón)
   */
  async sincronizarManual() {
    if (!this.tieneConexion) {
      this.alertService.showAlert(
        'Sin Conexión',
        'No hay conexión con el servidor. Verifique su conexión a internet.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();
      await this.sincronizarConBackend();
      
      // Recargar solicitudes procesadas después de sincronizar
      await this.cargarSolicitudesProcesadas();
      
      this.alertService.cerrarModalCarga();
      
      this.alertService.showAlert(
        'Éxito',
        'Sincronización completada correctamente.',
        'success'
      );
    } catch (error) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error durante la sincronización.',
        'error'
      );
    }
  }

  // ============================================
  // MÉTODOS PARA TAB 2: SOLICITUDES PROCESADAS
  // ============================================

  /**
   * Ver detalle completo de una solicitud procesada (abre modal PrimeNG)
   */
  verDetalleProcesada(solicitud: any) {
    this.solicitudProcesadaDetalle = solicitud;
    this.modalDetalleProcesadaAbierto = true;
  }

  /**
   * Cerrar modal de detalle de solicitud procesada
   */
  cerrarModalDetalleProcesada() {
    this.modalDetalleProcesadaAbierto = false;
    this.solicitudProcesadaDetalle = null;
  }

  /**
   * Ver adjuntos de una solicitud procesada
   */
  verAdjuntosProcesada(solicitud: any) {
    if (!solicitud.adjuntos || solicitud.adjuntos.length === 0) {
      this.alertService.showAlert(
        'Sin Adjuntos',
        'Esta solicitud no tiene adjuntos.',
        'info'
      );
      return;
    }

    let adjuntosHTML = `
      <div style="text-align: left;">
        <h4>Adjuntos de ${solicitud.serie}</h4>
        <hr>
        <ul style="list-style: none; padding: 0;">
    `;

    solicitud.adjuntos.forEach((adj: any) => {
      adjuntosHTML += `
        <li style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <strong>${adj.nombreArchivo}</strong><br>
          <small>Tipo: ${adj.tipoArchivo || 'N/A'}</small><br>
          <small>Tamaño: ${(adj.tamanoArchivo / 1024).toFixed(2)} KB</small><br>
          <small>Fecha: ${new Date(adj.fechaCreacion).toLocaleDateString()}</small>
        </li>
      `;
    });

    adjuntosHTML += `
        </ul>
      </div>
    `;

    this.alertService.showAlert(
      'Adjuntos',
      adjuntosHTML,
      'info'
    );
  }
}
