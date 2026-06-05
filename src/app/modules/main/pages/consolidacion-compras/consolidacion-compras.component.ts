import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { ItemSearchComponent } from './item-search/item-search.component';
import { TipoCambioService } from '@/app/services/tipo-cambio.service';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

@Component({
  selector: 'app-consolidacion-compras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule, DropdownComponent, ItemSearchComponent],
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
  modalOCDirectaAbierto = signal(false);
  guardandoOCDirecta = signal(false);
  modoEdicion = signal(false);
  ocIdEdicion = signal<number | null>(null);

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
  almacenesOC = signal<any[]>([]);
  empresas = signal<any[]>([]);
  itemsMaestroDirecta = signal<any[]>([]);
  cecosDirecta = signal<any[]>([]);
  proyectosDirecta = signal<any[]>([]);
  // Autocomplete estado por fila: indexado por posición del ítem
  itemAutocompleteState: { busqueda: string; sugerencias: any[]; mostrar: boolean }[] = [];

  // Filtros
  busqueda = '';
  filtroEstadoOC = '';

  // Resumen general
  totalItems = computed(() => this.requerimientos().length);
  itemsPendientes = computed(() => this.requerimientos().filter(r => !r.codigoConsolidacion).length);
  itemsConsolidados = computed(() => this.requerimientos().filter(r => !!r.codigoConsolidacion).length);

  // Distribucion contable calculada
  distribucionEdicion = signal<any[]>([]);

  distribucionContable = computed(() => {
    if (this.modoEdicion()) {
      return this.distribucionEdicion();
    }
    const mapa = new Map<string, { area: string; ceco: string; proyecto: string; cantidad: number }>();
    for (const item of this.itemsSeleccionados()) {
      const key = `${item.ceco}`;
      if (!mapa.has(key)) {
        mapa.set(key, { area: item.area || item.ceco, ceco: item.ceco, proyecto: item.proyecto || '', cantidad: item.cantidadPendiente });
      } else {
        mapa.get(key)!.cantidad += item.cantidadPendiente;
      }
    }
    const total = this.itemsSeleccionados().reduce((s: number, i: any) => s + i.cantidadPendiente, 0) || 1;
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

  // Clasificacion e Incoterms
  incoterms = signal<any[]>([]);
  clasificacionOpciones = [
    { value: 'IMP', label: 'IMP - Importación' },
    { value: 'LOC', label: 'LOC - Compras Locales' },
    { value: 'NAC', label: 'NAC - Compras Nacionales' }
  ];

  // Formulario OC
  ocForm: any = {
    rucProveedor: '', nombreProveedor: '', emailProveedor: '',
    telefonoProveedor: '', direccionProveedor: '',
    moneda: 'PEN', tipoCambio: 1, diasEntrega: 1, fechaEntregaEstimada: '',
    condicionesPago: 'Contado', formaPago: 'Transferencia',
    rucEmpresaOC: '', almacen: '', lugarEntrega: '', observaciones: '',
    clasificacion: 'LOC', incoterm: '',
    items: [], subtotal: 0, igv: 0, totalOrden: 0
  };

  // Formulario OC Directa
  ocDirectaForm: any = {
    rucProveedor: '', nombreProveedor: '', emailProveedor: '',
    telefonoProveedor: '', direccionProveedor: '',
    moneda: 'PEN', tipoCambio: 1, fechaEntregaEstimada: '',
    condicionesPago: 'Contado', formaPago: 'Transferencia',
    almacen: '', lugarEntrega: '', observaciones: '',
    clasificacion: 'LOC', incoterm: '',
    items: [], subtotal: 0, igv: 0, totalOrden: 0
  };
  busquedaProveedorDirecta = '';
  proveedoresSugeridosDirecta = signal<any[]>([]);
  cargandoProveedoresDirecta = signal(false);
  proveedorSeleccionadoDirecta = signal<any>(null);
  mostrarSugerenciasProveedorDirecta = signal(false);

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
    private ordenCompraService: OrdenCompraService,
    private tipoCambioService: TipoCambioService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.usuario = (await this.dexieService.obtenerPrimerUsuario()) ?? null;
    await this.cargarRequerimientos();
    await this.cargarRequerimientosCompletos();
    await this.cargarAlmacenes();
    await this.cargarEmpresas();
    this.cargarItemsMaestroDirecta();
    this.cargarCecosDirecta();
    this.cargarProyectosDirecta();
    this.cargarIncoterms();
    await this.cargarOrdenesCompra();
  }

  async cargarIncoterms() {
    try {
      const lista = await this.ordenCompraService.listarIncoterms();
      this.incoterms.set(lista);
    } catch {
      this.incoterms.set([]);
    }
  }

  onClasificacionChange(form: any) {
    if (form.clasificacion !== 'IMP') {
      form.incoterm = '';
    }
  }

  async cargarCecosDirecta() {
    try {
      let cecos = await this.dexieService.showCecos();
      if (!cecos || cecos.length === 0) {
        const resp: any = await lastValueFrom(
          this.maestrasService.getCecos([{ aplicacion: 'LOGISTICA', esadmin: 0 }])
        );
        cecos = Array.isArray(resp) ? resp : [];
        if (cecos.length > 0) await this.dexieService.saveCecos(cecos);
      }
      // Deduplicar por costcenter
      const vistos = new Set<string>();
      const unicos = cecos.filter((c: any) => {
        const key = c.costcenter || c.id;
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
      });
      this.cecosDirecta.set(unicos);
    } catch {
      this.cecosDirecta.set([]);
    }
  }

  async cargarProyectosDirecta() {
    try {
      let proyectos = await this.dexieService.showProyectos();
      if (!proyectos || proyectos.length === 0) {
        const resp: any = await lastValueFrom(
          this.maestrasService.getProyectos([{ ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA', esadmin: 0 }])
        );
        proyectos = Array.isArray(resp) ? resp : [];
        if (proyectos.length > 0) await this.dexieService.saveProyectos(proyectos);
      }
      // Deduplicar por proyectoio
      const vistos = new Set<string>();
      const unicos = proyectos.filter((p: any) => {
        const key = p.proyectoio || p.afe;
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
      });
      this.proyectosDirecta.set(unicos);
    } catch {
      this.proyectosDirecta.set([]);
    }
  }

  async cargarItemsMaestroDirecta() {
    try {
      // Intentar desde Dexie primero (más rápido, tiene descripcionLocal + cuentaGasto)
      let items = await this.dexieService.showMaestroItem();
      if (!items || items.length === 0) {
        // Fallback: cargar desde API y guardar en Dexie
        const resp: any = await lastValueFrom(
          this.maestrasService.getItems([{ ruc: this.usuario?.ruc }])
        );
        items = Array.isArray(resp) ? resp : [];
        if (items.length > 0) {
          await this.dexieService.saveMaestroItems(items);
        }
      }
      this.itemsMaestroDirecta.set(items);
    } catch {
      this.itemsMaestroDirecta.set([]);
    }
  }

  buscarCuentaContableItem(codigo: string): string {
    if (!codigo) return '';
    const encontrado = this.itemsMaestroDirecta().find(
      (i: any) => (i.item || i.codigo || '').toString().toUpperCase() === codigo.toString().toUpperCase()
    );
    return encontrado?.cuentaGasto || encontrado?.cuentaInventario || '';
  }

  onCodigoItemDirectaChange(item: any) {
    const cuenta = this.buscarCuentaContableItem(item.codigo);
    if (cuenta) {
      item.cuentaContable = cuenta;
    }
    this.calcularTotalesOCDirecta();
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

  async cargarEmpresas() {
    try {
      const resp = await this.maestrasService.getEmpresas([]);
      this.empresas.set(Array.isArray(resp) ? resp : []);
    } catch {
      this.empresas.set([]);
    }
  }

  async onEmpresaOCChange(ruc: string) {
    this.ocForm.rucEmpresaOC = ruc;
    this.ocForm.almacen = '';
    if (!ruc) {
      this.almacenesOC.set(this.almacenes());
      return;
    }
    try {
      const resp: any = await lastValueFrom(
        this.maestrasService.getAlmacenes([{ ruc, aplicacion: 'LOGISTICA' }])
      );
      this.almacenesOC.set(Array.isArray(resp) ? resp : []);
    } catch {
      this.almacenesOC.set([]);
    }
  }

  calcularFechaEntrega(): void {
    const dias = parseInt(this.ocForm.diasEntrega, 10) || 0;
    if (dias <= 0) {
      this.ocForm.fechaEntregaEstimada = '';
      return;
    }
    const hoy = new Date();
    const fechaEntrega = new Date(hoy);
    fechaEntrega.setDate(hoy.getDate() + dias + 1);
    this.ocForm.fechaEntregaEstimada = fechaEntrega.toISOString().split('T')[0];
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
      clasificacion: 'LOC',
      incoterm: '',
      subtotal: 0, igv: 0, totalOrden: 0
    };
    this.calcularFechaEntrega();
    this.calcularTotalesOC();
    this.modalOCAbierto.set(true);
    this.cargarTipoCambio();
  }

  async editarOC(oc: any) {
    this.cargandoOCs.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/obtener-detalle-oc`, { idOrden: oc.idOrden })
      );
      if (!resp || resp.error) {
        this.alertService.showAlert('Error', resp?.error || 'No se pudo cargar la OC.', 'error');
        return;
      }
      const items = Array.isArray(resp.itemsJson)
        ? resp.itemsJson
        : (resp.itemsJson ? JSON.parse(resp.itemsJson) : []);
      this.ocForm = {
        rucProveedor: resp.rucProveedor || '',
        nombreProveedor: resp.nombreProveedor || '',
        emailProveedor: resp.emailProveedor || '',
        telefonoProveedor: resp.telefonoProveedor || '',
        direccionProveedor: resp.direccionProveedor || '',
        moneda: resp.moneda || 'PEN',
        tipoCambio: resp.tipoCambio || 1,
        fechaEntregaEstimada: resp.fechaEntregaEstimada ? resp.fechaEntregaEstimada.substring(0, 10) : '',
        diasEntrega: 0,
        condicionesPago: resp.condicionesPago || 'Contado',
        formaPago: resp.formaPago || 'Transferencia',
        almacen: resp.almacen || '',
        rucEmpresaOC: '',
        lugarEntrega: resp.lugarEntrega || '',
        observaciones: resp.observaciones || '',
        clasificacion: resp.clasificacion || 'LOC',
        incoterm: resp.incoterm || '',
        items: items.map((i: any) => ({
          idDetalle: i.idDetalle,
          codigo: i.codigo,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          unidadMedida: i.unidadMedida,
          precioUnitario: i.precioUnitario,
          descuento: i.descuento || 0,
          ceco: i.ceco,
          proyecto: i.proyecto,
          idConsolidacion: i.idConsolidacion
        })),
        subtotal: resp.subtotal || 0,
        igv: resp.igv || 0,
        totalOrden: resp.totalOrden || 0
      };
      this.modoEdicion.set(true);
      this.ocIdEdicion.set(oc.idOrden);
      this.calcularTotalesOC();
      // Calcular distribución contable desde los items cargados
      const mapaEdicion = new Map<string, any>();
      for (const it of items) {
        const key = it.ceco || '';
        if (!mapaEdicion.has(key)) {
          mapaEdicion.set(key, { area: it.ceco, ceco: it.ceco, proyecto: it.proyecto || '', cantidad: it.cantidad });
        } else {
          mapaEdicion.get(key).cantidad += it.cantidad;
        }
      }
      const totalEdicion = items.reduce((s: number, i: any) => s + i.cantidad, 0) || 1;
      this.distribucionEdicion.set(Array.from(mapaEdicion.values()).map(d => ({
        ...d, porcentaje: (d.cantidad / totalEdicion) * 100
      })));
      this.modalOCAbierto.set(true);
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    } finally {
      this.cargandoOCs.set(false);
    }
  }

  async guardarEdicionOC() {
    if (!this.ocForm.nombreProveedor || !this.ocForm.rucProveedor || !this.ocForm.emailProveedor) {
      this.alertService.showAlert('Atención', 'Complete los datos del proveedor (RUC, Nombre, Email).', 'warning');
      return;
    }
    if (!this.ocForm.lugarEntrega || !this.ocForm.fechaEntregaEstimada) {
      this.alertService.showAlert('Atención', 'Indique el lugar de entrega y la fecha estimada.', 'warning');
      return;
    }
    if (this.ocForm.items.some((i: any) => !i.precioUnitario || parseFloat(i.precioUnitario) <= 0)) {
      this.alertService.showAlert('Atención', 'Todos los ítems deben tener precio unitario mayor a 0.', 'warning');
      return;
    }
    this.guardandoOC.set(true);
    try {
      const payload = {
        ...this.ocForm,
        idOrden: this.ocIdEdicion(),
        usuarioModifica: this.usuario?.documentoidentidad
      };
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/actualizar-oc-borrador`, payload)
      );
      if (resp?.success) {
        this.alertService.showAlert('OC Actualizada', 'La orden de compra fue actualizada correctamente.', 'success');
        this.modoEdicion.set(false);
        this.ocIdEdicion.set(null);
        this.cerrarModalOC();
        await this.cargarOrdenesCompra();
      } else {
        this.alertService.showAlert('Error', resp?.error || resp?.mensaje || 'Error al actualizar OC.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    } finally {
      this.guardandoOC.set(false);
    }
  }

  async cargarTipoCambio() {
    const fecha = this.tipoCambioService.fechaHoyString();
    const resp = await this.tipoCambioService.obtenerTipoCambio(fecha);
    if (resp?.tipoCambio) {
      this.ocForm.tipoCambio = resp.tipoCambio;
      this.cdr.markForCheck();
    }
  }

  cerrarModalOC() {
    this.modalOCAbierto.set(false);
    this.modoEdicion.set(false);
    this.ocIdEdicion.set(null);
    this.distribucionEdicion.set([]);
  }

  simboloMoneda(moneda: string): string {
    return moneda === 'USD' ? 'US$' : 'S/';
  }

  subtotalItem(item: any): number {
    const precio = parseFloat(item.precioUnitario) || 0;
    const bruto = item.cantidad * precio;
    const descPct = parseFloat(item.descuento) || 0;
    const neto = bruto - (bruto * descPct / 100);
    return Math.round(neto * 1000) / 1000;
  }

  calcularTotalesOC() {
    const subtotal = this.ocForm.items.reduce((s: number, i: any) => s + this.subtotalItem(i), 0);
    this.ocForm.subtotal = Math.round(subtotal * 1000) / 1000;
    this.ocForm.igv = Math.round(subtotal * 0.18 * 1000) / 1000;
    this.ocForm.totalOrden = Math.round((subtotal + this.ocForm.igv) * 1000) / 1000;
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
        usuarioGenera: this.usuario?.documentoidentidad,
        nombreRegistra: this.usuario?.nombre,
        rucEmpresa: this.usuario?.ruc
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

  sincronizandoMasivo = signal(false);

  async sincronizarOCsMasivo() {
    const pendientes = this.ordenesCompra().filter(o => o.estado === 'PENDIENTE' && !o.numeroOrdenSpring);
    if (pendientes.length === 0) {
      this.alertService.showAlert('Sin pendientes', 'Todas las OCs PENDIENTE ya están sincronizadas con SPRING.', 'info');
      return;
    }
    const ok = await this.alertService.showConfirm(
      'Sincronización masiva SPRING',
      `Se sincronizarán ${pendientes.length} OC(s) PENDIENTE sin número SPRING. ¿Continuar?`,
      'question'
    );
    if (!ok) return;

    this.sincronizandoMasivo.set(true);
    this.alertService.mostrarModalCarga();
    let exitosas = 0;
    let fallidas = 0;

    for (const oc of pendientes) {
      try {
        const companiaCodigo = this.usuario?.idempresa || '000008';
        const companiaSocio = (companiaCodigo || '000008').padStart(6, '0') + '00';
        const tipoComprobante = 'SY';

        const detalleResp: any = await lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/obtener-oc-para-sincronizar`, {
            idOrden: oc.idOrden, companiaCodigo, companiaSocio, tipoComprobante
          })
        );
        const ocCompleta = detalleResp?.jsonSincronizacion || detalleResp;
        if (!ocCompleta || typeof ocCompleta !== 'object') { fallidas++; continue; }

        const distribucion = this.generarDistribucionContable(ocCompleta);
        const idEmpresa = this.usuario?.idempresa || '000008';
        const syncResp = await this.ordenCompraService.sincronizarOCConsolidacion(
          oc.idOrden, idEmpresa, distribucion, ocCompleta
        );

        if (syncResp?.errorgeneral === 0) { exitosas++; } else { fallidas++; }
      } catch { fallidas++; }
    }

    this.alertService.cerrarModalCarga();
    this.sincronizandoMasivo.set(false);
    await this.cargarOrdenesCompra();
    this.alertService.showAlert(
      'Sincronización completada',
      `✔ ${exitosas} sincronizada(s) correctamente.${fallidas > 0 ? `  ✘ ${fallidas} con error.` : ''}`,
      exitosas > 0 && fallidas === 0 ? 'success' : 'warning'
    );
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

    // Verificar si el rol del usuario tiene permiso para omitir la validación de adjuntos
    let skipAdjuntos = false;
    try {
      const idrol = this.usuario?.idrol || '';
      if (idrol) {
        const respPerm: any = await lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/verificar-permiso`, { idrol, clave: 'SKIP_ADJUNTOS_OC' })
        );
        skipAdjuntos = respPerm?.valor === '1';
      }
    } catch { skipAdjuntos = false; }

    // Validar adjuntos antes de confirmar (se omite si el rol tiene permiso)
    if (!skipAdjuntos) {
      try {
        const respAdj: any = await lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/listar-adjuntos-oc`, { idOrden: oc.idOrden, tipoOrden: 'OC' })
        );
        const adjuntos = Array.isArray(respAdj) ? respAdj : [];
        const tienePdf = adjuntos.some((a: any) => {
          const tipo = (a.tipoArchivo || '').toLowerCase();
          const nombre = (a.nombreArchivo || '').toLowerCase();
          return tipo === 'pdf' || tipo === 'application/pdf' || nombre.endsWith('.pdf');
        });
        const tieneExcel = adjuntos.some((a: any) => {
          const tipo = (a.tipoArchivo || '').toLowerCase();
          const nombre = (a.nombreArchivo || '').toLowerCase();
          return tipo === 'excel' || tipo.includes('excel') || tipo.includes('spreadsheet') ||
                 nombre.endsWith('.xlsx') || nombre.endsWith('.xls');
        });

        if (!tienePdf || !tieneExcel) {
          const faltantes: string[] = [];
          if (!tienePdf) faltantes.push('📄 PDF de la orden de compra');
          if (!tieneExcel) faltantes.push('📊 Excel del cuadro comparativo de proveedores');
          this.alertService.showAlert(
            'Adjuntos requeridos',
            `Para enviar a aprobación debe adjuntar:\n\n${faltantes.join('\n')}\n\nAbre el detalle de la OC y sube los archivos correspondientes.`,
            'warning'
          );
          return;
        }
      } catch {
        this.alertService.showAlert('Error', 'No se pudo verificar los adjuntos. Intente nuevamente.', 'error');
        return;
      }
    }

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
    // Vista previa simple (sin formato configurable) - usada para estados previos
    try {
      const empresa: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/obtener-config-empresa`, { ruc: oc.rucEmpresa || '' })
      );
      const html = this.pdfService.buildOCHtml(oc, empresa);
      this.pdfService.imprimirOrdenHtml(html, oc.numeroOrden);
    } catch {
      this.alertService.showAlert('Aviso', 'No se pudo cargar la configuración de empresa para el PDF.', 'warning');
    }
  }

  async verPdfOCFormateado(oc: any) {
    // PDF con formato configurable (solo para OC APROBADA o ENVIADA)
    try {
      // Siempre cargar empresa según rucEmpresa de la OC (multiempresa)
      const empresa: any = await lastValueFrom(
        this.http.post<any>(`${this.baseUrl}/api/logistica/obtener-config-empresa`, { ruc: oc.rucEmpresa || '' })
      );
      if (empresa?.logoBase64) {
        this.pdfService.saveEmpresa(empresa);
      }
      const html = this.pdfService.buildOCHtml(oc, empresa);
      this.pdfService.imprimirOrdenHtml(html, oc.numeroOrden);
    } catch {
      this.alertService.showAlert('Aviso', 'No se pudo cargar el PDF con formato.', 'warning');
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

  rutaLocalArchivo: string | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] || null;
    this.rutaLocalArchivo = input.value || null;
  }

  private sanitizer = inject(DomSanitizer);
  adjuntoVisualizando = signal<{ nombre: string; url: string; tipo: string; safeUrl: SafeResourceUrl } | null>(null);

  descargarAdjunto(adj: any) {
    const mime = adj.tipoArchivo === 'pdf' ? 'application/pdf'
               : adj.tipoArchivo === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
               : adj.tipoArchivo === 'xls'  ? 'application/vnd.ms-excel'
               : 'application/octet-stream';
    const byteStr = atob(adj.contenidoB64);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = adj.nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  visualizarAdjunto(adj: any) {
    const mime = adj.tipoArchivo === 'pdf' ? 'application/pdf' : `application/${adj.tipoArchivo || 'octet-stream'}`;
    const byteStr = atob(adj.contenidoB64);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const url = URL.createObjectURL(blob);
    if (adj.tipoArchivo === 'pdf') {
      const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.adjuntoVisualizando.set({ nombre: adj.nombreArchivo, url, tipo: adj.tipoArchivo, safeUrl });
    } else {
      window.open(url, '_blank');
    }
  }

  cerrarVisualizador() {
    const actual = this.adjuntoVisualizando();
    if (actual?.url) URL.revokeObjectURL(actual.url);
    this.adjuntoVisualizando.set(null);
  }

  async actualizarContenidoAdjunto(event: Event, idAdjunto: number, origen: string = 'NUEVO') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const b64 = await this.fileToBase64(file);
      const urlArchivo = `\\\\172.16.20.24\\SpringGestionDoc\\TEMPORAL\\WH\\${file.name}`;
      const oc = this.ordenActual();
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/actualizar-adjunto-oc`, {
          idAdjunto,
          contenidoB64: b64,
          urlArchivo,
          nombreArchivo: file.name,
          tipoOrden: this.tipoOrdenActual(),
          usuarioSube: this.usuario?.documentoidentidad,
          idempresa: this.usuario?.idempresa,
          companiaSocio: oc?.companiaSocioSpring,
          numeroOrdenSpring: oc?.numeroOrdenSpring,
          rutaLocal: file.name
        })
      );
      if (resp?.success) {
        await this.cargarAdjuntos(this.ordenActual()?.idOrden, this.tipoOrdenActual());
        this.alertService.showAlert('Éxito', 'Archivo actualizado correctamente.', 'success');
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al actualizar.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error al actualizar el adjunto.', 'error');
    }
    input.value = '';
  }

  async subirAdjunto() {
    if (!this.archivoSeleccionado) return;
    this.subiendoAdjunto.set(true);
    try {
      const b64 = await this.fileToBase64(this.archivoSeleccionado);
      const tipoArchivo = this.obtenerTipoArchivo(this.archivoSeleccionado.name);
      const idOrden = this.ordenActual()?.idOrden;
      const numeroOrdenSpring = this.ordenActual()?.numeroOrdenSpring;
      const companiaSocio = this.ordenActual()?.companiaSocioSpring;
      console.log('DEBUG subirAdjunto - idOrden:', idOrden, 'tipo:', typeof idOrden, 'ordenActual:', this.ordenActual());
      const rutaServidor = `\\\\172.16.20.24\\SpringGestionDoc\\TEMPORAL\\WH\\${this.archivoSeleccionado.name}`;
      const payload: any = {
        idOrden: idOrden,
        tipoOrden: this.tipoOrdenActual(),
        nombreArchivo: this.archivoSeleccionado.name,
        tipoArchivo: tipoArchivo,
        tamano: this.archivoSeleccionado.size,
        contenidoB64: b64,
        descripcion: this.adjuntoDescripcion,
        usuarioSube: this.usuario?.documentoidentidad,
        idempresa: this.usuario?.idempresa,
        companiaSocio: companiaSocio,
        urlArchivo: rutaServidor,
        rutaLocal: this.rutaLocalArchivo || this.archivoSeleccionado.name
      };
      if (numeroOrdenSpring) {
        payload.numeroOrdenSpring = numeroOrdenSpring;
      }
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-adjunto-oc`, payload)
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

  // ========== OC DIRECTA ==========
  abrirModalOCDirecta() {
    this.ocDirectaForm = {
      rucProveedor: '', nombreProveedor: '', emailProveedor: '',
      telefonoProveedor: '', direccionProveedor: '',
      moneda: 'PEN', tipoCambio: 1, fechaEntregaEstimada: '',
      condicionesPago: 'Contado', formaPago: 'Transferencia',
      almacen: '', lugarEntrega: '', observaciones: '',
      clasificacion: 'LOC', incoterm: '',
      items: [], subtotal: 0, igv: 0, totalOrden: 0
    };
    this.busquedaProveedorDirecta = '';
    this.proveedorSeleccionadoDirecta.set(null);
    this.proveedoresSugeridosDirecta.set([]);
    this.itemAutocompleteState = [];
    this.modalOCDirectaAbierto.set(true);
  }

  cerrarModalOCDirecta() {
    this.modalOCDirectaAbierto.set(false);
  }

  agregarItemDirecta() {
    this.ocDirectaForm.items = [
      ...this.ocDirectaForm.items,
      { codigo: '', descripcion: '', cantidad: 1, unidadMedida: 'UND', precioUnitario: 0, descuento: 0, ceco: '', proyecto: '', tipo: 'ITEM', cuentaContable: '' }
    ];
    this.itemAutocompleteState.push({ busqueda: '', sugerencias: [], mostrar: false });
  }

  quitarItemDirectaConState(index: number) {
    this.ocDirectaForm.items = this.ocDirectaForm.items.filter((_: any, i: number) => i !== index);
    this.itemAutocompleteState.splice(index, 1);
    this.calcularTotalesOCDirecta();
  }

  buscarItemsDirecta(index: number, valor: string) {
    const state = this.itemAutocompleteState[index];
    if (!state) return;
    state.busqueda = valor;
    if (!valor || valor.length < 2) {
      state.sugerencias = [];
      state.mostrar = false;
      return;
    }
    const busq = valor.toLowerCase();
    state.sugerencias = this.itemsMaestroDirecta()
      .filter((i: any) =>
        (i.item || '').toLowerCase().includes(busq) ||
        (i.descripcionLocal || '').toLowerCase().includes(busq)
      )
      .slice(0, 10);
    state.mostrar = state.sugerencias.length > 0;
  }

  seleccionarItemDirecta(index: number, maestroItem: any) {
    const item = this.ocDirectaForm.items[index];
    if (!item) return;
    item.codigo = maestroItem.item || maestroItem.codigo || '';
    item.descripcion = maestroItem.descripcionLocal || maestroItem.descripcion || '';
    item.unidadMedida = maestroItem.unidadCodigo || maestroItem.unidadCompra || maestroItem.unidadMedida || 'UND';
    item.cuentaContable = maestroItem.cuentaGasto || maestroItem.cuentaInventario || '';
    item.precioUnitario = parseFloat(maestroItem.precioUnitarioLocal || '0') || 0;
    this.calcularTotalesOCDirecta();
  }

  onProductoSelectDirecta(index: number, event: any) {
    this.seleccionarItemDirecta(index, event);
  }

  cerrarAutocompleteItem(index: number) {
    setTimeout(() => {
      const state = this.itemAutocompleteState[index];
      if (state) state.mostrar = false;
    }, 200);
  }

  generarDistribucionContableDirecta(): any[] {
    const items = this.ocDirectaForm.items;
    if (!items || items.length === 0) return [];

    const grupos = new Map<string, { monto: number; proyecto: string; ceco: string; itemRef: any }>();
    for (const item of items) {
      const ceco = item.ceco || '999999';
      const proyecto = item.proyecto || '';
      const key = `${ceco}-${proyecto}-${item.codigo}`;
      const subtotal = this.subtotalItemDirecta(item);
      if (grupos.has(key)) {
        grupos.get(key)!.monto += subtotal;
      } else {
        grupos.set(key, { monto: subtotal, proyecto, ceco, itemRef: item });
      }
    }

    const distribucion: any[] = [];
    for (const [, grupo] of grupos) {
      const monto = Math.round(grupo.monto * 100) / 100;
      const itemRef = grupo.itemRef;
      const codigo = (itemRef.codigo || '').toString();
      const tipo = (itemRef.tipo || '').toString().toUpperCase();

      // Prioridad 1: cuenta contable cargada desde la maestra de items
      let cuenta = itemRef.cuentaContable || '';
      let descripcion = tipo || 'ITEM';

      // Prioridad 2: cuenta por tipo seleccionado
      if (!cuenta) {
        if (tipo === 'ITEM') {
          cuenta = this.buscarCuentaContableItem(codigo) || '25241001';
          descripcion = 'ITEM';
        } else if (tipo.includes('ACTIVO FIJO') || codigo.startsWith('3')) {
          cuenta = '33010101'; descripcion = 'ACTIVO FIJO';
        } else if (tipo.includes('ACTIVO MENOR') || codigo.startsWith('4')) {
          cuenta = '25302001'; descripcion = 'ACTIVO MENOR';
        } else if (tipo.includes('SERVICIO') || codigo.startsWith('5') || codigo.startsWith('9')) {
          cuenta = '63910101'; descripcion = 'SERVICIO';
        } else {
          cuenta = '25301001'; descripcion = 'COMMODITY';
        }
      }

      distribucion.push({
        cuenta,
        descripcion,
        centrocosto: grupo.ceco,
        proyecto: grupo.proyecto,
        monto,
        ccdestino: grupo.ceco
      });
    }
    return distribucion;
  }

  quitarItemDirecta(index: number) {
    this.ocDirectaForm.items = this.ocDirectaForm.items.filter((_: any, i: number) => i !== index);
    this.calcularTotalesOCDirecta();
  }

  calcularTotalesOCDirecta() {
    const subtotal = this.ocDirectaForm.items.reduce((s: number, i: any) => {
      return s + Math.round((i.cantidad * i.precioUnitario - (i.descuento || 0)) * 100) / 100;
    }, 0);
    this.ocDirectaForm.subtotal = Math.round(subtotal * 100) / 100;
    this.ocDirectaForm.igv = Math.round(subtotal * 0.18 * 100) / 100;
    this.ocDirectaForm.totalOrden = Math.round((subtotal + this.ocDirectaForm.igv) * 100) / 100;
  }

  subtotalItemDirecta(item: any): number {
    return Math.round((item.cantidad * item.precioUnitario - (item.descuento || 0)) * 100) / 100;
  }

  async buscarProveedoresDirecta() {
    if (!this.busquedaProveedorDirecta || this.busquedaProveedorDirecta.length < 3) {
      this.proveedoresSugeridosDirecta.set([]);
      this.mostrarSugerenciasProveedorDirecta.set(false);
      return;
    }
    this.cargandoProveedoresDirecta.set(true);
    try {
      const body = { ruc: this.usuario?.ruc, busqueda: this.busquedaProveedorDirecta, estado: 'ACTIVO' };
      const resp: any = await lastValueFrom(this.maestrasService.getProveedores(body));
      let proveedores = Array.isArray(resp) ? resp : [];
      const busq = this.busquedaProveedorDirecta.toLowerCase();
      proveedores = proveedores.filter((p: any) => {
        const nombre = (p.proveedor || p.nombre || '').toLowerCase();
        const rucP = (p.ruc || p.documento || '').toLowerCase();
        return nombre.includes(busq) || rucP.includes(busq);
      });
      this.proveedoresSugeridosDirecta.set(proveedores.slice(0, 10));
      this.mostrarSugerenciasProveedorDirecta.set(proveedores.length > 0);
    } catch {
      this.proveedoresSugeridosDirecta.set([]);
      this.mostrarSugerenciasProveedorDirecta.set(false);
    } finally {
      this.cargandoProveedoresDirecta.set(false);
    }
  }

  seleccionarProveedorDirecta(prov: any) {
    this.proveedorSeleccionadoDirecta.set(prov);
    this.ocDirectaForm.rucProveedor = prov.ruc || prov.documento || '';
    this.ocDirectaForm.nombreProveedor = prov.proveedor || '';
    this.ocDirectaForm.emailProveedor = prov.email || '';
    this.ocDirectaForm.telefonoProveedor = prov.telefono || '';
    this.ocDirectaForm.direccionProveedor = prov.direccion || '';
    this.busquedaProveedorDirecta = '';
    this.mostrarSugerenciasProveedorDirecta.set(false);
    this.proveedoresSugeridosDirecta.set([]);
  }

  limpiarProveedorDirecta() {
    this.proveedorSeleccionadoDirecta.set(null);
    this.ocDirectaForm.rucProveedor = '';
    this.ocDirectaForm.nombreProveedor = '';
    this.ocDirectaForm.emailProveedor = '';
    this.ocDirectaForm.telefonoProveedor = '';
    this.ocDirectaForm.direccionProveedor = '';
    this.busquedaProveedorDirecta = '';
    this.mostrarSugerenciasProveedorDirecta.set(false);
  }

  cerrarSugerenciasProveedorDirecta() {
    setTimeout(() => this.mostrarSugerenciasProveedorDirecta.set(false), 200);
  }

  async crearOCDirecta(enviarASpring = false) {
    if (!this.ocDirectaForm.nombreProveedor || !this.ocDirectaForm.rucProveedor || !this.ocDirectaForm.emailProveedor) {
      this.alertService.showAlert('Atención', 'Complete los datos del proveedor (RUC, Nombre, Email).', 'warning');
      return;
    }
    if (!this.ocDirectaForm.lugarEntrega || !this.ocDirectaForm.fechaEntregaEstimada) {
      this.alertService.showAlert('Atención', 'Indique el lugar de entrega y la fecha estimada.', 'warning');
      return;
    }
    if (!this.ocDirectaForm.items.length) {
      this.alertService.showAlert('Atención', 'Agregue al menos un ítem a la orden.', 'warning');
      return;
    }
    if (this.ocDirectaForm.items.some((i: any) => !i.codigo || !i.descripcion)) {
      this.alertService.showAlert('Atención', 'Todos los ítems deben tener código y descripción.', 'warning');
      return;
    }
    if (this.ocDirectaForm.items.some((i: any) => !i.precioUnitario || i.precioUnitario <= 0)) {
      this.alertService.showAlert('Atención', 'Todos los ítems deben tener precio unitario mayor a 0.', 'warning');
      return;
    }

    this.guardandoOCDirecta.set(true);
    try {
      const distribucion = this.generarDistribucionContableDirecta();
      const payload = {
        ...this.ocDirectaForm,
        idConsolidacion: null,
        esocdirecta: true,
        usuarioGenera: this.usuario?.documentoidentidad,
        nombreRegistra: this.usuario?.nombre,
        distribucionContable: distribucion
      };
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/crear-oc-borrador`, payload)
      );
      if (resp?.success) {
        this.cerrarModalOCDirecta();
        this.tabActiva.set(3);
        await this.cargarOrdenesCompra();

        if (enviarASpring) {
          const ocNueva = this.ordenesCompra().find(o => o.numeroOrden === resp.numeroOC);
          if (ocNueva) {
            await this.sincronizarOCConSpring(ocNueva);
          } else {
            this.alertService.showAlert('OC Creada', `Orden ${resp.numeroOC} creada. Sincronícela con SPRING desde la tabla.`, 'success');
          }
        } else {
          this.alertService.showAlert('OC Creada', `Orden de Compra ${resp.numeroOC} creada como borrador.`, 'success');
        }
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al crear OC Directa.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    } finally {
      this.guardandoOCDirecta.set(false);
    }
  }
}