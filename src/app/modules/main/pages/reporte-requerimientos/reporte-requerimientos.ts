import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogisticaService } from '../../services/logistica.service';

@Component({
  selector: 'app-reporte-requerimientos',
  imports: [CommonModule, FormsModule],
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

  constructor(
    private logisticaService: LogisticaService
  ) { }

  ngOnInit(): void {
    
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
    console.log(this.fdesde, this.fhasta);
  }
}
