import { Component, signal, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  ConformidadServicioPdfService,
  PlantillaConformidadServicio,
} from './conformidad-servicio-pdf.service';
import { OrdenPdfService, EmpresaConfig } from '@/app/modules/main/pages/consolidacion-compras/orden-pdf.service';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';
import { ConformidadServicioPlantillaService } from './conformidad-servicio-plantilla.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Component({
  selector: 'app-conformidad-servicio-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './conformidad-servicio.component.html',
  styleUrl: './conformidad-servicio.component.scss',
})
export class ConformidadServicioAdminComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasFirmaLologist') canvasFirmaRef!: ElementRef<HTMLCanvasElement>;

  private svc       = inject(ConformidadServicioPdfService);
  private ordenSvc  = inject(OrdenPdfService);
  private sanitizer = inject(DomSanitizer);
  private cdr       = inject(ChangeDetectorRef);
  private http          = inject(HttpClient);
  private baseUrl       = environment.baseUrl;
  private plantillaSvc  = inject(ConformidadServicioPlantillaService);
  private dexie         = inject(DexieService);

  guardandoBD = signal(false);

  // ── Canvas firma ─────────────────────────────────────────────────────────
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private dibujando = false;
  private lastX = 0;
  private lastY = 0;
  private _previewTimer: any = null;
  firmaVacia        = signal(true);
  firmaPreviewB64   = signal('');

  cfg          = signal<PlantillaConformidadServicio>(this.svc.getCfg(this.ordenSvc.getEmpresa().ruc));
  previewUrl   = signal<SafeResourceUrl | null>(null);
  empresa      = signal<EmpresaConfig>(this.ordenSvc.getEmpresa());
  empresaLista = signal<EmpresaConfig[]>([]);
  cargando     = signal(false);

  // ── Buscador LOLOGIST ────────────────────────────────────────────────────
  listaLologist      = signal<any[]>([]);
  buscandoLologist   = signal(false);
  lologistError      = signal('');

  alertMsg  = signal('');
  alertTipo = signal<'success' | 'danger'>('success');

  modalPreviewAbierto = signal(false);

  ngOnInit(): void {
    this.cargarEmpresas();
    this.refreshPreview();
  }

  ngAfterViewInit(): void {
    this.inicializarCanvas();
  }

  // ── Canvas ────────────────────────────────────────────────────────────────

  private inicializarCanvas(): void {
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!canvas) return;
    this.canvasCtx = canvas.getContext('2d');
    if (!this.canvasCtx) return;
    this.canvasCtx.strokeStyle = '#1a1a2e';
    this.canvasCtx.lineWidth = 2.5;
    this.canvasCtx.lineCap = 'round';
    this.canvasCtx.lineJoin = 'round';

    canvas.addEventListener('mousedown', (e) => {
      this.dibujando = true;
      const r = canvas.getBoundingClientRect();
      this.lastX = e.clientX - r.left; this.lastY = e.clientY - r.top;
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!this.dibujando || !this.canvasCtx) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left; const y = e.clientY - r.top;
      this.canvasCtx.beginPath(); this.canvasCtx.moveTo(this.lastX, this.lastY);
      this.canvasCtx.lineTo(x, y); this.canvasCtx.stroke();
      this.lastX = x; this.lastY = y; this.firmaVacia.set(false);
      this.capturarFirmaDebounced();
    });
    canvas.addEventListener('mouseup',    () => { this.dibujando = false; this.capturarFirma(); });
    canvas.addEventListener('mouseleave', () => this.dibujando = false);
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0]; const r = canvas.getBoundingClientRect();
      this.lastX = t.clientX - r.left; this.lastY = t.clientY - r.top; this.dibujando = true;
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); if (!this.dibujando || !this.canvasCtx) return;
      const t = e.touches[0]; const r = canvas.getBoundingClientRect();
      const x = t.clientX - r.left; const y = t.clientY - r.top;
      this.canvasCtx.beginPath(); this.canvasCtx.moveTo(this.lastX, this.lastY);
      this.canvasCtx.lineTo(x, y); this.canvasCtx.stroke();
      this.lastX = x; this.lastY = y; this.firmaVacia.set(false);
      this.capturarFirmaDebounced();
    }, { passive: false });
    canvas.addEventListener('touchend', () => { this.dibujando = false; this.capturarFirma(); });

    this.restaurarFirmaEnCanvas();
  }

  private restaurarFirmaEnCanvas(): void {
    const firma = this.cfg().firmaLologistBase64;
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!firma || !canvas || !this.canvasCtx) return;
    const img = new Image();
    img.onload = () => {
      this.canvasCtx!.clearRect(0, 0, canvas.width, canvas.height);
      this.canvasCtx!.drawImage(img, 0, 0, canvas.width, canvas.height);
      this.firmaVacia.set(false);
      this.firmaPreviewB64.set(canvas.toDataURL('image/png'));
      this.cdr.markForCheck();
    };
    img.src = firma;
  }

  private capturarFirmaDebounced(): void {
    if (this._previewTimer) clearTimeout(this._previewTimer);
    this._previewTimer = setTimeout(() => this.capturarFirma(), 150);
  }

  private capturarFirma(): void {
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!canvas) return;
    const b64 = canvas.toDataURL('image/png');
    this.firmaPreviewB64.set(b64);
    this.cfg.update(c => ({ ...c, firmaLologistBase64: b64 }));
    this.refreshPreview();  // actualiza vista previa en tiempo real
    this.cdr.markForCheck();
  }

  limpiarFirma(): void {
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (!canvas || !this.canvasCtx) return;
    this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    this.firmaVacia.set(true);
    this.firmaPreviewB64.set('');
    this.cfg.update(c => ({ ...c, firmaLologistBase64: '' }));
    this.cdr.markForCheck();
  }

  // ── Empresa ───────────────────────────────────────────────────────────────

  async cargarEmpresas(): Promise<void> {
    this.cargando.set(true);
    try {
      const lista = await this.ordenSvc.listarEmpresas();
      this.empresaLista.set(lista);
      const guardada = this.ordenSvc.getEmpresa();
      if (lista.length > 0 && !guardada.id) {
        this.seleccionarEmpresa(lista[0].id!);
      } else if (guardada.id) {
        const match = lista.find(e => e.id === guardada.id);
        if (match) {
          this.empresa.set(match);
          this.cargarPlantillaPorEmpresa(match.ruc ?? '');
          this.buscarLologistPorRuc(match.ruc ?? '');
        }
      }
    } catch { /* sin conexión */ } finally {
      this.cargando.set(false);
    }
  }

  seleccionarEmpresa(id: number | string): void {
    const idNum = Number(id);
    const emp = this.empresaLista().find(e => e.id === idNum);
    if (emp) {
      this.empresa.set(emp);
      this.ordenSvc.saveEmpresa(emp);
      this.cargarPlantillaPorEmpresa(emp.ruc ?? '');
      this.buscarLologistPorRuc(emp.ruc ?? '');
    }
  }

  private cargarPlantillaPorEmpresa(ruc: string): void {
    this.cargando.set(true);
    this.plantillaSvc.obtener(ruc).subscribe({
      next: cfg => {
        // Sincronizar BD → localStorage cache
        this.svc.saveCfg(cfg, ruc);
        this.cfg.set(cfg);
        this.firmaVacia.set(!cfg.firmaLologistBase64);
        this.firmaPreviewB64.set(cfg.firmaLologistBase64 || '');
        setTimeout(() => this.restaurarFirmaEnCanvas(), 50);
        this.refreshPreview();
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        // Sin conexión: usar localStorage cache
        const cached = this.svc.getCfg(ruc);
        this.cfg.set(cached);
        this.firmaVacia.set(!cached.firmaLologistBase64);
        this.firmaPreviewB64.set(cached.firmaLologistBase64 || '');
        setTimeout(() => this.restaurarFirmaEnCanvas(), 50);
        this.refreshPreview();
        this.cargando.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  buscarLologistPorRuc(ruc: string): void {
    if (!ruc) return;
    this.buscandoLologist.set(true);
    this.lologistError.set('');
    this.listaLologist.set([]);
    this.http.get<any[]>(
      `${this.baseUrl}/api/logistica/admin-logistica/lologist-por-ruc?ruc=${encodeURIComponent(ruc)}`
    ).subscribe({
      next: lista => {
        this.listaLologist.set(lista ?? []);
        if (!lista?.length)
          this.lologistError.set('No se encontró ningún operador LOLOGIST para esta empresa');
        this.buscandoLologist.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.lologistError.set('Error al consultar operadores logísticos');
        this.buscandoLologist.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarLologist(op: any): void {
    this.cfg.update(c => ({
      ...c,
      nombreLologist: op.nombre    ?? '',
      dniLologist:    op.nrodocumento ?? op.dni ?? '',
      cargoLologist:  c.cargoLologist || 'Operador Logístico',
    }));
    this.refreshPreview();
    this.cdr.markForCheck();
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  refreshPreview(): void {
    const html = this.svc.buildPreviewHtml(this.empresa());
    const blob = new Blob([html], { type: 'text/html' });
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob)));
    this.cdr.markForCheck();
  }

  abrirPreviewVentana(): void {
    this.svc.imprimirConformidad(
      this.svc.buildPreviewHtml(this.empresa()),
      'Vista previa Conformidad de Servicio'
    );
  }

  abrirModalPreview(): void {
    this.modalPreviewAbierto.set(true);
    document.body.style.overflow = 'hidden';
  }

  cerrarModalPreview(): void {
    this.modalPreviewAbierto.set(false);
    document.body.style.overflow = '';
  }

  // ── Config ────────────────────────────────────────────────────────────────

  patch(patch: Partial<PlantillaConformidadServicio>): void {
    this.cfg.set({ ...this.cfg(), ...patch });
  }

  async guardar(): Promise<void> {
    this.capturarFirma();
    const ruc = this.empresa().ruc ?? '';
    const cfg = this.cfg();
    // 1. Guardar siempre en localStorage (cache offline)
    this.svc.saveCfg(cfg, ruc);
    // 2. Guardar en BD
    this.guardandoBD.set(true);
    try {
      const u = await this.dexie.getUsuarioLogueado();
      await lastValueFrom(this.plantillaSvc.guardar(cfg, ruc, u?.usuario ?? 'SISTEMA'));
      this.mostrarAlerta(`Plantilla guardada en BD para ${this.empresa().razonSocial || ruc}`);
    } catch {
      this.mostrarAlerta('Guardado localmente (sin conexión a BD)', 'danger');
    } finally {
      this.guardandoBD.set(false);
      this.refreshPreview();
    }
  }

  restaurar(): void {
    this.svc.resetCfg(this.empresa().ruc);
    this.cfg.set(this.svc.getCfg(this.empresa().ruc));
    const canvas = this.canvasFirmaRef?.nativeElement;
    if (canvas && this.canvasCtx) { this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height); }
    this.firmaVacia.set(true);
    this.firmaPreviewB64.set('');
    this.refreshPreview();
    this.mostrarAlerta('Plantilla restaurada a valores predeterminados', 'danger');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private mostrarAlerta(msg: string, tipo: 'success' | 'danger' = 'success'): void {
    this.alertMsg.set(msg);
    this.alertTipo.set(tipo);
    setTimeout(() => this.alertMsg.set(''), 3500);
  }
}
