import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import * as XLSX from 'xlsx-js-style';
import FileSaver from 'file-saver';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Almacen, Empresa, Fundo, Usuario } from '@/app/shared/interfaces/Tables';
import { LogisticaService } from '../../services/logistica.service';
import moment from 'moment';

@Component({
  selector: 'app-reporte-requerimientos',
  imports: [CommonModule, FormsModule, TableModule, PaginatorModule],
  templateUrl: './reporte-requerimientos.html',
  styleUrl: './reporte-requerimientos.scss'
})
export class ReporteRequerimientos {

  fdesde: string = '';
  fhasta: string = '';

  data: any[] = [];
  columnas: string[] = [];
  filtro: string = '';
  dataFiltrada: any[] = [];

  // Paginación para cards (vista mobile)
  cardFirst = 0;
  cardRows = 10;

  empresas: Empresa[] = [];
  fundos: Fundo[] = [];
  almacenes: Almacen[] = [];
  usuario: Usuario = {
    id: '',
    sociedad: 0,
    idempresa: '',
    ruc: '',
    razonSocial: '',
    idProyecto: '',
    proyecto: '',
    documentoidentidad: '',
    usuario: '',
    clave: '',
    nombre: '',
    idrol: '',
    rol: '',
  };

  constructor(
    private logisticaService: LogisticaService,
    private dexieService: DexieService
  ) { }

  async ngOnInit() {
    await this.cargarMaestros();
    await this.cargarUsuario();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  private async cargarMaestros() {
    try {
      this.empresas = await this.dexieService.showEmpresas();
    } catch {
      this.empresas = [];
    }

    try {
      this.fundos = await this.dexieService.showFundos();
    } catch {
      this.fundos = [];
    }

    try {
      this.almacenes = await this.dexieService.showAlmacenes();
    } catch {
      this.almacenes = [];
    }
  }

  formatoReporteListar(){
    return [
      {
        ruc: this.usuario?.ruc,
        desde: this.fdesde,
        hasta: this.fhasta,
        dniusuario: this.usuario?.documentoidentidad,
        idrol: this.usuario?.idrol
      }
    ]
  }

  listarReporte() {
    const formato = this.formatoReporteListar()
    this.logisticaService.reporteRequerimientos(formato).subscribe((res: any[]) => {
      this.data = res

      // Formatear fecharegistro a dd/mm/yyyy
      this.data = this.data.map(item => {
        if (item.fecharegistro) {
          item.fecharegistro = moment(item.fecharegistro).format('DD/MM/YYYY');
        }
        return item;
      });

      // Ordenar por fecharegistro descendente y poner 'PENDIENTE' primero
      this.data.sort((a, b) => {
        // Primero ordenar por estado: PENDIENTE va primero
        const aEstado = (a.estados || '').toUpperCase();
        const bEstado = (b.estados || '').toUpperCase();
        
        if (aEstado === 'PENDIENTE' && bEstado !== 'PENDIENTE') {
          return -1;
        }
        if (aEstado !== 'PENDIENTE' && bEstado === 'PENDIENTE') {
          return 1;
        }
        
        // Si ambos tienen el mismo estado, ordenar por fecha descendente
        const fechaA = moment(a.fecharegistro, 'DD/MM/YYYY');
        const fechaB = moment(b.fecharegistro, 'DD/MM/YYYY');
        
        if (fechaA.isValid() && fechaB.isValid()) {
          return fechaB.diff(fechaA); // descendente
        }
        
        return 0;
      });

      const columnasExcluidas = [
        'id',
        'dniedita',
        'fechaedicion',
        'dnielimina',
        'servicio'
      ];

      this.columnas = Array.from(
        new Set(
          res.flatMap(obj => Object.keys(obj))
        )
      ).filter(col => !columnasExcluidas.includes(col));

      const indexRequisicion = this.columnas.indexOf('RequisicionNumero');
      if (indexRequisicion > 0) {
        this.columnas.splice(indexRequisicion, 2);
        this.columnas.unshift('RequisicionNumero');
      }
      const indexFecha = this.columnas.indexOf('fecharegistro');
      if (indexFecha > 0) {
        this.columnas.splice(indexFecha, 1);
        this.columnas.unshift('fecharegistro');
      }
      const indexGlosa = this.columnas.indexOf('glosa');
      if (indexGlosa > 0) {
        this.columnas.splice(indexGlosa, 1);
        this.columnas.splice(3, 0, 'glosa');
      }

      console.log(this.columnas);
      this.aplicarFiltro();
    });
  }

  aplicarFiltro() {
    const filtroNormalizado = (this.filtro || '').toLowerCase().trim();

    if (!filtroNormalizado) {
      this.dataFiltrada = this.data;
      this.cardFirst = 0;
      return;
    }

    this.dataFiltrada = this.data.filter(row =>
      this.columnas.some(col => {
        const valor = row[col];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(filtroNormalizado);
      })
    );
    this.cardFirst = 0;
  }

  // Nota: tipamos como `any` para evitar incompatibilidades del type-checker
  // (PrimeNG emite `PaginatorState` con props opcionales según versión)
  onCardPageChange(event: any) {
    this.cardFirst = event.first ?? 0;
    this.cardRows = event.rows ?? this.cardRows;
  }

  get dataFiltradaPaginada(): any[] {
    const start = this.cardFirst ?? 0;
    const rows = this.cardRows ?? 10;
    return (this.dataFiltrada ?? []).slice(start, start + rows);
  }

  exportarExcel() {
    const dataToExport = this.dataFiltrada.length ? this.dataFiltrada : this.data;

    if (!dataToExport || dataToExport.length === 0 || this.columnas.length === 0) {
      return;
    }

    const headers = this.columnas.map(col => this.getHeaderLabel(col));
    const rows = dataToExport.map(row =>
      this.columnas.map(col => this.getDisplayValue(col, row))
    );

    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      ...rows
    ]);

