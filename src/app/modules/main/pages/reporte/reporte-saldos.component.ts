import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Component, OnInit } from '@angular/core';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-reporte-saldos',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TableModule],
    templateUrl: './reporte-saldos.component.html',
    styleUrls: ['./reporte-saldos.component.scss']
})
export class ReporteSaldosComponent implements OnInit {

    saldos: any[] = [];
    saldosFiltrados: any[] = [];
    filtroAlmacen: string = '';
    filtroCodigo: string = '';
    loading: boolean = false;

    constructor(
        private requerimientoService: RequerimientosService,
        private alertService: AlertService
    ) { }

    ngOnInit(): void {
        this.listarSaldos();
    }

    listarSaldos() {
        this.loading = true;
        this.requerimientoService.obtenerReporteSaldos([]).subscribe({
            next: (data: any) => {
                this.saldos = Array.isArray(data) ? data : [];
                this.aplicarFiltro();
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.alertService.showAlertError(
                    'Error',
                    'Error al cargar reporte de saldos'
                );
            }
        });
    }

    aplicarFiltro() {
        this.saldosFiltrados = this.saldos.filter(x =>
            (!this.filtroAlmacen || (x.almacen || '').toLowerCase().includes(this.filtroAlmacen.toLowerCase())) &&
            (!this.filtroCodigo || (x.codigo || '').toLowerCase().includes(this.filtroCodigo.toLowerCase()))
        );
    }

    despachar(item: any) {
        this.alertService.showConfirm('Confirmar', '¿Desea despachar este item?', 'question').then((confirmed: boolean) => {
            if (confirmed) {
                this.requerimientoService.registrarDespacho(item).subscribe({
                    next: () => {
                        this.alertService.showAlert(
                            'Éxito',
                            'Item despachado correctamente',
                            'success'
                        );
                        this.listarSaldos();
                    },
                    error: () => this.alertService.showAlert(
                        'Error',
                        'No se pudo despachar',
                        'error'
                    )
                });
            }
        });
    }
}
