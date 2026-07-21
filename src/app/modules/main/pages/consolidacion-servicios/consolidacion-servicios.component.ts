import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { HttpClient } from '@angular/common/http';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { environment } from '@/environments/environment';
import { OrdenPdfService } from '../consolidacion-compras/orden-pdf.service';
import { EmpresasService } from '../dashboard-logistica/services/empresas.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

@Component({
  selector: 'app-consolidacion-servicios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule, AutoCompleteModule],
  templateUrl: './consolidacion-servicios.component.html',
  styleUrls: ['./consolidacion-servicios.component.scss'],
})
export class ConsolidacionServiciosComponent implements OnInit {
  private baseUrl = environment.baseUrl;

  tabActiva = signal(0);
  cargandoReqs = signal(false);
  cargandoOSs = signal(false);
  guardandoOS = signal(false);
  guardandoConformidad = signal(false);
  guardandoConfirmacion = signal(false);
  subiendoAdjunto = signal(false);
  procesandoExcel = signal(false);
  generandoOSIndividuales = signal(false);
  progresoGeneracion = signal(0);
  totalGeneracion = signal(0);

  modalAdjuntosAbierto = signal(false);
  modalConformidadAbierto = signal(false);
  modalCargaMasivaAbierto = signal(false);
  modalConfirmacionAbierto = signal(false);

  requerimientos = signal<any[]>([]);
  itemsSeleccionados = signal<any[]>([]);
  ordenesServicio = signal<any[]>([]);
  adjuntos = signal<any[]>([]);
  osActual = signal<any>(null);
  datosExcel = signal<any[]>([]);
  columnasExcel = signal<string[]>([]);

  osPendientesConformidad = computed(() =>
    this.ordenesServicio().filter(os => os.estado === 'ENVIADA' && !os.tieneConformidad)
  );

  totalServicios = computed(() => this.requerimientos().length);
  serviciosPendientes = computed(() => this.requerimientos().filter(r => !r.tieneOS).length);
  serviciosConOSGenerada = computed(() => this.requerimientos().filter(r => !!r.tieneOS).length);
  totalMontoSeleccionado = computed(() =>
    this.itemsSeleccionados().reduce((sum, r) => sum + ((r.precioUnitario || r.precioReferencial || 0) * (r.cantidadPendiente || 1)), 0)
  );
  seleccionadosParaOS = signal<Set<number | string>>(new Set());
  itemsSeleccionadosParaOS = computed(() =>
    this.itemsSeleccionados().filter(r => this.seleccionadosParaOS().has(r.idDetalle))
  );
  totalMontoSeleccionadoParaOS = computed(() =>
    this.itemsSeleccionadosParaOS().reduce((sum, r) => sum + this.subtotalReq(r), 0)
  );

  busqueda = '';
  filtroEstadoOS = '';
  adjuntoDescripcion = '';
  archivoSeleccionado: File | null = null;

  proveedorInput = '';
  proveedorSeleccionado: any = null;
  proveedoresSugeridos: any[] = [];
  cargandoProveedores = signal(false);
  formasPago: any[] = [];
  tiposPago: any[] = [];

  osFormProveedor: any = {
    proveedor: '', rucProveedor: '', nombreProveedor: '', emailProveedor: '',
    contactoProveedor: '', telefonoProveedor: '',
    moneda: 'PEN', condicionesPago: '', formaPago: '',
    fechaInicioServicio: '', fechaFinServicio: '', plazoEjecucion: 30,
  };

  conformidadForm: any = {
    dniJefeArea: '', nombreJefeArea: '', cargoJefeArea: '',
    estado: 'CONFORME', observaciones: ''
  };

  confirmacionForm: any = {
    fechaEjecucion: '', trabajoEjecutado: '', observaciones: '',
    dniConfirma: '', nombreConfirma: '', estado: 'CONFIRMADO'
  };

  usuario: Usuario | null = null;
  empresas: any[] = [];

  constructor(
    private http: HttpClient,
    private dexieService: DexieService,
    private alertService: AlertService,
    private pdfService: OrdenPdfService,
    private empresasService: EmpresasService,
    private maestrasService: MaestrasService
  ) {}

