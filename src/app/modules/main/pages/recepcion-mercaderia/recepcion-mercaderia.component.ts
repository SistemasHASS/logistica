import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { RecepcionOCService } from '@/app/services/recepcion-oc.service';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { KardexService } from '@/app/services/kardex.service';
import { OrdenCompraService } from '@/app/services/orden-compra.service';
import {
  RecepcionOrdenCompra,
  DetalleRecepcion,
  OrdenCompra,
  DetalleOrdenCompra,
  Usuario,
  Almacen,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-recepcion-mercaderia',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './recepcion-mercaderia.component.html',
  styleUrls: ['./recepcion-mercaderia.component.scss'],
})
export class RecepcionMercaderiaComponent implements OnInit {
  private baseUrl = environment.baseUrl;

  // Listas principales
  recepciones: RecepcionOrdenCompra[] = [];
  ordenesCompra: OrdenCompra[] = [];
  almacenes: Almacen[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Recepción actual
  recepcion: RecepcionOrdenCompra | null = null;
  detalleRecepcion: DetalleRecepcion[] = [];

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

  // Orden seleccionada
  ordenSeleccionada: OrdenCompra | null = null;

  // Filtros
  filtroEstado: string = 'TODAS';
  filtroAlmacen: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalParciales = 0;
  totalCompletas = 0;
  totalConformes = 0;
  totalNoConformes = 0;

  // Modal detalle recepción
  modalDetalleRecepcionAbierto = false;
  recepcionDetalle: RecepcionOrdenCompra | null = null;

  // Modal seguimiento
  modalSeguimientoAbierto = false;
  ordenSeguimiento: OrdenCompra | null = null;

  // Sistema Híbrido
  estaConectado = true;
  sincronizacionPendiente = false;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService,
    private recepcionOCService: RecepcionOCService,
    private kardexService: KardexService,
    private ordenCompraService: OrdenCompraService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    this.recepcion = this.nuevaRecepcion();
    await this.cargarRecepciones();
    await this.cargarOrdenesCompra();
    await this.cargarAlmacenes();
    this.actualizarContadores();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarRecepciones() {
    // Intentar cargar desde backend primero
    if (this.estaConectado) {
      try {
        await this.cargarRecepcionesDesdeBackend();
        return;
      } catch (error) {
        console.warn('Error cargando desde backend, usando local:', error);
      }
    }
    // Fallback a Dexie
    this.recepciones = await this.dexieService.showRecepcionesOrdenCompra();
    this.actualizarContadores();
  }

  /**
   * Cargar recepciones desde el backend (SQL Server)
   */
  async cargarRecepcionesDesdeBackend() {
    try {
      // Filtro multiempresa: ALLOGIST solo ve su empresa
      const filtros = this.usuario?.idrol?.includes('ALLOGIST') && this.usuario?.ruc
        ? { ruc: this.usuario.ruc }
        : {};
      const respuesta = await this.recepcionOCService.listarRecepciones(filtros).toPromise();

      // El SP retorna FOR JSON PATH → el backend devuelve array directamente o envuelto
      let lista: any[] = [];
      if (Array.isArray(respuesta)) {
        lista = respuesta;
      } else if (respuesta && Array.isArray((respuesta as any)[0])) {
        lista = (respuesta as any)[0];
      } else if (respuesta && typeof respuesta === 'object') {
        lista = Object.values(respuesta as any).filter(Array.isArray).flat();
      }

      if (lista.length > 0 || Array.isArray(respuesta)) {
        this.recepciones = lista.map((r: any) => {
          // detalle puede venir como string JSON (FOR JSON PATH anidado)
          let detalleArr: any[] = [];
          if (typeof r.detalle === 'string') {
            try { detalleArr = JSON.parse(r.detalle); } catch { detalleArr = []; }
          } else if (Array.isArray(r.detalle)) {
            detalleArr = r.detalle;
          }

          // Estado del frontend: mapeamos estados del SP a los que usa el componente
          let estadoFront: string;
          switch (r.estado) {
            case 'RECIBIDA':         estadoFront = 'PARCIAL';   break;
            case 'VALIDADA':         estadoFront = 'PARCIAL';   break;
            case 'INGRESADA_KARDEX': estadoFront = 'COMPLETA';  break;
            default:                 estadoFront = r.estado || 'PARCIAL';
          }

          return {
            id: r.idRecepcion,
            numeroRecepcion: r.numeroRecepcion,
            ordenCompraId: r.idOrden || 0,
            numeroOrden: r.numeroOrden,
            fecha: r.fecha,
            almacen: r.almacen,
            proveedor: r.proveedor,
            nombreProveedor: r.nombreProveedor,
            guiaRemision: r.guiaRemision,
            estado: estadoFront as 'PARCIAL' | 'COMPLETA' | 'PENDIENTE' | 'INGRESADO',
            estadoReal: r.estado,                          // estado real de BD
            conformidad: r.conformeRecepcion === true || r.conformeRecepcion === 1,
            usuarioRecibe: r.usuarioRecibe,
            fechaIngresoKardex: r.fechaIngresoKardex,
            ingresadoKardex: !!r.fechaIngresoKardex,
            numeroNI: r.numeroNI || null,                  // NI generada en SPRING
            detalle: detalleArr.map((d: any) => {
              // Debug: log estadoItem value
              console.log('Mapping detalle:', d.idDetalleRecepcion, 'estadoItem:', d.estadoItem);
              
              const estadoItem = (d.estadoItem || '').toString().trim().toUpperCase();
              const estado = estadoItem === 'NO_CONFORME' ? 'NO_CONFORME' : 'CONFORME';
              
              return {
                id: d.idDetalleRecepcion,
                recepcionId: r.idRecepcion,
                detalleOrdenCompraId: d.idDetalleOrden || d.idordencompradetalle || 0,
                item: d.item || 0,
                codigo: d.codigo,
                descripcion: d.descripcion,
                cantidadOrdenada: d.cantidadOrdenada,
                cantidadRecibida: d.cantidadRecibida,
                cantidadAceptada: d.cantidadAceptada,
                cantidadRechazada: d.cantidadRechazada || 0,
                unidadMedida: d.unidadMedida,
                lote: d.lote,
                estadoItem: estado as 'CONFORME' | 'NO_CONFORME',
                precioUnitario: d.precioUnitario,
                ceco: d.ceco
              };
            })
          };
        });

        // Guardar en Dexie para modo offline
        for (const recepcion of this.recepciones) {
          await this.dexieService.saveRecepcionOrdenCompra(recepcion);
        }

        this.actualizarContadores();
      }
    } catch (error) {
      console.error('Error cargando recepciones desde backend:', error);
      throw error;
    }
  }

  async cargarOrdenesCompra() {
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/recepcion-oc/listar-ocs-para-recepcion`, {})
      );
      const lista: any[] = Array.isArray(resp) ? resp : [];
      this.ordenesCompra = lista.map((oc: any) => {
        const itemsRaw = oc.items;
        const itemsArr: any[] = typeof itemsRaw === 'string'
          ? (JSON.parse(itemsRaw) as any[])
          : (Array.isArray(itemsRaw) ? itemsRaw : []);
        return {
          id: oc.idOrden,
          numeroOrden: oc.numeroOrden || '',
          numeroOrdenSpring: oc.numeroOrdenSpring || null,  // NUEVO: Número de orden en SPRING
          solicitudCompraId: 0,
          fecha: oc.fechaCreacion || '',
          fechaEntrega: oc.fechaEntregaEstimada || '',
          proveedor: oc.rucProveedor || '',
          rucProveedor: oc.rucProveedor || '',
          nombreProveedor: oc.nombreProveedor || '',
          direccionEntrega: '',
          montoTotal: oc.totalOrden || 0,
          moneda: oc.moneda || 'PEN',
          formaPago: '',
          condicionesPago: '',
          plazoEntrega: 0,
          usuarioGenera: '',
          estado: oc.estado || 'ENVIADA',
          almacen: oc.almacen || '',  // NUEVO: Almacén de la OC
          detalle: itemsArr.map((i: any) => ({
            id: i.idDetalle || i.id || 0,
            ordenCompraId: oc.idOrden,
            codigo: i.codigoItem || i.codigo || '',
            descripcion: i.descripcionItem || i.descripcion || '',
            cantidad: i.cantidad || 0,
            cantidadRecibida: i.cantidadRecibida || 0,
            cantidadPendiente: (i.cantidad || 0) - (i.cantidadRecibida || 0),
            unidadMedida: i.unidadMedida || 'UND',
            precioUnitario: i.precioUnitario || 0,
            descuento: 0,
            subtotal: 0,
            impuesto: 0,
            total: 0,
            ceco: i.ceco || i.centroCosto || '',
            proyecto: i.proyecto || '',
            estado: (i.estado || 'PENDIENTE') as 'PENDIENTE' | 'PARCIAL' | 'COMPLETO' | 'CANCELADO'
          }))
        } as OrdenCompra;
      });
      this.cdr.markForCheck();
    } catch (error) {
      console.warn('Error cargando OCs desde backend, usando Dexie como fallback:', error);
      const todas = await this.dexieService.showOrdenesCompra();
      this.ordenesCompra = todas.filter(
        (o: OrdenCompra) =>
          o.estado === 'APROBADA' ||
          o.estado === 'ENVIADA' ||
          o.estado === 'CONFIRMADA' ||
          o.estado === 'RECIBIDA_PARCIAL'
      );
    }
  }

  async cargarAlmacenes() {
    this.almacenes = await this.dexieService.showAlmacenes();
    if (!this.almacenes || this.almacenes.length === 0) {
      this.almacenes = [
        { almacen: 'H001', descripcion: 'Almacén Principal H001' },
        { almacen: 'H002', descripcion: 'Almacén H002' },
        { almacen: 'GENERAL', descripcion: 'Almacén General' },
      ] as any[];
    }
  }

  getNombreAlmacen(codigo: string): string {
    if (!codigo) return 'No especificado';
    const found = (this.almacenes as any[]).find(
      (a) => a.almacen === codigo || a.idalmacen === codigo
    );
    const nombre = found?.descripcion || found?.almacen || '';
    return nombre ? `${codigo} - ${nombre}` : codigo;
  }

  actualizarContadores() {
    this.totalParciales   = this.recepciones.filter((r) => r.estado === 'PARCIAL').length;
    this.totalCompletas   = this.recepciones.filter((r) => r.estado === 'COMPLETA').length;
    this.totalConformes   = this.recepciones.filter((r) => r.conformidad === true).length;
    this.totalNoConformes = this.recepciones.filter((r) => r.conformidad === false).length;
    this.cdr.markForCheck();
  }

  nuevaRecepcion(): RecepcionOrdenCompra {
    const hoy = new Date();
    const fechaLocal = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    return {
      numeroRecepcion: '',
      ordenCompraId: 0,
      numeroOrden: '',
      fecha: fechaLocal,
      almacen: '',
      detalle: [],
      conformidad: true,
      usuarioRecibe: this.usuario.documentoidentidad || '',
      estado: 'PARCIAL',
      guiaProveedor: '',
    };
  }

  nuevaRecepcionFormConOrden(ordenId: number) {
    this.recepcion = this.nuevaRecepcion();
    this.recepcion.ordenCompraId = ordenId;
    this.detalleRecepcion = [];
    this.ordenSeleccionada = null;
    this.mostrarFormulario = true;
    this.modoEdicion = false;
    // Trigger order change to load details
    this.onOrdenChange();
  }

  nuevaRecepcionForm() {
    this.recepcion = this.nuevaRecepcion();
    this.detalleRecepcion = [];
    this.ordenSeleccionada = null;
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async onOrdenChange() {
    if (!this.recepcion || !this.recepcion.ordenCompraId) return;

    const orden = this.ordenesCompra.find((o) => o.id === this.recepcion!.ordenCompraId);

    if (orden) {
      this.ordenSeleccionada = orden;
      this.recepcion!.numeroOrden = orden.numeroOrden;
      // Asignar almacen desde la orden (viene por defecto de la OC)
      const ordenAny = orden as any;
      if (ordenAny.almacen) {
        this.recepcion!.almacen = ordenAny.almacen;
      }

      // Cargar solo items con cantidad pendiente (recepción parcial o nueva)
      this.detalleRecepcion = orden.detalle
        .filter((item) => (item.cantidadPendiente ?? item.cantidad) > 0)
        .map((item) => ({
          recepcionId: 0,
          detalleOrdenCompraId: item.id || 0,
          item: item.item || 0,
          codigo: item.codigo,
          descripcion: item.descripcion,
          cantidadOrdenada: item.cantidadPendiente ?? item.cantidad,
          cantidadRecibida: 0,
          cantidadAceptada: 0,
          cantidadRechazada: 0,
          lote: '00',
          estadoItem: 'CONFORME' as const,
          proyecto: item.proyecto || '',
          ceco: item.ceco || '',
          precioUnitario: item.precioUnitario || 0,
          unidadMedida: item.unidadMedida || 'UND'
        }));
    }
  }

  actualizarCantidades(detalle: DetalleRecepcion) {
    // Convertir a número si viene como string (inputs type="text")
    detalle.cantidadRecibida = Number(detalle.cantidadRecibida) || 0;
    detalle.cantidadAceptada = Number(detalle.cantidadAceptada) || 0;
    detalle.cantidadRechazada = Number(detalle.cantidadRechazada) || 0;

    // Validar que cantidades sean coherentes
    if (detalle.cantidadRecibida < 0) detalle.cantidadRecibida = 0;
    if (detalle.cantidadAceptada < 0) detalle.cantidadAceptada = 0;
    if (detalle.cantidadRechazada < 0) detalle.cantidadRechazada = 0;

    // ✅ VALIDAR: cantidad recibida no puede ser mayor que la ordenada
    if (detalle.cantidadRecibida > detalle.cantidadOrdenada) {
      detalle.cantidadRecibida = detalle.cantidadOrdenada;
    }

    // Calcular cantidades automáticamente
    const total = detalle.cantidadAceptada + detalle.cantidadRechazada;
    if (total > detalle.cantidadRecibida) {
      // Ajustar si la suma excede lo recibido
      detalle.cantidadAceptada = detalle.cantidadRecibida - detalle.cantidadRechazada;
      if (detalle.cantidadAceptada < 0) {
        detalle.cantidadAceptada = 0;
        detalle.cantidadRechazada = detalle.cantidadRecibida;
      }
    }

    // Determinar estado
    if (detalle.cantidadRechazada > 0) {
      detalle.estadoItem = 'NO_CONFORME';
    } else {
      detalle.estadoItem = 'CONFORME';
    }

    // Actualizar conformidad general
    this.actualizarConformidadGeneral();
  }

  actualizarConformidadGeneral() {
    if (!this.recepcion) return;
    const hayNoConformes = this.detalleRecepcion.some((d) => d.estadoItem === 'NO_CONFORME');
    this.recepcion.conformidad = !hayNoConformes;
  }

  async guardarRecepcion() {
    if (!this.recepcion) {
      this.alertService.showAlert(
        'Error',
        'No hay una recepción activa.',
        'error'
      );
      return;
    }

    if (!this.recepcion.ordenCompraId) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar una orden de compra.',
        'warning'
      );
      return;
    }

    if (!this.recepcion.almacen) {
      this.alertService.showAlert('Atención', 'Debe seleccionar un almacén.', 'warning');
      return;
    }

    // Validar que al menos un item tenga cantidad recibida
    const hayRecepcion = this.detalleRecepcion.some((d) => d.cantidadRecibida > 0);
    if (!hayRecepcion) {
      this.alertService.showAlert(
        'Atención',
        'Debe registrar al menos una cantidad recibida.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (!this.modoEdicion) {
        this.recepcion!.numeroRecepcion = this.generarNumeroRecepcion();
      }

      // Filtrar solo items con cantidad recibida
      const detalleFiltrado = this.detalleRecepcion.filter((d) => d.cantidadRecibida > 0);
      
      // Determinar si es parcial o completa
      const todosCompletos = this.detalleRecepcion.every(
        (d) => d.cantidadRecibida >= d.cantidadOrdenada
      );
      const estadoFinal = todosCompletos ? 'COMPLETA' : 'PARCIAL';

      // Sistema Híbrido: Intentar guardar en backend primero
      if (this.estaConectado) {
        try {
          const datosBackend = this.recepcionOCService.prepararDatosRecepcion(
            this.recepcion!,
            detalleFiltrado,
            this.usuario
          );

          const respuesta = await this.recepcionOCService.registrarRecepcion(datosBackend).toPromise();
          
          if (respuesta?.mensaje?.includes('exitosamente')) {
            // Guardado exitoso en backend
            this.recepcion!.detalle = detalleFiltrado;
            this.recepcion!.usuarioRecibe = this.usuario.documentoidentidad;
            this.recepcion!.estado = estadoFinal;
            this.recepcion!.id = respuesta.idRecepcion;
            this.recepcion!.numeroRecepcion = respuesta.numeroRecepcion;

            // También guardar localmente para respaldo
            await this.dexieService.saveRecepcionOrdenCompra(this.recepcion!);
            
            // Actualizar orden de compra
            await this.actualizarOrdenCompra();

            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Éxito', 'Recepción guardada y sincronizada correctamente.', 'success');
          } else {
            throw new Error(respuesta?.error || 'Error al guardar en backend');
          }
        } catch (errorBackend) {
          console.warn('Error en backend, guardando localmente:', errorBackend);
          // Fallback a Dexie
          await this.guardarLocalmente(detalleFiltrado, estadoFinal);
        }
      } else {
        // Modo offline: guardar solo localmente
        await this.guardarLocalmente(detalleFiltrado, estadoFinal);
        this.sincronizacionPendiente = true;
      }

      this.mostrarFormulario = false;
      await this.cargarRecepciones();
      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al guardar recepción:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la recepción.',
        'error'
      );
    }
  }

  async actualizarOrdenCompra() {
    if (!this.ordenSeleccionada || !this.recepcion) return;

    // Actualizar cantidades recibidas en la orden
    for (const detRecep of this.recepcion!.detalle) {
      const itemOrden = this.ordenSeleccionada.detalle.find(
        (d) => d.id === detRecep.detalleOrdenCompraId
      );
      if (itemOrden) {
        itemOrden.cantidadRecibida += detRecep.cantidadAceptada;
        itemOrden.cantidadPendiente = itemOrden.cantidad - itemOrden.cantidadRecibida;

        // Actualizar estado del item
        if (itemOrden.cantidadRecibida >= itemOrden.cantidad) {
          itemOrden.estado = 'COMPLETO';
        } else if (itemOrden.cantidadRecibida > 0) {
          itemOrden.estado = 'PARCIAL';
        }
      }
    }

    // Actualizar estado de la orden
    const todosCompletos = this.ordenSeleccionada.detalle.every(
      (d) => d.estado === 'COMPLETO'
    );
    const algunoParcial = this.ordenSeleccionada.detalle.some((d) => d.estado === 'PARCIAL');

    if (todosCompletos) {
      this.ordenSeleccionada.estado = 'RECIBIDA_TOTAL';
    } else if (algunoParcial) {
      this.ordenSeleccionada.estado = 'RECIBIDA_PARCIAL';
    }

    await this.dexieService.saveOrdenCompra(this.ordenSeleccionada);
  }

  
  async eliminarRecepcion(index: number) {
    const recepcion = this.recepcionesFiltradas()[index];
    if (!recepcion) return;

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Está seguro de eliminar esta recepción? Esta acción no se puede deshacer.',
      'warning'
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.recepcionesOrdenCompra.delete(recepcion.id!);

      this.alertService.showAlert('Éxito', 'Recepción eliminada correctamente.', 'success');

      await this.cargarRecepciones();
    } catch (error) {
      console.error('Error al eliminar recepción:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar la recepción.',
        'error'
      );
    }
  }

  verDetalle(recepcion: RecepcionOrdenCompra) {
    // Asegurar que el estado siempre tenga un valor
    if (!recepcion.estado) {
      recepcion.estado = 'PARCIAL';
    }
    
    // Debug: verificar el detalle antes de mostrar
    console.log('verDetalle - recepcion:', recepcion);
    console.log('verDetalle - detalle:', recepcion.detalle);
    if (recepcion.detalle && recepcion.detalle.length > 0) {
      console.log('verDetalle - primer detalle item:', recepcion.detalle[0]);
    }
    
    this.recepcionDetalle = recepcion;
    this.modalDetalleRecepcionAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarModalDetalleRecepcion() {
    this.modalDetalleRecepcionAbierto = false;
    this.recepcionDetalle = null;
  }

  get ocDetalleNoSincronizada(): boolean {
    if (!this.recepcionDetalle) return false;
    const oc = this.ordenesCompra.find(o => o.id === this.recepcionDetalle!.ordenCompraId) as any;
    return !(oc?.numeroOrdenSpring);
  }

  private mapearFormaPago(formaPago: string): string {
    const mapa: { [key: string]: string } = {
      'CONTADO': '001',
      'CREDITO': '002',
      'CREDITO_15': '002',
      'CREDITO_30': '002',
      'CREDITO_45': '002',
      'CREDITO_60': '002',
      'CH': '001',
      'TC': '002',
      'TR': '002',
      'LT': '002',
      '001': '001',
      '002': '002'
    };
    return mapa[formaPago] || '001';
  }

  /**
   * Genera la distribución contable a partir de los detalles de la orden
   * Agrupa por centro de costo y proyecto
   */
  private generarDistribucionContable(orden: any): any[] {
    if (!orden || !orden['detalle'] || orden['detalle'].length === 0) {
      return [];
    }

    const distribucion: any[] = [];
    const grupos = new Map<string, any>();

    // Agrupar items por centro de costo y proyecto
    for (const item of orden['detalle']) {
      const ceco = item['ceco'] || '0000';
      const proyecto = item['proyecto'] || orden['proyecto'] || '';
      const key = `${ceco}-${proyecto}`;
      const monto = (item['cantidad'] || 0) * (item['precioUnitario'] || 0);

      if (grupos.has(key)) {
        grupos.get(key).monto += monto;
      } else {
        grupos.set(key, {
          ceco,
          proyecto,
          monto,
          codigo: item['codigo'] || ''
        });
      }
    }

    // Generar distribución con cuenta contable según tipo de item
    let id = 1;
    for (const grupo of grupos.values()) {
      const cuenta = this.obtenerCuentaContable(grupo.codigo);
      distribucion.push({
        cuenta: cuenta,
        descripcion: '03',
        centrocosto: grupo.ceco,
        proyecto: grupo.proyecto,
        monto: Math.round(grupo.monto * 100) / 100,
        referencia: 'GA',
        ccdestino: grupo.ceco.substring(0, 4)
      });
      id++;
    }

    return distribucion;
  }

  /**
   * Obtiene la cuenta contable según el código del item
   * COMMODITY: 25301001 (Mercaderías)
   * ACTIVO FIJO: 33010101 (Maquinaria y Equipo)
   * ACTIVO MENOR: 25302001 (Suministros)
   * SERVICIO: 63910101 (Servicios)
   */
  private obtenerCuentaContable(codigo: string): string {
    if (!codigo) return '25301001'; // Default: Mercaderías
    
    // COMMODITY: empieza con '1' o '2'
    if (codigo.startsWith('1') || codigo.startsWith('2')) {
      return '25301001'; // Mercaderías
    }
    // ACTIVO FIJO: empieza con '3'
    if (codigo.startsWith('3')) {
      return '33010101'; // Maquinaria y Equipo
    }
    // ACTIVO MENOR: empieza con '4'
    if (codigo.startsWith('4')) {
      return '25302001'; // Suministros
    }
    // SERVICIO: empieza con '5' o '9'
    if (codigo.startsWith('5') || codigo.startsWith('9')) {
      return '63910101'; // Servicios
    }
    
    return '25301001'; // Default: Mercaderías
  }

  async sincronizarConSpring() {
    if (!this.recepcionDetalle || !this.recepcionDetalle.numeroOrden) {
      this.alertService.showAlert('Error', 'No hay una orden de compra seleccionada', 'error');
      return;
    }

    try {
      this.alertService.showAlert('Sincronizando', 'Sincronizando con SPRING...', 'info');
      
      console.log('sincronizarConSpring - numeroOrden:', this.recepcionDetalle.numeroOrden);
      
      // Buscar la orden de compra completa
      let orden = this.ordenesCompra.find(o => o.id === this.recepcionDetalle?.ordenCompraId) as any;
      
      // Si no está en la lista, obtener del backend
      if (!orden) {
        console.log('Orden no encontrada en lista local, consultando backend...');
        try {
          const resp: any = await lastValueFrom(
            this.http.post(`${this.baseUrl}/api/logistica/orden-compra/listar`, {
              numeroOrden: this.recepcionDetalle.numeroOrden
            })
          );
          const lista = Array.isArray(resp) ? resp : [];
          orden = lista.find((o: any) => o.numeroOrden === this.recepcionDetalle?.numeroOrden) || lista[0];
          console.log('Orden desde backend:', orden);
        } catch (e) {
          console.error('Error consultando backend:', e);
        }
      }
      
      // Si aún no hay orden, construir desde los datos de la recepción
      if (!orden) {
        console.log('Construyendo orden desde datos de recepción...');
        orden = {
          numeroOrden: this.recepcionDetalle.numeroOrden,
          rucProveedor: this.recepcionDetalle.proveedor,
          idempresa: this.usuario.idempresa || '000008',
          moneda: 'PEN',
          almacen: this.recepcionDetalle.almacen,
          totalOrden: this.recepcionDetalle.detalle?.reduce((sum: number, d: any) => sum + (d.cantidadOrdenada * d.precioUnitario), 0) || 0,
          detalle: this.recepcionDetalle.detalle?.map((d: any) => ({
            id: d.id,
            codigo: d.codigo,
            descripcion: d.descripcion,
            cantidad: d.cantidadOrdenada,
            unidadMedida: d.unidadMedida,
            precioUnitario: d.precioUnitario,
            ceco: d.ceco,
            proyecto: d.proyecto
          }))
        };
      }
      
      if (!orden) {
        console.error('Orden no encontrada. numeroOrden buscado:', this.recepcionDetalle.numeroOrden);
        this.alertService.showAlert('Error', `No se encontró la orden de compra: ${this.recepcionDetalle.numeroOrden}`, 'error');
        return;
      }
      
      console.log('Orden encontrada:', orden);

      console.log('Orden encontrada:', orden);

      // Preparar datos para sincronización - asegurar que todos los campos requeridos estén presentes
      // IMPORTANTE: Usar los datos de la orden, no de la recepción
      const datosSincronizacion = {
        idordencompra: orden['idordencompra'] || orden['numeroOrden'] || orden['numero'] || this.recepcionDetalle?.numeroOrden,
        idempresa: orden['idempresa'] || this.usuario.idempresa || '000008',
        ruc: orden['ruc'] || orden['rucProveedor'] || orden['proveedor'] || this.recepcionDetalle?.proveedor,
        serie: 'WHPO',
        idproveedor: orden['idproveedor'] || orden['ruc'] || orden['rucProveedor'] || orden['proveedor'] || this.recepcionDetalle?.proveedor,
        idmoneda: orden['idmoneda'] || (orden['moneda'] === 'PEN' ? 'LO' : (orden['moneda'] || 'LO')),
        idalmacen: orden['idalmacen'] || orden['almacen'] || this.recepcionDetalle?.almacen || 'H001',
        fechaprometida: orden['fechaprometida'] || orden['fechaEntregaEstimada'] || new Date().toISOString(),
        montoigv: orden['montoigv'] || orden['igv'] || 0,
        montototal: orden['montototal'] || orden['totalOrden'] || orden['montoTotal'] || 0,
        montopendientedepago: orden['montopendientedepago'] || orden['montototal'] || orden['totalOrden'] || 0,
        idformapago: orden['idformapago'] || this.mapearFormaPago(orden['formaPago'] || 'CONTADO'),
        plazoentrega: orden['plazoentrega'] || 7,
        observaciones: orden['observaciones'] || '',
        idproyecto: orden['idproyecto'] || orden['proyecto'] || '',
        idlabor: orden['idlabor'] || orden['labor'] || '',
        idcultivo: orden['idcultivo'] || orden['cultivo'] || '',
        idactividad: '',
        idestado: 'PR',
        dniusuario: this.usuario.documentoidentidad,
        detalle: ((orden['detalle'] || orden['detalleOrdenCompra']) as any[])?.map((d, index) => ({
          idordencompradetalle: d['idordencompradetalle'] || d['id'] || d['idDetalle'] || (index + 1).toString(),
          tipo: 'BIEN',
          codigo: d['codigo'],
          unidadmedida: d['unidadmedida'] || d['unidadMedida'] || 'UND',
          descripcion: d['descripcion'],
          cantidadpedida: d['cantidadpedida'] || d['cantidad'] || d['cantidadOrdenada'] || 0,
          cantidadrecibida: d['cantidadrecibida'] || d['cantidadRecibida'] || d['cantidadAceptada'] || 0,
          preciounitario: d['preciounitario'] || d['precioUnitario'] || 0,
          igv: 0,
          descuento: 0,
          centrocosto: d['centrocosto'] || d['ceco'] || d['cecoDestino'] || '',
          proyecto: d['proyecto'] || '',
          eliminado: 0
        })) || []
      };

      // Verificar campos requeridos
      const camposFaltantes = [];
      if (!datosSincronizacion.idordencompra) camposFaltantes.push('idordencompra');
      if (!datosSincronizacion.ruc) camposFaltantes.push('ruc');
      if (!datosSincronizacion.idproveedor) camposFaltantes.push('idproveedor');
      
      if (camposFaltantes.length > 0) {
        console.error('Campos faltantes:', camposFaltantes);
        this.alertService.showAlertError('Error', `Faltan campos requeridos: ${camposFaltantes.join(', ')}`);
        return;
      }

      console.log('Datos para sincronización:', datosSincronizacion);
      console.log('JSON enviado:', JSON.stringify(datosSincronizacion, null, 2));

      // Detectar si es OC de consolidación (flujo nuevo) o flujo antiguo
      // Las OCs de consolidación tienen 'id' numérico en lugar de 'idordencompra' string
      const esOCConsolidacion = orden && (orden['id'] && typeof orden['id'] === 'number' && orden['id'] > 0);
      console.log('Es OC de consolidación:', esOCConsolidacion, '- ID:', orden?.['id']);

      // Llamar al servicio de sincronización con manejo de errores mejorado
      let respuesta: any;
      try {
        if (esOCConsolidacion) {
          // Usar endpoint específico para OCs de consolidación
          console.log('Usando endpoint de consolidación con idOrden:', orden['id']);
          // Generar distribución contable desde el frontend
          const distribucion = this.generarDistribucionContable(orden);
          console.log('Distribución contable generada:', distribucion);
          // Obtener idEmpresa del usuario logueado (desde API get-usuarios via Dexie)
          const idEmpresa = this.usuario?.idempresa || '000008';
          respuesta = await this.ordenCompraService.sincronizarOCConsolidacion(orden['id'], idEmpresa, distribucion);
        } else {
          // Usar endpoint estándar para flujo antiguo
          respuesta = await this.ordenCompraService.sincronizarOrdenCompra(datosSincronizacion);
        }
      } catch (httpError: any) {
        console.error('HTTP Error completo:', httpError);
        
        // Intentar obtener el mensaje de error del backend
        let errorMsg = 'Error de conexión con el servidor';
        if (httpError.error) {
          if (typeof httpError.error === 'string') {
            errorMsg = httpError.error;
          } else if (httpError.error.message) {
            errorMsg = httpError.error.message;
          } else if (httpError.error.title) {
            errorMsg = httpError.error.title;
          }
        } else if (httpError.message) {
          errorMsg = httpError.message;
        }
        
        this.alertService.showAlertError('Error del Servidor', errorMsg);
        return;
      }

      console.log('Respuesta sincronización:', respuesta);

      if (respuesta && respuesta.errorgeneral === 0) {
        this.alertService.showAlert(
          'Éxito', 
          `OC sincronizada con SPRING correctamente. Número: ${respuesta.numeroOrden}`,
          'success'
        );
        
        // Recargar recepciones para actualizar datos
        await this.cargarRecepcionesDesdeBackend();
      } else {
        this.alertService.showAlert(
          'Error', 
          respuesta?.mensaje || 'Error al sincronizar con SPRING',
          'error'
        );
      }
    } catch (error: any) {
      console.error('Error sincronizando con SPRING:', error);
      this.alertService.showAlert(
        'Error', 
        error?.message || 'Ocurrió un error al sincronizar con SPRING',
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

  // Filtros
  recepcionesFiltradas(): RecepcionOrdenCompra[] {
    let filtradas = [...this.recepciones];

    if (this.filtroEstado !== 'TODAS') {
      filtradas = filtradas.filter((r) => r.estado === this.filtroEstado);
    }

    if (this.filtroAlmacen) {
      filtradas = filtradas.filter((r) =>
        r.almacen.toLowerCase().includes(this.filtroAlmacen.toLowerCase())
      );
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (r) => new Date(r.fecha) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter((r) => new Date(r.fecha) <= new Date(this.filtroFechaFin));
    }

    return filtradas;
  }

  limpiarFiltros() {
    this.filtroEstado = 'TODAS';
    this.filtroAlmacen = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  // =============================================
  // MÉTODOS DEL SISTEMA HÍBRIDO
  // =============================================

  /**
   * Guardar recepción localmente en Dexie
   */
  private async guardarLocalmente(detalleFiltrado: any[], estadoFinal: 'PARCIAL' | 'COMPLETA') {
    this.recepcion!.detalle = detalleFiltrado;
    this.recepcion!.usuarioRecibe = this.usuario.documentoidentidad;
    this.recepcion!.estado = estadoFinal;

    await this.dexieService.saveRecepcionOrdenCompra(this.recepcion!);
    
    // Actualizar orden de compra
    await this.actualizarOrdenCompra();

    this.alertService.cerrarModalCarga();
    this.alertService.showAlert(
      'Éxito',
      'Recepción guardada localmente. Se sincronizará cuando haya conexión.',
      'success'
    );
  }

  /**
   * Verificar conexión con el backend
   */
  async verificarConexion() {
    try {
      const conectado = await this.recepcionOCService.verificarConexion().toPromise();
      this.estaConectado = conectado || false;
      
      if (this.estaConectado && this.sincronizacionPendiente) {
        await this.sincronizarPendientes();
      }
    } catch (error) {
      this.estaConectado = false;
      console.warn('Sin conexión al backend:', error);
    }
  }

  /**
   * Sincronizar recepciones pendientes
   */
  async sincronizarPendientes() {
    try {
      const recepcionesPendientes = await this.dexieService.showRecepcionesOrdenCompra();
      
      for (const recepcion of recepcionesPendientes) {
        if (recepcion.id && recepcion.id > 0) {
          // Ya fue sincronizada
          continue;
        }

        try {
          const datosBackend = this.recepcionOCService.prepararDatosRecepcion(
            recepcion,
            recepcion.detalle || [],
            this.usuario
          );

          await this.recepcionOCService.registrarRecepcion(datosBackend).toPromise();
          console.log(`Recepción ${recepcion.numeroRecepcion} sincronizada`);
        } catch (error) {
          console.warn(`Error sincronizando recepción ${recepcion.numeroRecepcion}:`, error);
        }
      }

      this.sincronizacionPendiente = false;
      await this.cargarRecepciones();
    } catch (error) {
      console.error('Error en sincronización:', error);
    }
  }

  /**
   * Generar número de recepción
   */
  generarNumeroRecepcion(): string {
    return this.recepcionOCService.generarNumeroRecepcion();
  }

  // Utilidades

  contarItemsPendientes(orden: OrdenCompra): number {
    if (!orden.detalle || orden.detalle.length === 0) return 0;
    return orden.detalle.filter(
      (d) => (d.cantidad - (d.cantidadRecibida || 0)) > 0
    ).length;
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      PARCIAL:           'badge-warning',
      COMPLETA:          'badge-success',
      CONFORME:          'badge-success',
      NO_CONFORME:       'badge-danger',
      ENVIADA:           'badge-info',
      RECIBIDA_PARCIAL:  'badge-warning',
      RECIBIDA_TOTAL:    'badge-success',
      VALIDADA:          'badge-info',
      INGRESADA_KARDEX:  'badge-success',
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

  calcularPorcentajeRecepcion(recepcion: RecepcionOrdenCompra): number {
    if (!recepcion.detalle || recepcion.detalle.length === 0) return 0;

    const totalOrdenado = recepcion.detalle.reduce((sum, d) => sum + d.cantidadOrdenada, 0);
    const totalRecibido = recepcion.detalle.reduce((sum, d) => sum + d.cantidadRecibida, 0);

    return totalOrdenado > 0 ? (totalRecibido / totalOrdenado) * 100 : 0;
  }

  calcularTotalAceptado(recepcion: RecepcionOrdenCompra): number {
    return recepcion.detalle.reduce((sum, d) => sum + d.cantidadAceptada, 0);
  }

  calcularTotalRechazado(recepcion: RecepcionOrdenCompra): number {
    return recepcion.detalle.reduce((sum, d) => sum + d.cantidadRechazada, 0);
  }

  /**
   * Validar y luego ingresar recepción a Kardex / SPRING
   */
  async validarYIngresarKardex(recepcion: RecepcionOrdenCompra) {
    if (!recepcion.id) {
      this.alertService.showAlert('Error', 'La recepción no tiene ID válido', 'error');
      return;
    }

    // Confirmación del usuario
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Ingreso a Almacén',
      `¿Está seguro de ingresar la recepción ${recepcion.numeroRecepcion} al almacén? Esto generará una Nota de Ingreso (NI) en SPRING y actualizará el stock.`,
      'warning'
    );

    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      // 1. VALIDAR recepción en backend
      const validacion = await this.recepcionOCService.validarRecepcion(
        recepcion.id,
        this.usuario.documentoidentidad
      ).toPromise();

      if (!validacion?.valido) {
        throw new Error(validacion?.mensaje || 'La recepción no es válida para ingreso');
      }

      // 2. INGRESAR A KARDEX / SPRING
      const respuesta = await this.recepcionOCService.ingresarRecepcionKardex(
        recepcion.id,
        this.usuario.documentoidentidad
      ).toPromise();

      if (respuesta?.numeroNI && !respuesta?.error) {
        // Actualizar local
        recepcion.ingresadoKardex = true;
        recepcion.fechaIngresoKardex = new Date().toISOString();
        recepcion.numeroNI = respuesta.numeroNI;
        
        await this.dexieService.saveRecepcionOrdenCompra(recepcion);

        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Éxito',
          `Recepción ingresada correctamente. NI generado: ${respuesta.numeroNI}`,
          'success'
        );

        await this.cargarRecepciones();
      } else {
        throw new Error(respuesta?.error || respuesta?.mensaje || 'Error al ingresar a Kardex');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Error al ingresar a almacén: ' + (error.message || error),
        'error'
      );
    }
  }

  /**
   * Método legacy - mantener para compatibilidad
   */
  async ingresarAKardex(recepcion: RecepcionOrdenCompra) {
    // Redirigir al nuevo flujo con SPRING
    await this.validarYIngresarKardex(recepcion);
  }

  /**
   * Actualizar cantidad recibida en backend (para recepciones existentes)
   */
  async actualizarCantidadEnBackend(detalle: DetalleRecepcion) {
    if (!detalle.id) return;

    try {
      // Preparar datos para backend
      const datos = {
        idDetalleRecepcion: detalle.id,
        cantidadRecibida: detalle.cantidadRecibida,
        cantidadAceptada: detalle.cantidadAceptada,
        lote: (detalle as any).lote || '',
        motivoRechazo: detalle.estadoItem === 'NO_CONFORME' ? 'Cantidad rechazada' : ''
      };

      // Llamar al servicio (necesita agregar método en RecepcionOCService)
      // Por ahora solo actualizamos localmente
      console.log('Actualizando cantidad en backend:', datos);
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
    }
  }
}
