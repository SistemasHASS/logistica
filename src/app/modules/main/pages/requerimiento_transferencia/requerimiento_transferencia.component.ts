import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Almacen } from '../../model/almacen.model';
import { LogisticaService } from '../../services/logistica.service';
import { UserService } from '@/app/shared/services/user.service';
import { ParametrosService } from '../../services/parametros.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
    selector: 'app-requerimiento_transferencia',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './requerimiento_transferencia.component.html',
    styleUrls: ['./requerimiento_transferencia.component.scss']
})
export class RequerimientoTransferenciaComponent implements OnInit {
    fecha = new Date();
    mensajeFundos: String = '';
    usuario: any;
    fundos: any[] = []; // Se llena al sincronizar
    areas = ['Mañana', 'Tarde', 'Noche'];
    almacenes: Almacen[] = [];

    fundoSeleccionado = '';
    cultivoSeleccionado = '';
    areaSeleccionada = '';
    almacenSeleccionado = '';

    // sincronizado = false; // habilita guardar y fundo

    constructor(
        private logisticaService: LogisticaService,
        private userService: UserService,
        private parametrosService: ParametrosService,
        private alertService: AlertService // ✅ inyectar el servicio
    ) { }

    ngOnInit(): void {
        // Obtener usuario logueado desde el UserService
        this.usuario = this.userService.getUsuario();
        console.log('Usuario logueado desde parametros:', this.usuario);
    }

    async sincronizar() {
        if (!this.usuario?.idempresa || !this.usuario?.sociedad || !this.usuario?.ruc) {
            this.alertService.showAlert('Error', 'No se pudo obtener la empresa, sociedad o RUC del usuario', 'error');
            return;
        }

        try {
            // 🔹 Mostrar mensaje de carga
            this.alertService.mostrarModalCarga();

            // 🔹 Llamar en paralelo a ambos servicios
            const [fundos, almacenes] = await Promise.all([
                this.parametrosService.sincronizarFundos(this.usuario.idempresa, this.usuario.sociedad),
                this.logisticaService.listarAlmacenes(this.usuario.ruc).toPromise()
            ]);

            // 🔹 Cerrar el modal de carga
            this.alertService.cerrarModalCarga();

            // 🔹 Actualizar listas
            this.fundos = fundos || [];
            this.fundoSeleccionado = '';

            this.almacenes = almacenes || [];
            this.almacenSeleccionado = '';

            console.log('✅ Fundos sincronizados:', fundos);
            console.log('✅ Almacenes sincronizados:', almacenes);

            // 🔹 Mostrar mensaje final de éxito
            this.alertService.showAlert('Sincronización completa', 'Los fundos y almacenes se actualizaron correctamente.', 'success');

        } catch (err) {
            console.error('❌ Error al sincronizar fundos y almacenes:', err);
            // Cerrar el modal en caso de error también
            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Error', 'Ocurrió un error al sincronizar los datos.', 'error');
        }
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

}