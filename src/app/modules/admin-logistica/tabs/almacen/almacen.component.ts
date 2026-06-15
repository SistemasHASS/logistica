import { Component, signal, ChangeDetectionStrategy, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlmacenPlantillaService } from './almacen-plantilla.service';

export interface PlantillaAlmacen {
  tipoDocumento: 'NI' | 'NS';
  tituloDocumento: string;
  mostrarUbicacionFisica: boolean;
  mostrarCodInterno: boolean;
  mostrarStockActual: boolean;
  mostrarCCostos: boolean;
  mostrarCantidadPendiente: boolean;
  mostrarCantidadCompra: boolean;
  firmante1: string;
  firmante2: string;
  piePagina: string;
  /** Firma predeterminada del almacenero (ALLOGIST) en base64 */
  firmaAlmacenBase64?: string;
  /** Nombre completo del almacenero */
  nombreAlmacenero?: string;
  /** DNI/documento del almacenero */
  dniAlmacenero?: string;
  /** Identificador de empresa (multiempresa) */
  ruc?: string;
  /** Razón social de la empresa */
  razonSocial?: string;
  /** Logo de la empresa en base64 para el PDF */
  logoEmpresaBase64?: string;
}

const LS_KEY_NI = 'plantilla_almacen_ni';
const LS_KEY_NS = 'plantilla_almacen_ns';

const DEFAULT_NI: PlantillaAlmacen = {
  tipoDocumento: 'NI',
  tituloDocumento: 'Nota de Ingreso',
  mostrarUbicacionFisica: true,
  mostrarCodInterno: true,
  mostrarStockActual: true,
  mostrarCCostos: false,
  mostrarCantidadPendiente: true,
  mostrarCantidadCompra: true,
  firmante1: 'ALMACEN',
  firmante2: 'AUTORIZA',
  piePagina: '',
  firmaAlmacenBase64: '',
  nombreAlmacenero: '',
  dniAlmacenero: '',
  ruc: '',
  razonSocial: '',
  logoEmpresaBase64: '',
};

const DEFAULT_NS: PlantillaAlmacen = {
  tipoDocumento: 'NS',
  tituloDocumento: 'Nota de Salida',
  mostrarUbicacionFisica: true,
  mostrarCodInterno: true,
  mostrarStockActual: true,
  mostrarCCostos: true,
  mostrarCantidadPendiente: true,
  mostrarCantidadCompra: false,
  firmante1: 'ALMACEN',
  firmante2: 'RECIBI CONFORME',
  piePagina: '',
  firmaAlmacenBase64: '',
  nombreAlmacenero: '',
  dniAlmacenero: '',
  ruc: '',
  razonSocial: '',
  logoEmpresaBase64: '',
};

function loadPlantilla(key: string, def: PlantillaAlmacen): PlantillaAlmacen {
  const raw = localStorage.getItem(key);
  return raw ? { ...def, ...JSON.parse(raw) } : { ...def };
}

