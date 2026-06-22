import {
  Component, OnInit, signal, computed,
  ChangeDetectionStrategy, ChangeDetectorRef, inject, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import {
  ConformidadAlmacenService,
  ConformidadNota,
  TipoNota,
  EstadoConformidad,
  RegistrarConformidadPayload
} from './conformidad-almacen.service';
import { PlantillaAlmacen } from '@/app/modules/admin-logistica/tabs/almacen/almacen.component';
import { AlmacenPlantillaService } from '@/app/modules/admin-logistica/tabs/almacen/almacen-plantilla.service';
import { ConformidadPdfService } from './conformidad-pdf.service';

type RolVista = 'LOLOGIST' | 'OPLOGIST' | 'ALLOGIST' | 'OTRO';

@Component({
  selector: 'app-conformidad-almacen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './conformidad-almacen.component.html',
  styleUrl: './conformidad-almacen.component.scss',
})
export class ConformidadAlmacenComponent implements OnInit {
  @ViewChild('firmaCanvas') firmaCanvas!: ElementRef<HTMLCanvasElement>;

  private svc            = inject(ConformidadAlmacenService);
  private dexie          = inject(DexieService);
  private alert          = inject(AlertService);
  private cdr            = inject(ChangeDetectorRef);
  private plantillaSvc   = inject(AlmacenPlantillaService);
  private pdfSvc         = inject(ConformidadPdfService);

  // ── Estado usuario ──────────────────────────────────────────────
  usuario    = signal<any>(null);
  rolVista   = signal<RolVista>('OTRO');

  // ── Tabs ────────────────────────────────────────────────────────
  /** 'ni' | 'ns' */
  tabActivo  = signal<TipoNota>('NI');
  /** 'pendientes' | 'historial' */
  seccion    = signal<'pendientes' | 'historial'>('pendientes');

  // ── Listas ──────────────────────────────────────────────────────
  listaPendientes = signal<ConformidadNota[]>([]);
  listaHistorial  = signal<ConformidadNota[]>([]);

  // ── Filtros ─────────────────────────────────────────────────────
  filtroRequerimiento = signal('');
  filtroNI            = signal('');
  filtroNS            = signal('');
  filtroItem          = signal('');

  // ── Listas filtradas computadas ─────────────────────────────────
  pendientesFiltradas = computed(() => this.filtrarNotas(this.listaPendientes()));
  historialFiltrado   = computed(() => this.filtrarNotas(this.listaHistorial()));

  // ── Plantillas configuradas (desde BD vía API) ──────────────────
  plantillaNI = signal<PlantillaAlmacen | null>(null);
  plantillaNS = signal<PlantillaAlmacen | null>(null);
  plantillaActiva = computed<PlantillaAlmacen | null>(() =>
    this.notaSeleccionada()?.tipo === 'NS' ? this.plantillaNS() : this.plantillaNI()
  );

  // ── Modal conformidad ───────────────────────────────────────────
  modalAbierto   = signal(false);
  notaSeleccionada = signal<ConformidadNota | null>(null);
  observaciones  = signal('');
  firmando       = signal(false);
  firmaVacia              = signal(true);
  firmaConformidadPreview  = signal('');  // base64 en tiempo real del canvas de conformidad

  // ── Canvas firma ────────────────────────────────────────────────
  private ctx: CanvasRenderingContext2D | null = null;
  private dibujando = false;
  private lastX = 0;
  private lastY = 0;

  // ── Modal detalle (solo lectura ALLOGIST) ───────────────────────
  modalDetalleAbierto = signal(false);
  notaDetalle = signal<ConformidadNota | null>(null);

  // ── Computed helpers ────────────────────────────────────────────
  esLologist  = computed(() => this.rolVista() === 'LOLOGIST');
  esOplogist  = computed(() => this.rolVista() === 'OPLOGIST');
  esAllogist  = computed(() => this.rolVista() === 'ALLOGIST');
  puedeConfirmarNI = computed(() => this.esLologist());
  puedeConfirmarNS = computed(() => this.esOplogist());

  cargando = signal(false);
  errorCarga = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const user = await this.dexie.getUsuarioLogueado();
    this.usuario.set(user);

    const rol: string = user?.idrol ?? '';
    if (rol.includes('LOLOGIST'))      this.rolVista.set('LOLOGIST');
    else if (rol.includes('OPLOGIST')) this.rolVista.set('OPLOGIST');
    else if (rol.includes('ALLOGIST')) this.rolVista.set('ALLOGIST');

    // Definir tab inicial según rol
    if (this.esOplogist()) this.tabActivo.set('NS');

    // Cargar plantillas desde BD con ruc de la empresa del usuario
    this.cargarPlantillas(user?.ruc ?? '');

    await this.recargarListas();
    this.cdr.markForCheck();
  }

  setTab(tipo: TipoNota): void {
    this.tabActivo.set(tipo);
    this.seccion.set('pendientes');
    this.recargarListas();
  }

  setSeccion(s: 'pendientes' | 'historial'): void {
    this.seccion.set(s);
    this.recargarListas();
  }

  recargarDesdeBoton(): void {
    this.recargarListas();
  }

  async recargarListas(): Promise<void> {
    const tipo = this.tabActivo();
    const idusuario = this.usuario()?.documentoidentidad ?? '';
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      const todas = await lastValueFrom(this.svc.listarNotas(tipo, '', '', idusuario));
      this.listaPendientes.set(todas.filter(n => n.estado === 'PENDIENTE'));
      this.listaHistorial.set(todas.filter(n => n.estado !== 'PENDIENTE'));
    } catch (err: any) {
      this.errorCarga.set('Error al cargar notas. Verifique la conexión con el servidor.');
      this.listaPendientes.set([]);
      this.listaHistorial.set([]);
    } finally {
      this.cargando.set(false);
      this.cdr.markForCheck();
    }
  }

  private cargarPlantillas(ruc: string = ''): void {
    this.plantillaSvc.obtenerAmbas(ruc).subscribe(({ ni, ns }) => {
      this.plantillaNI.set(ni);
      this.plantillaNS.set(ns);
      this.cdr.markForCheck();
    });
  }

  // ── Abrir modal firma ───────────────────────────────────────────
  abrirModalFirma(nota: ConformidadNota): void {
    this.notaSeleccionada.set({ ...nota });
    this.observaciones.set('');
    this.firmaVacia.set(true);
    // Refrescar plantilla desde BD al abrir el modal (con ruc del usuario)
    this.cargarPlantillas(this.usuario()?.ruc ?? '');
    this.modalAbierto.set(true);
    this.cdr.markForCheck();
    // Inicializar canvas en próximo ciclo
    setTimeout(() => this.inicializarCanvas(), 100);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.notaSeleccionada.set(null);
    this.firmaConformidadPreview.set('');
    this.ctx = null;
    this.cdr.markForCheck();
  }

  // ── Abrir detalle ALLOGIST ──────────────────────────────────────
  abrirDetalle(nota: ConformidadNota): void {
    this.notaDetalle.set(nota);
    this.modalDetalleAbierto.set(true);
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.notaDetalle.set(null);
    this.cdr.markForCheck();
  }

  // ── Canvas helpers ──────────────────────────────────────────────
  private inicializarCanvas(): void {
    const canvas = this.firmaCanvas?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.firmaVacia.set(true);

    canvas.addEventListener('mousedown',  (e) => this.startDraw(e));
    canvas.addEventListener('mousemove',  (e) => this.draw(e));
    canvas.addEventListener('mouseup',    ()  => this.stopDraw());
    canvas.addEventListener('mouseleave', ()  => this.stopDraw());
    canvas.addEventListener('touchstart', (e) => this.startDrawTouch(e), { passive: false });
    canvas.addEventListener('touchmove',  (e) => this.drawTouch(e),      { passive: false });
    canvas.addEventListener('touchend',   ()  => this.stopDraw());
  }

  private getPos(canvas: HTMLCanvasElement, e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private startDraw(e: MouseEvent): void {
    this.dibujando = true;
    const pos = this.getPos(this.firmaCanvas.nativeElement, e);
    this.lastX = pos.x; this.lastY = pos.y;
  }

  private draw(e: MouseEvent): void {
    if (!this.dibujando || !this.ctx) return;
    const pos = this.getPos(this.firmaCanvas.nativeElement, e);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.lastX = pos.x; this.lastY = pos.y;
    this.firmaVacia.set(false);
  }

  private stopDraw(): void {
    this.dibujando = false;
    const canvas = this.firmaCanvas?.nativeElement;
    if (canvas) this.firmaConformidadPreview.set(canvas.toDataURL('image/png'));
  }

  private startDrawTouch(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.firmaCanvas.nativeElement.getBoundingClientRect();
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
    this.dibujando = true;
  }

  private drawTouch(e: TouchEvent): void {
    e.preventDefault();
    if (!this.dibujando || !this.ctx) return;
    const touch = e.touches[0];
    const rect = this.firmaCanvas.nativeElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x; this.lastY = y;
    this.firmaVacia.set(false);
  }

  limpiarFirma(): void {
    const canvas = this.firmaCanvas?.nativeElement;
    if (!canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.firmaVacia.set(true);
    this.firmaConformidadPreview.set('');
  }

  // ── Confirmar conformidad ───────────────────────────────────────
  async confirmarConformidad(estado: 'CONFORME' | 'NO_CONFORME'): Promise<void> {
    const nota = this.notaSeleccionada();
    if (!nota) return;
    if (this.firmaVacia() && estado === 'CONFORME') {
      this.alert.showAlertAcept('Debe firmar antes de dar conformidad', 'Firma requerida', 'warning');
      return;
    }

    const canvas = this.firmaCanvas?.nativeElement;
    const firmaBase64 = canvas ? canvas.toDataURL('image/png') : '';
    const usuario = this.usuario();

    const payload: RegistrarConformidadPayload = {
      idNota:        nota.id,
      idNotaFuente:  nota.idNotaFuente,
      tipo:          nota.tipo,
      estado,
      firmaBase64,
      firmante:      usuario?.nombre ?? 'Usuario',
      usuario:       usuario?.documentoidentidad ?? usuario?.nombre ?? 'usuario',
      observaciones: this.observaciones()
    };

    try {
      const res = await lastValueFrom(this.svc.registrarConformidad(payload));
      const exito = res?.success === 1 || res?.success === true;
      if (!exito) throw new Error(res?.mensaje ?? 'Error desconocido');

      const msg = estado === 'CONFORME'
        ? `Nota ${nota.numeroNota} marcada como CONFORME`
        : `Nota ${nota.numeroNota} marcada como NO CONFORME`;
      this.alert.showAlertAcept(msg, 'Conformidad registrada', estado === 'CONFORME' ? 'success' : 'warning');

      // Descargar PDF con firma embebida
      if (estado === 'CONFORME') {
        const notaConFormidad: ConformidadNota = {
          ...nota,
          estado,
          firmaBase64,
          firmante:          payload.firmante,
          usuarioConformidad: payload.usuario,
          fechaConformidad:  new Date().toISOString(),
          observaciones:     payload.observaciones
        };
        this.pdfSvc.descargarPdf(notaConFormidad, this.plantillaActiva(), firmaBase64, payload.firmante);
      }

      this.cerrarModal();
      this.seccion.set('historial');   // redirigir a historial para ver la nota procesada
      await this.recargarListas();
    } catch (err: any) {
      this.alert.showAlertAcept(
        err?.message ?? 'No se pudo registrar la conformidad',
        'Error', 'error'
      );
    }
  }

  descargarPdfNota(nota: ConformidadNota): void {
    const plantilla = nota.tipo === 'NS' ? this.plantillaNS() : this.plantillaNI();
    const firmante = nota.firmante ?? nota.usuarioConformidad ?? 'Firmante';
    const firma = nota.firmaBase64 ?? '';
    this.pdfSvc.descargarPdf(nota, plantilla, firma, firmante);
  }

  // ── Helpers template ───────────────────────────────────────────
  badgeClass(estado: EstadoConformidad): string {
    switch (estado) {
      case 'CONFORME':    return 'badge bg-success';
      case 'NO_CONFORME': return 'badge bg-danger';
      default:            return 'badge bg-warning text-dark';
    }
  }

  badgeLabel(estado: EstadoConformidad): string {
    switch (estado) {
      case 'CONFORME':    return 'Conforme';
      case 'NO_CONFORME': return 'No Conforme';
      default:            return 'Pendiente';
    }
  }

  formatFecha(iso: string): string {
    if (!iso) return '-';
    return iso.substring(0, 10).split('-').reverse().join('/');
  }

  // ── Filtros helpers ─────────────────────────────────────────────
  private filtrarNotas(notas: ConformidadNota[]): ConformidadNota[] {
    const req = this.filtroRequerimiento().toLowerCase().trim();
    const ni  = this.filtroNI().toLowerCase().trim();
    const ns  = this.filtroNS().toLowerCase().trim();
    const it  = this.filtroItem().toLowerCase().trim();

    if (!req && !ni && !ns && !it) return notas;

    return notas.filter(n => {
      // Filtro por requerimiento (referencia/descripcionRef)
      if (req && !n.referencia.toLowerCase().includes(req) && !n.descripcionRef.toLowerCase().includes(req)) {
        return false;
      }
      // Filtro por NI
      if (ni && n.tipo === 'NI' && !n.numeroNota.toLowerCase().includes(ni)) {
        return false;
      }
      // Filtro por NS
      if (ns && n.tipo === 'NS' && !n.numeroNota.toLowerCase().includes(ns)) {
        return false;
      }
      // Filtro por item (busca en los items de la nota)
      if (it) {
        const tieneItem = n.items.some(i =>
          i.codigo.toLowerCase().includes(it) ||
          i.descripcion.toLowerCase().includes(it)
        );
        if (!tieneItem) return false;
      }
      return true;
    });
  }

  limpiarFiltros(): void {
    this.filtroRequerimiento.set('');
    this.filtroNI.set('');
    this.filtroNS.set('');
    this.filtroItem.set('');
  }
}
