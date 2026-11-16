import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import * as XLSX from 'xlsx-js-style';
import FileSaver from 'file-saver';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Almacen, Empresa, Fundo, Usuario } from '@/app/shared/interfaces/Tables';
import { LogisticaService } from '../../services/logistica.service';
import moment from 'moment';

const ETAPAS = ['PENDIENTE', 'APROBADO', 'EN_PROCESO', 'CON_OC', 'ATENDIDO'];
const ETAPA_LBL: Record<string, string> = {
  PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', EN_PROCESO: 'En Proceso', CON_OC: 'Con OC', ATENDIDO: 'Atendido'
};
const ETAPA_CLS: Record<string, string> = {
  PENDIENTE: 'b-pend', APROBADO: 'b-ap', EN_PROCESO: 'b-ep', CON_OC: 'b-oc', ATENDIDO: 'b-at'
};

interface DetRow {
  req: any;      // referencia a cabecera
  det: any;      // línea
  reqNum: string; // N° requerimiento mostrado (spr o id interno)
}

@Component({
  selector: 'app-analisis-req-compra',
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './analisis-req-compra.component.html',
  styleUrl: './analisis-req-compra.component.scss'
})
export class AnalisisReqCompraComponent implements OnInit {

  readonly etapas = ETAPAS;
  readonly etapaLbl = ETAPA_LBL;
  readonly etapaCls = ETAPA_CLS;

  fdesde = '';
  fhasta = '';
  fidfundo = '';
  busqueda = '';
  filtroEstado = 'TODOS';
  tabActivo: 'req' | 'det' = 'req';

  data: any[] = [];
  cargando = false;
  error = '';
  sinAcceso = false;
  mensajeAcceso = '';

  empresas: Empresa[] = [];
  fundos: Fundo[] = [];
  almacenes: Almacen[] = [];
  usuario: Usuario | null = null;

  constructor(
    private logisticaService: LogisticaService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    this.fdesde = moment().subtract(90, 'days').format('YYYY-MM-DD');
    this.fhasta = moment().format('YYYY-MM-DD');
    await this.cargarMaestros();
    await this.cargarUsuario();
    this.buscar();
  }

  async cargarUsuario() {
    this.usuario = (await this.dexieService.obtenerPrimerUsuario()) ?? null;
  }

  private async cargarMaestros() {
    try { this.empresas = await this.dexieService.showEmpresas(); } catch { this.empresas = []; }
    try { this.fundos = await this.dexieService.showFundos(); } catch { this.fundos = []; }
    try { this.almacenes = await this.dexieService.showAlmacenes(); } catch { this.almacenes = []; }
  }

  buscar() {
    if (!this.usuario?.ruc) return;
    this.cargando = true;
    this.error = '';
    this.sinAcceso = false;
    const payload = [{
      ruc: this.usuario.ruc,
      desde: this.fdesde,
      hasta: this.fhasta,
      estado: 'TODOS',
      idrol: this.usuario.idrol,
      dniusuario: this.usuario.documentoidentidad,
      idfundo: this.fidfundo || null,
      busqueda: '',
      modulo: 'ANALISIS_REQ_COMPRA'
    }];
    this.logisticaService.reporteSeguimientoComprasAnalisis(payload).subscribe({
      next: (res: any) => {
        if (res && res.status === 'SIN_ACCESO') {
          this.sinAcceso = true;
          this.mensajeAcceso = res.mensaje || 'Reporte de acceso restringido.';
          this.data = [];
        } else {
          this.data = Array.isArray(res) ? res : [];
        }
        this.cargando = false;
      },
      error: () => {
        this.data = [];
        this.error = 'No se pudo cargar el reporte. Intente nuevamente.';
        this.cargando = false;
      }
    });
  }

  /* ---------- derivados ---------- */
  etapaReq(r: any): string { return ETAPAS[r.etapaNum ?? 1] ?? 'APROBADO'; }

  get flatDet(): DetRow[] {
    const out: DetRow[] = [];
    for (const r of this.dataFiltrada) {
      for (const d of (r.det || [])) out.push({ req: r, det: d, reqNum: r.spr || r.id });
    }
    return out;
  }