    const lastColLetter = this.getExcelColumnLetter(this.columnas.length - 1);
    const lastRowNumber = rows.length + 1;
    worksheet['!autofilter'] = { ref: `A1:${lastColLetter}${lastRowNumber}` };

    const workbook = {
      Sheets: { Reporte: worksheet },
      SheetNames: ['Reporte']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'reporte_requerimientos.xlsx');
  }

  getHeaderLabel(col: string): string {
    const lowerKey = col.toLowerCase();

    if (lowerKey === 'ruc') {
      return 'Empresa';
    }

    if (lowerKey === 'idfundo') {
      return 'Fundo';
    }

    if (lowerKey === 'idalmacen') {
      return 'Almacén';
    }

    if (lowerKey === 'idalmacendestino') {
      return 'Almacén Destino';
    }

    if (lowerKey === 'idclasificacion') {
      return 'Clasificación';
    }

    return col.toUpperCase().replace('_', ' ');
  }

  getDisplayValue(col: string, row: any): any {
    const lowerKey = col.toLowerCase();

    if (lowerKey === 'aprobado') {
      const value = row[col];
      return value ? 'Aprobado' : 'No Aprobado';
    }

    return this.mapCellValue(col, row);
  }

  // Helpers para cards (porque el API puede traer nombres de campos distintos)
  getUsuarioCard(row: any): string {
    const value =
      row?.nrodocumento ??
      row?.usuario ??
      row?.user ??
      row?.dni ??
      row?.documento ??
      row?.nroDocumento;
    return value !== null && value !== undefined ? String(value) : '';
  }

  getNombreAlmacenCard(row: any, key: 'idalmacen' | 'idalmacendestino' = 'idalmacen'): string {
    const id =
      row?.[key] ??
      row?.[key.toUpperCase()] ??
      row?.[key === 'idalmacen' ? 'IdAlmacen' : 'IdAlmacenDestino'];
    return this.getNombreAlmacenPorId(id);
  }

  private mapCellValue(col: string, row: any): any {
    const key = col;
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'ruc') {
      const ruc = row[key] ?? row['ruc'] ?? row['RUC'];
      return this.getNombreEmpresaPorRuc(String(ruc ?? ''));
    }

    if (lowerKey === 'idfundo') {
      const idfundo = row[key] ?? row['idfundo'] ?? row['IDFUNDO'];
      const ruc = row['ruc'] ?? row['RUC'];
      return this.getNombreFundoPorCodigo(String(idfundo ?? ''), String(ruc ?? ''));
    }

    if (lowerKey === 'idalmacen' || lowerKey === 'idalmacendestino') {
      const idalmacen = row[key];
      return this.getNombreAlmacenPorId(idalmacen);
    }

    return row[key];
  }

  private getNombreEmpresaPorRuc(ruc: string): string {
    if (!ruc) {
      return '';
    }

    const empresa = this.empresas.find(e => e.ruc === ruc);
    return empresa?.razonsocial ?? ruc;
  }

  private getNombreFundoPorCodigo(codigoFundo: string, ruc: string): string {
    if (!codigoFundo) {
      return '';
    }

    const empresa = this.empresas.find(e => e.ruc === ruc);
    if (!empresa) {
      return codigoFundo;
    }

    const fundo = this.fundos
      .filter(f => f.empresa === empresa.empresa)
      .find(f => f.codigoFundo == codigoFundo);

    return fundo?.nombreFundo ?? codigoFundo;
  }

  private getNombreAlmacenPorId(id: any): string {
    if (id === null || id === undefined || id === '') {
      return '';
    }

    const idStr = String(id);
    const almacen = this.almacenes.find(a => String(a.idalmacen) === idStr);
    return almacen?.almacen ?? idStr;
  }

  private getExcelColumnLetter(index: number): string {
    let result = '';
    let n = index + 1;

    while (n > 0) {
      const rem = (n - 1) % 26;
      result = String.fromCharCode(65 + rem) + result;
      n = Math.floor((n - 1) / 26);
    }

    return result;
  }
}
