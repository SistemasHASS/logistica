import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { Usuario } from '@/app/shared/interfaces/Tables';

declare var bootstrap: any; // Para usar Bootstrap modal
@Component({
    selector: 'app-aprobaciones',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './aprobaciones.component.html',
    styleUrl: './aprobaciones.component.scss'
})
export class AprobacionesComponent {

    currentTab: 'ITEM' | 'COMMODITY' | 'ACTIVO FIJO' = 'ITEM';
    incidenciasPersona: any = [];
    dataSelected: any = [];
    // Selección individual por tab
    dataSelectedItems: any[] = [];
    dataSelectedCommodity: any[] = [];
    dataSelectedActivo: any[] = [];
    loading = false;
    allChecked: boolean = false;
    isAllApproved: boolean = true;
    requerimientos: any[] = [];

    allCheckedItems = false;
    allCheckedCommodity = false;
    allCheckedActivo = false;
    requerimientosItems: any[] = [];
    requerimientosCommodity: any[] = [];
    requerimientosActivoFijo: any[] = [];

    // Para el modal de visualización
    requerimientoSeleccionado: any = null;
    detalleRequerimiento: any[] = [];

    usuarioAprueba = 'APROBADOR_99';
    usuario: Usuario = {
        id: "",
        sociedad: 0,
        idempresa: "",
        ruc: "",
        razonSocial: "",
        idProyecto: "",
        proyecto: "",
        documentoidentidad: "",
        usuario: "",
        clave: "",
        nombre: "",
        idrol: "",
        rol: ""
    }

    constructor(
        private dexieService: DexieService,
        private alertService: AlertService,
        private requerimientosService: RequerimientosService,
    ) { }

    async ngOnInit() {
        await this.getUsuario();
        await this.sincronizarRequerimientos();
        await this.cargar();
    }

    get listaActual() {
        if (this.currentTab === 'ITEM') return this.requerimientosItems;
        if (this.currentTab === 'COMMODITY') return this.requerimientosCommodity;
        return this.requerimientosActivoFijo;
    }


    async getUsuario() {
        const usuario = await this.dexieService.showUsuario();
        if (usuario) { this.usuario = usuario } else { console.log('Error', 'Usuario not found', 'error'); }
    }

    async cargar() {
        this.requerimientos = await this.dexieService.showRequerimiento();
        this.requerimientosItems = this.requerimientos.filter(x => x.tipo === 'ITEM');
        this.requerimientosCommodity = this.requerimientos.filter(x => x.tipo === 'COMMODITY');
        this.requerimientosActivoFijo = this.requerimientos.filter(x => x.tipo === 'ACTIVO FIJO');
        // console.log(this.requerimientos)
    }

    async cargarRequerimientos() {
        const data = await this.dexieService.showRequerimiento();

        this.requerimientosItems = data.filter(x => x.tipo === 'ITEM');
        this.requerimientosCommodity = data.filter(x => x.tipo === 'COMMODITY');
    }


    async cambiarEstado(req: any, estado: 'APROBADO' | 'RECHAZADO') {
        req.estado = estado;
        req.usuarioAprueba = this.usuarioAprueba;
        req.fechaAprobacion = new Date().toISOString();
        await this.dexieService.saveRequerimiento(req);
        this.cargarRequerimientos();
    }

    obtenerRol() {
        if (this.usuario.idrol.includes('ALLOGIST')) return 'ALLOGIST'
        if (this.usuario.idrol.includes('APLOGIST')) return 'APLOGIST'
        return ''
    }

    async sincronizarRequerimientos() {
        try {
            const requerimmientos = this.requerimientosService.getRequerimientos([{ ruc: this.usuario.ruc, idrol: this.obtenerRol() }])
            requerimmientos.subscribe(async (resp: any) => {
                if (!!resp && resp.length) {
                    await this.dexieService.saveRequerimientos(resp)
                    // Ahora recorre cada requerimiento y guarda su detalle
                    for (const req of resp) {
                        if (req.detalle && req.detalle.length) {
                            for (const det of req.detalle) {
                                // Añadimos un campo idrequerimiento para enlazarlo
                                await this.dexieService.detalles.add({
                                    ...det,
                                    idrequerimiento: req.idrequerimiento
                                });
                            }
                        }
                    }

                    console.log('✅ Requerimientos y detalles guardados correctamente');

                    // 👇👇 AGREGA ESTO PARA REFRESCAR LA VISTA INMEDIATAMENTE
                    await this.cargar();
                }
            });

        } catch (error: any) {
            console.error(error);
            this.alertService.showAlert('Error!', '<p>Ocurrio un error</p><p>', 'error');
        }
    }

