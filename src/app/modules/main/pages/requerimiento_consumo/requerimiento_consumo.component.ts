import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Requerimiento, DetalleRequerimiento, Usuario } from 'src/app/shared/interfaces/Tables';

@Component({
    selector: 'app-requerimiento_consumo',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './requerimiento_consumo.component.html',
    styleUrls: ['./requerimiento_consumo.component.scss']
})
export class RequerimientoConsumoComponent implements OnInit {
    fecha = new Date();
    mensajeFundos: String = '';
    // suario: any;
    fundos: any[] = [];
    cultivos: any[] = [];
    areas: any[] = [];
    proyectos: any[] = [];
    items: any[] = [];
    turnos: any[] = [];
    labores: any[] = [];
    cecos: any[] = [];
    almacenes: any[] = [];
    clasificaciones: any[] = [];
    glosa: string = '';
    requerimientos: Requerimiento[] = [];

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
    // detalle: LineaDetalle[] = [];
    detalles: DetalleRequerimiento[] = [];

    detalle: DetalleRequerimiento = {
        // id: 0,
        codigo: "",
        producto: "",
        cantidad: 0,
        proyecto: "",
        ceco: "",
        turno: "",
        labor: ""
    }

    requerimiento: Requerimiento = {
        // id: 0,
        fecha: "",
        fundo: "",
        almacen: "",
        glosa: "",
        tipo: "Consumo",
        detalle: []
    }

    modalAbierto: boolean = false;
    // lineaTemp: LineaDetalle = this.nuevaLinea();
    lineaTemp: DetalleRequerimiento = this.nuevaLinea();
    editIndex: number = -1;

    fundoSeleccionado = '';
    cultivoSeleccionado = '';
    areaSeleccionada = '';
    almacenSeleccionado = '';
    proyectoSeleccionado = '';
    itemSeleccionado = '';
    clasificacionSeleccionado = '';
    cecoSeleccionado = '';
    turnoSeleccionado = '';
    laborSeleccionado = '';

    constructor(
        private userService: UserService,
        private dexieService: DexieService,
        private alertService: AlertService // ✅ inyectar el servicio
    ) { }

    async ngOnInit() {
        await this.cargarUsuario(); // 👈 carga el usuario primero
        await this.cargarMaestras();
        // await this.cargarDetalles(); // 🔹 cargar detalles guardados
    }

    async cargarUsuario() {
  try {
     const usuarioActual = await this.dexieService.showUsuario();
    if (usuarioActual) {
      this.usuario = usuarioActual;
      console.log('Usuario cargado:', this.usuario);
    } else {
      console.warn('⚠️ No se encontró usuario en UserService.');
    }
  } catch (error) {
    console.error('❌ Error al cargar usuario:', error);
  }
}

