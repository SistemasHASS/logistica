import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
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

@Component({
  selector: 'app-seguimiento-compras',
  imports: [CommonModule, FormsModule, TableModule, InputTextModule, MultiSelectModule],
  templateUrl: './seguimiento-compras.component.html',
  styleUrl: './seguimiento-compras.component.scss'
})
export class SeguimientoComprasComponent implements OnInit {

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
      busqueda: '',
      modulo: 'SEGUIMIENTO_REQ_COMPRA'
    }];
    this.logisticaService.reporteSeguimientoCompras(payload).subscribe({
      next: (res: any) => {
        this.data = (Array.isArray(res) ? res : []).map(r => this.enriquecerFila(r));
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

  /** Campos auxiliares para los filtros de columna (menú estilo Excel). */
  readonly etapaOpciones = ETAPAS.map(e => ({ label: ETAPA_LBL[e], value: e }));

  private enriquecerFila(r: any): any {
    r.reqFiltro = [r.id, r.spr]
      .filter(v => v != null && String(v).trim() !== '')
      .map(String)
      .join(' ');
    r.fundoArea = [r.fundo, r.area].filter(Boolean).join(' ');
    r.ocFiltro = (r.ocs || [])
      .map((o: any) => [o.n, o.spr, o.prov, o.est].filter(Boolean).join(' '))
      .join(' ');
    r.etapaFiltro = this.etapaReq(r);
    return r;
  }

  avance(r: any) { return { at: r.linAtend ?? 0, tot: r.totLin ?? 0 }; }

  private matchBusqueda(r: any): boolean {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return true;
    return (r.id || '').toLowerCase().includes(q)
        || (r.spr || '').toLowerCase().includes(q)
        || (r.sol || '').toLowerCase().includes(q)
        || (r.ocs || []).some((o: any) =>
             (o.n || '').toLowerCase().includes(q)
             || (o.prov || '').toLowerCase().includes(q)
             || (o.spr || '').toLowerCase().includes(q))
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

  toggleExpand(id: string) {
    this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id);
  }

  etapaIndex(e: string): number { return ETAPAS.indexOf(e); }

  pctLinea(d: any): number {
    if (!d.ped || d.ped <= 0) return 0;
    return Math.min(100, Math.round(((d.rec ?? 0) / d.ped) * 100));
  }

  notaLinea(d: any): string {
    if (d.etapa === 'EN_PROCESO' && d.ocEst === 'PENDIENTE_APROBACION') return 'OC en aprobación';
    if (d.etapa === 'APROBADO' && d.consol === 0 && d.oc) return 'Liberado por rechazo OC';
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
      EN_PROCESO: { fgColor: { rgb: 'FEF3C7' } },
      CON_OC: { fgColor: { rgb: 'CCFBF1' } }, ATENDIDO: { fgColor: { rgb: 'DCFCE7' } }
    };

    const wb = XLSX.utils.book_new();

    // ---- hoja 1: detalle por ítem ----
    const aoa: any[][] = [[
      'N° Req', 'N° Req SPRING', 'Solicitante', 'Fundo', 'Área', 'F. Registro',
      'F. Aprob. N2', 'Días', 'Etapa Req.',
      'Código', 'Descripción', 'Cantidad', 'Etapa Línea',
      'N° OC', 'OC SPRING', 'Estado OC', 'Proveedor', 'Monto',
      'Cant. Pedida', 'Cant. Recibida', '% Atención',
      'N° NI SPRING', 'Guía Proveedor', 'F. Ingreso', 'Nota'
    ]];

    rows.forEach(r => {
      const et = this.etapaReq(r);
      const ocP = (r.ocs || [])[0] || {};
      (r.det || []).forEach((d: any, i: number) => {
        aoa.push([
          i === 0 ? r.id : '', i === 0 ? r.spr : '', i === 0 ? r.sol : '',
          i === 0 ? r.fundo : '', i === 0 ? r.area : '', i === 0 ? r.freg : '',
          i === 0 ? r.fap : '', i === 0 ? r.dias : '', i === 0 ? ETAPA_LBL[et] : '',
          d.cod, d.desc, d.cant, ETAPA_LBL[d.etapa] ?? d.etapa,
          d.oc || '', ocP.spr || '', d.ocEst || '', d.prov || ocP.prov || '', ocP.monto ?? '',
          d.ped ?? '', d.rec ?? '', (d.ped && d.ped > 0) ? this.pctLinea(d) / 100 : '',
          d.ni || '', d.guia || '', d.fing || '', this.notaLinea(d) || (d.parcial ? 'Recepción parcial' : '')
        ]);
      });
    });

    const wsDet = XLSX.utils.aoa_to_sheet(aoa);
    wsDet['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 11 },
      { wch: 11 }, { wch: 6 }, { wch: 11 }, { wch: 10 }, { wch: 32 }, { wch: 9 }, { wch: 12 },
      { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 24 }, { wch: 12 },
      { wch: 12 }, { wch: 13 }, { wch: 11 }, { wch: 13 }, { wch: 13 }, { wch: 11 }, { wch: 26 }];
    aoa[0].forEach((_c: any, i: number) => {
      const cell = wsDet[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) cell.s = { fill: headFill, font: headFont, border };
    });
    aoa.forEach((_row: any[], ri: number) => {
      if (ri === 0) return;
      const etapaCell = wsDet[XLSX.utils.encode_cell({ r: ri, c: 12 })];
      if (etapaCell?.v) {
        const key = Object.keys(ETAPA_LBL).find(k => ETAPA_LBL[k] === etapaCell.v);
        if (key) etapaCell.s = { fill: etapaFill[key], font: { bold: true }, border };
      }
      const pct = wsDet[XLSX.utils.encode_cell({ r: ri, c: 20 })];
      if (pct && typeof pct.v === 'number') pct.z = '0%';
    });
    XLSX.utils.book_append_sheet(wb, wsDet, 'Detalle por ítem');

    // ---- hoja 2: resumen por req ----
    const res: any[][] = [[
      'N° Req', 'N° Req SPRING', 'Solicitante', 'Fundo', 'Área',
      'F. Registro', 'F. Aprob. N2', 'Días', 'Etapa',
      'Ítems atendidos', 'Ítems totales', '% Avance',
      'OC(s)', 'Estado OC', 'Proveedor', 'Monto', 'OC Rechazada'
    ]];
    rows.forEach(r => {
      const av = this.avance(r);
      res.push([
        r.id, r.spr || '', r.sol || '', r.fundo || '', r.area || '',
        r.freg || '', r.fap || '', r.dias ?? '', ETAPA_LBL[this.etapaReq(r)],
        av.at, av.tot, av.tot ? av.at / av.tot : 0,
        (r.ocs || []).map((o: any) => o.n).join(' / '),
        (r.ocs || []).map((o: any) => o.est).join(' / '),
        (r.ocs || []).map((o: any) => o.prov).join(' / '),
        (r.ocs || []).map((o: any) => o.monto).join(' / '),
        r.ocRech ? 'SÍ' : 'NO'
      ]);
    });
    const wsRes = XLSX.utils.aoa_to_sheet(res);
    wsRes['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 11 },
      { wch: 11 }, { wch: 6 }, { wch: 11 }, { wch: 14 }, { wch: 12 }, { wch: 9 },
      { wch: 30 }, { wch: 20 }, { wch: 26 }, { wch: 14 }, { wch: 12 }];
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
    FileSaver.saveAs(new Blob([buf]), `seguimiento_req_compra${suf}.xlsx`);
  }
}
