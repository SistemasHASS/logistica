import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import * as XLSX from 'xlsx-js-style';
import FileSaver from 'file-saver';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Almacen, Empresa, Fundo } from '@/app/shared/interfaces/Tables';
import { LogisticaService } from '../../services/logistica.service';

@Component({
  selector: 'app-reporte-requerimientos',
  imports: [CommonModule, FormsModule, TableModule],
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

  empresas: Empresa[] = [];
  fundos: Fundo[] = [];
  almacenes: Almacen[] = [];

  constructor(
    private logisticaService: LogisticaService,
    private dexieService: DexieService
  ) { }

  async ngOnInit() {
    await this.cargarMaestros();
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

  listarReporte() {
    this.logisticaService.reporteRequerimientos([{}]).subscribe((res: any[]) => {
      this.data = res;
      console.log(res);

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
        this.columnas.splice(indexRequisicion, 1);
        this.columnas.unshift('RequisicionNumero');
      }

      console.log(this.columnas);
      this.aplicarFiltro();
    });
  }

  aplicarFiltro() {
    const filtroNormalizado = (this.filtro || '').toLowerCase().trim();

    if (!filtroNormalizado) {
      this.dataFiltrada = this.data;
      return;
    }

    this.dataFiltrada = this.data.filter(row =>
      this.columnas.some(col => {
        const valor = row[col];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(filtroNormalizado);
      })
    );
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
