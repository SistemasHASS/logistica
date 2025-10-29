import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Almacen } from '../../model/almacen.model';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

interface LineaDetalle {
    codigo: string;
    producto: string;
    cantidad: number;
    proyecto: string;
    ceco: string;
    turno: string;
    labor: string;
}

@Component({
    selector: 'app-requerimiento_consumo',
    standalone: true,
    // imports: [CommonModule, FormsModule, DatePipe],
    imports: [CommonModule, FormsModule],
    templateUrl: './requerimiento_consumo.component.html',
    styleUrls: ['./requerimiento_consumo.component.scss']
})
export class RequerimientoConsumoComponent implements OnInit {
    fecha = new Date();
    mensajeFundos: String = '';
    usuario: any;
    fundos: any[] = [];
    cultivos: any[] = [];
    areas: any[] = [];
    proyectos: any[] = [];
    items: any[] = [];
    turnos: any[] = [];
    labores: any[] = [];
    cecos: any[] = [];
    // almacenes: Almacen[] = [];
    almacenes: any[] = [];
    clasificaciones: any[] = [];
    glosa: string = '';
    detalle: LineaDetalle[] = [];

    modalAbierto: boolean = false;
    lineaTemp: LineaDetalle = this.nuevaLinea();
    editIndex: number = -1;

    fundoSeleccionado = '';
    cultivoSeleccionado = '';
    areaSeleccionada = '';
    almacenSeleccionado = '';
    clasificacionSeleccionado = '';

    constructor(
        private userService: UserService,
        private dexieService: DexieService,
        private alertService: AlertService // ✅ inyectar el servicio
    ) { }

    async ngOnInit() {
        await this.ListarFundos();
        await this.ListarCultivos();
        await this.ListarAreas();
        await this.ListarAlmacenes();
        await this.ListarProyectos();
        await this.ListarItems();
        await this.ListarTurnos();
        await this.ListarLabores();
        await this.ListarCecos();
        await this.ListarClasificaciones();
    }

    async ListarFundos() {
        this.fundos = await this.dexieService.showFundos()
    }

    async ListarCultivos() {
        this.cultivos = await this.dexieService.showCultivos()
    }

    async ListarAreas() {
        this.areas = await this.dexieService.showAreas()
    }

    async ListarAlmacenes() {
        this.almacenes = await this.dexieService.showAlmacenes()
    }

    async ListarProyectos() {
        this.proyectos = await this.dexieService.showProyectos()
    }

    async ListarItems() {
        this.items = await this.dexieService.showItemComoditys()
    }

    async ListarClasificaciones() {
        this.clasificaciones = await this.dexieService.showClasificaciones()
    }

    async ListarTurnos() {
        this.turnos = await this.dexieService.showTurnos()
    }

    async ListarLabores() {
        this.labores = await this.dexieService.showLabores()
    }

    async ListarCecos() {
        this.cecos = await this.dexieService.showCecos()
    }

    nuevaLinea(): LineaDetalle {
        return {
            codigo: '',
            producto: '',
            cantidad: 0,
            proyecto: '',
            ceco: '',
            turno: '',
            labor: ''
        };
    }

    abrirModal(): void {
        this.modalAbierto = true;
        if (this.editIndex === -1) this.lineaTemp = this.nuevaLinea();
    }

    cerrarModal(): void {
        this.modalAbierto = false;
        this.editIndex = -1;
    }

    guardarLinea(): void {
        if (this.editIndex >= 0) {
            this.detalle[this.editIndex] = { ...this.lineaTemp };
        } else {
            this.detalle.push({ ...this.lineaTemp });
        }
        this.cerrarModal();
    }

    editarLinea(index: number): void {
        this.editIndex = index;
        this.lineaTemp = { ...this.detalle[index] };
        this.modalAbierto = true;
    }

    eliminarLinea(index: number): void {
        this.detalle.splice(index, 1);
    }

    async guardar() {
        if (!this.fundoSeleccionado) {
            this.alertService.showAlert('Atención', 'Debes seleccionar un Fundo antes de guardar.', 'warning');
            return;
        }

        if (!this.almacenSeleccionado) {
            this.alertService.showAlert('Atención', 'Debes seleccionar un Almacén antes de guardar.', 'warning');
            return;
        }

        try {
            // 🔹 Mostrar modal de carga
            this.alertService.mostrarModalCarga();

            // 🔹 Simulación del guardado (aquí reemplaza por tu lógica real)
            await new Promise(resolve => setTimeout(resolve, 1500)); // simulación de espera

            // 🔹 Cerrar modal de carga
            this.alertService.cerrarModalCarga();

            console.log('Guardando parámetros:', {
                fundo: this.fundoSeleccionado,
                almacen: this.almacenSeleccionado,
                usuario: this.usuario?.nombre || 'Desconocido'
            });

            // 🔹 Mostrar éxito
            this.alertService.showAlert('Éxito', 'Los parámetros se guardaron correctamente.', 'success');
        } catch (err) {
            console.error('❌ Error al guardar parámetros:', err);

            // Cerrar modal y mostrar error
            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Error', 'Ocurrió un error al guardar los parámetros.', 'error');
        }
    }

    cancelar(): void {
        const confirmar = confirm('¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.');
        if (!confirmar) return;

        this.fundoSeleccionado = '';
        this.cultivoSeleccionado = '';
        this.almacenSeleccionado = '';

        // Si también quieres vaciar los combos:
        // this.fundos = [];
        // this.almacenes = [];

        // Si deseas recargar la vista original del usuario
        // this.ngOnInit();

        console.log('Formulario de parámetros reiniciado');
        this.alertService.mostrarInfo('Los cambios han sido cancelados.');
    }
}