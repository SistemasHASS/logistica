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
import { OrdenPdfService } from '../consolidacion-compras/orden-pdf.service';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

@Component({
  selector: 'app-consolidacion-servicios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule],
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
  subiendoAdjunto = signal(false);
  procesandoExcel = signal(false);

  modalAdjuntosAbierto = signal(false);
  modalConformidadAbierto = signal(false);
  modalCargaMasivaAbierto = signal(false);

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
  serviciosPendientes = computed(() => this.requerimientos().filter(r => !r.codigoConsolidacion).length);
  serviciosConsolidados = computed(() => this.requerimientos().filter(r => !!r.codigoConsolidacion).length);

  busqueda = '';
  filtroEstadoOS = '';
  adjuntoDescripcion = '';
  archivoSeleccionado: File | null = null;

  osForm: any = {
    rucProveedor: '', nombreProveedor: '', emailProveedor: '',
    contactoProveedor: '', telefonoProveedor: '',
    tipoServicio: 'Servicio', descripcion: '', alcance: '',
    fechaInicioServicio: '', fechaFinServicio: '', plazoEjecucion: 30,
    ubicacionServicio: '', moneda: 'PEN',
    condicionesPago: 'Contado', formaPago: 'Transferencia',
    centroCosto: '', proyecto: '', observaciones: '',
    dniJefeArea: '', nombreJefeArea: '',
    items: [{ descripcionServicio: '', especificaciones: '', unidadMedida: 'SVC', cantidad: 1, precioUnitario: 0 }],
    montoTotal: 0
  };

  conformidadForm: any = {
    dniJefeArea: '', nombreJefeArea: '', cargoJefeArea: '',
    estado: 'CONFORME', observaciones: ''
  };

  usuario: Usuario | null = null;

  constructor(
    private http: HttpClient,
    private dexieService: DexieService,
    private alertService: AlertService,
    private pdfService: OrdenPdfService
  ) {}

  async ngOnInit() {
    this.usuario = (await this.dexieService.obtenerPrimerUsuario()) ?? null;
    await this.cargarRequerimientos();
    await this.cargarOrdenesServicio();
  }

  async cargarRequerimientos() {
    this.cargandoReqs.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-requerimientos-para-os`, {
          ruc: this.usuario?.ruc, busqueda: this.busqueda
        })
      );
      this.requerimientos.set(Array.isArray(resp) ? resp : []);
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
    this.osForm.items = this.itemsSeleccionados().map(r => ({
      descripcionServicio: r.descripcion,
      especificaciones: '',
      unidadMedida: r.unidadMedida || 'SVC',
      cantidad: r.cantidadPendiente,
      precioUnitario: 0,
      idDetalle: r.idDetalle
    }));
    this.osForm.idConsolidacion = this.itemsSeleccionados()[0]?.IdConsolidacion;
    this.tabActiva.set(1);
  }

  subtotalItemOS(item: any): number {
    return Math.round(item.cantidad * item.precioUnitario * 100) / 100;
  }
  calcularTotalesOS() {
    this.osForm.montoTotal = this.osForm.items.reduce((s: number, i: any) => s + this.subtotalItemOS(i), 0);
  }
  agregarItemOS() {
    this.osForm.items.push({ descripcionServicio: '', especificaciones: '', unidadMedida: 'SVC', cantidad: 1, precioUnitario: 0 });
  }
  eliminarItemOS(i: number) { this.osForm.items.splice(i, 1); this.calcularTotalesOS(); }

  async crearOSBorrador() {
    if (!this.osForm.nombreProveedor || !this.osForm.rucProveedor) {
      this.alertService.showAlert('Atención', 'Complete RUC y nombre del proveedor.', 'warning'); return;
    }
    if (!this.osForm.dniJefeArea || !this.osForm.nombreJefeArea) {
      this.alertService.showAlert('Atención', 'Indique el jefe de área responsable de la conformidad.', 'warning'); return;
    }
    if (this.osForm.items.some((i: any) => !i.precioUnitario || i.precioUnitario <= 0)) {
      this.alertService.showAlert('Atención', 'Todos los ítems deben tener precio unitario.', 'warning'); return;
    }
    this.guardandoOS.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/crear-os-borrador`, {
          ...this.osForm, usuarioGenera: this.usuario?.documentoidentidad
        })
      );
      if (resp?.success) {
        this.alertService.showAlert('OS Creada', `Orden de Servicio ${resp.numeroOS} creada en borrador.`, 'success');
        this.limpiarSeleccion();
        this.tabActiva.set(2);
        await this.cargarOrdenesServicio();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al crear OS.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error.', 'error');
    } finally { this.guardandoOS.set(false); }
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

  onFileSelected(event: Event) {
    this.archivoSeleccionado = (event.target as HTMLInputElement).files?.[0] || null;
  }

  async subirAdjunto() {
    if (!this.archivoSeleccionado) return;
    this.subiendoAdjunto.set(true);
    try {
      const b64 = await this.fileToBase64(this.archivoSeleccionado);
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-adjunto-oc`, {
          idOrden: this.osActual()?.idOS, tipoOrden: 'OS',
          nombreArchivo: this.archivoSeleccionado.name,
          tipoArchivo: this.archivoSeleccionado.type,
          tamano: this.archivoSeleccionado.size,
          contenidoB64: b64,
          descripcion: this.adjuntoDescripcion,
          usuarioSube: this.usuario?.documentoidentidad
        })
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

  badgeEstadoOS(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE': 'bg-warning text-dark',
      'PENDIENTE_APROBACION': 'bg-info text-white',
      'APROBADA': 'bg-success',
      'ENVIADA': 'bg-primary',
      'CONFORME': 'bg-success',
      'NO_CONFORME': 'bg-danger'
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