import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  OrdenPdfService,
  PlantillaOC,
  PlantillaOS,
  EmpresaConfig,
} from '@/app/modules/main/pages/consolidacion-compras/orden-pdf.service';

const LOGO_OC_KEY = 'pdf_logo_oc';
const LOGO_OS_KEY = 'pdf_logo_os';
const FIRMAS_OC_KEY = 'pdf_firmas_oc';
const FIRMAS_OS_KEY = 'pdf_firmas_os';

export interface Firma {
  etiqueta: string;
  cargo: string;
}

const FIRMAS_DEFAULT: Firma[] = [
  { etiqueta: 'Solicitante', cargo: 'Jefe de Área' },
  { etiqueta: 'Aprobado por', cargo: 'Gerencia / Logística' },
  { etiqueta: 'Proveedor', cargo: '' },
];

@Component({
  selector: 'app-pdf',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf.component.html',
  styleUrl: './pdf.component.scss',
})
export class PdfComponent implements OnInit {
  private svc = inject(OrdenPdfService);
  private sanitizer = inject(DomSanitizer);

  // ── Tabs ─────────────────────────────────────────────────────────
  tabActivo = signal<'oc' | 'os'>('oc');

  // ── OC ───────────────────────────────────────────────────────────
  cfgOC = signal<PlantillaOC>(this.svc.getCfgOC());
  tcOC  = signal<string[]>(this.svc.getTcOC());
  firmasOC = signal<Firma[]>(this.cargarFirmas(FIRMAS_OC_KEY));
  logoOC = signal<string>(localStorage.getItem(LOGO_OC_KEY) ?? '');
  nuevoTcOC = signal('');

  // ── OS ───────────────────────────────────────────────────────────
  cfgOS = signal<PlantillaOS>(this.svc.getCfgOS());
  tcOS  = signal<string[]>(this.svc.getTcOS());
  firmasOS = signal<Firma[]>(this.cargarFirmas(FIRMAS_OS_KEY));
  logoOS = signal<string>(localStorage.getItem(LOGO_OS_KEY) ?? '');
  nuevoTcOS = signal('');
  nuevoDatoOS = signal('');

  // ── Empresa ──────────────────────────────────────────────────────
  empresa        = signal<EmpresaConfig>(this.svc.getEmpresa());
  empresaLista   = signal<EmpresaConfig[]>([]);
  empresaCargando = signal(false);

  // ── Vista previa ─────────────────────────────────────────────────
  previewUrl = signal<SafeResourceUrl | null>(null);
  previewTipoOC = signal<'ITEM' | 'COMMODITY'>('ITEM');

  // ── Alertas ──────────────────────────────────────────────────────
  alertMsg  = signal('');
  alertTipo = signal<'success' | 'danger'>('success');

  // ── Modal preview ─────────────────────────────────────────────
  modalPreviewAbierto = signal(false);

