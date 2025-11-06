import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { Requerimiento, DetalleRequerimiento, Usuario } from 'src/app/shared/interfaces/Tables';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { Ceco, Configuracion, Labor, Proyecto, Turno } from '@/app/shared/interfaces/Tables';
import { Area, ItemComodity, Almacen, Clasificacion } from '@/app/shared/interfaces/Tables';

@Component({
    selector: 'app-requerimiento_consumo',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './requerimiento_consumo.component.html',
    styleUrls: ['./requerimiento_consumo.component.scss']
})
export class RequerimientoConsumoComponent implements OnInit {
    mostrarFormulario = false;
    modoEdicion: boolean = false;
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
        documentoidentidad: '',
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
        labor: "",
        estado: 0
    }

    requerimiento: Requerimiento = {
        // id: 0,
        idrequerimiento: "",
        fecha: "",
        almacen: "",
        glosa: "",
        tipo: "",
        ruc: "",
        idfundo: "",
        idarea: "",
        idclasificacion: "",
        nrodocumento: "",
        idalmacen: "",
        idalmacendestino: "",
        idproyecto: "",
        estado: 0,
        detalle: []
    }

    configuracion: Configuracion = {
        id: '',
        idempresa: '',
        idfundo: '',
        idcultivo: '',
        idarea: '',
        idalmacen: '',
        idproyecto: '',
        idacopio: 0,
        idceco: '',
        idlabor: '',
        iditem: '',
        idturno: '',
        idclasificacion: ''
    }

    filteredCecos: Ceco[] = [];
    filteredTurnos: Turno[] = [];
    filteredProyectos: Proyecto[] = [];
    filteredLabores: Labor[] = [];
    filteredAreas: Area[] = [];
    filteredItems: ItemComodity[] = [];
    filteredClasificaciones: Clasificacion[] = [];
    filteredAlmacenes: Almacen[] = [];

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
    itemsFiltrados: any[] = [];
    clasificacionesFiltrados: any[] = [];

    constructor(
        private userService: UserService,
        private utilsService: UtilsService,
        private dexieService: DexieService,
        private alertService: AlertService, // ✅ inyectar el servicio
        private requerimientosService: RequerimientosService
    ) { }

    async ngOnInit() {
        await this.cargarUsuario(); // 👈 carga el usuario primero
        await this.cargarMaestras();
        await this.cargarRequerimientos(); // 👈 Esto llena la tabla al inicio
        // await this.cargarDetalles(); // 🔹 cargar detalles guardados
    }

    async onFundoChange(limpiar = false) {
        if (limpiar) { this.configuracion.idturno = ''; this.configuracion.idceco = ''; this.configuracion.idlabor = ''; this.configuracion.idproyecto }
        await this.filtraFundo();
    }

    async filtraFundo() {
        this.filteredTurnos.length = 0;
        this.configuracion.idturno = '';
        if (this.configuracion.idcultivo) {
            const cultivo = this.cultivos.find((e: any) => e.id == this.configuracion.idcultivo)
            // const turnos = await this.dexieService.showTurnos()
            // this.filteredTurnos = this.turnos.filter((x: Turno) => x.idcultivo?.trim() === cultivo.codigo);
        }
    }

    async onProyectoChange() {
        this.filteredProyectos.length = 0;
        this.configuracion.iditem = '';
        if (this.configuracion.idproyecto) {
            const proyecto = this.proyectos.find((e: any) => e.id == this.configuracion.idproyecto)
            // const turnos = await this.dexieService.showTurnos()
            // this.filteredTurnos = this.turnos.filter((x: Turno) => x.idproyecto?.trim() === proyecto.codigo);
        }
    }

    async filtrarClasificaciones() {
        this.clasificacionesFiltrados = this.clasificaciones.filter(it => it.tipoClasificacion === 'I');
    }

    nuevoRequerimiento(): void {
        this.requerimiento = {
            idrequerimiento: '',
            fecha: new Date().toISOString(),
            almacen: '',
            glosa: '',
            tipo: 'Consumo',
            ruc: this.usuario.ruc,
            idfundo: '',
            idarea: '',
            idclasificacion: '',
            nrodocumento: this.usuario.documentoidentidad,
            idalmacen: '',
            idalmacendestino: '',
            idproyecto: '',
            estado: 0,
            detalle: []
        };

        this.detalles = [];
        this.glosa = '';
        this.modalAbierto = true;
        this.modoEdicion = false; // 🔹 Desactivamos modo edición
    }


    async sincronizarRequerimiento() {
        if (this.requerimiento.detalle.length === 0) {
            this.alertService.showAlert('Alerta', 'Debe ingresar al menos un requerimiento', 'warning');
            return;
        }

        const confirmacion = await this.alertService.showConfirm(
            'Confirmación',
            '¿Desea enviar los datos?',
            'warning'
        );

        if (!confirmacion) return;

        // 👇 Aquí formamos el objeto según el SP
        const requerimiento = {
            idrequerimiento: `${this.usuario.ruc}${this.requerimiento.idalmacen}${this.usuario.documentoidentidad}${new Date().toISOString().replace(/[-:TZ.]/g, '')}`,
            ruc: this.usuario.ruc,
            idfundo: this.requerimiento.idfundo,
            // idarea: this.areaSeleccionada,
            idarea: this.requerimiento.idarea,
            idclasificacion: this.requerimiento.idclasificacion,
            nrodocumento: this.usuario.documentoidentidad,
            idalmacen: this.requerimiento.idalmacen,
            idalmacendestino: this.requerimiento.idalmacendestino || '',
            glosa: this.requerimiento.glosa || '',
            eliminado: 0,
            detalle: this.requerimiento.detalle.map((d: any) => ({
                codigo: d.codigo,
                tipoclasificacion: d.tipoclasificacion,
                cantidad: d.cantidad,
                idproyecto: d.proyecto || '',
                idcentrocosto: d.ceco || '',
                idturno: d.turno || '',
                idlabor: d.labor || '',
                eliminado: 0
            }))
        };

        // 👇 Mandamos directamente el array (NO dentro de { json: ... })
        const payload = [requerimiento];

        console.log('📤 Enviando al backend:', payload);

        this.requerimientosService.registrarRequerimientos(payload).subscribe({
            next: (resp) => {
                console.log('✅ Respuesta del backend:', resp);

                // Manejo del resultado del SP
                if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
                    this.alertService.showAlert('Éxito', 'Requerimiento sincronizado correctamente', 'success');
                } else {
                    this.alertService.showAlert('Error', 'Hubo un problema al sincronizar el requerimiento', 'error');
                    console.error('Detalles del error:', resp);
                }
            },
            error: (err) => {
                console.error('❌ Error HTTP:', err);
                this.alertService.showAlert('Error', 'No se pudo conectar con el servidor', 'error');
            }
        });
    }

    formatoRequerimiento() {
        const requerimientos = this.requerimiento.detalle.map((item: any) => {
            return {
                idrequerimiento: item.idrequerimiento,
                ruc: item.ruc,
                idfundo: item.idfundo,
                idarea: item.idarea,
                idclasificacion: item.idclasificacion,
                nrodocumento: item.nrodocumento,
                idalmacen: item.idalmacen,
                idalmacendestino: item.idalmacendestino,
                glosa: item.glosa,
                codigo: item.codigo,
                tipoclasificacion: 'I',
                cantidad: item.cantidad,
                idproyecto: item.proyecto,
                idcentrocosto: item.ceco,
                idturno: item.turno,
                idlabor: item.labor
                // eliminado: 0
            }
        })
        return requerimientos.filter((item: any) => item.estado == 0)
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
        this.itemsFiltrados = this.items.filter(it => it.tipoclasificacion === 'I');
    }

    async ListarClasificaciones() {
        this.clasificaciones = await this.dexieService.showClasificaciones()
        this.clasificacionesFiltrados = this.clasificaciones.filter(it => it.tipoClasificacion === 'I');
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
            labor: '',
            estado: 0
        };
    }

    async abrirModal() {
        if (this.editIndex === -1) {
            // const nuevoCodigo = (this.detalles.length + 1).toString().padStart(6, '0');
            this.lineaTemp = {
                // codigo: nuevoCodigo,
                codigo: '',
                producto: '',
                estado: 0,
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

        // Buscar producto seleccionado
        const productoSeleccionado = this.items.find(
            it => it.codigo === this.lineaTemp.producto
        );
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
        const nuevaLineaDetalle = {
            codigo: productoSeleccionado.codigo,
            producto: productoSeleccionado.descripcion, // 👈 Guardamos la descripción visible
            cantidad: this.lineaTemp.cantidad,
            proyecto: this.lineaTemp.proyecto,
            ceco: this.lineaTemp.ceco,
            turno: this.lineaTemp.turno,
            labor: this.lineaTemp.labor,
            estado: 0 // 👈 agrega cualquier campo adicional que tu tabla Dexie requiera
        };

        // ✅ Si pasa todas las validaciones
        if (this.editIndex >= 0) {
            // Editar línea existente
            const idExistente = this.detalles[this.editIndex].id!;
            // await this.dexieService.detalles.put({ id: idExistente, ...this.lineaTemp });
            await this.dexieService.detalles.put({ id: idExistente, ...nuevaLineaDetalle });
            // this.detalle[this.editIndex] = { ...this.lineaTemp };
            // console.log(this.detalles);
            // ✅ Actualizar en memoria también
            this.detalles[this.editIndex] = { id: idExistente, ...nuevaLineaDetalle };
        } else {
            // Agregar nueva línea
            delete this.lineaTemp.id;
            // Agregar nueva línea
            const idNuevo = await this.dexieService.detalles.add({ ...nuevaLineaDetalle });
            // ✅ Añadir al arreglo en memoria
            this.detalles.push({ id: idNuevo, ...nuevaLineaDetalle });
            // await this.dexieService.detalles.add(this.lineaTemp);
            // await this.dexieService.detalles.add({ ...nuevaLineaDetalle });
            // this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
            // this.detalle.push({ ...this.lineaTemp });
            // console.log(this.detalles);
        }

        // await this.cargarDetalles();
        this.cerrarModal();
        this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
    }

    editarLinea(index: number): void {
        this.editIndex = index;
        const detalleSeleccionado = this.detalles[index];

        // Buscar el producto en la lista de items por descripción
        const producto = this.items.find(it => it.descripcion === detalleSeleccionado.producto);

        // Cargar en lineaTemp el código real para que el select lo reconozca
        this.lineaTemp = {
            ...detalleSeleccionado,
            producto: producto ? producto.codigo : detalleSeleccionado.codigo
        };

        // this.lineaTemp = { ...this.detalles[index] };
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

        if (!this.areaSeleccionada) {
            this.alertService.showAlert('Atención', 'Debes seleccionar un Area antes de guardar.', 'warning');
            return;
        }

        if (!this.almacenSeleccionado) {
            this.alertService.showAlert('Atención', 'Debes seleccionar un Almacén antes de guardar.', 'warning');
            return;
        }

        if (!this.clasificacionSeleccionado) {
            this.alertService.showAlert('Atención', 'Debes seleccionar una clasificación antes de guardar.', 'warning');
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
            this.requerimiento.idrequerimiento = this.usuario.ruc + this.almacenSeleccionado + this.usuario.documentoidentidad + this.utilsService.formatoAnioMesDiaHoraMinSec();
            this.requerimiento.ruc = this.usuario.ruc;
            this.requerimiento.idfundo = this.fundoSeleccionado;
            this.requerimiento.idarea = this.areaSeleccionada;
            this.requerimiento.idclasificacion = this.clasificacionSeleccionado;
            this.requerimiento.nrodocumento = this.usuario.documentoidentidad;
            this.requerimiento.idalmacen = this.almacenSeleccionado;
            this.requerimiento.idalmacendestino = "";
            this.requerimiento.idproyecto = this.proyectoSeleccionado;
            this.requerimiento.fecha = new Date().toISOString();
            this.requerimiento.almacen = this.almacenSeleccionado;
            this.requerimiento.glosa = this.glosa;
            this.requerimiento.detalle = this.detalles;
            // this.requerimiento.tipo = 'Consumo';
            // this.requerimientos.push(this.requerimiento);    
            // await this.dexieService.saveRequerimiento(this.requerimiento);    
            // await this.dexieService.saveRequerimientos(this.requerimientos);
            console.log("Requerimiento", this.requerimiento);
            // 4️⃣ Guardar requerimiento en Dexie
            // delete this.requerimiento.id;
            // const requerimientoId = await this.dexieService.requerimientos.add(this.requerimiento);
            const requerimientoId = await this.dexieService.requerimientos.put(this.requerimiento);


            console.log('Guardando parámetros:', {
                fundo: this.fundoSeleccionado,
                almacen: this.almacenSeleccionado,
                ceco: this.cecoSeleccionado,
                proyecto: this.proyectoSeleccionado,
                clasificacion: this.clasificacionSeleccionado,
                area: this.areaSeleccionada,
                usuario: this.usuario?.nombre || 'Desconocido'
            });

            // this.requerimientos.push(this.requerimiento);
            // await this.cargarRequerimientos();

            // ✅ Si estás editando, actualiza la lista en memoria
            if (this.modoEdicion) {
                const index = this.requerimientos.findIndex(r => r.idrequerimiento === this.requerimiento.idrequerimiento);
                if (index !== -1) {
                    this.requerimientos[index] = { ...this.requerimiento };
                }
                this.modoEdicion = false;
            } else {
                // ✅ Si es nuevo, agrégalo normalmente
                this.requerimientos.push({ ...this.requerimiento });
            }


            // 🔹 Mostrar éxito
            // this.alertService.showAlert('Éxito', 'Los parámetros se guardaron correctamente.', 'success');
            this.alertService.showAlert('Éxito', `Requerimiento #${requerimientoId} guardado correctamente.`, 'success');
            // this.alertService.showAlert('Éxito', `Requerimiento #${this.requerimiento.id} guardado correctamente.`, 'success');
            // 5️⃣ Limpiar formulario
            this.detalles = [];
            this.fundoSeleccionado = '';
            this.almacenSeleccionado = '';
            this.areaSeleccionada = '';
            this.clasificacionSeleccionado = '';
            this.glosa = '';

        } catch (err) {
            console.error('❌ Error al guardar parámetros:', err);

            // Cerrar modal y mostrar error
            this.alertService.cerrarModalCarga();
            // this.modoEdicion = false;
            // this.mostrarFormulario = false;
            // this.modalAbierto = false;

            this.alertService.showAlert('Error', 'Ocurrió un error al guardar los parámetros.', 'error');
        }
    }

    cancelar(): void {
        const confirmar = confirm('¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.');
        if (!confirmar) return;

        this.fundoSeleccionado = '';
        this.cultivoSeleccionado = '';
        this.almacenSeleccionado = '';

        console.log('Formulario de parámetros reiniciado');
        this.alertService.mostrarInfo('Los cambios han sido cancelados.');
    }

    editarRequerimiento(index: number) {
        this.requerimiento = { ...this.requerimientos[index] };
        this.detalles = this.requerimiento.detalle || [];

        // Cargar los campos en los selects principales
        this.fundoSeleccionado = this.requerimiento.idfundo;
        this.areaSeleccionada = this.requerimiento.idarea;
        this.almacenSeleccionado = this.requerimiento.idalmacen;
        this.clasificacionSeleccionado = this.requerimiento.idclasificacion;
        this.glosa = this.requerimiento.glosa;

        // Mostrar el formulario principal
        this.modoEdicion = true; // 🔹 Activamos modo edición
        this.mostrarFormulario = true;
        this.modalAbierto = false; // aseguramos que el modal detalle no esté abierto
    }


    async eliminarRequerimiento(index: number) {
        const confirmacion = await this.alertService.showConfirm(
            'Confirmación',
            '¿Desea eliminar este requerimiento?',
            'warning'
        );
        if (!confirmacion) return;

        try {
            const req = this.requerimientos[index];
            await this.dexieService.deleteRequerimiento(req.idrequerimiento);
            await this.cargarRequerimientos();
            this.alertService.showAlert('Éxito', 'Requerimiento eliminado correctamente.', 'success');
        } catch (error) {
            console.error('Error al eliminar requerimiento:', error);
            this.alertService.showAlert('Error', 'Ocurrió un error al eliminar el requerimiento.', 'error');
        }
    }

}