import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { environment } from '@/environments/environment';
import { OrdenPdfService } from './orden-pdf.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { OrdenCompraService } from '@/app/services/orden-compra.service';
import { DropdownComponent } from '@/app/modules/main/components/dropdown/dropdown.component';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

@Component({
  selector: 'app-consolidacion-compras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule, DropdownComponent],
  templateUrl: './consolidacion-compras.component.html',
  styleUrls: ['./consolidacion-compras.component.scss'],
})
export class ConsolidacionComprasComponent implements OnInit {
  private baseUrl = environment.baseUrl;

  // Estado
  tabActiva = signal(0);
  cargandoReqs = signal(false);
  cargandoReqsCompletos = signal(false);
  cargandoOCs = signal(false);
  guardandoOC = signal(false);
  subiendoAdjunto = signal(false);
  modalOCAbierto = signal(false);
  modalAdjuntosAbierto = signal(false);
  modalDetalleReqAbierto = signal(false);
  modalDetalleOCAbierto = signal(false);

  // Datos
  requerimientos = signal<any[]>([]);
  requerimientosCompletos = signal<any[]>([]);
  itemsSeleccionados = signal<any[]>([]);
  ordenesCompra = signal<any[]>([]);
  adjuntos = signal<any[]>([]);
  ordenActual = signal<any>(null);
  requerimientoDetalleActual = signal<any>(null);
  tipoOrdenActual = signal<'OC' | 'OS'>('OC');
  ocsConPdfYExcel = signal<Set<number>>(new Set());
  itemsMaestra = signal<any[]>([]);
  filasExpandidas = signal<Set<string>>(new Set());
  almacenes = signal<any[]>([]);

  // Filtros
  busqueda = '';
  filtroEstadoOC = '';

  // Resumen general
  totalItems = computed(() => this.requerimientos().length);
  itemsPendientes = computed(() => this.requerimientos().filter(r => !r.codigoConsolidacion).length);
  itemsConsolidados = computed(() => this.requerimientos().filter(r => !!r.codigoConsolidacion).length);

  // Distribucion contable calculada
  distribucionContable = computed(() => {
    const mapa = new Map<string, { area: string; ceco: string; proyecto: string; cantidad: number }>();
    for (const item of this.itemsSeleccionados()) {
      const key = `${item.ceco}`;
      if (!mapa.has(key)) {
        mapa.set(key, { area: item.area, ceco: item.ceco, proyecto: item.proyecto || '', cantidad: item.cantidadPendiente });
      } else {
        mapa.get(key)!.cantidad += item.cantidadPendiente;
      }
    }
    const total = this.itemsSeleccionados().reduce((s, i) => s + i.cantidadPendiente, 0) || 1;
    return Array.from(mapa.values()).map(d => ({
      ...d,
      porcentaje: (d.cantidad / total) * 100
    }));
  });

  gruposConsolidados = computed(() => {
    const mapa = new Map<string, any>();
    const maestra = this.itemsMaestra();
    
    for (const item of this.itemsSeleccionados()) {
      if (!mapa.has(item.codigo)) {
        const itemMaestra = maestra.find((m: any) => m.codigo === item.codigo);
        mapa.set(item.codigo, {
          codigo: item.codigo,
          descripcion: item.descripcion,
          unidadMedida: item.unidadMedida,
          cantidadTotal: 0,
          precioUnitario: itemMaestra?.precio || 0,
          moneda: itemMaestra?.moneda || 'LO',
          items: []
        });
      }
      const grupo = mapa.get(item.codigo)!;
      grupo.cantidadTotal += item.cantidadPendiente;
      grupo.items.push(item);
    }
    
    return Array.from(mapa.values()).map(g => ({
      ...g,
      valorTotal: g.cantidadTotal * (g.precioUnitario || 0)
    }));
  });

  // Formulario OC
  ocForm: any = {
    rucProveedor: '', nombreProveedor: '', emailProveedor: '',
    telefonoProveedor: '', direccionProveedor: '',
    moneda: 'PEN', tipoCambio: 1, fechaEntregaEstimada: '',
    condicionesPago: 'Contado', formaPago: 'Transferencia',
    almacen: '', lugarEntrega: '', observaciones: '',
    items: [], subtotal: 0, igv: 0, totalOrden: 0
  };