@Component({
  selector: 'app-almacen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './almacen.component.html',
  styleUrl: './almacen.component.scss',
})
export class AlmacenComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasFirmaAlmacen') canvasFirmaRef!: ElementRef<HTMLCanvasElement>;

  private plantillaSvc = inject(AlmacenPlantillaService);
  private http         = inject(HttpClient);
  private dexie        = inject(DexieService);
  private baseUrl      = environment.baseUrl;

  listaEmpresas   = signal<any[]>([]);
  empresaActiva   = signal<any>(null);
  empresaRuc      = signal('');
  empresaNombre   = signal('');
  empresaLogo     = signal('');

  listaAlmaceneros  = signal<any[]>([]);
  buscandoAlmacenero = signal(false);
  almaceneroError   = signal('');

  tabActivo = signal<'ni' | 'ns'>('ni');
  cargando  = signal(true);

  cfgNI = signal<PlantillaAlmacen>(loadPlantilla(LS_KEY_NI, DEFAULT_NI));
  cfgNS = signal<PlantillaAlmacen>(loadPlantilla(LS_KEY_NS, DEFAULT_NS));

  alertMsg  = signal('');
  alertTipo = signal<'success' | 'danger'>('success');

  // ── Canvas firma almacenero ──────────────────────────────────────
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private dibujando = false;
  private lastX = 0;
  private lastY = 0;
  firmaAlmacenVacia    = signal(true);
  firmaPreviewBase64    = signal('');  // se actualiza en tiempo real al dibujar

  ngOnInit(): void {
    this.cargarEmpresaYPlantillas();
  }

  private async cargarEmpresaYPlantillas(): Promise<void> {
    // 1. Listar todas las empresas
    try {
      const usuario = await this.dexie.showUsuario();
      const rucUsuario = usuario?.ruc ?? '';
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-empresas`, {})
      );
      const arr: any[] = Array.isArray(res) ? res : [];
      this.listaEmpresas.set(arr);
      // Preseleccionar empresa del usuario logueado, sino la primera activa
      const emp = arr.find(e => e.ruc === rucUsuario && e.activo)
               ?? arr.find(e => e.activo)
               ?? arr[0];
      if (emp) this.setEmpresaActiva(emp);
    } catch { this.cargando.set(false); }
  }

  setEmpresaActiva(emp: any): void {
    this.empresaActiva.set(emp);
    this.empresaRuc.set(emp.ruc ?? '');
    this.empresaNombre.set(emp.razonSocial ?? '');
    this.empresaLogo.set(emp.logoBase64 ?? '');
    this.listaAlmaceneros.set([]);
    this.almaceneroError.set('');
    this.cargarPlantillasPorEmpresa(emp.ruc ?? '');
    this.buscarAlmaceneroPorRuc(emp.ruc ?? '');
  }

  buscarAlmaceneroPorRuc(ruc: string): void {
    if (!ruc) return;
    this.buscandoAlmacenero.set(true);
    this.almaceneroError.set('');
    this.http.get<any[]>(
      `${this.baseUrl}/api/logistica/admin-logistica/almacenero-por-ruc?ruc=${encodeURIComponent(ruc)}`
    ).subscribe({
      next: lista => {
        this.listaAlmaceneros.set(lista);
        if (lista.length === 0)
          this.almaceneroError.set('No se encontró almacenero (ALLOGIST) para este RUC');
        this.buscandoAlmacenero.set(false);
      },
      error: () => {
        this.almaceneroError.set('Error al consultar almaceneros');
        this.buscandoAlmacenero.set(false);
      }
    });
  }

  seleccionarAlmacenero(alm: any): void {
    const nombre = alm.nombre       ?? '';
    const dni    = alm.nrodocumento ?? '';
    this.cfgNI.update(c => ({ ...c, nombreAlmacenero: nombre, dniAlmacenero: dni }));
    this.cfgNS.update(c => ({ ...c, nombreAlmacenero: nombre, dniAlmacenero: dni }));
  }

  private cargarPlantillasPorEmpresa(ruc: string): void {
    this.cargando.set(true);
    this.plantillaSvc.obtenerAmbas(ruc).subscribe({
      next: ({ ni, ns }) => {
        const niConEmp = { ...ni, ruc, razonSocial: this.empresaNombre(), logoEmpresaBase64: this.empresaLogo() };
        const nsConEmp = { ...ns, ruc, razonSocial: this.empresaNombre(), logoEmpresaBase64: this.empresaLogo() };
        this.cfgNI.set(niConEmp);
        this.cfgNS.set(nsConEmp);
        localStorage.setItem(LS_KEY_NI + '_' + ruc, JSON.stringify(niConEmp));
        localStorage.setItem(LS_KEY_NS + '_' + ruc, JSON.stringify(nsConEmp));
        this.cargando.set(false);
        this.firmaAlmacenVacia.set(!(niConEmp.firmaAlmacenBase64));
        setTimeout(() => this.restaurarFirmaEnCanvas(), 100);
      },
      error: () => this.cargando.set(false)
    });
  }

  ngAfterViewInit(): void {
    this.inicializarCanvas();
  }

  private inicializarCanvas(): void {
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!canvas) return;
    this.canvasCtx = canvas.getContext('2d');
    if (!this.canvasCtx) return;
    this.canvasCtx.strokeStyle = '#1a1a2e';
    this.canvasCtx.lineWidth = 2.5;
    this.canvasCtx.lineCap = 'round';
    this.canvasCtx.lineJoin = 'round';

    canvas.addEventListener('mousedown',  (e) => { this.dibujando = true; const r = canvas.getBoundingClientRect(); this.lastX = e.clientX - r.left; this.lastY = e.clientY - r.top; });
    canvas.addEventListener('mousemove',  (e) => {
      if (!this.dibujando || !this.canvasCtx) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left; const y = e.clientY - r.top;
      this.canvasCtx.beginPath(); this.canvasCtx.moveTo(this.lastX, this.lastY); this.canvasCtx.lineTo(x, y); this.canvasCtx.stroke();
      this.lastX = x; this.lastY = y; this.firmaAlmacenVacia.set(false);
    });
    canvas.addEventListener('mouseup',    () => { this.dibujando = false; this.actualizarPreviewFirma(); });
    canvas.addEventListener('mouseleave', () => this.dibujando = false);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; const r = canvas.getBoundingClientRect(); this.lastX = t.clientX - r.left; this.lastY = t.clientY - r.top; this.dibujando = true; }, { passive: false });
    canvas.addEventListener('touchmove',  (e) => {
      e.preventDefault(); if (!this.dibujando || !this.canvasCtx) return;
      const t = e.touches[0]; const r = canvas.getBoundingClientRect();
      const x = t.clientX - r.left; const y = t.clientY - r.top;
      this.canvasCtx.beginPath(); this.canvasCtx.moveTo(this.lastX, this.lastY); this.canvasCtx.lineTo(x, y); this.canvasCtx.stroke();
      this.lastX = x; this.lastY = y; this.firmaAlmacenVacia.set(false);
    }, { passive: false });
    canvas.addEventListener('touchend', () => { this.dibujando = false; this.actualizarPreviewFirma(); });

    this.restaurarFirmaEnCanvas();
  }

  private actualizarPreviewFirma(): void {
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!canvas) return;
    this.firmaPreviewBase64.set(canvas.toDataURL('image/png'));
  }

  private restaurarFirmaEnCanvas(): void {
    const firma = this.cfgNI().firmaAlmacenBase64 || this.cfgNS().firmaAlmacenBase64;
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!firma || !canvas || !this.canvasCtx) return;
    const img = new Image();
    img.onload = () => {
      this.canvasCtx!.clearRect(0, 0, canvas.width, canvas.height);
      this.canvasCtx!.drawImage(img, 0, 0, canvas.width, canvas.height);
      this.firmaAlmacenVacia.set(false);
      this.firmaPreviewBase64.set(canvas.toDataURL('image/png'));
    };
    img.src = firma;
  }

  limpiarFirmaAlmacen(): void {
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!canvas || !this.canvasCtx) return;
    this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    this.firmaAlmacenVacia.set(true);
    this.firmaPreviewBase64.set('');
    this.patchNI({ firmaAlmacenBase64: '', nombreAlmacenero: this.cfgNI().nombreAlmacenero });
    this.patchNS({ firmaAlmacenBase64: '', nombreAlmacenero: this.cfgNS().nombreAlmacenero });
  }

  capturarFirmaAlmacen(): void {
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/png');
    this.patchNI({ firmaAlmacenBase64: base64 });
    this.patchNS({ firmaAlmacenBase64: base64 });
  }

  setNombreAlmacenero(nombre: string): void {
    this.patchNI({ nombreAlmacenero: nombre });
    this.patchNS({ nombreAlmacenero: nombre });
  }

  setTab(t: 'ni' | 'ns') {
    this.tabActivo.set(t);
  }

  patchNI(partial: Partial<PlantillaAlmacen>) {
    this.cfgNI.update(c => ({ ...c, ...partial }));
  }

  patchNS(partial: Partial<PlantillaAlmacen>) {
    this.cfgNS.update(c => ({ ...c, ...partial }));
  }

  guardarNI() {
    this.capturarFirmaAlmacen();
    const ruc = this.empresaRuc();
    // Asegurar que el ruc esté en la plantilla antes de guardar
    this.cfgNI.update(c => ({ ...c, ruc }));
    this.plantillaSvc.guardar(this.cfgNI()).subscribe({
      next: () => {
        localStorage.setItem(LS_KEY_NI + '_' + ruc, JSON.stringify(this.cfgNI()));
        this.mostrarAlerta('Plantilla Nota de Ingreso guardada correctamente');
      },
      error: () => this.mostrarAlerta('Error al guardar plantilla NI', 'danger')
    });
  }

  resetNI() {
    this.cfgNI.set({ ...DEFAULT_NI });
    this.plantillaSvc.guardar(DEFAULT_NI).subscribe({
      next: () => {
        localStorage.setItem(LS_KEY_NI, JSON.stringify(DEFAULT_NI));
        this.mostrarAlerta('Plantilla NI restablecida a valores predeterminados', 'danger');
      },
      error: () => this.mostrarAlerta('Error al restablecer plantilla NI', 'danger')
    });
  }

  guardarNS() {
    this.capturarFirmaAlmacen();
    const ruc = this.empresaRuc();
    this.cfgNS.update(c => ({ ...c, ruc }));
    this.plantillaSvc.guardar(this.cfgNS()).subscribe({
      next: () => {
        localStorage.setItem(LS_KEY_NS + '_' + ruc, JSON.stringify(this.cfgNS()));
        this.mostrarAlerta('Plantilla Nota de Salida guardada correctamente');
      },
      error: () => this.mostrarAlerta('Error al guardar plantilla NS', 'danger')
    });
  }

  resetNS() {
    this.cfgNS.set({ ...DEFAULT_NS });
    this.plantillaSvc.guardar(DEFAULT_NS).subscribe({
      next: () => {
        localStorage.setItem(LS_KEY_NS, JSON.stringify(DEFAULT_NS));
        this.mostrarAlerta('Plantilla NS restablecida a valores predeterminados', 'danger');
      },
      error: () => this.mostrarAlerta('Error al restablecer plantilla NS', 'danger')
    });
  }

  private mostrarAlerta(msg: string, tipo: 'success' | 'danger' = 'success') {
    this.alertMsg.set(msg);
    this.alertTipo.set(tipo);
    setTimeout(() => this.alertMsg.set(''), 3500);
  }

  columnasBadgeNI(): string[] {
    const cfg = this.cfgNI();
    const cols = ['#', 'Ítem', 'Cnd.', 'Descripción'];
    if (cfg.mostrarUbicacionFisica) cols.push('Ubic. Física');
    if (cfg.mostrarCodInterno) cols.push('COD.INT.');
    cols.push('Unidad', 'Cant. Ingreso');
    if (cfg.mostrarCantidadCompra) cols.push('Cant. Compra');
    if (cfg.mostrarCantidadPendiente) cols.push('Cant. Pendiente');
    if (cfg.mostrarStockActual) cols.push('Stock Actual');
    cols.push('C.Costos');
    return cols;
  }

  columnasBadgeNS(): string[] {
    const cfg = this.cfgNS();
    const cols = ['#', 'Ítem', 'Cnd.', 'Descripción'];
    if (cfg.mostrarUbicacionFisica) cols.push('Ubic. Física');
    if (cfg.mostrarCodInterno) cols.push('COD.INT.');
    cols.push('Unidad', 'Cant. Salida', 'Cant. Requerida');
    if (cfg.mostrarCantidadPendiente) cols.push('Cant. Pendiente');
    if (cfg.mostrarStockActual) cols.push('Stock Actual');
    cols.push('C.Costos');
    return cols;
  }

  hoy = signal(new Date().toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' }));

  static getPlantillaNI(): PlantillaAlmacen {
    return loadPlantilla(LS_KEY_NI, DEFAULT_NI);
  }

  static getPlantillaNS(): PlantillaAlmacen {
    return loadPlantilla(LS_KEY_NS, DEFAULT_NS);
  }
}