  async ngOnInit() {
    this.usuario = (await this.dexieService.obtenerPrimerUsuario()) ?? null;
    await this.cargarEmpresas();
    await this.cargarRequerimientos();
    await this.cargarOrdenesServicio();
    Promise.all([this.cargarFormasPago(), this.cargarTiposPago()]);
  }

  async cargarFormasPago(): Promise<void> {
    try {
      const resp: any = await lastValueFrom(this.maestrasService.getFormasPago({ ruc: this.usuario?.ruc }));
      this.formasPago = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
    } catch { this.formasPago = []; }
  }

  async cargarTiposPago(): Promise<void> {
    try {
      const resp: any = await lastValueFrom(this.maestrasService.getTiposPago({ ruc: this.usuario?.ruc }));
      this.tiposPago = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
    } catch { this.tiposPago = []; }
  }

  async cargarEmpresas() {
    try {
      const empresasData = await this.empresasService.getEmpresas().toPromise();
      if (empresasData) {
        this.empresas = this.empresasService.filtrarEmpresasRequeridas(empresasData);
      }
    } catch {
      this.empresas = [];
    }
  }

  private readonly rucPorEmpresa: { [id: string]: string } = {
    '000010': '20563196387',
    '000008': '20481121966',
    '000006': '20610773274'
  };

  get rucEmpresa(): string {
    const idEmpresa = this.usuario?.idempresa;
    return this.empresas.find(e => e.id === idEmpresa)?.ruc || this.rucPorEmpresa[idEmpresa || ''] || '';
  }