  // Búsqueda de proveedores
  busquedaProveedor = '';
  proveedoresSugeridos = signal<any[]>([]);
  cargandoProveedores = signal(false);
  proveedorSeleccionado = signal<any>(null);
  mostrarSugerenciasProveedor = signal(false);

  // Adjuntos
  adjuntoDescripcion = '';
  archivoSeleccionado: File | null = null;

  // Usuario
  usuario: Usuario | null = null;

  constructor(
    private http: HttpClient,
    private dexieService: DexieService,
    private alertService: AlertService,
    private pdfService: OrdenPdfService,
    private maestrasService: MaestrasService,
    private ordenCompraService: OrdenCompraService
  ) {}

  async ngOnInit() {
    this.usuario = (await this.dexieService.obtenerPrimerUsuario()) ?? null;
    await this.cargarRequerimientos();
    await this.cargarRequerimientosCompletos();
    await this.cargarAlmacenes();
  }

  async cargarRequerimientos() {
    this.cargandoReqs.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-requerimientos-para-oc`, {
          ruc: this.usuario?.ruc,
          busqueda: this.busqueda,
          soloSinOC: true
        })
      );
      this.requerimientos.set(Array.isArray(resp) ? resp : []);
    } catch {
      this.requerimientos.set([]);
    } finally {
      this.cargandoReqs.set(false);
    }
  }

  async cargarRequerimientosCompletos() {
    this.cargandoReqsCompletos.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-requerimientos-completos`, {
          ruc: this.usuario?.ruc,
          busqueda: this.busqueda,
          soloSinOC: true
        })
      );
      this.requerimientosCompletos.set(Array.isArray(resp) ? resp : []);
    } catch {
      this.requerimientosCompletos.set([]);
    } finally {
      this.cargandoReqsCompletos.set(false);
    }
  }

  async cargarAlmacenes() {
    try {
      const resp: any = await lastValueFrom(
        this.maestrasService.getAlmacenes([
          { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' }
        ])
      );
      this.almacenes.set(Array.isArray(resp) ? resp : []);
    } catch {
      this.almacenes.set([]);
    }
  }

  async cargarOrdenesCompra() {
    this.cargandoOCs.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-ocs-por-estado`, {
          estado: this.filtroEstadoOC,
          usuario: this.usuario?.documentoidentidad
        })
      );
      this.ordenesCompra.set(Array.isArray(resp) ? resp : []);
      
      // Verificar qué OCs tienen PDF y Excel
      const ocs = Array.isArray(resp) ? resp : [];
      const ocsConAmbos = new Set<number>();
      
      for (const oc of ocs) {
        const tieneAmbos = await this.tienePdfYExcelParaOC(oc);
        if (tieneAmbos) {
          ocsConAmbos.add(oc.idOrden);
        }
      }
      
      this.ocsConPdfYExcel.set(ocsConAmbos);
    } catch {
      this.ordenesCompra.set([]);
      this.ocsConPdfYExcel.set(new Set());
    } finally {
      this.cargandoOCs.set(false);
    }
  }

  estaSeleccionado(idDetalle: number) {
    return this.itemsSeleccionados().some(i => i.idDetalle === idDetalle);
  }

  toggleSeleccion(req: any) {
    const actual = this.itemsSeleccionados();
    const codigoItem = req.codigo;
    const itemsMismoCodigo = this.requerimientos().filter(r => r.codigo === codigoItem);
    
    if (this.estaSeleccionado(req.idDetalle)) {
      // Deseleccionar todos los items con el mismo código
      this.itemsSeleccionados.set(actual.filter(i => i.codigo !== codigoItem));
    } else {
      // Seleccionar todos los items con el mismo código
      const idsActuales = new Set(actual.map(i => i.idDetalle));
      const nuevos = itemsMismoCodigo.filter(i => !idsActuales.has(i.idDetalle));
      this.itemsSeleccionados.set([...actual, ...nuevos]);
    }
    
    // Cargar items del maestra para los códigos seleccionados
    this.cargarItemsMaestra();
  }

  seleccionarTodos(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.itemsSeleccionados.set(checked ? [...this.requerimientos()] : []);
    if (checked) {
      this.cargarItemsMaestra();
    }
  }

  async cargarItemsMaestra() {
    const codigosUnicos = [...new Set(this.itemsSeleccionados().map(i => i.codigo))];
    if (codigosUnicos.length === 0) {
      this.itemsMaestra.set([]);
      return;
    }
    try {
      const resp: any = await lastValueFrom(
        this.maestrasService.getItems({
          ruc: this.usuario?.ruc,
          codigos: codigosUnicos
        })
      );
      this.itemsMaestra.set(Array.isArray(resp) ? resp : []);
    } catch {
      this.itemsMaestra.set([]);
    }
  }

  toggleFilaExpandida(codigo: string) {
    const actual = new Set(this.filasExpandidas());
    if (actual.has(codigo)) {
      actual.delete(codigo);
    } else {
      actual.add(codigo);
    }
    this.filasExpandidas.set(actual);
  }

  estaFilaExpandida(codigo: string): boolean {
    return this.filasExpandidas().has(codigo);
  }

  simboloMoneda(moneda: string): string {
    return moneda === 'EX' ? '$' : 'S/';
  }

  getNombreAlmacen(codigo: string): string {
    if (!codigo) return '';
    const almacen = this.almacenes().find((a: any) => a.codigo === codigo || a.AlmacenCodigo === codigo);
    return almacen?.descripcion || almacen?.AlmacenDescripcion || codigo;
  }

  limpiarSeleccion() {
    this.itemsSeleccionados.set([]);
  }

  irAConsolidar() {
    this.tabActiva.set(2);
  }

  abrirModalEmitirOC() {
    const items = this.gruposConsolidados().map(g => ({
      codigo: g.codigo,
      descripcion: g.descripcion,
      cantidad: g.cantidadTotal,
      unidadMedida: g.unidadMedida,
      precioUnitario: g.precioUnitario || 0,
      descuento: 0,
      ceco: g.items[0]?.ceco || '',
      proyecto: g.items[0]?.proyecto || '',
      idDetalle: g.items[0]?.idDetalle,
      idConsolidacion: g.items[0]?.IdConsolidacion
    }));

    // Obtener almacén del primer requerimiento seleccionado
    const primerItem = this.itemsSeleccionados()[0];
    const almacenOrigen = primerItem?.almacen || primerItem?.idalmacen || primerItem?.AlmacenCodigo || '';

    this.ocForm = {
      ...this.ocForm,
      almacen: almacenOrigen,
      items,
      subtotal: 0, igv: 0, totalOrden: 0
    };
    this.modalOCAbierto.set(true);
  }

  cerrarModalOC() {
    this.modalOCAbierto.set(false);
  }

  subtotalItem(item: any): number {
    return Math.round((item.cantidad * item.precioUnitario - (item.descuento || 0)) * 100) / 100;
  }

  calcularTotalesOC() {
    const subtotal = this.ocForm.items.reduce((s: number, i: any) => s + this.subtotalItem(i), 0);
    this.ocForm.subtotal = Math.round(subtotal * 100) / 100;
    this.ocForm.igv = Math.round(subtotal * 0.18 * 100) / 100;
    this.ocForm.totalOrden = Math.round((subtotal + this.ocForm.igv) * 100) / 100;
  }

  /**
   * Genera la distribución contable para sincronización con SPRING
   * Basado en los items de la OC, agrupa por ceco/proyecto y asigna cuentas según tipo de ítem
   * @param orden Orden de compra con items
   * @returns Array de distribución contable
   */
  private generarDistribucionContable(orden: any): any[] {
    const distribucion: any[] = [];

    if (!orden.items || orden.items.length === 0) {
      return distribucion;
    }

    // Mapa de agrupación por ceco y proyecto
    const grupos = new Map<string, { monto: number; proyecto: string; ceco: string }>();

    for (const item of orden.items) {
      const ceco = item.ceco || '999999';
      const proyecto = item.proyecto || '';
      const key = `${ceco}-${proyecto}`;

      const subtotal = this.subtotalItem(item);

      if (grupos.has(key)) {
        grupos.get(key)!.monto += subtotal;
      } else {
        grupos.set(key, { monto: subtotal, proyecto, ceco });
      }
    }

    // Generar distribución por cada grupo
    for (const [key, grupo] of grupos) {
      const montoRedondeado = Math.round(grupo.monto * 100) / 100;

      // Determinar cuenta contable según tipo de ítem (usar primer ítem del grupo como referencia)
      const itemReferencia = orden.items.find((i: any) =>
        (i.ceco || '999999') === grupo.ceco && (i.proyecto || '') === grupo.proyecto
      );

      let cuenta = '25301001'; // Default: COMMODITY
      let descripcion = 'COMMODITY';

      if (itemReferencia) {
        const codigo = (itemReferencia.codigo || '').toString();
        const tipo = (itemReferencia.tipo || '').toString().toUpperCase();

        if (tipo.includes('ACTIVO FIJO') || codigo.startsWith('3')) {
          cuenta = '33010101';
          descripcion = 'ACTIVO FIJO';
        } else if (tipo.includes('ACTIVO MENOR') || codigo.startsWith('4')) {
          cuenta = '25302001';
          descripcion = 'ACTIVO MENOR';
        } else if (tipo.includes('SERVICIO') || codigo.startsWith('5') || codigo.startsWith('9')) {
          cuenta = '63910101';
          descripcion = 'SERVICIO';
        } else if (codigo.startsWith('1') || codigo.startsWith('2') || tipo.includes('COMMODITY')) {
          cuenta = '25301001';
          descripcion = 'COMMODITY';
        }
      }

      distribucion.push({
        cuenta: cuenta,
        descripcion: descripcion,
        centrocosto: grupo.ceco,
        proyecto: grupo.proyecto,
        monto: montoRedondeado,
        referencia: orden.numeroOrden || '',
        ccdestino: grupo.ceco
      });
    }

    return distribucion;
  }

  async crearOCBorrador() {
    if (!this.ocForm.nombreProveedor || !this.ocForm.rucProveedor || !this.ocForm.emailProveedor) {
      this.alertService.showAlert('Atención', 'Complete los datos del proveedor (RUC, Nombre, Email).', 'warning');
      return;
    }
    if (!this.ocForm.lugarEntrega || !this.ocForm.fechaEntregaEstimada) {
      this.alertService.showAlert('Atención', 'Indique el lugar de entrega y la fecha estimada.', 'warning');
      return;
    }
    if (this.ocForm.items.some((i: any) => !i.precioUnitario || i.precioUnitario <= 0)) {
      this.alertService.showAlert('Atención', 'Todos los ítems deben tener precio unitario mayor a 0.', 'warning');
      return;
    }

    this.guardandoOC.set(true);
    try {
      const payload = {
        ...this.ocForm,
        idConsolidacion: this.ocForm.items[0]?.idConsolidacion,
        usuarioGenera: this.usuario?.documentoidentidad
      };
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/crear-oc-borrador`, payload)
      );
      if (resp?.success) {
        this.alertService.showAlert('OC Creada', `Orden de Compra ${resp.numeroOC} creada en borrador. Adjunte los documentos y luego envíe a aprobación.`, 'success');

        this.cerrarModalOC();
        this.limpiarSeleccion();
        await this.cargarRequerimientos();
        this.tabActiva.set(3);
        await this.cargarOrdenesCompra();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al crear OC.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    } finally {
      this.guardandoOC.set(false);
    }
  }

  async sincronizarOCConSpring(oc: any) {
    const ok = await this.alertService.showConfirm('Sincronizar con SPRING',
      `¿Confirma sincronizar la OC ${oc.numeroOrden} con SPRING?`, 'question');
    if (!ok) return;

    try {
      this.alertService.mostrarModalCarga();
      console.log('Sincronizando OC con SPRING:', oc);

      // 1. Obtener datos completos de la OC para sincronización con SPRING
      const companiaCodigo = this.usuario?.idempresa || '000008';
      const companiaSocio = (companiaCodigo || '000008').padStart(6, '0') + '00'; // Ej: 00000800
      const tipoComprobante = 'SY'; // Fijo por ahora, podría venir de la sesión en el futuro

      const detalleResp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/obtener-oc-para-sincronizar`, {
          idOrden: oc.idOrden,
          companiaCodigo,
          companiaSocio,
          tipoComprobante
        })
      );

      // La respuesta viene directamente como el objeto JSON (no envuelto en {success, data})
      const ocCompleta = detalleResp?.jsonSincronizacion || detalleResp;

      if (!ocCompleta || typeof ocCompleta !== 'object') {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Error', 'No se pudo obtener los detalles de la OC', 'error');
        return;
      }
      console.log('OC completa obtenida:', ocCompleta);

      // 2. Generar distribución contable
      const distribucion = this.generarDistribucionContable(ocCompleta);
      console.log('Distribución contable generada:', distribucion);

      // 3. Obtener idEmpresa del usuario
      const idEmpresa = this.usuario?.idempresa || '000008';

      // 4. Sincronizar con SPRING
      const syncResp = await this.ordenCompraService.sincronizarOCConsolidacion(
        oc.idOrden,
        idEmpresa,
        distribucion,
        ocCompleta
      );

      this.alertService.cerrarModalCarga();

      if (syncResp?.errorgeneral === 0) {
        this.alertService.showAlert('Éxito', `OC sincronizada con SPRING exitosamente. Número SPRING: ${syncResp.numeroOrdenSpring || 'N/A'}`, 'success');
        await this.cargarOrdenesCompra();
      } else {
        this.alertService.showAlert('Error', `Error al sincronizar: ${syncResp?.mensaje || 'Error desconocido'}`, 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al sincronizar OC con SPRING:', error);
      this.alertService.showAlert('Error', error?.message || 'Error inesperado', 'error');
    }
  }

  async enviarOCAprobacion(oc: any) {
    console.log('DEBUG enviarOCAprobacion - oc:', oc, 'idOrden:', oc.idOrden, 'tipo:', typeof oc.idOrden);
    const ok = await this.alertService.showConfirm('Enviar a Aprobación',
      `¿Confirma enviar la OC ${oc.numeroOrden} a aprobación? Monto: ${oc.moneda} ${oc.totalOrden}`, 'question');
    if (!ok) return;
    try {
      this.alertService.mostrarModalCarga();
      console.log('OC completa:', oc);

      // Enviar a aprobación local (el SP sincroniza automáticamente con SPRING en estado PR)
      const idConsolidacion = oc.idConsolidacion || oc.codigoConsolidacion || oc.consolidacionId ||
                                (oc.items && oc.items.length > 0 ? oc.items[0]?.idConsolidacion : null);
      console.log('IdConsolidacion a enviar:', idConsolidacion);

      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/enviar-oc-aprobacion`, {
          idOrden: oc.idOrden,
          idConsolidacion: idConsolidacion,
          usuarioGenera: this.usuario?.documentoidentidad
        })
      );

      this.alertService.cerrarModalCarga();

      const esExito = resp?.success === 1 || resp?.success === true || resp?.errorgeneral === 0;
      if (esExito) {
        const mensajeSync = resp?.numeroOrdenSpring
          ? ` Sincronizada con SPRING: ${resp.numeroOrdenSpring}`
          : '';
        this.alertService.showAlert('Éxito', `OC enviada a aprobación.${mensajeSync}`, 'success');
        await this.cargarOrdenesCompra();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error.', 'error');
      }
    } catch (e: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    }
  }

  async verPdfOC(oc: any) {
    try {
      const empresa: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/obtener-config-empresa`, {})
      );
      const html = this.pdfService.buildOCHtml(oc, empresa);
      this.pdfService.imprimirOrdenHtml(html, oc.numeroOrden);
    } catch {
      this.alertService.showAlert('Aviso', 'No se pudo cargar la configuración de empresa para el PDF.', 'warning');
    }
  }

  async confirmarEnvioOC(oc: any) {
    const ok = await this.alertService.showConfirm('Confirmar Envío al Proveedor',
      `¿Confirma enviar la OC ${oc.numeroOrden} al correo ${oc.emailProveedor}?`, 'question');
    if (!ok) return;
    try {
      this.alertService.mostrarModalCarga();
      const resp: any = await this.pdfService.enviarOrdenAlProveedor('OC', oc.idOrden);
      this.alertService.cerrarModalCarga();
      if (resp?.success) {
        const tipo = resp?.correoEnviado === false ? 'warning' : 'success';
        const titulo = resp?.correoEnviado === false ? 'OC Confirmada' : 'Enviado';
        this.alertService.showAlert(titulo, resp.mensaje, tipo);
        await this.cargarOrdenesCompra();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al enviar.', 'error');
      }
    } catch (e: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    }
  }

  exportarExcelOC(): void {
    const data = this.ordenesCompra();
    if (!data.length) return;
    const fecha = new Date().toISOString().slice(0, 10);
    const rows = data.map((oc, i) => ({
      '#': i + 1,
      'N° Orden': oc.numeroOrden || '',
      'Proveedor': oc.nombreProveedor || '',
      'RUC Proveedor': oc.rucProveedor || '',
      'Moneda': oc.moneda || '',
      'Total': oc.totalOrden ?? '',
      'Estado': oc.estado || '',
      'Condiciones Pago': oc.condicionesPago || '',
      'Lugar Entrega': oc.lugarEntrega || '',
      'F. Entrega Estimada': oc.fechaEntregaEstimada || '',
      'F. Creación': oc.fechaCreacion || '',
      'Correo Enviado': oc.correoEnviado ? 'Sí' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 4 }, { wch: 18 }, { wch: 30 }, { wch: 14 },
      { wch: 8 }, { wch: 14 }, { wch: 20 }, { wch: 16 },
      { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Órdenes de Compra');
    const buffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `ordenes_compra_${fecha}.xlsx`);
  }

  async abrirAdjuntos(orden: any, tipo: 'OC' | 'OS') {
    this.ordenActual.set(orden);
    this.tipoOrdenActual.set(tipo);
    this.adjuntoDescripcion = '';
    this.archivoSeleccionado = null;
    await this.cargarAdjuntos(orden.idOrden, tipo);
    this.modalAdjuntosAbierto.set(true);
  }

  cerrarModalAdjuntos() {
    this.modalAdjuntosAbierto.set(false);
    this.cargarOrdenesCompra();
  }

  async cargarAdjuntos(idOrden: number, tipo: string) {
    console.log('DEBUG cargarAdjuntos - idOrden:', idOrden, 'tipo:', typeof idOrden);
    try {
      const payload = { idOrden, tipoOrden: tipo };
      console.log('DEBUG cargarAdjuntos - payload:', payload);
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-adjuntos-oc`, payload)
      );
      console.log('DEBUG cargarAdjuntos - resp:', resp);
      this.adjuntos.set(Array.isArray(resp) ? resp : []);
    } catch {
      this.adjuntos.set([]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] || null;
  }

  async subirAdjunto() {
    if (!this.archivoSeleccionado) return;
    this.subiendoAdjunto.set(true);
    try {
      const b64 = await this.fileToBase64(this.archivoSeleccionado);
      const tipoArchivo = this.obtenerTipoArchivo(this.archivoSeleccionado.name);
      const idOrden = this.ordenActual()?.idOrden;
      console.log('DEBUG subirAdjunto - idOrden:', idOrden, 'tipo:', typeof idOrden, 'ordenActual:', this.ordenActual());
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-adjunto-oc`, {
          idOrden: idOrden,
          tipoOrden: this.tipoOrdenActual(),
          nombreArchivo: this.archivoSeleccionado.name,
          tipoArchivo: tipoArchivo,
          tamano: this.archivoSeleccionado.size,
          contenidoB64: b64,
          descripcion: this.adjuntoDescripcion,
          usuarioSube: this.usuario?.documentoidentidad
        })
      );
      if (resp?.success) {
        this.archivoSeleccionado = null;
        this.adjuntoDescripcion = '';
        await this.cargarAdjuntos(this.ordenActual()?.idOrden, this.tipoOrdenActual());
        // Refrescar el contador de adjuntos en la tabla sin cerrar el modal
        this.cargarOrdenesCompra();
        
        // Actualizar signal ocsConPdfYExcel
        const idOrden = this.ordenActual()?.idOrden;
        if (idOrden) {
          const tieneAmbos = this.tienePdfYExcel();
          const nuevoSet = new Set(this.ocsConPdfYExcel());
          if (tieneAmbos) {
            nuevoSet.add(idOrden);
          } else {
            nuevoSet.delete(idOrden);
          }
          this.ocsConPdfYExcel.set(nuevoSet);
        }
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al subir adjunto.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error.', 'error');
    } finally {
      this.subiendoAdjunto.set(false);
    }
  }

  obtenerTipoArchivo(nombreArchivo: string): string {
    const extension = nombreArchivo.toLowerCase().split('.').pop();
    if (extension === 'pdf') return 'PDF';
    if (extension === 'xlsx' || extension === 'xls') return 'EXCEL';
    return 'OTRO';
  }

  async eliminarAdjunto(idAdjunto: number) {
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/eliminar-adjunto-oc`, { idAdjunto })
      );
      if (resp?.success) {
        await this.cargarAdjuntos(this.ordenActual()?.idOrden, this.tipoOrdenActual());
        // Refrescar el contador de adjuntos en la tabla sin cerrar el modal
        this.cargarOrdenesCompra();
        
        // Actualizar signal ocsConPdfYExcel
        const idOrden = this.ordenActual()?.idOrden;
        if (idOrden) {
          const tieneAmbos = this.tienePdfYExcel();
          const nuevoSet = new Set(this.ocsConPdfYExcel());
          if (tieneAmbos) {
            nuevoSet.add(idOrden);
          } else {
            nuevoSet.delete(idOrden);
          }
          this.ocsConPdfYExcel.set(nuevoSet);
        }
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al eliminar adjunto.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error.', 'error');
    }
  }

  tienePdfYExcel(): boolean {
    const adjuntos = this.adjuntos();
    console.log('Adjuntos actuales:', adjuntos);
    console.log('Tipos de archivo:', adjuntos.map(a => a.tipoArchivo));
    // Check for PDF (case-insensitive)
    const tienePdf = adjuntos.some(a => {
      const tipo = (a.tipoArchivo || '').toLowerCase();
      return tipo === 'pdf' || tipo === 'application/pdf' || a.nombreArchivo?.toLowerCase().endsWith('.pdf');
    });
    // Check for Excel (case-insensitive)
    const tieneExcel = adjuntos.some(a => {
      const tipo = (a.tipoArchivo || '').toLowerCase();
      const nombre = (a.nombreArchivo || '').toLowerCase();
      return tipo === 'excel' || tipo.includes('excel') || tipo.includes('spreadsheet') ||
             nombre.endsWith('.xlsx') || nombre.endsWith('.xls');
    });
    console.log('Tiene PDF:', tienePdf, 'Tiene Excel:', tieneExcel);
    return tienePdf && tieneExcel;
  }

  async tienePdfYExcelParaOC(oc: any): Promise<boolean> {
    console.log('DEBUG tienePdfYExcelParaOC - oc.idOrden:', oc.idOrden, 'tipo:', typeof oc.idOrden);
    try {
      const payload = { idOrden: oc.idOrden, tipoOrden: 'OC' };
      console.log('DEBUG tienePdfYExcelParaOC - payload:', payload);
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-adjuntos-oc`, payload)
      );
      const adjuntos = Array.isArray(resp) ? resp : [];
      console.log('DEBUG Adjuntos de OC', oc.idOrden, ':', adjuntos);
      console.log('DEBUG Tipos de archivo:', adjuntos.map((a: any) => ({ nombre: a.nombreArchivo, tipo: a.tipoArchivo, idOrden: a.idOrden })));
      // Check for PDF (case-insensitive, also check file name)
      const tienePdf = adjuntos.some((a: any) => {
        const tipo = (a.tipoArchivo || '').toLowerCase();
        const nombre = (a.nombreArchivo || '').toLowerCase();
        return tipo === 'pdf' || tipo === 'application/pdf' || nombre.endsWith('.pdf');
      });
      // Check for Excel (case-insensitive, also check file name)
      const tieneExcel = adjuntos.some((a: any) => {
        const tipo = (a.tipoArchivo || '').toLowerCase();
        const nombre = (a.nombreArchivo || '').toLowerCase();
        return tipo === 'excel' || tipo.includes('excel') || tipo.includes('spreadsheet') ||
               nombre.endsWith('.xlsx') || nombre.endsWith('.xls');
      });
      console.log('OC', oc.idOrden, '- Tiene PDF:', tienePdf, 'Tiene Excel:', tieneExcel);
      return tienePdf && tieneExcel;
    } catch {
      return false;
    }
  }

  recortarNumeroReq(numero: string): string {
    if (!numero) return '';
    return numero.length > 10 ? numero.substring(0, 10) : numero;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res((reader.result as string).split(',')[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async verDetalleOC(oc: any) {
    this.ordenActual.set(oc);
    await this.cargarAdjuntos(oc.idOrden, 'OC');
    this.modalDetalleOCAbierto.set(true);
  }

  cerrarModalDetalleOC() {
    this.modalDetalleOCAbierto.set(false);
    this.ordenActual.set(null);
  }

  badgeEstadoOC(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE': 'bg-warning text-dark',
      'PENDIENTE_APROBACION': 'bg-info text-white',
      'APROBADA': 'bg-success',
      'ENVIADA': 'bg-primary',
      'ANULADA': 'bg-danger'
    };
    return map[estado] || 'bg-secondary';
  }

  abrirModalDetalleReq(req: any) {
    this.requerimientoDetalleActual.set(req);
    this.modalDetalleReqAbierto.set(true);
  }

  cerrarModalDetalleReq() {
    this.modalDetalleReqAbierto.set(false);
    this.requerimientoDetalleActual.set(null);
  }

  async verDetalleRequerimiento(req: any) {
    // Cargar items individuales del requerimiento usando el endpoint existente
    this.cargandoReqs.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-requerimientos-para-oc`, {
          ruc: this.usuario?.ruc,
          busqueda: req.numeroRequerimiento,
          soloSinOC: false
        })
      );
      const items = Array.isArray(resp) ? resp.filter((r: any) => r.numeroRequerimiento === req.numeroRequerimiento) : [];
      this.requerimientoDetalleActual.set({ ...req, items });
      this.modalDetalleReqAbierto.set(true);
    } catch {
      this.alertService.showAlert('Error', 'No se pudo cargar los detalles del requerimiento.', 'error');
    } finally {
      this.cargandoReqs.set(false);
    }
  }

  // ========== BÚSQUEDA DE PROVEEDORES ==========
  async buscarProveedores() {
    if (!this.busquedaProveedor || this.busquedaProveedor.length < 3) {
      this.proveedoresSugeridos.set([]);
      this.mostrarSugerenciasProveedor.set(false);
      return;
    }

    this.cargandoProveedores.set(true);
    try {
      const body = {
        ruc: this.usuario?.ruc,
        busqueda: this.busquedaProveedor,
        estado: 'ACTIVO'
      };
      const resp: any = await lastValueFrom(this.maestrasService.getProveedores(body));
      let proveedores = Array.isArray(resp) ? resp : [];

      // Filtro local adicional por si el backend no filtra correctamente
      const busquedaLower = this.busquedaProveedor.toLowerCase();
      proveedores = proveedores.filter((prov: any) => {
        const nombre = (prov.proveedor || prov.nombre || '').toLowerCase();
        const ruc = (prov.ruc || prov.documento || '').toLowerCase();
        return nombre.includes(busquedaLower) || ruc.includes(busquedaLower);
      });

      this.proveedoresSugeridos.set(proveedores.slice(0, 10)); // Máximo 10 sugerencias
      this.mostrarSugerenciasProveedor.set(proveedores.length > 0);
    } catch (error) {
      this.proveedoresSugeridos.set([]);
      this.mostrarSugerenciasProveedor.set(false);
    } finally {
      this.cargandoProveedores.set(false);
    }
  }

  seleccionarProveedor(prov: any) {
    this.proveedorSeleccionado.set(prov);
    this.ocForm.rucProveedor = prov.ruc || prov.documento || '';
    this.ocForm.nombreProveedor = prov.proveedor || '';
    this.ocForm.emailProveedor = prov.email || '';
    this.ocForm.telefonoProveedor = prov.telefono || '';
    this.ocForm.direccionProveedor = prov.direccion || '';
    this.busquedaProveedor = '';
    this.mostrarSugerenciasProveedor.set(false);
    this.proveedoresSugeridos.set([]);
  }

  limpiarProveedor() {
    this.proveedorSeleccionado.set(null);
    this.ocForm.rucProveedor = '';
    this.ocForm.nombreProveedor = '';
    this.ocForm.emailProveedor = '';
    this.ocForm.telefonoProveedor = '';
    this.ocForm.direccionProveedor = '';
    this.busquedaProveedor = '';
    this.mostrarSugerenciasProveedor.set(false);
  }

  cerrarSugerenciasProveedor() {
    setTimeout(() => {
      this.mostrarSugerenciasProveedor.set(false);
    }, 200);
  }
}