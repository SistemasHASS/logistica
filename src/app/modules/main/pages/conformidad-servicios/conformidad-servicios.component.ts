import {
  Component, OnInit, signal, computed, AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, inject, ViewChild, ElementRef, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { lastValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import {
  ConformidadServiciosService,
  OrdenServicioConformidad,
  EstadoConformidadOS,
  RegistrarConformidadOSPayload
} from './conformidad-servicios.service';
import { ConformidadServicioPdfService } from '@/app/modules/admin-logistica/tabs/conformidad-servicio/conformidad-servicio-pdf.service';
import { ConformidadServicioPlantillaService } from '@/app/modules/admin-logistica/tabs/conformidad-servicio/conformidad-servicio-plantilla.service';
import { OrdenPdfService } from '../consolidacion-compras/orden-pdf.service';

type Seccion = 'PENDIENTE' | 'HISTORIAL';

@Component({
  selector: 'app-conformidad-servicios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './conformidad-servicios.component.html',
  styleUrl: './conformidad-servicios.component.scss',
})
export class ConformidadServiciosComponent implements OnInit {

  private svc          = inject(ConformidadServiciosService);
  private dexie        = inject(DexieService);
  private alert        = inject(AlertService);
  private cdr          = inject(ChangeDetectorRef);
  private pdfSvc       = inject(ConformidadServicioPdfService);
  private plantillaSvc = inject(ConformidadServicioPlantillaService);
  private ordenSvc     = inject(OrdenPdfService);

  empresa = signal<any>(null);

  // ── Usuario ──────────────────────────────────────────────────────
  usuario = signal<any>(null);
  esLologist = computed(() => (this.usuario()?.idrol ?? '').includes('LOLOGIST'));

  // ── Sección activa ───────────────────────────────────────────────
  seccionActiva = signal<Seccion>('PENDIENTE');

  // ── Datos ────────────────────────────────────────────────────────
  listaPendientes = signal<OrdenServicioConformidad[]>([]);
  listaHistorial  = signal<OrdenServicioConformidad[]>([]);

  // ── Filtros ──────────────────────────────────────────────────────
  filtroBusqueda = signal('');
  filtroTipoServicio = signal('');

  // ── Listas filtradas ─────────────────────────────────────────────
  pendientesFiltrados = computed(() => {
    const q = this.filtroBusqueda().toLowerCase();
    const t = this.filtroTipoServicio().toLowerCase();
    return this.listaPendientes().filter(os =>
      (!q || os.numeroOrden.toLowerCase().includes(q)
           || os.nombreProveedor.toLowerCase().includes(q)
           || os.descripcion.toLowerCase().includes(q))
      && (!t || os.tipoServicio.toLowerCase().includes(t))
    );
  });

  historialFiltrado = computed(() => {
    const q = this.filtroBusqueda().toLowerCase();
    const t = this.filtroTipoServicio().toLowerCase();
    return this.listaHistorial().filter(os =>
      (!q || os.numeroOrden.toLowerCase().includes(q)
           || os.nombreProveedor.toLowerCase().includes(q)
           || os.descripcion.toLowerCase().includes(q))
      && (!t || os.tipoServicio.toLowerCase().includes(t))
    );
  });

  // ── Modal detalle ────────────────────────────────────────────────
  modalDetalleAbierto = signal(false);
  osSeleccionada = signal<OrdenServicioConformidad | null>(null);

  // ── Modal conformidad ────────────────────────────────────────────
  modalConformidadAbierto = signal(false);
  guardando = signal(false);

  formConformidad = signal<{
    conformidad: EstadoConformidadOS;
    calificacion: number;
    observaciones: string;
  }>({
    conformidad: 'CONFORME',
    calificacion: 5,
    observaciones: ''
  });

  readonly tiposConformidad: { label: string; value: EstadoConformidadOS }[] = [
    { label: 'Conforme',                     value: 'CONFORME' },
    { label: 'No Conforme',                  value: 'NO_CONFORME' },
    { label: 'Conforme con Observaciones',   value: 'CONFORME_CON_OBSERVACIONES' },
  ];

  readonly estrellas = [1, 2, 3, 4, 5];

  // ── Vista previa plantilla (computed — reacciona a firma en tiempo real) ───
  htmlPreview = computed<SafeHtml>(() => {
    const os  = this.osSeleccionada();
    if (!os) return '';
    const firma = this.firmaPreview(); // dependencia reactiva — se actualiza en cada trazo
    const html  = this.pdfSvc.buildHtml(
      { ...os, firmaJefeArea: firma || undefined },
      this.empresa() ?? undefined
    );
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  // ── Canvas firma (firmante 2 — confirmante) ───────────────────────
  @ViewChild('firmaOSCanvas') firmaOSCanvas!: ElementRef<HTMLCanvasElement>;
  firmaVacia    = signal(true);
  firmaPreview  = signal('');  // base64 en tiempo real
  private ctx: CanvasRenderingContext2D | null = null;
  private dibujando = false;
  private lastX = 0;
  private lastY = 0;

  cargando = signal(false);

  private sanitizer = inject(DomSanitizer);
  private zone      = inject(NgZone);

  // ─────────────────────────────────────────────────────────────────
  async ngOnInit() {
    const u = await this.dexie.getUsuarioLogueado();
    this.usuario.set(u);
    // Cargar plantilla de la empresa del usuario logueado
    if (u?.ruc) {
      this.plantillaSvc.obtener(u.ruc).subscribe({
        next: cfg => {
          this.pdfSvc.saveCfg(cfg, u.ruc);
          // Intentar cargar también la empresa (logo + razonSocial)
          this.ordenSvc.listarEmpresas().then(lista => {
            const emp = lista.find(e => e.ruc === u.ruc);
            if (emp) this.empresa.set(emp);
          });
          this.cdr.markForCheck();
        }
      });
    }
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando.set(true);
    const usuario = this.usuario()?.documentoidentidad ?? '';
    try {
      const [pendientes, historial] = await Promise.all([
        lastValueFrom(this.svc.listarParaConformidad({ seccion: 'PENDIENTE', usuario })),
        lastValueFrom(this.svc.listarParaConformidad({ seccion: 'HISTORIAL', usuario })),
      ]);
      this.listaPendientes.set(this.mapearItems(pendientes ?? []));
      this.listaHistorial.set(this.mapearItems(historial ?? []));
    } catch (e: any) {
      this.alert.showAlert('Error', 'No se pudo cargar las órdenes de servicio', 'error');
    } finally {
      this.cargando.set(false);
      this.cdr.markForCheck();
    }
  }

  private mapearItems(lista: any[]): OrdenServicioConformidad[] {
    return lista.map(os => ({
      ...os,
      items: this.parsearItems(os.items),
    }));
  }

  private parsearItems(raw: any): any[] {
    if (!raw) return [];
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { return []; }
  }

  // ── Sección ───────────────────────────────────────────────────────
  cambiarSeccion(s: Seccion) {
    this.seccionActiva.set(s);
    this.filtroBusqueda.set('');
    this.filtroTipoServicio.set('');
  }

  // ── Modal detalle ─────────────────────────────────────────────────
  abrirDetalle(os: OrdenServicioConformidad) {
    this.osSeleccionada.set(os);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle() {
    this.modalDetalleAbierto.set(false);
    this.osSeleccionada.set(null);
  }

  // ── Modal conformidad ─────────────────────────────────────────────
  abrirModalConformidad(os: OrdenServicioConformidad) {
    this.osSeleccionada.set(os);
    this.formConformidad.set({ conformidad: 'CONFORME', calificacion: 5, observaciones: '' });
    this.firmaVacia.set(true);
    this.firmaPreview.set('');
    this.ctx = null;
    this.modalConformidadAbierto.set(true);
    // htmlPreview es computed — se genera automáticamente
    // Inicializar canvas en próximo ciclo de render
    setTimeout(() => this.inicializarCanvas(), 120);
  }

  cerrarModalConformidad() {
    this.modalConformidadAbierto.set(false);
    this.ctx = null;
    this.firmaPreview.set('');
    this.firmaVacia.set(true);
  }

  // ── Canvas helpers ───────────────────────────────────────────────
  private inicializarCanvas(): void {
    const canvas = this.firmaOSCanvas?.nativeElement;
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth  || 360;
    canvas.height = canvas.offsetHeight || 120;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth   = 2;
    this.ctx.lineCap     = 'round';
    this.ctx.lineJoin    = 'round';
    this.limpiarCanvas();
    this.registrarEventosCanvas(canvas);
  }

  private registrarEventosCanvas(canvas: HTMLCanvasElement): void {
    // Mouse
    canvas.addEventListener('mousedown', (e) => { this.dibujando = true; [this.lastX, this.lastY] = this.coords(e, canvas); });
    canvas.addEventListener('mousemove', (e) => { if (this.dibujando) this.dibujar(e, canvas); });
    canvas.addEventListener('mouseup',   () => this.pararDibujo(canvas));
    canvas.addEventListener('mouseleave',() => this.pararDibujo(canvas));
    // Touch
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.dibujando = true; [this.lastX, this.lastY] = this.coordsTouch(e, canvas); }, { passive: false });
    canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); if (this.dibujando) this.dibujarTouch(e, canvas); }, { passive: false });
    canvas.addEventListener('touchend',   () => this.pararDibujo(canvas));
  }

  private coords(e: MouseEvent, c: HTMLCanvasElement): [number, number] {
    const r = c.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  private coordsTouch(e: TouchEvent, c: HTMLCanvasElement): [number, number] {
    const r = c.getBoundingClientRect();
    const t = e.touches[0];
    return [t.clientX - r.left, t.clientY - r.top];
  }

  private dibujar(e: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.ctx) return;
    const [x, y] = this.coords(e, canvas);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    [this.lastX, this.lastY] = [x, y];
    this.firmaVacia.set(false);
    this.firmaPreview.set(canvas.toDataURL());
    this.cdr.markForCheck();
  }

  private dibujarTouch(e: TouchEvent, canvas: HTMLCanvasElement): void {
    if (!this.ctx) return;
    const [x, y] = this.coordsTouch(e, canvas);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    [this.lastX, this.lastY] = [x, y];
    this.firmaVacia.set(false);
    this.firmaPreview.set(canvas.toDataURL());
    this.cdr.markForCheck();
  }

  private pararDibujo(canvas: HTMLCanvasElement): void {
    this.dibujando = false;
  }

  limpiarFirma(): void {
    const canvas = this.firmaOSCanvas?.nativeElement;
    if (!canvas || !this.ctx) return;
    this.limpiarCanvas();
    this.firmaVacia.set(true);
    this.firmaPreview.set('');
    this.cdr.markForCheck();
  }

  private limpiarCanvas(): void {
    if (!this.ctx || !this.firmaOSCanvas) return;
    const c = this.firmaOSCanvas.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, c.width, c.height);
    // Línea guía
    this.ctx.save();
    this.ctx.strokeStyle = '#cbd5e1';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(16, c.height - 28);
    this.ctx.lineTo(c.width - 16, c.height - 28);
    this.ctx.stroke();
    this.ctx.restore();
  }

  setCalificacion(n: number) {
    this.formConformidad.update(f => ({ ...f, calificacion: n }));
  }

  setConformidad(v: EstadoConformidadOS) {
    this.formConformidad.update(f => ({ ...f, conformidad: v }));
  }

  setObservaciones(v: string) {
    this.formConformidad.update(f => ({ ...f, observaciones: v }));
  }

  async guardarConformidad() {
    const os = this.osSeleccionada();
    if (!os) return;

    const form = this.formConformidad();
    if (form.conformidad === 'NO_CONFORME' && !form.observaciones.trim()) {
      this.alert.showAlert('Atención', 'Debe ingresar observaciones cuando el servicio no es conforme', 'warning');
      return;
    }

    if (this.firmaVacia()) {
      this.alert.showAlert('Firma requerida', 'Debe firmar el documento antes de confirmar la conformidad', 'warning');
      return;
    }

    const u = this.usuario();
    const firmaBase64 = this.firmaOSCanvas?.nativeElement?.toDataURL() ?? '';
    const payload: RegistrarConformidadOSPayload = {
      ordenServicioId: os.idOS,
      conformidad: form.conformidad,
      calificacion: form.calificacion,
      observaciones: form.observaciones,
      usuarioConformidad: u?.documentoidentidad ?? '',
      nombreUsuario: u?.nombre ?? '',
      cargoUsuario: u?.cargo ?? u?.idrol ?? '',
      firmaBase64,
    };

    this.guardando.set(true);
    try {
      const resp = await lastValueFrom(this.svc.registrarConformidad(payload));
      const r = typeof resp === 'string' ? JSON.parse(resp) : resp;

      if (r?.status === 'success' || r?.success === 1) {
        this.alert.showAlert(
          'Conformidad registrada',
          `La orden ${os.numeroOrden} fue marcada como ${this.etiquetaConformidad(form.conformidad)}`,
          'success'
        );
        this.cerrarModalConformidad();
        await this.cargarDatos();
        // Generar e imprimir el documento de conformidad
        this.imprimirConformidad({
          ...os,
          estadoConformidad: form.conformidad,
          observacionesConformidad: form.observaciones,
          nombreConformidad: this.usuario()?.nombre ?? '',
          fechaConformidad: new Date().toLocaleDateString('es-PE'),
          firmaJefeArea: firmaBase64,
        });
      } else {
        this.alert.showAlert('Error', r?.mensaje ?? 'No se pudo registrar la conformidad', 'error');
      }
    } catch (e: any) {
      this.alert.showAlert('Error', e?.message ?? 'Error al registrar conformidad', 'error');
    } finally {
      this.guardando.set(false);
      this.cdr.markForCheck();
    }
  }

  // ── PDF / Impresión ───────────────────────────────────────────────
  imprimirConformidad(os: OrdenServicioConformidad): void {
    const emp = this.empresa();
    const html = this.pdfSvc.buildHtml(os, emp ?? undefined);
    this.pdfSvc.imprimirConformidad(html, `Conformidad-${os.numeroOrden}`);
  }

  // ── Helpers ───────────────────────────────────────────────────────
  etiquetaConformidad(v?: string): string {
    switch (v) {
      case 'CONFORME':                   return 'Conforme';
      case 'NO_CONFORME':                return 'No Conforme';
      case 'CONFORME_CON_OBSERVACIONES': return 'Conforme con Observaciones';
      default: return v ?? '—';
    }
  }

  badgeConformidad(v?: string): string {
    switch (v) {
      case 'CONFORME':                   return 'badge bg-success';
      case 'NO_CONFORME':                return 'badge bg-danger';
      case 'CONFORME_CON_OBSERVACIONES': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary';
    }
  }

  formatMonto(n?: number, moneda?: string): string {
    if (!n) return '0.00';
    return `${moneda ?? 'PEN'} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