  ngOnInit() {
    this.cargarEmpresasDesdeApi();
    this.refreshPreview();
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private cargarFirmas(key: string): Firma[] {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : FIRMAS_DEFAULT.map(f => ({ ...f }));
  }

  private mostrarAlerta(msg: string, tipo: 'success' | 'danger' = 'success') {
    this.alertMsg.set(msg);
    this.alertTipo.set(tipo);
    setTimeout(() => this.alertMsg.set(''), 3000);
  }

  // ── Vista previa ─────────────────────────────────────────────────
  refreshPreview() {
    const emp = this.empresa();
    const html = this.tabActivo() === 'oc'
      ? this.svc.buildPreviewOCHtml(emp, this.previewTipoOC())
      : this.svc.buildPreviewOSHtml(emp);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  abrirModalPreview() {
    this.modalPreviewAbierto.set(true);
    document.body.style.overflow = 'hidden';
  }

  cerrarModalPreview() {
    this.modalPreviewAbierto.set(false);
    document.body.style.overflow = '';
  }

  // ── Empresas desde API ──────────────────────────────────────────
  async cargarEmpresasDesdeApi() {
    this.empresaCargando.set(true);
    try {
      const lista = await this.svc.listarEmpresas();
      this.empresaLista.set(lista);
      // Si hay empresas y la actual no tiene id, preseleccionar la activa del localStorage
      const guardada = this.svc.getEmpresa();
      if (lista.length > 0 && !guardada.id) {
        this.seleccionarEmpresa(lista[0].id!);
      } else if (guardada.id) {
        const match = lista.find(e => e.id === guardada.id);
        if (match) this.empresa.set(match);
      }
    } catch {
      // Sin conexión a API: mantiene la empresa guardada localmente
    } finally {
      this.empresaCargando.set(false);
    }
  }

  seleccionarEmpresa(id: number) {
    const emp = this.empresaLista().find(e => e.id === id);
    if (emp) {
      this.empresa.set(emp);
      this.svc.saveEmpresa(emp);
      this.refreshPreview();
    }
  }

  onSelectEmpresaChange(ev: Event) {
    const id = parseInt((ev.target as HTMLSelectElement).value, 10);
    if (!isNaN(id)) this.seleccionarEmpresa(id);
  }

  // ── Logo Empresa ─────────────────────────────────────────────────
  onLogoEmpresaChange(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.empresa.update(e => ({ ...e, logoBase64: base64 }));
    };
    reader.readAsDataURL(file);
  }

  eliminarLogoEmpresa() {
    this.empresa.update(e => ({ ...e, logoBase64: '' }));
  }

  patchEmpresa(partial: Partial<EmpresaConfig>) {
    this.empresa.update(e => ({ ...e, ...partial }));
  }

  guardarEmpresa() {
    this.svc.saveEmpresa(this.empresa());
    this.mostrarAlerta('Datos de empresa guardados');
    this.refreshPreview();
  }

  resetEmpresa() {
    this.svc.resetEmpresa();
    this.empresa.set(this.svc.getEmpresa());
    this.mostrarAlerta('Datos de empresa restablecidos', 'danger');
    this.refreshPreview();
  }

  // ── Logo ─────────────────────────────────────────────────────────
  onLogoChange(ev: Event, tipo: 'oc' | 'os') {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (tipo === 'oc') { this.logoOC.set(base64); localStorage.setItem(LOGO_OC_KEY, base64); }
      else               { this.logoOS.set(base64); localStorage.setItem(LOGO_OS_KEY, base64); }
    };
    reader.readAsDataURL(file);
  }

  eliminarLogo(tipo: 'oc' | 'os') {
    if (tipo === 'oc') { this.logoOC.set(''); localStorage.removeItem(LOGO_OC_KEY); }
    else               { this.logoOS.set(''); localStorage.removeItem(LOGO_OS_KEY); }
  }

  // ── Cfg OC ───────────────────────────────────────────────────────
  patchOC(partial: Partial<PlantillaOC>) {
    this.cfgOC.update(c => ({ ...c, ...partial }));
  }

  guardarOC() {
    this.svc.saveCfgOC(this.cfgOC());
    localStorage.setItem(FIRMAS_OC_KEY, JSON.stringify(this.firmasOC()));
    this.mostrarAlerta('Plantilla OC guardada correctamente');
    this.refreshPreview();
  }

  resetOC() {
    this.svc.resetCfgOC();
    this.cfgOC.set(this.svc.getCfgOC());
    this.firmasOC.set(FIRMAS_DEFAULT.map(f => ({ ...f })));
    this.logoOC.set('');
    localStorage.removeItem(FIRMAS_OC_KEY);
    localStorage.removeItem(LOGO_OC_KEY);
    this.mostrarAlerta('Plantilla OC restablecida', 'danger');
    this.refreshPreview();
  }

  // ── Cfg OS ───────────────────────────────────────────────────────
  patchOS(partial: Partial<PlantillaOS>) {
    this.cfgOS.update(c => ({ ...c, ...partial }));
  }