    /** ✅ Visualizar detalle del requerimiento */
    async visualizarDetalle(req: any, tipo: string) {
        this.requerimientoSeleccionado = req;
        
        // Cargar el detalle del requerimiento desde Dexie
        if (req.detalle && req.detalle.length > 0) {
            this.detalleRequerimiento = req.detalle;
        } else {
            // Si no está en memoria, buscar en Dexie
            this.detalleRequerimiento = await this.dexieService.detalles
                .where('idrequerimiento')
                .equals(req.idrequerimiento)
                .toArray();
        }

        // Abrir el modal
        const modalElement = document.getElementById('modalVisualizarDetalle');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    /** ✅ Seleccionar todos por tab */
    seleccionarTodos(tab: string) {
        if (tab === 'ITEM') {
            this.requerimientosItems.forEach(r => r.checked = this.allCheckedItems);
            this.dataSelectedItems = this.requerimientosItems.filter(r => r.checked);
        }

        if (tab === 'COMMODITY') {
            this.requerimientosCommodity.forEach(r => r.checked = this.allCheckedCommodity);
            this.dataSelectedCommodity = this.requerimientosCommodity.filter(r => r.checked);
        }

        if (tab === 'ACTIVO FIJO') {
            this.requerimientosActivoFijo.forEach(r => r.checked = this.allCheckedActivo);
            this.dataSelectedActivo = this.requerimientosActivoFijo.filter(r => r.checked);
        }

        this.actualizarSeleccionados();
    }


    /** ✅ Aprobación individual */
    async aprobar(req: any, tipo: string) {
        req.estados = "APROBADO";
        await this.dexieService.requerimientos.put(req);
        this.alertService.showAlert('Aprobado', 'Requerimiento aprobado correctamente', 'success');

        this.quitarDeLista(req.id, tipo);
    }

    /** ✅ Rechazo individual */
    async rechazar(req: any, tipo: string) {
        req.estados = "RECHAZADO";
        await this.dexieService.requerimientos.put(req);
        this.alertService.showAlert('Rechazado', 'Requerimiento rechazado correctamente', 'warning');

        this.quitarDeLista(req.id, tipo);
    }

    /** ✅ Aprobación masiva solo del tab seleccionado */
    async aprobarMasivo(tipo: string) {
        let list: any[] = [];

        if (tipo === 'ITEM') list = this.requerimientosItems.filter(r => r.checked);
        if (tipo === 'COMMODITY') list = this.requerimientosCommodity.filter(r => r.checked);
        if (tipo === 'ACTIVO') list = this.requerimientosActivoFijo.filter(r => r.checked);

        if (list.length === 0) {
            this.alertService.showAlert('Atención', 'Seleccione al menos un registro', 'warning');
            return;
        }

        for (const req of list) {
            req.estados = 'APROBADO';
            await this.dexieService.requerimientos.put(req);
            this.quitarDeLista(req.id, tipo);
        }

        this.alertService.showAlert('Aprobados', 'Requerimientos aprobados', 'success');
    }

    async aprobarSimple(req: any) {
        req.estados = "APROBADO";
        await this.dexieService.requerimientos.put(req);
        this.alertService.showAlert('Aprobado', 'Requerimiento aprobado correctamente', 'success');
        this.requerimientos = this.requerimientos.filter(r => r.id !== req.id);
    }

    async rechazarSimple(req: any) {
        req.estado = "RECHAZADO";
        await this.dexieService.requerimientos.put(req);
        this.alertService.showAlert('Rechazado', 'Requerimiento rechazado correctamente', 'warning');
        this.requerimientos = this.requerimientos.filter(r => r.id !== req.id);
    }


    allSelected() {
        this.listaActual.forEach(e => {
            if (!e.estados) {  // que no esté aprobado/rechazado
                e.checked = this.allChecked;
            }
        });

        this.dataSelected = this.allChecked
            ? this.listaActual.filter(item => !item.estados)
            : [];
    }

    quitarDeLista(id: any, tipo: string) {
        if (tipo === 'ITEM') {
            this.requerimientosItems = this.requerimientosItems.filter(r => r.id !== id);
        }
        if (tipo === 'COMMODITY') {
            this.requerimientosCommodity = this.requerimientosCommodity.filter(r => r.id !== id);
        }
        if (tipo === 'ACTIVO FIJO') {
            this.requerimientosActivoFijo = this.requerimientosActivoFijo.filter(r => r.id !== id);
        }
    }

    aprobarRequerimientos() {
        Swal.fire({
            title: '¿Estás Seguro?',
            icon: 'warning',
            html: 'Confirma que deseas aprobar<br>las requerimientos seleccionados',
            showCancelButton: true,
            confirmButtonText: 'Sí, deseo aprobar',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-warning'
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                this.dataSelected.forEach((e: any) => {
                    //   this.dexieService.updateAIncidenciaPersona(e.nrodocumento, 1)
                });
                this.cargar()
                this.clearMemory()
            }
        })
    }

    async aprobarSeleccionados() {
        for (const req of this.dataSelected) {
            req.estado = 'APROBADO';
            await this.dexieService.saveRequerimiento(req);
        }
        this.cargarRequerimientos();
    }

    clearMemory() {
        this.dataSelected = []
        this.allChecked = false
        this.incidenciasPersona.forEach((e: any) => {
            e.checked = false
        });
    }

    simpleSelected(tab: string) {

        if (tab === 'ITEM') {
            this.dataSelectedItems = this.requerimientosItems.filter(req => req.checked);
            this.allCheckedItems = this.dataSelectedItems.length === this.requerimientosItems.length;
        }

        if (tab === 'COMMODITY') {
            this.dataSelectedCommodity = this.requerimientosCommodity.filter(req => req.checked);
            this.allCheckedCommodity = this.dataSelectedCommodity.length === this.requerimientosCommodity.length;
        }

        if (tab === 'ACTIVO FIJO') {
            this.dataSelectedActivo = this.requerimientosActivoFijo.filter(req => req.checked);
            this.allCheckedActivo = this.dataSelectedActivo.length === this.requerimientosActivoFijo.length;
        }
    }

    /** ✅ Actualiza dataSelected según checks marcados */
    actualizarSeleccionados() {
        this.dataSelected = [
            ...this.requerimientosItems,
            ...this.requerimientosCommodity,
            ...this.requerimientosActivoFijo
        ].filter((x: any) => x.checked);

        this.dataSelectedItems = this.dataSelected.filter((x: any) => x.tipo === 'ITEM');
        this.dataSelectedCommodity = this.dataSelected.filter((x: any) => x.tipo === 'COMMODITY');
        this.dataSelectedActivo = this.dataSelected.filter((x: any) => x.tipo === 'ACTIVO FIJO');
    }

}
