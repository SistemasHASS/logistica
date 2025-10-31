import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from 'src/app/shared/dixiedb/dexie-db.service';
import { ReporteService } from '../../services/reporte.service';
import moment from 'moment';
import * as XLSX from 'xlsx-js-style';
import FileSaver from 'file-saver';
import * as ExcelJS from 'exceljs';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts';
import { Usuario } from '@/app/shared/interfaces/Tables';

@Component({
    selector: 'app-reporte_logistico',
    imports: [CommonModule, FormsModule],
    templateUrl: './reporte_logistico.component.html',
    styleUrl: './reporte_logistico.component.scss'
})
export class ReporteLogisticoComponent {
    data: any = [];
    columns: any = [];
    body: any = [];
    columnas: string[] = [];
    usuario: Usuario = {
        id: '',
        sociedad: 0,
        idempresa: '',
        ruc: '',
        razonSocial: '',
        idProyecto: '',
        proyecto: '',
        documentoIdentidad: '',
        usuario: '',
        clave: '',
        nombre: '',
        idrol: '',
        rol: ''
    }

    fdesde: any;
    fhasta: any;
    // activeTab = 'home';
    activeTab: string = '';
    nombreReporte: string = 'Seleccione un reporte'; // título dinámico


    constructor(
        private dexieService: DexieService,
        private reporteService: ReporteService,
        private alertService: AlertService
    ) { }

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    async ngOnInit() {
        this.actualizarNombreReporte(); // inicializa el texto
        const usuario = await this.dexieService.showUsuario();
        if (usuario) {
            this.usuario = usuario;
        }
        this.fdesde = this.getDate();
        this.fhasta = this.getDate();
    }

    actualizarNombreReporte() {
        if (this.activeTab === 'consumo') {
            this.nombreReporte = 'Reporte de Consumo';
        } else if (this.activeTab === 'transferencia') {
            this.nombreReporte = 'Reporte de Transferencia';
        } else {
            this.nombreReporte = 'Seleccione un reporte';
        }
    }

    async listarReporte() {

        if (!this.activeTab) {
            this.alertService.showAlert('Aviso', 'Debe seleccionar un tipo de reporte', 'info');
            return;
        }
        this.alertService.mostrarModalCarga();
        const formato = await this.getFormatoReporte();

        switch (this.activeTab) {
            // case "home": {
            //     const formato = await this.getFormatoReporte()
            //     const result = await this.reporteService.reporteConsumo(formato)
            //     this.alertService.cerrarModalCarga();
            //     if (result.length > 0) {
            //         this.data = result
            //         this.columnas = Object.keys(this.data[0]);
            //     } else {
            //         this.data.length = 0
            //         this.alertService.showAlert('Importante!', 'No existe un reporte para mostrar', 'info');
            //     }
            //     break;
            // }
            case "consumo": {
                const formato = await this.getFormatoReporte();
                const result = await this.reporteService.reporteConsumo(formato);
                this.procesarResultado(result);
                break;
            }
            case "transferencia": {
                const formato = await this.getFormatoReporte();
                const result = await this.reporteService.reporteTransferencia(formato);
                this.procesarResultado(result);
                break;
            }
        }
    }

    procesarResultado(result: any[]) {
        this.alertService.cerrarModalCarga();
        if (result.length > 0) {
            this.data = result;
            this.columnas = Object.keys(this.data[0]);
        } else {
            this.data = [];
            this.alertService.showAlert('Importante!', 'No existe un reporte para mostrar', 'info');
        }
    }

    async getFormatoReporte() {
        return [{
            ruc: this.usuario.ruc,
            nrodocumento: this.usuario.documentoIdentidad,
            idrol: this.obtenerRol(),
            desde: this.formatDateViaje(this.fdesde),
            hasta: this.formatDateViaje(this.fhasta)
        }]
    }

    obtenerRol() {
        if (this.usuario.idrol.includes('SUCAL')) return 'SUCAL'
        if (this.usuario.idrol.includes('PLCAL')) return 'PLCAL'
        if (this.usuario.idrol.includes('ASCAL')) return 'ASCAL'
        if (this.usuario.idrol.includes('ADCAL')) return 'ADCAL'
        return ''
    }

    get reportesKeys(): string[] {
        return Object.keys(this.data[0]);
    }

    getReporteData(key: string): any[] {
        return this.data[0][key];
    }

    getHeaders(data: any[]): string[] {
        return data.length > 0 ? Object.keys(data[0]) : [];
    }

    exportToExcel(key: string) {
        const dataToExport = this.getReporteData(key);
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = { Sheets: { [key]: worksheet }, SheetNames: [key] };
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blobData = new Blob([excelBuffer], { type: 'application/octet-stream' });
        FileSaver.saveAs(blobData, `${key}.xlsx`);
    }

    getDate() {
        return moment(new Date()).format('YYYY-MM-DD')
    }

    formatDateViaje(date: any) {
        return moment(date).format('YYYYMMDD')
    }

