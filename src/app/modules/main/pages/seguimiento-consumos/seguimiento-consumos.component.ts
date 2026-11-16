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
const ETAPAS = ['PENDIENTE', 'APROBADO', 'EN_ATENCION', 'DESPACHADO', 'CONFORME'];
const ETAPA_LBL: Record<string, string> = {
  PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', EN_ATENCION: 'En Atención', DESPACHADO: 'Despachado', CONFORME: 'Conforme'
};
const ETAPA_CLS: Record<string, string> = {
  PENDIENTE: 'b-pend', APROBADO: 'b-ap', EN_ATENCION: 'b-ep', DESPACHADO: 'b-oc', CONFORME: 'b-at'
};

@Component({
  selector: 'app-seguimiento-consumos',
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './seguimiento-consumos.component.html',
  styleUrl: './seguimiento-consumos.component.scss'
})
export class SeguimientoConsumosComponent implements OnInit {

  readonly etapas = ETAPAS;
  readonly etapaLbl = ETAPA_LBL;
  readonly etapaCls = ETAPA_CLS;

  // filtros
  fdesde = '';
  fhasta = '';
  fidfundo = '';
  fidarea = '';
  busqueda = '';
  filtroEstado = 'TODOS';

  // data
  data: any[] = [];
  expanded = new Set<string>();
  cargando = false;
  error = '';

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
    this.expanded.clear();
    const payload = [{
      ruc: this.usuario.ruc,
      desde: this.fdesde,
      hasta: this.fhasta,
      estado: this.filtroEstado,
      idrol: this.usuario.idrol,
      dniusuario: this.usuario.documentoidentidad,
      idfundo: this.fidfundo || null,
      idarea: this.fidarea || null,
      busqueda: ''
    }];
    this.logisticaService.reporteSeguimientoConsumos(payload).subscribe({
      next: (res: any) => {
        this.data = Array.isArray(res) ? res : [];
        this.cargando = false;
      },
      error: () => {
        this.data = [];
        this.error = 'No se pudo cargar el reporte. Intente nuevamente.';
        this.cargando = false;
      }
    });
  }

  setFiltro(f: string) { this.filtroEstado = f; }

  /* ---------- derivados ---------- */
  etapaReq(r: any): string { return ETAPAS[r.etapaNum ?? 1] ?? 'APROBADO'; }

  avance(r: any) { return { at: r.linAtend ?? 0, tot: r.totLin ?? 0 }; }

  private matchBusqueda(r: any): boolean {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return true;
    return (r.id || '').toLowerCase().includes(q)
        || (r.spr || '').toLowerCase().includes(q)
        || (r.sol || '').toLowerCase().includes(q)
        || (r.nss || []).some((n: any) =>
             (n.n || '').toLowerCase().includes(q)
             || (n.usr || '').toLowerCase().includes(q))
        || (r.det || []).some((d: any) =>
             (d.cod || '').toLowerCase().includes(q)
             || (d.desc || '').toLowerCase().includes(q));
  }

  get dataFiltrada(): any[] {
    return this.data.filter(r =>
      (this.filtroEstado === 'TODOS' || this.etapaReq(r) === this.filtroEstado)
      && this.matchBusqueda(r));
  }

  kpi(etapa: string): number {
    return this.data.filter(r => this.etapaReq(r) === etapa && this.matchBusqueda(r)).length;
  }

  tieneParcial(r: any): boolean {
    return (r.det || []).some((d: any) => d.parcial);
  }

  esSinStock(r: any): boolean {
    return r.estadosReq === 'SIN_STOCK';
  }

  toggleExpand(id: string) {
    this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id);
  }

  etapaIndex(e: string): number { return ETAPAS.indexOf(e); }

  pctLinea(d: any): number {
    if (!d.cant || d.cant <= 0) return 0;
    return Math.min(100, Math.round(((d.desp ?? 0) / d.cant) * 100));
  }

  notaLinea(d: any): string {
    if (d.etapa === 'EN_ATENCION') return 'Atención parcial';
    if (d.etapa === 'DESPACHADO') return 'Falta conformidad';
    return '';
  }

  /* ---------- exportar ---------- */
  exportarExcel() {
    const rows = this.dataFiltrada;
    if (!rows.length) return;

    const headFill = { fgColor: { rgb: '1F3864' } };
    const headFont = { color: { rgb: 'FFFFFF' }, bold: true, sz: 10 };
    const border = {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    };
    const etapaFill: Record<string, any> = {
      PENDIENTE: { fgColor: { rgb: 'E2E8F0' } }, APROBADO: { fgColor: { rgb: 'DBEAFE' } },
      EN_ATENCION: { fgColor: { rgb: 'FEF3C7' } },
      DESPACHADO: { fgColor: { rgb: 'CCFBF1' } }, CONFORME: { fgColor: { rgb: 'DCFCE7' } }
    };

    const wb = XLSX.utils.book_new();

    // ---- hoja 1: detalle por ítem ----
    const aoa: any[][] = [[
      'N° Req', 'Solicitante', 'Fundo', 'Área', 'Almacén', 'F. Registro',
      'F. Aprob. N2', 'Días', 'Etapa Req.',
      'Código', 'Descripción', 'UM', 'Cantidad', 'Etapa Línea',
      'Despachado', 'Pendiente', '% Atención',
      'N° Despachos', 'Última NS', 'Usuario Desp.', 'F. Despacho', 'Nota'
    ]];

    rows.forEach(r => {
      const et = this.etapaReq(r);
      (r.det || []).forEach((d: any, i: number) => {
        aoa.push([
          i === 0 ? r.id : '', i === 0 ? r.sol : '',
          i === 0 ? r.fundo : '', i === 0 ? r.area : '', i === 0 ? r.alm : '', i === 0 ? r.freg : '',
          i === 0 ? r.fap : '', i === 0 ? r.dias : '', i === 0 ? ETAPA_LBL[et] : '',
          d.cod, d.desc, d.um, d.cant, ETAPA_LBL[d.etapa] ?? d.etapa,
          d.desp ?? 0, d.pend ?? '', (d.cant && d.cant > 0) ? this.pctLinea(d) / 100 : '',
          d.nDesp ?? '', d.ns || '', d.usr || '', d.fdesp || '',
          this.notaLinea(d) || (d.parcial ? 'Despacho parcial' : '')
        ]);
      });
    });

    const wsDet = XLSX.utils.aoa_to_sheet(aoa);
    wsDet['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 11 },
      { wch: 11 }, { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 32 }, { wch: 8 }, { wch: 9 },
      { wch: 12 }, { wch: 11 }, { wch: 10 }, { wch: 11 }, { wch: 11 }, { wch: 16 }, { wch: 14 },
      { wch: 11 }, { wch: 24 }];
    aoa[0].forEach((_c: any, i: number) => {
      const cell = wsDet[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) cell.s = { fill: headFill, font: headFont, border };
    });
    aoa.forEach((_row: any[], ri: number) => {
      if (ri === 0) return;
      const etapaCell = wsDet[XLSX.utils.encode_cell({ r: ri, c: 13 })];
      if (etapaCell?.v) {
        const key = Object.keys(ETAPA_LBL).find(k => ETAPA_LBL[k] === etapaCell.v);
        if (key) etapaCell.s = { fill: etapaFill[key], font: { bold: true }, border };
      }
      const pct = wsDet[XLSX.utils.encode_cell({ r: ri, c: 16 })];
      if (pct && typeof pct.v === 'number') pct.z = '0%';
    });
    XLSX.utils.book_append_sheet(wb, wsDet, 'Detalle por ítem');

    // ---- hoja 2: resumen por req ----
    const res: any[][] = [[
      'N° Req', 'Solicitante', 'Fundo', 'Área', 'Almacén',
      'F. Registro', 'F. Aprob. N2', 'Días', 'Etapa',
      'Ítems atendidos', 'Ítems totales', '% Avance',
      'Nota(s) de Salida', 'Estado despacho', 'Conformidad', 'Sin Stock'
    ]];
    rows.forEach(r => {
      const av = this.avance(r);
      res.push([
        r.id, r.sol || '', r.fundo || '', r.area || '', r.alm || '',
        r.freg || '', r.fap || '', r.dias ?? '', ETAPA_LBL[this.etapaReq(r)],
        av.at, av.tot, av.tot ? av.at / av.tot : 0,
        (r.nss || []).map((n: any) => n.n).join(' / '),
        (r.nss || []).map((n: any) => n.est).join(' / '),
        (r.nss || []).map((n: any) => n.conf).join(' / '),
        this.esSinStock(r) ? 'SÍ' : 'NO'
      ]);
    });
    const wsRes = XLSX.utils.aoa_to_sheet(res);
    wsRes['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 11 },
      { wch: 11 }, { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 9 },
      { wch: 30 }, { wch: 20 }, { wch: 16 }, { wch: 10 }];
    res[0].forEach((_c: any, i: number) => {
      const cell = wsRes[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) cell.s = { fill: headFill, font: headFont, border };
    });
    res.forEach((_row: any[], ri: number) => {
      if (ri === 0) return;
      const etapaCell = wsRes[XLSX.utils.encode_cell({ r: ri, c: 8 })];
      if (etapaCell?.v) {
        const key = Object.keys(ETAPA_LBL).find(k => ETAPA_LBL[k] === etapaCell.v);
        if (key) etapaCell.s = { fill: etapaFill[key], font: { bold: true }, border };
      }
      const pct = wsRes[XLSX.utils.encode_cell({ r: ri, c: 11 })];
      if (pct && typeof pct.v === 'number') pct.z = '0%';
    });
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen por req');

    const suf = this.filtroEstado === 'TODOS' ? '' : '_' + this.filtroEstado.toLowerCase();
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(new Blob([buf]), `seguimiento_req_consumo${suf}.xlsx`);
  }
}
