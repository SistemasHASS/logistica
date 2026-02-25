import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Component, OnInit } from '@angular/core';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';

@Component({
    selector: 'app-reporte-saldos',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TableModule, SelectModule],
    templateUrl: './reporte-saldos.component.html',
    styleUrls: ['./reporte-saldos.component.scss']
})
export class ReporteSaldosComponent implements OnInit {

    saldos: any[] = [];
    saldosFiltrados: any[] = [];
    filtroAlmacen: string = '';
    filtroCodigo: string = '';
    almacenes: { label: string; value: string }[] = [];
    loading: boolean = false;
    usuario: any = {};

    constructor(
        private requerimientoService: RequerimientosService,
        private alertService: AlertService,
        private dexieService: DexieService
    ) { }

    async ngOnInit(): Promise<void> {
        // Cargar usuario desde Dexie
        this.usuario = await this.dexieService.usuario.toArray();
        this.usuario = this.usuario[0] || {};
        
        this.listarSaldos();
    }

    listarSaldos() {
        this.loading = true;
        
        // Enviar idempresa del usuario logueado
        const body = {
            idempresa: this.usuario.idempresa
        };
        
        this.requerimientoService.obtenerReporteSaldos(body).subscribe({
            next: (data: any) => {
                this.saldos = Array.isArray(data) ? data : [];
                this.cargarAlmacenes();
                this.aplicarFiltro();
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.alertService.showAlertError(
                    'Error',
                    'No se pudo cargar los saldos'
                );
            }
        });
    }

    aplicarFiltro() {
        this.saldosFiltrados = this.saldos.filter(x =>
            (!this.filtroAlmacen || (x.almacen || '').toLowerCase() === this.filtroAlmacen.toLowerCase()) &&
            (!this.filtroCodigo || (x.codigo || '').toLowerCase().includes(this.filtroCodigo.toLowerCase()))
        );
    }

    cargarAlmacenes() {
        const almacenesUnicos = [...new Set(this.saldos.map((s) => s.almacen).filter(Boolean))];
        this.almacenes = almacenesUnicos.map((a) => ({ label: a, value: a }));
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