  guardarOS() {
    this.svc.saveCfgOS(this.cfgOS());
    localStorage.setItem(FIRMAS_OS_KEY, JSON.stringify(this.firmasOS()));
    this.mostrarAlerta('Plantilla OS guardada correctamente');
    this.refreshPreview();
  }

  resetOS() {
    this.svc.resetCfgOS();
    this.cfgOS.set(this.svc.getCfgOS());
    this.firmasOS.set(FIRMAS_DEFAULT.map(f => ({ ...f })));
    this.logoOS.set('');
    localStorage.removeItem(FIRMAS_OS_KEY);
    localStorage.removeItem(LOGO_OS_KEY);
    this.mostrarAlerta('Plantilla OS restablecida', 'danger');
    this.refreshPreview();
  }

  // ── Firmas ───────────────────────────────────────────────────────
  agregarFirma(tipo: 'oc' | 'os') {
    const sig = tipo === 'oc' ? this.firmasOC : this.firmasOS;
    sig.update(f => [...f, { etiqueta: '', cargo: '' }]);
  }

  eliminarFirma(tipo: 'oc' | 'os', i: number) {
    const sig = tipo === 'oc' ? this.firmasOC : this.firmasOS;
    sig.update(f => f.filter((_, idx) => idx !== i));
  }

  updateFirma(tipo: 'oc' | 'os', i: number, field: keyof Firma, value: string) {
    const sig = tipo === 'oc' ? this.firmasOC : this.firmasOS;
    sig.update(f => f.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  // ── T&C OC ───────────────────────────────────────────────────────
  agregarTcOC() {
    const val = this.nuevoTcOC().trim();
    if (!val) return;
    this.tcOC.update(t => [...t, val]);
    this.nuevoTcOC.set('');
  }

  eliminarTcOC(i: number) { this.tcOC.update(t => t.filter((_, idx) => idx !== i)); }

  updateTcOC(i: number, val: string) {
    this.tcOC.update(t => t.map((item, idx) => idx === i ? val : item));
  }

  guardarTcOC() {
    this.svc.saveTcOC(this.tcOC());
    this.mostrarAlerta('T&C OC guardados');
  }

  resetTcOC() {
    this.svc.resetTcOC();
    this.tcOC.set(this.svc.getTcOC());
    this.mostrarAlerta('T&C OC restablecidos', 'danger');
  }

  // ── T&C OS ───────────────────────────────────────────────────────
  agregarTcOS() {
    const val = this.nuevoTcOS().trim();
    if (!val) return;
    this.tcOS.update(t => [...t, val]);
    this.nuevoTcOS.set('');
  }

  eliminarTcOS(i: number) { this.tcOS.update(t => t.filter((_, idx) => idx !== i)); }

  updateTcOS(i: number, val: string) {
    this.tcOS.update(t => t.map((item, idx) => idx === i ? val : item));
  }

  guardarTcOS() {
    this.svc.saveTcOS(this.tcOS());
    this.mostrarAlerta('T&C OS guardados');
  }

  resetTcOS() {
    this.svc.resetTcOS();
    this.tcOS.set(this.svc.getTcOS());
    this.mostrarAlerta('T&C OS restablecidos', 'danger');
  }

  // ── Datos Servicio OS ─────────────────────────────────────────────
  agregarDatoOS() {
    const val = this.nuevoDatoOS().trim();
    if (!val) return;
    this.patchOS({ datosServicio: [...this.cfgOS().datosServicio, val] });
    this.nuevoDatoOS.set('');
  }

  eliminarDatoOS(i: number) {
    this.patchOS({ datosServicio: this.cfgOS().datosServicio.filter((_, idx) => idx !== i) });
  }

  updateDatoOS(i: number, val: string) {
    this.patchOS({ datosServicio: this.cfgOS().datosServicio.map((item, idx) => idx === i ? val : item) });
  }
}