    exportarPDF() {
        if (!this.data || this.data.length === 0) {
            return;
        }

        // 1. Obtener las columnas de forma dinámica (todas las claves del primer objeto)
        const columnas = Object.keys(this.data[0]);

        // 2. Generar encabezados con títulos legibles
        const encabezados = columnas.map(col => ({
            text: col.toUpperCase().replace(/_/g, ' '), // "DNI_conductor" → "DNI CONDUCTOR"
            style: 'tableHeader'
        }));

        // 3. Generar las filas dinámicas
        const body = this.data.map((row: any) =>
            columnas.map(col => {
                if (col.toLowerCase() === 'aprobado') {
                    return row[col] ? 'Aprobado' : 'No Aprobado';
                }
                return row[col] ?? '';
            })
        );

        // 4. Construir definición del documento
        const docDefinition: any = {
            content: [
                { text: 'Reporte Dinámico', style: 'header' },
                {
                    table: {
                        headerRows: 1,
                        widths: columnas.map(() => 'auto'),
                        body: [
                            encabezados, // cabeceras
                            ...body      // filas
                        ]
                    },
                    layout: {
                        fillColor: (rowIndex: number) => {
                            return rowIndex === 0 ? '#337ab7' : rowIndex % 2 === 0 ? '#f2f2f2' : null;
                        }
                    }
                }
            ],
            styles: {
                header: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                tableHeader: { bold: true, fontSize: 10, color: 'white', alignment: 'center' }
            },
            defaultStyle: { fontSize: 9 }
        };

        // 5. Guardar o descargar
        const camaraBridge = (window as any).CamaraBridge;
        if (camaraBridge && typeof camaraBridge.savePdf === 'function') {
            pdfMake.createPdf(docDefinition).getBase64((base64Data: string) => {
                camaraBridge.savePdf(base64Data, 'reporte.pdf');
            });
        } else {
            pdfMake.createPdf(docDefinition).download('reporte.pdf');
        }
    }


    // exportarPDF() {
    //   const encabezados = [
    //     '#','Fecha Registro','Horario', 'Punto Inicio', 'Punto Fin','# Pasajeros'
    //   ];

    //   const body = this.data.map((row: any, i: any) => [
    //     i + 1,
    //     row.fecharegistro,
    //     row.horario,
    //     row.puntoinicio,
    //     row.puntofin,
    //     row.cantidad
    //   ]);

    //   const conductor = this.data.length > 0 ? this.data[0].conductor : '';
    //   const placa = this.data.length > 0 ? this.data[0].placa : '';
    //   const ruc = this.data.length > 0 ? this.data[0].ruc : '';
    //   const dni = this.data.length > 0 ? this.data[0].DNI_conductor : '';

    //   const docDefinition: any = {
    //     content: [
    //       { text: 'Reporte de Rendimiento', style: 'header' },
    //       { columns: [{ text: `RUC: ${ruc}`, style: 'subHeader' }], margin: [0,0,0,10] },
    //       {
    //         columns: [
    //           { text: `Conductor: ${conductor}`, style: 'subHeader' },
    //           { text: `Placa: ${placa}`, style: 'subHeader', alignment: 'right' }
    //         ],
    //         margin: [0,0,0,5]
    //       },
    //       { columns: [{ text: `DNI: ${dni}`, style: 'subHeader' }], margin: [0,0,0,10] },
    //       {
    //         table: {
    //           headerRows: 1,
    //           widths: ['auto','auto','auto','auto','auto','auto'],
    //           body: [
    //             encabezados.map(h => ({ text: h, style: 'tableHeader' })),
    //             ...body
    //           ]
    //         },
    //         layout: {
    //           fillColor: (rowIndex: number) => {
    //             return rowIndex === 0 ? '#337ab7' : rowIndex % 2 === 0 ? '#f2f2f2' : null;
    //           }
    //         }
    //       }
    //     ],
    //     styles: {
    //       header: { fontSize: 16, bold: true, alignment: 'center', margin: [0,0,0,10] },
    //       subHeader: { fontSize: 11, bold: true },
    //       tableHeader: { bold: true, fontSize: 10, color: 'white', alignment: 'center' }
    //     },
    //     defaultStyle: { fontSize: 9 }
    //   };

    //   const camaraBridge = (window as any).CamaraBridge;

    //   if (camaraBridge && typeof camaraBridge.savePdf === "function") {
    //     pdfMake.createPdf(docDefinition).getBase64((base64Data: string) => {
    //       camaraBridge.savePdf(base64Data, "reporte.pdf");
    //     });
    //   } else {
    //     pdfMake.createPdf(docDefinition).download("reporte.pdf");
    //   }
    // }

    // exportarExcel(): void {
    //   try {
    //     const nombreArchivo = `reporte_viajes_${new Date().toISOString().slice(0,10)}.xlsx`;
    //     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.data);
    //     const wb: XLSX.WorkBook = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    //     const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    //     const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    //     FileSaver.saveAs(blob, nombreArchivo);
    //   } catch (error) {
    //     console.log(error);
    //     this.alertService.showAlert('Importante!', 'No existe herramienta para excel', 'info');
    //   }
    // }

    exportarExcel(): void {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte');

            const headers = Object.keys(this.data[0] || {});
            worksheet.addRow(headers).eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '337AB7' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            this.data.forEach((item: any, index: any) => {
                const row = worksheet.addRow(Object.values(item));

                const fillColor = index % 2 === 0 ? 'DCE6F1' : 'C8D7E8'; // zebra
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFF2F2F2' } },
                        left: { style: 'thin', color: { argb: 'FFF2F2F2' } },
                        bottom: { style: 'thin', color: { argb: 'FFF2F2F2' } },
                        right: { style: 'thin', color: { argb: 'FFF2F2F2' } }
                    };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });
            });

            const nombreArchivo = `reporte_viajes_${new Date().toISOString().slice(0, 10)}.xlsx`;
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/octet-stream' });
                FileSaver.saveAs(blob, nombreArchivo);
            });
        } catch (error) {
            this.alertService.showAlert('Importante!', 'No existe herramienta para excel', 'info');
        }
    }
}
