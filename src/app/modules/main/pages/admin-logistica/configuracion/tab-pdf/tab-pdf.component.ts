import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OrdenPdfService, PlantillaOC, PlantillaOS } from '@/app/modules/main/pages/consolidacion-compras/orden-pdf.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-tab-pdf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-pdf.component.html',
  styleUrl: './tab-pdf.component.scss',
})
export class TabPdfComponent implements OnInit {
  private pdfSvc    = inject(OrdenPdfService);
  private alertSvc  = inject(AlertService);
  private sanitizer = inject(DomSanitizer);

  /** 'oc' | 'os' */
  tabActivo = signal<'oc' | 'os'>('oc');
  /** Sección dentro de cada tab: 'plantilla' | 'tc' */
  seccionTab = signal<'plantilla' | 'tc'>('plantilla');

  // ── Config plantilla OC ───────────────────────────────────────────────────
  cfgOC = signal<PlantillaOC>(this.pdfSvc.getCfgOC());
  tcOC  = signal<string[]>([]);

  // ── Config plantilla OS ───────────────────────────────────────────────────
  cfgOS = signal<PlantillaOS>(this.pdfSvc.getCfgOS());
  tcOS  = signal<string[]>([]);

  // ── Preview ───────────────────────────────────────────────────────────────
  previewOCUrl = signal<SafeResourceUrl | null>(null);
  previewOSUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this.tcOC.set([...this.pdfSvc.getTcOC()]);
    this.tcOS.set([...this.pdfSvc.getTcOS()]);
    this.refrescarPreviewOC();
    this.refrescarPreviewOS();
  }

  setTab(t: 'oc' | 'os'): void { this.tabActivo.set(t); }
  setSeccion(s: 'plantilla' | 'tc'): void { this.seccionTab.set(s); }

  // ── Helpers preview ───────────────────────────────────────────────────────

  private buildBlob(html: string): SafeResourceUrl {
    const blob = new Blob([html], { type: 'text/html' });
    return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
  }

  refrescarPreviewOC(): void {
    this.previewOCUrl.set(this.buildBlob(this.pdfSvc.buildPreviewOCHtml()));
  }

  refrescarPreviewOS(): void {
    this.previewOSUrl.set(this.buildBlob(this.pdfSvc.buildPreviewOSHtml()));
  }

  abrirVentana(tipo: 'oc' | 'os'): void {
    const html = tipo === 'oc' ? this.pdfSvc.buildPreviewOCHtml() : this.pdfSvc.buildPreviewOSHtml();
    this.pdfSvc.imprimirOrdenHtml(html, tipo === 'oc' ? 'Vista previa OC' : 'Vista previa OS');
  }

  // ── OC: config plantilla ──────────────────────────────────────────────────

  patchOC(patch: Partial<PlantillaOC>): void {
    this.cfgOC.set({ ...this.cfgOC(), ...patch });
  }

  guardarCfgOC(): void {
    this.pdfSvc.saveCfgOC(this.cfgOC());
    this.refrescarPreviewOC();
    this.alertSvc.showAlertAcept('Configuración de plantilla OC guardada', 'Formato PDF', 'success');
  }

  resetCfgOC(): void {
    this.pdfSvc.resetCfgOC();
    this.cfgOC.set(this.pdfSvc.getCfgOC());
    this.refrescarPreviewOC();
    this.alertSvc.showAlertAcept('Plantilla OC restaurada a valores predeterminados', 'Formato PDF', 'info');
  }

  // ── OS: config plantilla ──────────────────────────────────────────────────

  patchOS(patch: Partial<PlantillaOS>): void {
    this.cfgOS.set({ ...this.cfgOS(), ...patch });
  }

  guardarCfgOS(): void {
    this.pdfSvc.saveCfgOS(this.cfgOS());
    this.refrescarPreviewOS();
    this.alertSvc.showAlertAcept('Configuración de plantilla OS guardada', 'Formato PDF', 'success');
  }

  resetCfgOS(): void {
    this.pdfSvc.resetCfgOS();
    this.cfgOS.set(this.pdfSvc.getCfgOS());
    this.refrescarPreviewOS();
    this.alertSvc.showAlertAcept('Plantilla OS restaurada a valores predeterminados', 'Formato PDF', 'info');
  }

  // ── OS: datos del servicio ────────────────────────────────────────────────

  actualizarDatoOS(idx: number, valor: string): void {
    const arr = [...this.cfgOS().datosServicio];
    arr[idx] = valor;
    this.patchOS({ datosServicio: arr });
  }

  agregarDatoOS(): void {
    this.patchOS({ datosServicio: [...this.cfgOS().datosServicio, ''] });
  }

  eliminarDatoOS(idx: number): void {
    const arr = [...this.cfgOS().datosServicio];
    arr.splice(idx, 1);
    this.patchOS({ datosServicio: arr });
  }

  // ── OC: T&C ───────────────────────────────────────────────────────────────

  actualizarTcOC(idx: number, valor: string): void {
    const arr = [...this.tcOC()]; arr[idx] = valor; this.tcOC.set(arr);
  }
  agregarTcOC(): void { this.tcOC.set([...this.tcOC(), '']); }
  eliminarTcOC(idx: number): void {
    const arr = [...this.tcOC()]; arr.splice(idx, 1); this.tcOC.set(arr);
  }
  guardarTcOC(): void {
    this.pdfSvc.saveTcOC(this.tcOC());
    this.refrescarPreviewOC();
    this.alertSvc.showAlertAcept('T&C de OC guardados', 'Formato PDF', 'success');
  }
  resetTcOC(): void {
    this.pdfSvc.resetTcOC();
    this.tcOC.set([...this.pdfSvc.getTcOC()]);
    this.refrescarPreviewOC();
    this.alertSvc.showAlertAcept('T&C de OC restaurados', 'Formato PDF', 'info');
  }

  // ── OS: T&C ───────────────────────────────────────────────────────────────

  actualizarTcOS(idx: number, valor: string): void {
    const arr = [...this.tcOS()]; arr[idx] = valor; this.tcOS.set(arr);
  }
  agregarTcOS(): void { this.tcOS.set([...this.tcOS(), '']); }
  eliminarTcOS(idx: number): void {
    const arr = [...this.tcOS()]; arr.splice(idx, 1); this.tcOS.set(arr);
  }
  guardarTcOS(): void {
    this.pdfSvc.saveTcOS(this.tcOS());
    this.refrescarPreviewOS();
    this.alertSvc.showAlertAcept('T&C de OS guardados', 'Formato PDF', 'success');
  }
  resetTcOS(): void {
    this.pdfSvc.resetTcOS();
    this.tcOS.set([...this.pdfSvc.getTcOS()]);
    this.refrescarPreviewOS();
    this.alertSvc.showAlertAcept('T&C de OS restaurados', 'Formato PDF', 'info');
  }
}
