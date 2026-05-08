import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import Swal from 'sweetalert2';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { OrdenCompraService } from '@/app/services/orden-compra.service';
import { SolicitudCompraService } from '@/app/services/solicitud-compra.service';
import { SeguimientoOCService } from '@/app/services/seguimiento-oc.service';
import { ConsolidacionService } from '@/app/services/consolidacion.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { ItemService } from '@/app/modules/main/services/items.service';
import { OrdenCompraPdfService } from './orden-compra-pdf.service';
import { EmailService } from '@/app/modules/main/services/email.service';
import { lastValueFrom } from 'rxjs';
import {
  OrdenCompra,
  DetalleOrdenCompra,
  Cotizacion,
  SolicitudCompra,
  Usuario,
  Almacen,
  SeguimientoOrdenCompra,
  HitoCompra,
  EstadoSeguimientoOC,
  OrdenCompraConSeguimiento,
  Proveedor
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-ordenes-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule],
  templateUrl: './ordenes-compra.component.html',
  styleUrls: ['./ordenes-compra.component.scss'],
})
export class OrdenesCompraComponent implements OnInit {
  // Listas principales
  ordenesCompra: OrdenCompra[] = [];
  cotizaciones: Cotizacion[] = [];
  solicitudesCompra: SolicitudCompra[] = [];
  almacenes: Almacen[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Orden actual
  ordenCompra: OrdenCompra | null = null;
  detalleOrden: DetalleOrdenCompra[] = [];

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

  // Cotización seleccionada
  cotizacionSeleccionada: Cotizacion | null = null;

  // Filtros
  filtroEstado: string = 'TODAS';
  filtroProveedor: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalGeneradas = 0;
  totalEnviadas = 0;
  totalConfirmadas = 0;
  totalEnProceso = 0;
  totalRecibidas = 0;

  // Modal detalle orden
  modalDetalleOrdenAbierto = false;
  ordenDetalle: OrdenCompra | null = null;

  // Modal seguimiento
  modalSeguimientoAbierto = false;
  ordenSeguimiento: OrdenCompra | null = null;
  seguimientoActual: SeguimientoOrdenCompra | null = null;

  // Distribución contable
  distribucionContable: any[] = [];
  mostrarTabDistribucion = false;
  gastosData: any[] = [];
  laborData: any[] = [];

  // FormControl maps para dropdowns inline de distribución (igual que module-compras)
  private ccDestinoControls = new Map<string, FormControl>();
  private referenciaControls = new Map<string, FormControl>();

  // Estados del timeline de OC
  estadosSeguimiento: EstadoSeguimientoOC[] = [
    'GENERADA',
    'APROBADA',
    'CONFIRMADA',
    'EN_PROCESO',
    'RECIBIDA_PARCIAL',
    'RECIBIDA_TOTAL'
  ];

  // Gestión de hitos
  hitosEnEdicion: HitoCompra | null = null;
  modalHitoAbierto = false;
  estadosHito: string[] = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO'];

  // Modal generar OC desde solicitud
  modalGenerarOCAbierto = false;
  solicitudSeleccionada: SolicitudCompra | null = null;
  datosProveedor = {
    proveedor: '',
    nombreProveedor: '',
    rucProveedor: '',
    direccionProveedor: '',
    telefonoProveedor: '',
    emailProveedor: '',
    moneda: 'PEN',
    tipoCambio: 3.0,
    fechaEntregaEstimada: '',
    lugarEntrega: '',
    condicionesPago: '',
    formaPago: '001',
    observaciones: ''
  };

  // Sistema Híbrido
  estaConectado = true;
  sincronizacionPendiente = false;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService,
    private consolidacionService: ConsolidacionService,
    private ordenCompraService: OrdenCompraService,
    private solicitudCompraService: SolicitudCompraService,
    private seguimientoOCService: SeguimientoOCService,
    private maestrasService: MaestrasService,
    private itemService: ItemService,
    private pdfService: OrdenCompraPdfService,
    private emailService: EmailService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    this.ordenCompra = this.nuevaOrdenCompra();
    await this.cargarOrdenesCompra();
    await this.cargarCotizaciones();
    await this.cargarSolicitudesCompra();
    await this.cargarAlmacenes();
    this.actualizarContadores();
    await this.cargarCatalogosDistribucion();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarOrdenesCompra() {
    this.ordenesCompra = await this.dexieService.showOrdenesCompra();
    this.actualizarContadores();
  }

  async cargarCotizaciones() {
    const todas = await this.dexieService.showCotizaciones();
    // Filtrar solo cotizaciones seleccionadas
    this.cotizaciones = todas.filter((c: Cotizacion) => c.estado === 'SELECCIONADA');
  }

  async cargarAlmacenes() {
    this.almacenes = await this.dexieService.showAlmacenes();
  }

  async cargarSolicitudesCompra() {
    // Prioridad 1: cargar del backend (solicitudes con idestado = APROBADA)
    try {
      const empresa = this.usuario.ruc || '';
      const backendData = await this.solicitudCompraService.listarSolicitudesProcesadas(empresa);
      const aprobadas = Array.isArray(backendData)
        ? backendData.filter((s: any) => s.idestado === 'APROBADA')
        : [];

      // Mapear al formato local para reutilizar la misma tabla
      this.solicitudesCompra = aprobadas.map((s: any) => ({
        id: s.id || 0,
        idSolicitud: s.idSolicitud || s.idsolicitud,
        numeroSolicitud: s.serie || s.numeroSolicitud || '',
        fecha: s.fecha || '',
        tipo: 'DIRECTA' as const,
        almacen: s.almacen || '',
        usuarioSolicita: s.usuariosolicita || '',
        nombreSolicita: s.nombresolicita || '',
        estado: 'APROBADA' as const,
        observaciones: s.observaciones || '',
        fechaRequerida: s.fechaentrega || s.fechaRequerida || '',
        moneda: s.moneda || 'PEN',
        montoEstimado: s.montoTotal || s.montototal || 0,
        detalle: []
      }));
    } catch {
      // Si el backend no responde, usar Dexie local como fallback
      const todas = await this.dexieService.solicitudesCompra.toArray();
      this.solicitudesCompra = todas.filter(
        (s: SolicitudCompra) => s.estado === 'APROBADA' && s.idSolicitud
      );
    }
  }

  actualizarContadores() {
    this.totalGeneradas = this.ordenesCompra.filter((o) => o.estado === 'GENERADA').length;
    this.totalEnviadas = this.ordenesCompra.filter((o) => o.estado === 'ENVIADA').length;
    this.totalConfirmadas = this.ordenesCompra.filter((o) => o.estado === 'CONFIRMADA').length;
    this.totalEnProceso = this.ordenesCompra.filter((o) => o.estado === 'EN_PROCESO').length;
    this.totalRecibidas = this.ordenesCompra.filter(
      (o) => o.estado === 'RECIBIDA_PARCIAL' || o.estado === 'RECIBIDA_TOTAL'
    ).length;
  }

  async cargarCatalogosDistribucion() {
    try {
      // Cargar gastos: desde Dexie o API si está vacío
      let gastos = await this.dexieService.showTipoGastos();
      if (!gastos || gastos.length === 0) {
        try {
          const resp = await lastValueFrom(this.maestrasService.getTipoGastos([{}]));
          if (resp && resp.length) {
            await this.dexieService.saveTipoGastos(resp);
            gastos = await this.dexieService.showTipoGastos();
          }
        } catch { /* sin conexión, continuar */ }
      }
      this.gastosData = gastos || [];

      // Cargar labores: desde Dexie o API si está vacío
      let labores = await this.dexieService.showLabores();
      if (!labores || labores.length === 0) {
        try {
          const resp = await this.maestrasService.getLabores([{ aplicacion: 'LOGISTICA', esadmin: 0 }]);
          if (resp && resp.length) {
            await this.dexieService.saveLabores(resp);
            labores = await this.dexieService.showLabores();
          }
        } catch { /* sin conexión, continuar */ }
      }
      this.laborData = labores || [];
    } catch (error) {
      console.error('Error al cargar catálogos de distribución:', error);
    }
  }

  async asegurarMaestroItems(): Promise<void> {
    const count = await this.dexieService.maestroItems.count();
    if (count === 0) {
      try {
        const resp = await lastValueFrom(this.itemService.getItem([]));
        if (resp && resp.length) {
          await this.dexieService.saveMaestroItems(resp);
        }
      } catch { /* sin conexión */ }
    }
  }

  async generarDistribucionContable() {
    try {
      this.distribucionContable = [];
      this.ccDestinoControls.clear();
      this.referenciaControls.clear();

      // Asegurar que maestroItems esté cargado en Dexie
      await this.asegurarMaestroItems();

      // Obtener ceco y proyecto desde la cotización origen (que ya los tiene del requerimiento)
      const cotizacionId = this.ordenCompra?.cotizacionId || 0;
      let detallesCotizacion: any[] = [];
      if (cotizacionId) {
        const cotizacion = await this.dexieService.cotizaciones.get(cotizacionId);
        detallesCotizacion = cotizacion?.detalle || [];
      }

      // Buscar la solicitud de cotización para obtener idConsolidacion
      const idSolicitudCotizacion = this.cotizacionSeleccionada?.idSolicitudCotizacion || 0;
      let detallesSolicitudCot: any[] = [];
      if (idSolicitudCotizacion && detallesCotizacion.every((d: any) => !d.ceco)) {
        detallesSolicitudCot = await this.dexieService.detalleSolicitudCotizacion
          .where('idSolicitudCotizacion')
          .equals(idSolicitudCotizacion)
          .toArray();
      }

      // Fallback final: ir al SP del backend si Dexie no tiene ceco/proyecto (datos anteriores al fix)
      let detallesConsolidacion: any[] = [];
      const sinCeco = detallesCotizacion.every((d: any) => !d.ceco) && detallesSolicitudCot.every((d: any) => !d.ceco);
      if (sinCeco) {
        try {
          // Obtener idConsolidacion desde la solicitud en Dexie
          const solicitudCot = idSolicitudCotizacion
            ? await this.dexieService.solicitudesCotizacion.get(idSolicitudCotizacion)
            : null;
          const idConsolidacion = solicitudCot?.idConsolidacion || 0;
          if (idConsolidacion) {
            const consolidacion = await this.consolidacionService.obtenerConsolidacion(idConsolidacion);
            detallesConsolidacion = consolidacion?.detalles || [];
          }
        } catch (e) {
          console.warn('[DIST] No se pudo obtener consolidación del backend:', e);
        }
      }

      const distribucionesMap = new Map<string, any>();

      for (const detalleItem of this.detalleOrden) {
        const det = detalleItem as any;
        const subtotal = this.calcularSubtotalSinIgv(detalleItem);

        // Buscar ceco y proyecto: cotización Dexie → solicitud Dexie → consolidación backend (SP)
        const detCot = detallesCotizacion.find(
          (d: any) => d.codigo === detalleItem.codigo
        );
        const detSolCot = detallesSolicitudCot.find(
          (d: any) => d.codigoItem === detalleItem.codigo
        );
        const detConsolidacion = detallesConsolidacion.find(
          (d: any) => d.codigoItem === detalleItem.codigo
        );
        const centrocosto = det.centrocosto
          || detCot?.ceco
          || detSolCot?.ceco
          || detConsolidacion?.ceco
          || '';
        const proyecto = det.proyecto
          || detCot?.proyecto
          || detSolCot?.proyecto
          || detConsolidacion?.proyecto
          || '';

        let cuenta = '';
        let descripcion = detalleItem.descripcion || '';

        // Buscar por 'item' que coincide con codigo del detalle
        let itemData = await this.dexieService.maestroItems
          .where('item')
          .equals(detalleItem.codigo || '')
          .first();

        // Fallback: buscar por descripcionLocal si no coincidió por código
        if (!itemData && detalleItem.descripcion) {
          const desc = detalleItem.descripcion.trim();
          itemData = await this.dexieService.maestroItems
            .filter(m => m.descripcionLocal?.trim() === desc || m.descripcionCompleta?.trim() === desc)
            .first();
        }

        if (itemData) {
          cuenta = itemData.cuentaInventario || itemData.cuentaGasto || '';
          descripcion = itemData.subFamilia || itemData.familia || itemData.descripcionLocal || descripcion;
        }

        const cuentaKey = `${cuenta || detalleItem.codigo}-${centrocosto}-${proyecto}`;

        if (distribucionesMap.has(cuentaKey)) {
          distribucionesMap.get(cuentaKey).monto += subtotal;
        } else {
          distribucionesMap.set(cuentaKey, {
            id: `DIST-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            cuenta,
            descripcion,
            centrocosto,
            proyecto,
            monto: subtotal,
            referencia: '',
            ccdestino: ''
          });
        }
      }

      this.distribucionContable = Array.from(distribucionesMap.values());
    } catch (error) {
      console.error('Error al generar distribución contable:', error);
    }
  }

  getCCDestinoControl(item: any): FormControl {
    if (!this.ccDestinoControls.has(item.id)) {
      const control = new FormControl(item.ccdestino || '');
      control.valueChanges.subscribe(newValue => {
        this.distribucionContable = this.distribucionContable.map(dist =>
          dist.id === item.id ? { ...dist, ccdestino: newValue } : dist
        );
      });
      this.ccDestinoControls.set(item.id, control);
    } else {
      const control = this.ccDestinoControls.get(item.id)!;
      if (control.value !== item.ccdestino) {
        control.setValue(item.ccdestino || '', { emitEvent: false });
      }
    }
    return this.ccDestinoControls.get(item.id)!;
  }

  getReferenciaControl(item: any): FormControl {
    if (!this.referenciaControls.has(item.id)) {
      const control = new FormControl(item.referencia || '');
      control.valueChanges.subscribe(newValue => {
        this.distribucionContable = this.distribucionContable.map(dist =>
          dist.id === item.id ? { ...dist, referencia: newValue } : dist
        );
      });
      this.referenciaControls.set(item.id, control);
    } else {
      const control = this.referenciaControls.get(item.id)!;
      if (control.value !== item.referencia) {
        control.setValue(item.referencia || '', { emitEvent: false });
      }
    }
    return this.referenciaControls.get(item.id)!;
  }

  calcularSubtotalSinIgv(detalle: DetalleOrdenCompra): number {
    const cantidad = detalle.cantidad || 0;
    const precio = detalle.precioUnitario || 0;
    const descuento = detalle.descuento || 0;
    return cantidad * precio * (1 - descuento / 100);
  }

  getTotalDistribucion(): number {
    return this.distribucionContable.reduce((sum, item) => sum + (item.monto || 0), 0);
  }

  nuevaOrdenCompra(): OrdenCompra {
    return {
      numeroOrden: '',
      solicitudCompraId: 0,
      fecha: new Date().toISOString(),
      fechaEntrega: '',
      proveedor: '',
      nombreProveedor: '',
      rucProveedor: '',
      direccionEntrega: '',
      montoTotal: 0,
      moneda: 'PEN',
      formaPago: 'CONTADO',
      condicionesPago: '',
      plazoEntrega: 0,
      detalle: [],
      estado: 'GENERADA',
      usuarioGenera: this.usuario.documentoidentidad || '',
    };
  }

  nuevaOrdenCompraForm() {
    this.ordenCompra = this.nuevaOrdenCompra();
    this.detalleOrden = [];
    this.cotizacionSeleccionada = null;
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async generarDesdeCotizacion(cotizacion: Cotizacion) {
    try {
      this.alertService.mostrarModalCarga();

      // Cargar solicitud de compra: buscar primero por id local Dexie,
      // luego por idSolicitud del backend (por si fue sincronizada)
      let solicitud = await this.dexieService.solicitudesCompra.get(
        cotizacion.solicitudCompraId
      );
      if (!solicitud && cotizacion.solicitudCompraId) {
        const todas = await this.dexieService.solicitudesCompra.toArray();
        solicitud = todas.find(
          (s: any) =>
            s.idSolicitud === cotizacion.solicitudCompraId ||
            s.numeroSolicitud === cotizacion.numeroSolicitud
        );
      }
      // Si aún no hay solicitud, crear una ficticia para no bloquear el flujo
      if (!solicitud) {
        solicitud = {
          id: cotizacion.solicitudCompraId,
          idSolicitud: cotizacion.solicitudCompraId,
          numeroSolicitud: cotizacion.numeroSolicitud || '',
          fecha: cotizacion.fecha,
          tipo: 'DIRECTA' as const,
          almacen: '',
          usuarioSolicita: '',
          nombreSolicita: '',
          estado: 'APROBADA' as const,
          observaciones: '',
          detalle: [],
        } as any;
      }

      // Crear orden desde cotización
      this.ordenCompra = {
        numeroOrden: this.generarNumeroOrden(),
        solicitudCompraId: cotizacion.solicitudCompraId,
        cotizacionId: cotizacion.id,
        fecha: new Date().toISOString().split('T')[0],
        fechaEntrega: this.calcularFechaEntrega(cotizacion.plazoEntrega),
        proveedor: cotizacion.proveedor,
        nombreProveedor: cotizacion.nombreProveedor,
        rucProveedor: cotizacion.rucProveedor,
        direccionEntrega: cotizacion.lugarEntrega || '',
        montoTotal: cotizacion.montoTotal,
        moneda: cotizacion.moneda,
        formaPago: cotizacion.formaPago,
        condicionesPago: cotizacion.condicionesPago,
        plazoEntrega: cotizacion.plazoEntrega,
        garantia: cotizacion.garantia,
        observaciones: cotizacion.observaciones,
        detalle: [],
        estado: 'GENERADA',
        usuarioGenera: this.usuario.documentoidentidad,
      };

      // Convertir detalle de cotización a detalle de orden
      this.detalleOrden = cotizacion.detalle.map((det) => ({
        ordenCompraId: 0,
        codigo: det.codigo,
        descripcion: det.descripcion,
        cantidad: det.cantidad,
        cantidadRecibida: 0,
        cantidadPendiente: det.cantidad,
        unidadMedida: det.unidadMedida,
        precioUnitario: det.precioUnitario,
        descuento: det.descuento,
        subtotal: det.subtotal,
        impuesto: det.impuesto,
        total: det.total,
        marca: det.marca,
        modelo: det.modelo,
        especificaciones: det.especificaciones,
        estado: 'PENDIENTE',
      }));

      // Generar distribución contable desde el detalle
      await this.generarDistribucionContable();

      this.cotizacionSeleccionada = cotizacion;
      this.mostrarFormulario = true;
      this.modoEdicion = false;

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Orden de compra generada desde cotización.',
        'success'
      );
    } catch (error) {
      console.error('Error al generar orden desde cotización:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al generar la orden de compra.',
        'error'
      );
    }
  }

  abrirModalGenerarOC(solicitud: SolicitudCompra) {
    this.solicitudSeleccionada = solicitud;
    this.datosProveedor = {
      proveedor: '',
      nombreProveedor: '',
      rucProveedor: '',
      direccionProveedor: '',
      telefonoProveedor: '',
      emailProveedor: '',
      moneda: solicitud.moneda || 'PEN',
      tipoCambio: 3.0,
      fechaEntregaEstimada: solicitud.fechaRequerida || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lugarEntrega: solicitud.almacen || '',
      condicionesPago: '',
      formaPago: '001',
      observaciones: solicitud.observaciones || ''
    };
    this.modalGenerarOCAbierto = true;
  }

  cerrarModalGenerarOC() {
    this.modalGenerarOCAbierto = false;
    this.solicitudSeleccionada = null;
  }

  generarDesdeSolicitud(solicitud: SolicitudCompra) {
    this.abrirModalGenerarOC(solicitud);
  }

  async confirmarGenerarOC() {
    if (!this.solicitudSeleccionada) return;

    if (!this.datosProveedor.proveedor) {
      this.alertService.showAlert('Atención', 'Ingrese el código del proveedor.', 'warning');
      return;
    }
    if (!this.datosProveedor.nombreProveedor) {
      this.alertService.showAlert('Atención', 'Ingrese el nombre del proveedor.', 'warning');
      return;
    }
    if (!this.datosProveedor.rucProveedor) {
      this.alertService.showAlert('Atención', 'Ingrese el RUC del proveedor.', 'warning');
      return;
    }
    if (!this.datosProveedor.fechaEntregaEstimada) {
      this.alertService.showAlert('Atención', 'Ingrese la fecha de entrega estimada.', 'warning');
      return;
    }

    try {
      this.cerrarModalGenerarOC();
      this.alertService.mostrarModalCarga();

      const datos = {
        idSolicitud: this.solicitudSeleccionada.idSolicitud || this.solicitudSeleccionada.id,
        ...this.datosProveedor,
        usuarioRegistra: this.usuario.documentoidentidad || '',
        nombreUsuarioRegistra: this.usuario.nombre || ''
      };

      const respuesta = await this.ordenCompraService.generarOrdenDesdeSolicitud(datos);

      if (respuesta && respuesta.mensaje) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Éxito', respuesta.mensaje, 'success');
        await this.cargarOrdenesCompra();
        await this.cargarSolicitudesCompra();
        this.actualizarContadores();
      } else if (respuesta && respuesta.error) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Error', respuesta.error, 'error');
      } else {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Error', 'No se pudo generar la orden de compra.', 'error');
      }
    } catch (error) {
      console.error('Error al generar OC desde solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al generar la orden de compra.', 'error');
    }
  }

  async sincronizarConSpring(orden: OrdenCompra) {
    try {
      const confirmacion = await this.alertService.showConfirm(
        'Confirmación',
        '¿Desea enviar esta orden de compra al ERP SPRING?',
        'info'
      );

      if (!confirmacion) return;

      this.alertService.mostrarModalCarga();

      // Preparar datos para sincronización según el formato esperado por el SP
      const ord: any = orden;
      const datosSincronizacion = [{
        idordencompra: orden.numeroOrden || '',
        ruc: this.usuario.ruc || '',
        idempresa: this.usuario.idempresa || '',
        serie: 'WHPO',
        idproveedor: orden.proveedor || '',
        idalmacen: ord.almacen || '',
        fechaprometida: orden.fechaEntrega ? orden.fechaEntrega.split('T')[0] : new Date().toISOString().split('T')[0],
        idmoneda: orden.moneda || 'PEN',
        montoigv: ord.montoIgv || 0,
        montototal: orden.montoTotal || 0,
        montopendientedepago: orden.montoTotal || 0,
        plazoentrega: orden.plazoEntrega || 10,
        idformapago: orden.formaPago || '001',
        observaciones: orden.observaciones || '',
        idproyecto: ord.proyecto || '',
        idactividad: '',
        idlabor: ord.labor || '',
        idestado: 'PE',
        idaprobacion: '',
        dniusuario: this.usuario.documentoidentidad || '',
        detalle: (orden.detalle || []).map((det, index) => {
          const detAny: any = det;
          return {
            idordencompradetalle: `${orden.numeroOrden}-${index + 1}`,
            tipo: detAny.tipo || 'BIEN',
            codigo: det.codigo || '',
            unidadmedida: det.unidadMedida || '',
            descripcion: (det.descripcion || '').substring(0, 60),
            cantidadpedida: det.cantidad || 0,
            cantidadrecibida: det.cantidadRecibida || 0,
            preciounitario: det.precioUnitario || 0,
            igv: detAny.igv || det.impuesto || 0,
            descuento: det.descuento || 0,
            centrocosto: detAny.centrocosto || '',
            proyecto: detAny.proyecto || '',
            idestado: 'PE',
            eliminado: 0
          };
        }),
        distribucion: (this.distribucionContable || []).map((dist: any) => ({
          cuenta: dist.cuenta || '',
          descripcion: dist.descripcion || '',
          centrocosto: dist.centrocosto || '',
          proyecto: dist.proyecto || '',
          monto: dist.monto || 0,
          referencia: dist.referencia || '',
          ccdestino: dist.ccdestino || ''
        })),
        adjuntos: []
      }];

      const respuesta = await this.ordenCompraService.sincronizarOrdenCompra(datosSincronizacion);

      if (respuesta && respuesta.errorgeneral === 0) {
        // Actualizar estado de la orden localmente
        orden.estado = 'ENVIADA';
        await this.dexieService.saveOrdenCompra(orden);

        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Éxito',
          `Orden de compra enviada a SPRING. Número: ${respuesta.numeroOrden}`,
          'success'
        );

        await this.cargarOrdenesCompra();
        this.actualizarContadores();
      } else {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Error',
          respuesta.mensaje || 'Error al sincronizar con SPRING',
          'error'
        );
      }
    } catch (error) {
      console.error('Error al sincronizar con SPRING:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al sincronizar la orden de compra con SPRING.',
        'error'
      );
    }
  }

  calcularFechaEntrega(plazoEntrega: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + plazoEntrega);
    return fecha.toISOString();
  }

  async guardarOrdenCompra() {
    if (!this.ordenCompra) {
      this.alertService.showAlert(
        'Error',
        'No hay una orden de compra activa.',
        'error'
      );
      return;
    }

    if (!this.ordenCompra.proveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del proveedor.',
        'warning'
      );
      return;
    }

    if (!this.ordenCompra.nombreProveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el nombre del proveedor.',
        'warning'
      );
      return;
    }

    if (!this.ordenCompra.direccionEntrega) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar la dirección de entrega.',
        'warning'
      );
      return;
    }

    if (this.detalleOrden.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un item a la orden de compra.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (!this.modoEdicion) {
        this.ordenCompra.numeroOrden = this.generarNumeroOrden();
      }

      this.ordenCompra.detalle = [...this.detalleOrden];
      this.ordenCompra.usuarioGenera = this.usuario.documentoidentidad;
      this.ordenCompra.estado = 'GENERADA';

      // Guardar localmente primero
      await this.dexieService.saveOrdenCompra(this.ordenCompra);

      // Si está conectado, asignar aprobadores automáticamente
      if (this.estaConectado && !this.modoEdicion) {
        try {
          const respuesta = await this.ordenCompraService
            .asignarAprobadores(this.ordenCompra.id!, this.ordenCompra.montoTotal)
            .toPromise();

          if (respuesta?.status === 'success') {
            console.log('Aprobadores asignados:', respuesta);
            this.ordenCompra.estadoAprobacion = 'PENDIENTE';
            this.ordenCompra.requiereAprobacion = true;
            await this.dexieService.saveOrdenCompra(this.ordenCompra);
          }
        } catch (errorAprobacion) {
          console.warn('Error al asignar aprobadores:', errorAprobacion);
          // Continuar aunque falle la asignación de aprobadores
        }
      }

      // Si se generó desde cotización, actualizar solicitud y cotización
      if (this.ordenCompra.solicitudCompraId) {
        const solicitud = await this.dexieService.solicitudesCompra.get(
          this.ordenCompra.solicitudCompraId
        );
        if (solicitud) {
          solicitud.estado = 'ORDEN_GENERADA';
          await this.dexieService.saveSolicitudCompra(solicitud);
        }
      }
      // Marcar la cotización como ORDEN_GENERADA para que salga de Pendientes
      if (this.ordenCompra.cotizacionId) {
        const cotizacion = await this.dexieService.cotizaciones.get(this.ordenCompra.cotizacionId);
        if (cotizacion) {
          cotizacion.estado = 'ORDEN_GENERADA';
          await this.dexieService.cotizaciones.put(cotizacion);
        }
      }
      await this.cargarCotizaciones();

      this.alertService.cerrarModalCarga();
      
      const mensajeExito = this.ordenCompra.requiereAprobacion
        ? 'Orden de compra generada y enviada a aprobación correctamente.'
        : 'Orden de compra guardada correctamente.';
      
      this.alertService.showAlert('Éxito', mensajeExito, 'success');

      this.mostrarFormulario = false;
      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al guardar orden de compra:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la orden de compra.',
        'error'
      );
    }
  }

  generarNumeroOrden(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `OC-${año}${mes}${dia}-${hora}${min}${seg}`;
  }

  async editarOrdenCompra(index: number) {
    const orden = this.ordenesCompraFiltradas()[index];
    if (!orden) return;

    if (orden.estado !== 'GENERADA') {
      this.alertService.showAlert(
        'Atención',
        'Solo se pueden editar órdenes en estado GENERADA.',
        'warning'
      );
      return;
    }

    this.ordenCompra = { ...orden };
    this.detalleOrden = [...(orden.detalle || [])];
    this.modoEdicion = true;
    this.editIndex = index;
    this.mostrarFormulario = true;

    // Generar distribución contable desde el detalle
    await this.generarDistribucionContable();
  }

  async eliminarOrdenCompra(index: number) {
    const orden = this.ordenesCompraFiltradas()[index];
    if (!orden) return;

    if (orden.estado !== 'GENERADA') {
      this.alertService.showAlert(
        'Atención',
        'Solo se pueden eliminar órdenes en estado GENERADA.',
        'warning'
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Está seguro de eliminar esta orden de compra?',
      'warning'
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.ordenesCompra.delete(orden.id!);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra eliminada correctamente.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al eliminar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar la orden de compra.',
        'error'
      );
    }
  }

  async enviarOrdenCompra(orden: OrdenCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar esta orden de compra al proveedor?',
      'info'
    );

    if (!confirmacion) return;

    try {
      orden.estado = 'ENVIADA';
      await this.dexieService.saveOrdenCompra(orden);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra enviada correctamente.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al enviar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al enviar la orden de compra.',
        'error'
      );
    }
  }

  async confirmarOrdenCompra(orden: OrdenCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿El proveedor ha confirmado esta orden de compra?',
      'info'
    );

    if (!confirmacion) return;

    try {
      orden.estado = 'CONFIRMADA';
      orden.usuarioAprueba = this.usuario.documentoidentidad;
      orden.fechaAprobacion = new Date().toISOString();
      await this.dexieService.saveOrdenCompra(orden);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra confirmada correctamente.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al confirmar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al confirmar la orden de compra.',
        'error'
      );
    }
  }

  async iniciarProcesoOrden(orden: OrdenCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Marcar esta orden como EN PROCESO?',
      'info'
    );

    if (!confirmacion) return;

    try {
      orden.estado = 'EN_PROCESO';
      await this.dexieService.saveOrdenCompra(orden);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra marcada como EN PROCESO.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al actualizar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al actualizar la orden de compra.',
        'error'
      );
    }
  }

  async cancelarOrdenCompra(orden: OrdenCompra) {
    const motivo = await this.alertService.showPrompt(
      'Cancelar Orden de Compra',
      'Ingrese el motivo de la cancelación:'
    );

    if (!motivo) return;

    try {
      orden.estado = 'CANCELADA';
      orden.observaciones = (orden.observaciones || '') + '\nCANCELADA: ' + motivo;
      await this.dexieService.saveOrdenCompra(orden);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra cancelada correctamente.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al cancelar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al cancelar la orden de compra.',
        'error'
      );
    }
  }

  async generarPdfOrdenCompra(orden: OrdenCompra) {
    try {
      // Obtener datos del proveedor
      let proveedor: Proveedor = {
        id: 0,
        TipoPersona: 'JURIDICA',
        documento: orden.rucProveedor || '',
        ruc: orden.rucProveedor || '',
        Estado: 'ACTIVO',
        TipoPago: orden.formaPago || 'CONTADO',
        MonedaPago: orden.moneda || 'PEN',
        detraccion: '',
        TipoServicio: 'BIENES'
      };

      // Generar y descargar PDF
      this.pdfService.descargarPdf(orden, proveedor);

      this.alertService.showAlert(
        'Éxito',
        'PDF de orden de compra generado correctamente.',
        'success'
      );
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al generar el PDF.',
        'error'
      );
    }
  }

  async enviarOrdenCompraPorEmail(orden: OrdenCompra) {
    try {
      // Generar PDF en base64
      let proveedor: Proveedor = {
        id: 0,
        TipoPersona: 'JURIDICA',
        documento: orden.rucProveedor || '',
        ruc: orden.rucProveedor || '',
        Estado: 'ACTIVO',
        TipoPago: orden.formaPago || 'CONTADO',
        MonedaPago: orden.moneda || 'PEN',
        detraccion: '',
        TipoServicio: 'BIENES'
      };

      // Generar PDF
      const pdfDoc = this.pdfService.generarPdfOrdenCompra(orden, proveedor);
      const pdfBase64 = pdfDoc.output('datauristring').split(',')[1];

      // Enviar por email
      const resultado = await this.emailService.enviarOrdenCompraPorEmail(
        orden, 
        pdfBase64, 
        orden.correoProveedor
      );

      if (resultado) {
        this.alertService.showAlert(
          'Éxito',
          'Orden de compra enviada por email correctamente.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error al enviar orden de compra por email:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al enviar el email.',
        'error'
      );
    }
  }

  verDetalle(orden: OrdenCompra) {
    this.ordenDetalle = orden;
    this.modalDetalleOrdenAbierto = true;
  }

  cerrarModalDetalleOrden() {
    this.modalDetalleOrdenAbierto = false;
    this.ordenDetalle = null;
  }

  cancelarFormulario() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar? Se perderán los cambios no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  // Filtros
  ordenesCompraFiltradas(): OrdenCompra[] {
    let filtradas = [...this.ordenesCompra];

    if (this.filtroEstado !== 'TODAS') {
      filtradas = filtradas.filter((o) => o.estado === this.filtroEstado);
    }

    if (this.filtroProveedor) {
      filtradas = filtradas.filter(
        (o) =>
          o.nombreProveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase()) ||
          o.proveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase())
      );
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (o) => new Date(o.fecha) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter((o) => new Date(o.fecha) <= new Date(this.filtroFechaFin));
    }

    return filtradas;
  }

  limpiarFiltros() {
    this.filtroEstado = 'TODAS';
    this.filtroProveedor = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  // Utilidades
  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      GENERADA: 'badge-info',
      ENVIADA: 'badge-warning',
      CONFIRMADA: 'badge-primary',
      EN_PROCESO: 'badge-secondary',
      RECIBIDA_PARCIAL: 'badge-warning',
      RECIBIDA_TOTAL: 'badge-success',
      CANCELADA: 'badge-danger',
    };
    return clases[estado] || 'badge-secondary';
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

  formatearMoneda(monto: number, moneda: string = 'PEN'): string {
    const simbolo = moneda === 'PEN' ? 'S/' : '$';
    return `${simbolo} ${monto.toFixed(2)}`;
  }

  calcularPorcentajeRecibido(orden: OrdenCompra): number {
    if (!orden.detalle || orden.detalle.length === 0) return 0;

    const totalOrdenado = orden.detalle.reduce((sum, d) => sum + d.cantidad, 0);
    const totalRecibido = orden.detalle.reduce((sum, d) => sum + d.cantidadRecibida, 0);

    return totalOrdenado > 0 ? (totalRecibido / totalOrdenado) * 100 : 0;
  }

  obtenerEstadoDetalle(detalle: DetalleOrdenCompra): string {
    if (detalle.cantidadRecibida === 0) return 'PENDIENTE';
    if (detalle.cantidadRecibida >= detalle.cantidad) return 'COMPLETO';
    return 'PARCIAL';
  }

  // ============================================
  // MÉTODOS DE SEGUIMIENTO DE OC
  // ============================================

  /**
   * Crear un hito vacío para edición
   */
  nuevoHitoVacio(): HitoCompra {
    return {
      descripcion: '',
      estado: 'PENDIENTE',
      porcentajeAvance: 0,
      fechaProgramada: '',
      responsable: '',
      observaciones: ''
    };
  }

  /**
   * Ver seguimiento de una orden de compra
   */
  async verSeguimiento(orden: OrdenCompra) {
    this.ordenSeguimiento = orden;
    this.modalSeguimientoAbierto = true;

    try {
      const seguimiento = await this.seguimientoOCService.obtenerSeguimiento(orden.id!).toPromise();
      if (seguimiento) {
        this.seguimientoActual = seguimiento;
      } else {
        // Sin registro en backend: construir seguimiento local desde la orden
        this.seguimientoActual = {
          id: orden.id ?? 0,
          idOrden: orden.id ?? 0,
          numeroOrden: orden.numeroOrden,
          estado: orden.estado as any,
          proveedor: orden.proveedor,
          nombreProveedor: orden.nombreProveedor,
          montoTotal: orden.montoTotal,
          usuarioGenera: '',
          porcentajeAvance: this.calcularPorcentajePorEstado(orden.estado as string),
          fechaRegistro: new Date().toISOString(),
          hitos: []
        };
      }
    } catch (error) {
      console.error('Error al cargar seguimiento:', error);
      // Igual construir desde la orden para mostrar el estado correcto
      this.seguimientoActual = {
        id: orden.id ?? 0,
        idOrden: orden.id ?? 0,
        numeroOrden: orden.numeroOrden,
        estado: orden.estado as any,
        proveedor: orden.proveedor,
        nombreProveedor: orden.nombreProveedor,
        montoTotal: orden.montoTotal,
        usuarioGenera: '',
        porcentajeAvance: this.calcularPorcentajePorEstado(orden.estado as string),
        fechaRegistro: new Date().toISOString(),
        hitos: []
      };
    }
  }

  /**
   * Cerrar modal de seguimiento
   */
  cerrarModalSeguimiento() {
    this.modalSeguimientoAbierto = false;
    this.ordenSeguimiento = null;
    this.seguimientoActual = null;
  }

  /**
   * Calcular porcentaje total basado en hitos o en estado del flujo
   */
  calcularPorcentajeTotal(): number {
    // Si hay hitos, calcular desde ellos
    if (this.seguimientoActual?.hitos && this.seguimientoActual.hitos.length > 0) {
      return this.seguimientoOCService.calcularPorcentajeAvance(this.seguimientoActual.hitos);
    }
    // Sin hitos: calcular según el estado del flujo
    const estado = this.seguimientoActual?.estado || this.ordenSeguimiento?.estado;
    return this.calcularPorcentajePorEstado(estado as string);
  }

  /**
   * Devuelve el % fijo que corresponde a cada estado del flujo
   */
  calcularPorcentajePorEstado(estado: string): number {
    const mapa: Record<string, number> = {
      'GENERADA':          0,
      'ENVIADA':          10,
      'APROBADA':         20,
      'CONFIRMADA':       40,
      'EN_PROCESO':       60,
      'RECIBIDA_PARCIAL': 80,
      'RECIBIDA_TOTAL':  100,
      'CANCELADA':         0,
      'ANULADA':           0
    };
    return mapa[estado] ?? 0;
  }

  /**
   * Avanzar al siguiente estado del flujo
   */
  async avanzarEstado() {
    if (!this.seguimientoActual || !this.ordenSeguimiento) return;

    const siguienteEstado = this.seguimientoOCService.obtenerSiguienteEstado(this.seguimientoActual.estado);
    if (!siguienteEstado) {
      Swal.fire('Aviso', 'No se puede avanzar más en el flujo', 'warning');
      return;
    }

    try {
      await this.seguimientoOCService.actualizarSeguimiento({
        idOrden: this.ordenSeguimiento.id!,
        nuevoEstado: siguienteEstado,
        usuario: this.usuario.usuario,
        hitos: this.seguimientoActual.hitos
      }).toPromise();

      await this.verSeguimiento(this.ordenSeguimiento);
      await this.cargarOrdenesCompra();
      Swal.fire('Éxito', `Estado avanzado a ${this.seguimientoOCService.obtenerTextoEstado(siguienteEstado)}`, 'success');
    } catch (error) {
      console.error('Error al avanzar estado:', error);
      Swal.fire('Error', 'Error al avanzar estado', 'error');
    }
  }

  /**
   * Abrir modal para editar hito
   */
  abrirModalHito(hito?: HitoCompra) {
    this.hitosEnEdicion = hito ? { ...hito } : this.nuevoHitoVacio();
    this.modalHitoAbierto = true;
  }

  /**
   * Cerrar modal de hito
   */
  cerrarModalHito() {
    this.modalHitoAbierto = false;
    this.hitosEnEdicion = null;
  }

  /**
   * Guardar hito (crear o actualizar)
   */
  guardarHito() {
    if (!this.hitosEnEdicion || !this.seguimientoActual) return;

    if (!this.hitosEnEdicion.descripcion) {
      Swal.fire('Aviso', 'La descripción es requerida', 'warning');
      return;
    }

    if (!this.seguimientoActual.hitos) {
      this.seguimientoActual.hitos = [];
    }

    const index = this.seguimientoActual.hitos.findIndex(h => h.descripcion === this.hitosEnEdicion!.descripcion);

    if (index >= 0) {
      this.seguimientoActual.hitos[index] = { ...this.hitosEnEdicion };
    } else {
      this.seguimientoActual.hitos.push({ ...this.hitosEnEdicion });
    }

    this.cerrarModalHito();
    Swal.fire('Éxito', 'Hito guardado', 'success');
  }

  /**
   * Eliminar hito
   */
  eliminarHito(hito: HitoCompra) {
    if (!this.seguimientoActual?.hitos) return;

    this.seguimientoActual.hitos = this.seguimientoActual.hitos.filter(h => h !== hito);
    Swal.fire('Éxito', 'Hito eliminado', 'success');
  }

  /**
   * Sincronizar hitos con el backend
   */
  async sincronizarHitos() {
    if (!this.seguimientoActual || !this.ordenSeguimiento) return;

    try {
      await this.seguimientoOCService.actualizarSeguimiento({
        idOrden: this.ordenSeguimiento.id!,
        nuevoEstado: this.seguimientoActual.estado,
        usuario: this.usuario.usuario,
        hitos: this.seguimientoActual.hitos
      }).toPromise();

      Swal.fire('Éxito', 'Hitos sincronizados', 'success');
    } catch (error) {
      console.error('Error al sincronizar hitos:', error);
      Swal.fire('Error', 'Error al sincronizar hitos', 'error');
    }
  }

  /**
   * Verificar si puede avanzar de estado
   */
  puedeAvanzar(): boolean {
    return this.seguimientoActual
      ? this.seguimientoOCService.puedeAvanzar(this.seguimientoActual.estado)
      : false;
  }

  /**
   * Obtener texto del siguiente estado
   */
  obtenerTextoSiguienteEstado(): string {
    if (!this.seguimientoActual) return '';
    const siguiente = this.seguimientoOCService.obtenerSiguienteEstado(this.seguimientoActual.estado);
    return siguiente ? this.seguimientoOCService.obtenerTextoEstado(siguiente) : '';
  }

  /**
   * Obtener texto del estado de hito
   */
  obtenerTextoEstadoHito(estado: string): string {
    return this.seguimientoOCService.obtenerTextoEstadoHito(estado);
  }

  /**
   * Manejar cambio de estado de hito
   */
  onEstadoHitoChange(estado: string) {
    if (!this.hitosEnEdicion) return;

    this.hitosEnEdicion.estado = estado as 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';

    if (estado === 'COMPLETADO') {
      this.hitosEnEdicion.porcentajeAvance = 100;
      this.hitosEnEdicion.fechaEjecucion = new Date().toISOString().split('T')[0];
    } else if (estado === 'PENDIENTE') {
      this.hitosEnEdicion.porcentajeAvance = 0;
    } else if (estado === 'EN_PROCESO') {
      this.hitosEnEdicion.porcentajeAvance = 50;
    }
  }

  /**
   * Verificar si la orden está finalizada
   */
  isOrdenFinalizada(): boolean {
    return this.seguimientoActual?.estado === 'RECIBIDA_TOTAL' ||
           this.seguimientoActual?.estado === 'ANULADA';
  }

  /**
   * Verificar si un estado del timeline está completado
   */
  esEstadoCompletado(estado: EstadoSeguimientoOC): boolean {
    if (!this.seguimientoActual) return false;

    const ordenEstados: EstadoSeguimientoOC[] = ['GENERADA', 'APROBADA', 'CONFIRMADA', 'EN_PROCESO', 'RECIBIDA_PARCIAL', 'RECIBIDA_TOTAL'];
    const estadoActualIndex = ordenEstados.indexOf(this.seguimientoActual.estado);
    const estadoVerificarIndex = ordenEstados.indexOf(estado);

    return estadoVerificarIndex < estadoActualIndex ||
           (this.seguimientoActual.estado === estado && estado !== 'RECIBIDA_TOTAL');
  }

  /**
   * Obtener la fecha de transición para un estado
   */
  obtenerFechaEstado(estado: EstadoSeguimientoOC): string {
    if (!this.seguimientoActual) return '';

    const fecha = this.seguimientoActual &&
      (this.seguimientoActual as any)[`fecha${this.capitalizarEstado(estado)}`];

    return fecha ? this.formatearFecha(fecha) : '';
  }

  /**
   * Capitalizar el nombre del estado para obtener la propiedad de fecha
   */
  private capitalizarEstado(estado: string): string {
    return estado.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
  }

  /**
   * Obtener el texto descriptivo de un estado (wrapper para el servicio)
   */
  obtenerTextoEstado(estado: EstadoSeguimientoOC | string): string {
    return this.seguimientoOCService.obtenerTextoEstado(estado as EstadoSeguimientoOC);
  }

  /**
   * Obtener clase CSS para estado de hito
   */
  obtenerClaseEstadoHito(estado: string): string {
    return this.seguimientoOCService.obtenerClaseEstadoHito(estado);
  }

  /**
   * Actualizar obtenerClaseEstado para usar el servicio cuando es estado de seguimiento
   */
  obtenerClaseEstadoSeguimiento(estado: string): string {
    if (Object.values(this.estadosSeguimiento).includes(estado as EstadoSeguimientoOC)) {
      return this.seguimientoOCService.obtenerColorEstado(estado as EstadoSeguimientoOC);
    }
    return 'badge-secondary';
  }
}