  private matchBusqueda(r: any): boolean {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return true;
    return (r.id || '').toLowerCase().includes(q)
        || (r.spr || '').toLowerCase().includes(q)
        || (r.sol || '').toLowerCase().includes(q)
        || (r.ocs || []).some((o: any) =>
             (o.n || '').toLowerCase().includes(q) || (o.prov || '').toLowerCase().includes(q))
        || (r.det || []).some((d: any) =>
             (d.cod || '').toLowerCase().includes(q) || (d.desc || '').toLowerCase().includes(q));
  }

  get dataFiltrada(): any[] {
    return this.data.filter(r =>
      (this.filtroEstado === 'TODOS' || this.etapaReq(r) === this.filtroEstado)
      && this.matchBusqueda(r));
  }

  /* KPIs de análisis */
  get totalReqs()    { return this.dataFiltrada.length; }
  get totalLineas()  { return this.dataFiltrada.reduce((s, r) => s + (r.totLin ?? 0), 0); }
  get pctAtencion(): number {
    const tot = this.totalLineas;
    if (!tot) return 0;
    const at = this.dataFiltrada.reduce((s, r) => s + (r.linAtend ?? 0), 0);
    return Math.round((at / tot) * 100);
  }
  get montoTotal(): number {
    return this.dataFiltrada.reduce((s, r) =>
      s + (r.ocs || []).filter((o: any) => o.est !== 'RECHAZADA' && o.est !== 'ANULADA')
           .reduce((a: number, o: any) => a + (+o.monto || 0), 0), 0);
  }
  get leadProm(): string {
    const vals = this.dataFiltrada
      .map(r => (r.dApOc ?? 0) + (r.dOcIng ?? 0))
      .filter(v => v > 0);
    if (!vals.length) return '—';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) + 'd';
  }
  get dApOcProm(): string {
    const vals = this.dataFiltrada.map(r => r.dApOc).filter(v => v != null && v >= 0);
    if (!vals.length) return '—';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) + 'd';
  }

  leadClass(v: number | null): string {
    if (v == null) return '';
    if (v <= 7) return 'lead-ok';
    if (v <= 20) return 'lead-warn';
    return 'lead-bad';
  }

  /* ---------- exportar ---------- */
  exportarExcel() {
    const rows = this.dataFiltrada;
    if (!rows.length) return;

    const headFill = { fgColor: { rgb: '1F3864' } };
    const headFont = { color: { rgb: 'FFFFFF' }, bold: true, sz: 10 };
    const etapaFill: Record<string, any> = {
      PENDIENTE: { fgColor: { rgb: 'E2E8F0' } }, APROBADO: { fgColor: { rgb: 'DBEAFE' } },
      EN_PROCESO: { fgColor: { rgb: 'FEF3C7' } },
      CON_OC: { fgColor: { rgb: 'CCFBF1' } }, ATENDIDO: { fgColor: { rgb: 'DCFCE7' } }
    };
    const wb = XLSX.utils.book_new();

    // ---- hoja Requerimientos ----
    const reqAoa: any[][] = [[
      'N° Req', 'Req SPRING', 'Prioridad', 'Solicitante', 'DNI', 'Fundo', 'Área', 'Almacén',
      'F. Registro', 'F. Aprob. N2', 'Aprobador N2', 'Etapa', 'Atendidos', 'Total',
      'OC(s)', 'OC SPRING', 'Estado OC', 'Proveedor', 'Monto',
      'Días AprobN2→OC', 'Días OC→Ingreso', 'Lead Time', 'OC Rechazada'
    ]];
    rows.forEach(r => {
      reqAoa.push([
        r.id, r.spr || '', r.pri || '', r.sol || '', r.dni || '', r.fundo || '', r.area || '', r.almDest || r.alm || '',
        r.freg || '', r.fap || '', r.apN2 || '', ETAPA_LBL[this.etapaReq(r)], r.linAtend ?? 0, r.totLin ?? 0,
        (r.ocs || []).map((o: any) => o.n).join(' / '),
        (r.ocs || []).map((o: any) => o.spr).join(' / '),
        (r.ocs || []).map((o: any) => o.est).join(' / '),
        (r.ocs || []).map((o: any) => o.prov).join(' / '),
        (r.ocs || []).map((o: any) => o.monto).join(' / '),
        r.dApOc ?? '', r.dOcIng ?? '',
        (r.dApOc != null && r.dOcIng != null) ? r.dApOc + r.dOcIng : '',
        r.ocRech ? 'SÍ' : 'NO'
      ]);
    });
    const wsReq = XLSX.utils.aoa_to_sheet(reqAoa);
    wsReq['!cols'] = reqAoa[0].map((_h, i) => ({ wch: [16, 13, 9, 20, 11, 11, 14, 10, 11, 11, 18, 12, 10, 7, 30, 14, 22, 26, 14, 15, 15, 10, 12][i] || 12 }));
    this.estilizar(wsReq, reqAoa, 11, etapaFill, headFill, headFont);
    XLSX.utils.book_append_sheet(wb, wsReq, 'Requerimientos');

    // ---- hoja Detalles ----
    const detAoa: any[][] = [[
      'N° Req', 'Solicitante', 'Fundo', 'Etapa Req.',
      'Código', 'Descripción', 'UM', 'Cant.', 'Ceco', 'Proyecto', 'Partida', 'Turno', 'Labor',
      'Etapa Línea', 'Consol.', 'N° OC', 'Sec. OC', 'Estado OC', 'Proveedor', 'P. Unit.',
      'Pedida', 'Recibida', 'Pendiente', '% Atención', 'N° NI', 'Guía', 'F. Ingreso', 'Días Etapa'
    ]];
    this.flatDet.forEach(({ req: r, det: d }) => {
      detAoa.push([
        r.spr || r.id, r.sol, r.fundo || '', ETAPA_LBL[this.etapaReq(r)],
        d.cod, d.desc, d.um || '', d.cant, d.ceco || '', d.proy || '', d.partida || '', d.turno || '', d.labor || '',
        ETAPA_LBL[d.etapa] ?? d.etapa, d.consol ? 'SÍ' : 'NO',
        d.oc || '', d.sec ?? '', d.ocEst || '', d.prov || '', d.pu ?? '',
        d.ped ?? '', d.rec ?? '', (d.ped != null && d.rec != null) ? d.ped - d.rec : '',
        (d.ped && d.ped > 0) ? Math.min(1, (d.rec ?? 0) / d.ped) : '',
        d.ni || '', d.guia || '', d.fing || '', d.dEtapa ?? ''
      ]);
    });
    const wsDet = XLSX.utils.aoa_to_sheet(detAoa);
    wsDet['!cols'] = detAoa[0].map((_h, i) => ({ wch: [16, 18, 10, 11, 10, 30, 6, 8, 10, 10, 10, 8, 8, 12, 7, 18, 7, 18, 24, 10, 8, 9, 9, 10, 13, 12, 11, 10][i] || 10 }));
    this.estilizar(wsDet, detAoa, 13, etapaFill, headFill, headFont);
    // % atención col 23
    detAoa.forEach((_r, ri) => {
      if (ri === 0) return;
      const pct = wsDet[XLSX.utils.encode_cell({ r: ri, c: 23 })];
      if (pct && typeof pct.v === 'number') pct.z = '0%';
    });
    XLSX.utils.book_append_sheet(wb, wsDet, 'Detalles por ítem');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(new Blob([buf]), 'analisis_req_compra.xlsx');
  }

  private estilizar(ws: any, aoa: any[][], colEtapa: number, etapaFill: any, headFill: any, headFont: any) {
    aoa[0].forEach((_c: any, i: number) => {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) cell.s = { fill: headFill, font: headFont };
    });
    const lbl2key: Record<string, string> = Object.fromEntries(
      Object.entries(ETAPA_LBL).map(([k, v]) => [v, k]));
    aoa.forEach((_row: any[], ri: number) => {
      if (ri === 0) return;
      const cell = ws[XLSX.utils.encode_cell({ r: ri, c: colEtapa })];
      const key = lbl2key[cell?.v];
      if (key) cell.s = { fill: etapaFill[key], font: { bold: true } };
    });
  }
}