    async cargarMaestras() {
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

    async cargarDetalles() {
        this.detalles = await this.dexieService.showDetallesRequerimiento();
    }

    async cargarRequerimientos() {
        this.requerimientos = await this.dexieService.showRequerimiento();
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

    nuevaLinea(): DetalleRequerimiento {
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

    async abrirModal() {
        if (this.editIndex === -1) {
            const nuevoCodigo = (this.detalles.length + 1).toString().padStart(6, '0');
            this.lineaTemp = {
                codigo: nuevoCodigo,
                producto: '',
                cantidad: 0,
                proyecto: '',
                ceco: '',
                turno: '',
                labor: ''
            };
        }
        this.modalAbierto = true;
    }

    cerrarModal(): void {
        this.modalAbierto = false;
        this.editIndex = -1;
    }

    async guardarLinea() {
        // ✅ Validaciones previas
        if (!this.lineaTemp.producto || this.lineaTemp.producto.trim() === '') {
            this.alertService.showAlert('Campo requerido', 'Debes seleccionar un producto.', 'warning');
            return;
        }

        if (!this.lineaTemp.cantidad || this.lineaTemp.cantidad <= 0) {
            this.alertService.showAlert('Campo inválido', 'La cantidad debe ser mayor a 0.', 'warning');
            return;
        }

        if (!this.lineaTemp.proyecto || this.lineaTemp.proyecto.trim() === '') {
            this.alertService.showAlert('Campo requerido', 'Debes seleccionar un proyecto.', 'warning');
            return;
        }

        if (!this.lineaTemp.ceco || this.lineaTemp.ceco.trim() === '') {
            this.alertService.showAlert('Campo requerido', 'Debes seleccionar un CECO.', 'warning');
            return;
        }

        if (!this.lineaTemp.turno || this.lineaTemp.turno.trim() === '') {
            this.alertService.showAlert('Campo requerido', 'Debes seleccionar un turno.', 'warning');
            return;
        }

        if (!this.lineaTemp.labor || this.lineaTemp.labor.trim() === '') {
            this.alertService.showAlert('Campo requerido', 'Debes seleccionar una labor.', 'warning');
            return;
        }

        // ✅ Si pasa todas las validaciones
        if (this.editIndex >= 0) {
            // Editar línea existente
            const idExistente = this.detalles[this.editIndex].id!;
            await this.dexieService.detalles.put({ id: idExistente, ...this.lineaTemp });
            // this.detalle[this.editIndex] = { ...this.lineaTemp };
            // console.log(this.detalles);
        } else {
            // Agregar nueva línea
            delete this.lineaTemp.id;
            await this.dexieService.detalles.add(this.lineaTemp);
            // this.detalle.push({ ...this.lineaTemp });
            // console.log(this.detalles);
        }

        await this.cargarDetalles();
        this.cerrarModal();
        this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
    }

    editarLinea(index: number): void {
        this.editIndex = index;
        this.lineaTemp = { ...this.detalles[index] };
        this.modalAbierto = true;
    }

    async eliminarLinea(index: number) {
        const id = this.detalles[index].id!;
        await this.dexieService.deleteDetalleRequerimiento(id);
        await this.cargarDetalles();
        this.alertService.mostrarInfo('Línea eliminada.');
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

            // Fecha actual
            // const fechaActual = new Date().toISOString();

            // 🔹 Simulación del guardado (aquí reemplaza por tu lógica real)
            await new Promise(resolve => setTimeout(resolve, 1500)); // simulación de espera

            // 🔹 Cerrar modal de carga
            this.alertService.cerrarModalCarga();

            // 3️⃣ Crear requerimiento
            // const fechaActual = new Date().toISOString();
            // const requerimiento: Requerimiento = {
            //     fecha: fechaActual,
            //     fundo: this.fundoSeleccionado,
            //     almacen: this.almacenSeleccionado,
            //     glosa: this.glosa,
            //     detalle: this.detalles,
            //     tipo: 'Consumo'
            // };
            this.requerimiento.fecha = new Date().toISOString();
            this.requerimiento.fundo = this.fundoSeleccionado;
            this.requerimiento.almacen = this.almacenSeleccionado;
            this.requerimiento.glosa = this.glosa;
            this.requerimiento.detalle = this.detalles;
            this.requerimiento.tipo = 'Consumo';
            // this.requerimientos.push(this.requerimiento);    
            // await this.dexieService.saveRequerimiento(this.requerimiento);    
            // await this.dexieService.saveRequerimientos(this.requerimientos);

            // 4️⃣ Guardar requerimiento en Dexie
            delete this.requerimiento.id;
            // const requerimientoId = await this.dexieService.requerimientos.add(this.requerimiento);
            const requerimientoId = await this.dexieService.requerimientos.put(this.requerimiento);


            console.log('Guardando parámetros:', {
                fundo: this.fundoSeleccionado,
                almacen: this.almacenSeleccionado,
                usuario: this.usuario?.nombre || 'Desconocido'
            });

            // 🔹 Mostrar éxito
            // this.alertService.showAlert('Éxito', 'Los parámetros se guardaron correctamente.', 'success');
            this.alertService.showAlert('Éxito', `Requerimiento #${requerimientoId} guardado correctamente.`, 'success');
            // this.alertService.showAlert('Éxito', `Requerimiento #${this.requerimiento.id} guardado correctamente.`, 'success');
            // 5️⃣ Limpiar formulario
            this.detalles = [];
            this.fundoSeleccionado = '';
            this.almacenSeleccionado = '';
            this.glosa = '';

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