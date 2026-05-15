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
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

@Component({
  selector: 'app-consolidacion-compras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule],
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
    for (const item of this.itemsSeleccionados()) {
      if (!mapa.has(item.codigo)) {
        mapa.set(item.codigo, {
          codigo: item.codigo,
          descripcion: item.descripcion,
          unidadMedida: item.unidadMedida,
          cantidadTotal: 0,
          items: []
        });
      }
      const grupo = mapa.get(item.codigo)!;
      grupo.cantidadTotal += item.cantidadPendiente;
      grupo.items.push(item);
    }
    return Array.from(mapa.values());
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
    private maestrasService: MaestrasService
  ) {}

  async ngOnInit() {
    this.usuario = (await this.dexieService.obtenerPrimerUsuario()) ?? null;
    await this.cargarRequerimientos();
    await this.cargarRequerimientosCompletos();
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
  }

  seleccionarTodos(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.itemsSeleccionados.set(checked ? [...this.requerimientos()] : []);
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
      precioUnitario: 0,
      descuento: 0,
      ceco: g.items[0]?.ceco || '',
      proyecto: g.items[0]?.proyecto || '',
      idDetalle: g.items[0]?.idDetalle,
      idConsolidacion: g.items[0]?.IdConsolidacion
    }));
    this.ocForm = {
      ...this.ocForm,
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
        this.alertService.showAlert('OC Creada', `Orden de Compra ${resp.numeroOC} creada en borrador.`, 'success');
        this.cerrarModalOC();
        this.limpiarSeleccion();
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

  async enviarOCAprobacion(oc: any) {
    const ok = await this.alertService.showConfirm('Enviar a Aprobación',
      `¿Confirma enviar la OC ${oc.numeroOrden} a aprobación? Monto: ${oc.moneda} ${oc.totalOrden}`, 'question');
    if (!ok) return;
    try {
      this.alertService.mostrarModalCarga();
      console.log('OC completa:', oc);
      // Intentar obtener idConsolidacion de la OC o de sus items
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
      if (resp?.success) {
        this.alertService.showAlert('Éxito', 'OC enviada a aprobación correctamente.', 'success');
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
        this.alertService.showAlert('Enviado', resp.mensaje || 'OC enviada al proveedor correctamente.', 'success');
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
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-adjuntos-oc`, { idOrden, tipoOrden: tipo })
      );
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
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-adjunto-oc`, {
          idOrden: this.ordenActual()?.idOrden,
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
    const tienePdf = adjuntos.some(a => a.tipoArchivo === 'PDF' || a.tipoArchivo === 'application/pdf');
    const tieneExcel = adjuntos.some(a => a.tipoArchivo === 'EXCEL' || a.tipoArchivo?.toLowerCase().includes('excel') || a.tipoArchivo?.toLowerCase().includes('spreadsheet'));
    console.log('Tiene PDF:', tienePdf, 'Tiene Excel:', tieneExcel);
    return tienePdf && tieneExcel;
  }

  async tienePdfYExcelParaOC(oc: any): Promise<boolean> {
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-adjuntos-oc`, { idOrden: oc.idOrden, tipoOrden: 'OC' })
      );
      const adjuntos = Array.isArray(resp) ? resp : [];
      console.log('Adjuntos de OC', oc.idOrden, ':', adjuntos);
      const tienePdf = adjuntos.some((a: any) => a.tipoArchivo === 'PDF' || a.tipoArchivo === 'application/pdf');
      const tieneExcel = adjuntos.some((a: any) => a.tipoArchivo === 'EXCEL' || a.tipoArchivo?.toLowerCase().includes('excel') || a.tipoArchivo?.toLowerCase().includes('spreadsheet'));
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
      const proveedores = Array.isArray(resp) ? resp : [];
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