  async cargarRequerimientos() {
    this.cargandoReqs.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-requerimientos-servicio-para-os`, {
          idEmpresa: this.usuario?.idempresa, ruc: this.rucEmpresa, busqueda: this.busqueda, soloSinOS: true
        })
      );
      const data = Array.isArray(resp) ? resp : [];
      data.forEach((r: any) => {
        if (!r.precioUnitario && r.precioReferencial > 0) {
          r.precioUnitario = r.precioReferencial;
        }
      });
      this.requerimientos.set(data);
    } catch { this.requerimientos.set([]); }
    finally { this.cargandoReqs.set(false); }
  }

  async cargarOrdenesServicio() {
    this.cargandoOSs.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-oss-por-estado`, {
          estado: this.filtroEstadoOS, usuario: this.usuario?.documentoidentidad
        })
      );
      this.ordenesServicio.set(Array.isArray(resp) ? resp : []);
    } catch { this.ordenesServicio.set([]); }
    finally { this.cargandoOSs.set(false); }
  }

  estaSeleccionado(id: number) { return this.itemsSeleccionados().some(i => i.idDetalle === id); }
  toggleSeleccion(req: any) {
    const actual = this.itemsSeleccionados();
    this.itemsSeleccionados.set(this.estaSeleccionado(req.idDetalle)
      ? actual.filter(i => i.idDetalle !== req.idDetalle)
      : [...actual, req]);
  }
  seleccionarTodos(event: Event) {
    this.itemsSeleccionados.set((event.target as HTMLInputElement).checked ? [...this.requerimientos()] : []);
  }
  limpiarSeleccion() { this.itemsSeleccionados.set([]); }

  irAConsolidar() {
    const seleccionados = this.itemsSeleccionados();
    if (seleccionados.length === 0) {
      this.alertService.showAlert('Atención', 'Seleccione al menos un requerimiento.', 'warning');
      return;
    }
    const sinPrecio = seleccionados.filter(r => !r.precioUnitario || r.precioUnitario <= 0);
    if (sinPrecio.length > 0) {
      this.alertService.showAlert('Atención',
        `${sinPrecio.length} requerimiento(s) no tienen precio. Asigne un precio unitario antes de continuar.`, 'warning');
      return;
    }
    if (seleccionados[0]?.dniJefeArea) {
      this.osFormProveedor.dniJefeArea = seleccionados[0].dniJefeArea;
      this.osFormProveedor.nombreJefeArea = seleccionados[0].nombreJefeArea;
    }
    this.seleccionadosParaOS.set(new Set(seleccionados.map(r => r.idDetalle)));
    this.tabActiva.set(1);
  }

  estaSeleccionadoParaOS(idDetalle: number | string) {
    return this.seleccionadosParaOS().has(idDetalle);
  }

  toggleSeleccionParaOS(req: any) {
    const set = new Set(this.seleccionadosParaOS());
    if (set.has(req.idDetalle)) set.delete(req.idDetalle);
    else set.add(req.idDetalle);
    this.seleccionadosParaOS.set(set);
  }

  seleccionarTodosParaOS(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.seleccionadosParaOS.set(checked ? new Set(this.itemsSeleccionados().map(r => r.idDetalle)) : new Set());
  }

  subtotalReq(req: any): number {
    return Math.round((req.cantidadPendiente || 1) * (req.precioUnitario || 0) * 100) / 100;
  }

  async filtrarProveedores(event: any): Promise<void> {
    const query = String(event.query ?? '').trim();
    if (!query || query.length < 3) {
      this.proveedoresSugeridos = [];
      return;
    }
    this.cargandoProveedores.set(true);
    try {
      const body = { ruc: this.rucEmpresa, busqueda: query, estado: 'ACTIVO' };
      const resp: any = await lastValueFrom(this.maestrasService.getProveedores(body));
      let lista = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
      const queryLower = query.toLowerCase();
      lista = lista.filter((p: any) => {
        const nombre = String(p.proveedor ?? p.nombre ?? p.razonSocial ?? '').toLowerCase();
        const ruc = String(p.ruc ?? p.rucproveedor ?? p.documento ?? '').toLowerCase();
        return nombre.includes(queryLower) || ruc.includes(queryLower);
      });
      this.proveedoresSugeridos = lista.map((p: any) => ({
        id: String(p.idproveedor ?? p.id ?? p.ruc ?? p.documento ?? ''),
        nombre: String(p.proveedor ?? p.nombre ?? p.razonSocial ?? ''),
        ruc: String(p.ruc ?? p.rucproveedor ?? p.documento ?? ''),
        email: String(p.email ?? p.correo ?? p.Email ?? p.Correo ?? '').trim(),
        telefono: String(p.telefono ?? p.Telefono ?? '').trim(),
        monedaPago: String(p.MonedaPago ?? p.monedaPago ?? '').toUpperCase(),
        tipoPago: String(p.TipoPago ?? p.tipoPago ?? '').toUpperCase(),
        formaPago: String(p.FormadePago ?? p.formadePago ?? p.formaPago ?? ''),
        diasEntrega: parseInt(p.NumeroDiasEntrega ?? p.numeroDiasEntrega ?? p.DiasEntrega ?? p.diasEntrega ?? '30', 10) || 30
      }));
    } catch (err) {
      this.proveedoresSugeridos = [];
    } finally {
      this.cargandoProveedores.set(false);
    }
  }

  seleccionarProveedor(event: any): void {
    const prov = event?.value ?? event;
    this.proveedorSeleccionado = prov;
    if (!prov) return;

    this.osFormProveedor.proveedor = prov.id;
    this.osFormProveedor.rucProveedor = prov.ruc;
    this.osFormProveedor.nombreProveedor = prov.nombre;
    this.osFormProveedor.emailProveedor = prov.email || '';
    this.osFormProveedor.telefonoProveedor = prov.telefono || '';
    this.osFormProveedor.moneda = prov.monedaPago === 'EX' ? 'USD' : 'PEN';
    this.osFormProveedor.condicionesPago = this.mapearAFormaPago(prov.formaPago) || this.mapearAFormaPago(prov.tipoPago) || this.formasPago[0]?.idformapago || 'Contado';
    this.osFormProveedor.formaPago = this.mapearATipoPago(prov.tipoPago) || this.mapearATipoPago(prov.formaPago) || this.tiposPago[0]?.TipoPago || 'Transferencia';
    this.osFormProveedor.plazoEjecucion = prov.diasEntrega ?? 30;
    this.proveedorInput = prov.nombre;
  }

  limpiarProveedor(): void {
    this.proveedorSeleccionado = null;
    this.proveedorInput = '';
    this.osFormProveedor.proveedor = '';
    this.osFormProveedor.rucProveedor = '';
    this.osFormProveedor.nombreProveedor = '';
    this.osFormProveedor.emailProveedor = '';
    this.osFormProveedor.telefonoProveedor = '';
    this.osFormProveedor.moneda = 'PEN';
    this.osFormProveedor.condicionesPago = '';
    this.osFormProveedor.formaPago = '';
    this.osFormProveedor.plazoEjecucion = 30;
  }

  private normalizarTexto(texto: string): string {
    return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  private mapearAFormaPago(valor: string): string {
    if (!valor || !this.formasPago.length) return valor;
    const v = this.normalizarTexto(valor);
    const match = this.formasPago.find(fp =>
      this.normalizarTexto(fp.formapago) === v ||
      this.normalizarTexto(fp.idformapago) === v
    );
    return match?.idformapago || valor;
  }

  private mapearATipoPago(valor: string): string {
    if (!valor || !this.tiposPago.length) return valor;
    const v = this.normalizarTexto(valor);
    const match = this.tiposPago.find(tp =>
      this.normalizarTexto(tp.Descripcion) === v ||
      this.normalizarTexto(tp.TipoPago) === v
    );
    return match?.TipoPago || valor;
  }

  condicionPagoExiste(valor: string): boolean {
    return this.formasPago.some(fp => fp.idformapago === valor);
  }

  formaPagoExiste(valor: string): boolean {
    return this.tiposPago.some(tp => tp.TipoPago === valor);
  }

  get montoTotalSeleccion(): number {
    return this.itemsSeleccionadosParaOS().reduce((s, r) => s + this.subtotalReq(r), 0);
  }

  async generarOSIndividuales() {
    if (!this.osFormProveedor.nombreProveedor || !this.osFormProveedor.rucProveedor) {
      this.alertService.showAlert('Atención', 'Complete RUC y nombre del proveedor.', 'warning'); return;
    }
    const seleccionados = this.itemsSeleccionadosParaOS();
    if (seleccionados.length === 0) {
      this.alertService.showAlert('Atención', 'Seleccione al menos un requerimiento para generar OS.', 'warning'); return;
    }
    const sinPrecio = seleccionados.filter(r => !r.precioUnitario || r.precioUnitario <= 0);
    if (sinPrecio.length > 0) {
      this.alertService.showAlert('Atención', `${sinPrecio.length} requerimiento(s) sin precio unitario.`, 'warning'); return;
    }

    const ok = await this.alertService.showConfirm('Generar OS Individuales',
      `Se crearán ${seleccionados.length} Orden(es) de Servicio individuales. ¿Confirma?`, 'question');
    if (!ok) return;

    this.generandoOSIndividuales.set(true);
    this.progresoGeneracion.set(0);
    this.totalGeneracion.set(seleccionados.length);
    const resultados: { req: any; success: boolean; numeroOS?: string; mensaje?: string }[] = [];

    for (let i = 0; i < seleccionados.length; i++) {
      const req = seleccionados[i];
      this.progresoGeneracion.set(i + 1);
      try {
        const payload = {
          idRequerimiento: req.idRequerimiento,
          idDetalleRequerimiento: req.idDetalle,
          proveedor: this.osFormProveedor.rucProveedor,
          nombreProveedor: this.osFormProveedor.nombreProveedor,
          rucProveedor: this.osFormProveedor.rucProveedor,
          emailProveedor: this.osFormProveedor.emailProveedor,
          telefonoProveedor: this.osFormProveedor.telefonoProveedor,
          tipoServicio: 'Servicio',
          descripcion: req.descripcion,
          alcance: req.observaciones || '',
          cantidad: req.cantidadPendiente || 1,
          precioUnitario: req.precioUnitario,
          unidadMedida: req.unidadMedida || 'SVC',
          moneda: this.osFormProveedor.moneda,
          condicionesPago: this.osFormProveedor.condicionesPago,
          formaPago: this.osFormProveedor.formaPago,
          fechaInicioServicio: this.osFormProveedor.fechaInicioServicio || null,
          fechaFinServicio: this.osFormProveedor.fechaFinServicio || null,
          plazoEjecucion: this.osFormProveedor.plazoEjecucion || 30,
          centroCosto: req.ceco,
          proyecto: req.proyecto,
          areaSolicita: req.area,
          idArea: req.idarea,
          dniJefeArea: req.dniJefeArea || '',
          nombreJefeArea: req.nombreJefeArea || '',
          usuarioGenera: this.usuario?.documentoidentidad,
          rucEmpresa: this.rucEmpresa
        };
        const resp: any = await lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/crear-os-individual`, payload)
        );
        resultados.push({ req, success: !!resp?.success, numeroOS: resp?.numeroOS, mensaje: resp?.mensaje });
      } catch (e: any) {
        resultados.push({ req, success: false, mensaje: e?.message || 'Error inesperado' });
      }
    }

    this.generandoOSIndividuales.set(false);
    const exitosos = resultados.filter(r => r.success);
    const fallidos = resultados.filter(r => !r.success);

    if (fallidos.length === 0) {
      this.alertService.showAlert('OS Generadas',
        `${exitosos.length} OS individual(es) creada(s) exitosamente:\n${exitosos.map(r => r.numeroOS).join(', ')}`, 'success');
    } else {
      this.alertService.showAlert('Resultado parcial',
        `${exitosos.length} exitosas, ${fallidos.length} fallidas.\nFallidas: ${fallidos.map(r => r.req.descripcion + ': ' + r.mensaje).join('\n')}`,
        exitosos.length > 0 ? 'warning' : 'error');
    }

    this.limpiarSeleccion();
    this.tabActiva.set(2);
    await this.cargarRequerimientos();
    await this.cargarOrdenesServicio();
  }

  // Método para compatibilidad con flujo consolidado existente (crear-os-borrador)
  async crearOSBorrador() {
    await this.generarOSIndividuales();
  }

  async enviarOSAprobacion(os: any) {
    const ok = await this.alertService.showConfirm('Enviar a Aprobación',
      `¿Confirma enviar la OS ${os.numeroOrden} a aprobación?`, 'question');
    if (!ok) return;
    try {
      this.alertService.mostrarModalCarga();
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/enviar-os-aprobacion`, {
          idOS: os.idOS, usuarioGenera: this.usuario?.documentoidentidad
        })
      );
      this.alertService.cerrarModalCarga();
      if (resp?.success) {
        this.alertService.showAlert('Éxito', 'OS enviada a aprobación.', 'success');
        await this.cargarOrdenesServicio();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error.', 'error');
      }
    } catch (e: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', e?.message || 'Error.', 'error');
    }
  }

  exportarExcelOS(): void {
    const data = this.ordenesServicio();
    if (!data.length) return;
    const fecha = new Date().toISOString().slice(0, 10);
    const rows = data.map((os, i) => ({
      '#': i + 1,
      'N° Orden': os.numeroOrden || '',
      'Proveedor': os.nombreProveedor || '',
      'RUC Proveedor': os.rucProveedor || '',
      'Tipo Servicio': os.tipoServicio || '',
      'Descripción': os.descripcion || '',
      'Moneda': os.moneda || '',
      'Monto Total': os.montoTotal ?? '',
      'Estado': os.estado || '',
      'F. Inicio': os.fechaInicioServicio || '',
      'F. Fin': os.fechaFinServicio || '',
      'F. Registro': os.fechaRegistro || '',
      'Correo Enviado': os.correoEnviado ? 'Sí' : 'No',
      'Conforme': os.tieneConformidad ? 'Sí' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 4 }, { wch: 18 }, { wch: 30 }, { wch: 14 },
      { wch: 18 }, { wch: 30 }, { wch: 8 }, { wch: 14 },
      { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Órdenes de Servicio');
    const buffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `ordenes_servicio_${fecha}.xlsx`);
  }

  async verPdfOS(os: any) {
    try {
      const empresa: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/obtener-config-empresa`, {})
      );
      const html = this.pdfService.buildOSHtml(os, empresa);
      this.pdfService.imprimirOrdenHtml(html, os.numeroOrden);
    } catch {
      this.alertService.showAlert('Aviso', 'No se pudo cargar la configuración de empresa para el PDF.', 'warning');
    }
  }

  async confirmarEnvioOS(os: any) {
    const ok = await this.alertService.showConfirm('Enviar al Proveedor',
      `¿Confirma enviar la OS ${os.numeroOrden} al correo ${os.emailProveedor}?`, 'question');
    if (!ok) return;
    try {
      this.alertService.mostrarModalCarga();
      const resp: any = await this.pdfService.enviarOrdenAlProveedor('OS', os.idOS);
      this.alertService.cerrarModalCarga();
      if (resp?.success) {
        this.alertService.showAlert('Enviado', resp.mensaje || 'OS enviada al proveedor correctamente.', 'success');
        await this.cargarOrdenesServicio();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al enviar.', 'error');
      }
    } catch (e: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    }
  }

  async abrirAdjuntos(os: any) {
    this.osActual.set(os);
    await this.cargarAdjuntos(os.idOS, 'OS');
    this.modalAdjuntosAbierto.set(true);
  }
  cerrarModalAdjuntos() { this.modalAdjuntosAbierto.set(false); this.cargarOrdenesServicio(); }

  async cargarAdjuntos(idOrden: number, tipo: string) {
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-adjuntos-oc`, { idOrden, tipoOrden: tipo })
      );
      this.adjuntos.set(Array.isArray(resp) ? resp : []);
    } catch { this.adjuntos.set([]); }
  }

  rutaLocalArchivo: string | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] || null;
    this.rutaLocalArchivo = input.value || null;
  }

  async subirAdjunto() {
    if (!this.archivoSeleccionado) return;
    this.subiendoAdjunto.set(true);
    try {
      const b64 = await this.fileToBase64(this.archivoSeleccionado);
      const numeroOrdenSpring = this.osActual()?.numeroOrdenSpring;
      const companiaSocio = this.osActual()?.companiaSocioSpring;
      const rutaServidor = `\\\\172.16.20.24\\SpringGestionDoc\\TEMPORAL\\WH\\${this.archivoSeleccionado.name}`;
      const payload: any = {
        idOrden: this.osActual()?.idOS, tipoOrden: 'OS',
        nombreArchivo: this.archivoSeleccionado.name,
        tipoArchivo: this.archivoSeleccionado.type,
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
        await this.cargarAdjuntos(this.osActual()?.idOS, 'OS');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error.', 'error');
    } finally { this.subiendoAdjunto.set(false); }
  }

  abrirConformidad(os: any) {
    this.osActual.set(os);
    this.conformidadForm = {
      dniJefeArea: os.dniJefeArea || '', nombreJefeArea: os.nombreJefeArea || '',
      cargoJefeArea: '', estado: 'CONFORME', observaciones: ''
    };
    this.modalConformidadAbierto.set(true);
  }
  cerrarModalConformidad() { this.modalConformidadAbierto.set(false); }

  async registrarConformidad() {
    if (!this.conformidadForm.dniJefeArea || !this.conformidadForm.nombreJefeArea) {
      this.alertService.showAlert('Atención', 'Complete los datos del jefe de área.', 'warning'); return;
    }
    this.guardandoConformidad.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/registrar-conformidad-os`, {
          idOrdenServicio: this.osActual()?.idOS,
          ...this.conformidadForm,
          usuarioCrea: this.usuario?.documentoidentidad
        })
      );
      if (resp?.success) {
        this.alertService.showAlert('Éxito', 'Conformidad registrada correctamente.', 'success');
        this.cerrarModalConformidad();
        await this.cargarOrdenesServicio();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error.', 'error');
    } finally { this.guardandoConformidad.set(false); }
  }

  abrirCargaMasiva() { this.datosExcel.set([]); this.columnasExcel.set([]); this.modalCargaMasivaAbierto.set(true); }
  cerrarCargaMasiva() { this.modalCargaMasivaAbierto.set(false); }

  onExcelSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (rows.length === 0) {
        this.alertService.showAlert('Aviso', 'El archivo Excel está vacío o no tiene datos.', 'warning');
        return;
      }
      this.columnasExcel.set(Object.keys(rows[0]));
      this.datosExcel.set(rows);
    };
    reader.readAsArrayBuffer(file);
  }

  async procesarCargaMasiva() {
    this.procesandoExcel.set(true);
    try {
      this.alertService.showAlert('Info', 'Funcionalidad de carga masiva Excel lista para integrar con SheetJS.', 'info');
      this.cerrarCargaMasiva();
    } finally { this.procesandoExcel.set(false); }
  }

  descargarPlantilla(event: Event) {
    event.preventDefault();
    const columnas = [
      'proveedor', 'ruc', 'emailProveedor', 'contactoProveedor', 'telefonoProveedor',
      'tipoServicio', 'descripcionServicio', 'alcance',
      'fechaInicio', 'fechaFin', 'plazoEjecucion',
      'ubicacionServicio', 'moneda', 'precioUnitario',
      'condicionesPago', 'formaPago', 'ceco', 'proyecto',
      'dniJefeArea', 'nombreJefeArea', 'observaciones'
    ];
    const ejemplo: Record<string, any> = {
      proveedor: 'Empresa SAC',
      ruc: '20123456789',
      emailProveedor: 'contacto@empresa.com',
      contactoProveedor: 'Juan Pérez',
      telefonoProveedor: '999888777',
      tipoServicio: 'Mantenimiento',
      descripcionServicio: 'Mantenimiento de equipos de cómputo',
      alcance: 'Revisión y limpieza de equipos',
      fechaInicio: '2025-06-01',
      fechaFin: '2025-06-30',
      plazoEjecucion: 30,
      ubicacionServicio: 'Oficina Principal',
      moneda: 'PEN',
      precioUnitario: 5000,
      condicionesPago: 'Contado',
      formaPago: 'Transferencia',
      ceco: 'CC-001',
      proyecto: '',
      dniJefeArea: '12345678',
      nombreJefeArea: 'María García',
      observaciones: ''
    };
    const ws = XLSX.utils.json_to_sheet([ejemplo], { header: columnas });
    ws['!cols'] = columnas.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    const buffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      'plantilla_regularizacion_os.xlsx'
    );
  }

  // =====================================================================
  // CONFIRMACIÓN DE SERVICIO REALIZADO
  // =====================================================================

  abrirConfirmacionServicio(os: any) {
    this.osActual.set(os);
    this.confirmacionForm = {
      fechaEjecucion: new Date().toISOString().slice(0, 10),
      trabajoEjecutado: '',
      observaciones: '',
      dniConfirma: this.usuario?.documentoidentidad || '',
      nombreConfirma: this.usuario?.nombre || '',
      estado: 'CONFIRMADO'
    };
    this.modalConfirmacionAbierto.set(true);
  }
  cerrarConfirmacionServicio() { this.modalConfirmacionAbierto.set(false); }

  async registrarConfirmacionServicio() {
    if (!this.confirmacionForm.trabajoEjecutado) {
      this.alertService.showAlert('Atención', 'Describa el trabajo ejecutado por el proveedor.', 'warning'); return;
    }
    if (!this.confirmacionForm.dniConfirma) {
      this.alertService.showAlert('Atención', 'Indique quién confirma la ejecución del servicio.', 'warning'); return;
    }

    const ok = await this.alertService.showConfirm(
      this.confirmacionForm.estado === 'CONFIRMADO' ? 'Confirmar Servicio Ejecutado' : 'Registrar Observaciones',
      this.confirmacionForm.estado === 'CONFIRMADO'
        ? `Al confirmar, se habilitará el pago de la OS ${this.osActual()?.numeroOrden}. ¿Desea continuar?`
        : `Se registrarán observaciones para la OS ${this.osActual()?.numeroOrden}. ¿Desea continuar?`,
      'question'
    );
    if (!ok) return;

    this.guardandoConfirmacion.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/registrar-confirmacion-servicio`, {
          idOrdenServicio: this.osActual()?.id || this.osActual()?.idOS,
          ...this.confirmacionForm,
          usuario: this.usuario?.documentoidentidad
        })
      );
      if (resp?.success) {
        this.alertService.showAlert('Confirmación Registrada',
          this.confirmacionForm.estado === 'CONFIRMADO'
            ? 'Servicio confirmado. Se habilitó el proceso de pago.'
            : 'Observaciones registradas correctamente.',
          'success');
        this.cerrarConfirmacionServicio();
        await this.cargarOrdenesServicio();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al registrar confirmación.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    } finally { this.guardandoConfirmacion.set(false); }
  }

  badgeEstadoOS(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE': 'bg-warning text-dark',
      'PENDIENTE_APROBACION': 'bg-info text-white',
      'APROBADA': 'bg-success',
      'ENVIADA': 'bg-primary',
      'CONFORME': 'bg-success',
      'NO_CONFORME': 'bg-danger',
      'CON_OBSERVACIONES': 'bg-warning text-dark'
    };
    return map[estado] || 'bg-secondary';
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res((reader.result as string).split(',')[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }
}