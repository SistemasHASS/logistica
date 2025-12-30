import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Usuario, ListaStock, DetalleListaStock } from '@/app/shared/interfaces/Tables';
// import { DropdownComponent } from '../../components/dropdown/dropdown.component';
import * as XLSX from 'xlsx';

declare var bootstrap: any;

interface ItemConStock {
    codigo: string;
    descripcion: string;
    stockActual: number;
    stockMinimo: number;
    stockMaximo: number;
    unidadMedida: string;
    almacen: string;
    ultimaActualizacion: string;
}

@Component({
    selector: 'app-listas-stock',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './listas-stock.component.html',
    styleUrls: ['./listas-stock.component.scss']
})
export class ListasStockComponent implements OnInit {

    // Datos principales
    listasStock: ListaStock[] = [];
    listaSeleccionada: ListaStock | null = null;
    detalleListaActual: DetalleListaStock[] = [];

    // Items disponibles
    itemsDisponibles: any[] = [];
    itemsFiltrados: any[] = [];

    SeccionaItem: string = '';

    // Almacenes
    almacenes: any[] = [];

    // Formulario nueva lista
    nuevaLista: ListaStock = {
        id: 0,
        nombre: '',
        descripcion: '',
        almacen: '',
        fecha: new Date().toISOString(),
        estado: 'ACTIVA',
        usuarioCreador: '',
        detalle: []
    };

    // Formulario agregar item
    nuevoItem: DetalleListaStock = {
        id: 0,
        listaStockId: 0,
        codigo: '',
        descripcion: '',
        stockInicial: 0,
        stockActual: 0,
        stockMinimo: 0,
        stockMaximo: 0,
        unidadMedida: 'UND',
        estado: 'ACTIVO'
    };

    // Estados de vista
    vistaActual: 'LISTADO' | 'CREAR' | 'EDITAR' | 'DETALLE' = 'LISTADO';
    modoEdicion: boolean = false;

    // Filtros
    busquedaItem: string = '';
    almacenFiltro: string = '';

    // Usuario
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
    };

    // Importación masiva
    archivoSeleccionado: File | null = null;
    datosImportacion: any[] = [];

    constructor(
        private dexieService: DexieService,
        private alertService: AlertService
    ) { }

    async ngOnInit() {
        await this.cargarUsuario();
        await this.cargarAlmacenes();
        await this.cargarItems();
        await this.cargarListasStock();
    }

    async cargarUsuario() {
        const usuario = await this.dexieService.showUsuario();
        if (usuario) {
            this.usuario = usuario;
            this.nuevaLista.usuarioCreador = usuario.documentoidentidad;
        }
    }

    async cargarAlmacenes() {
        this.almacenes = await this.dexieService.showAlmacenes();
    }

    async cargarItems() {
        this.itemsDisponibles = await this.dexieService.showItemComoditys();
        // this.itemsFiltrados = [...this.itemsDisponibles]
        this.itemsFiltrados = this.itemsDisponibles.filter((item) => item.tipoclasificacion === 'I')
    }

    async cargarListasStock() {
        this.listasStock = await this.dexieService.showListasStock();
    }

    // ===============================================
    // GESTIÓN DE LISTAS
    // ===============================================

    iniciarNuevaLista() {
        this.nuevaLista = {
            id: 0,
            nombre: '',
            descripcion: '',
            almacen: '',
            fecha: new Date().toISOString(),
            estado: 'ACTIVA',
            usuarioCreador: this.usuario.documentoidentidad,
            detalle: []
        };
        this.detalleListaActual = [];
        this.vistaActual = 'CREAR';
        this.modoEdicion = false;
    }

    async guardarLista() {
        // Validaciones
        if (!this.nuevaLista.nombre || !this.nuevaLista.almacen) {
            this.alertService.showAlert('Atención', 'Complete los campos obligatorios', 'warning');
            return;
        }

        if (this.detalleListaActual.length === 0) {
            this.alertService.showAlert('Atención', 'Debe agregar al menos un item a la lista', 'warning');
            return;
        }

        try {
            this.alertService.mostrarModalCarga();

            // Asignar detalle a la lista
            this.nuevaLista.detalle = this.detalleListaActual;

            if (this.modoEdicion && this.nuevaLista.id) {
                // Actualizar
                await this.dexieService.listasStock.put(this.nuevaLista);
            } else {
                // Crear nueva
                this.nuevaLista.id = Date.now();
                await this.dexieService.listasStock.add(this.nuevaLista);

                // Crear registros de stock iniciales
                for (const item of this.detalleListaActual) {
                    await this.dexieService.stock.add({
                        id: Date.now(),
                        codigo: item.codigo,
                        descripcion: item.descripcion,
                        almacen: this.nuevaLista.almacen,
                        cantidad: item.stockInicial,
                        unidadMedida: item.unidadMedida,
                        ultimaActualizacion: new Date().toISOString()
                    });
                }
            }

            await this.cargarListasStock();

            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Éxito', 'Lista de stock guardada correctamente', 'success');

            this.vistaActual = 'LISTADO';

        } catch (error) {
            console.error('Error guardando lista:', error);
            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Error', 'No se pudo guardar la lista', 'error');
        }
    }

    async editarLista(lista: ListaStock) {
        this.nuevaLista = { ...lista };
        this.detalleListaActual = lista.detalle ? [...lista.detalle] : [];
        this.modoEdicion = true;
        this.vistaActual = 'EDITAR';
    }

    async verDetalleLista(lista: ListaStock) {
        this.listaSeleccionada = lista;
        this.detalleListaActual = lista.detalle || [];

        // Cargar stock actual desde la tabla stock
        for (const item of this.detalleListaActual) {
            const stockActual = await this.dexieService.stock
                .where(['codigo', 'almacen'])
                .equals([item.codigo, lista.almacen])
                .first();

            if (stockActual) {
                item.stockActual = stockActual.cantidad;
            }
        }

        this.vistaActual = 'DETALLE';
    }

    async desactivarLista(lista: ListaStock) {
        const confirmacion = await this.alertService.showConfirm(
            'Confirmar',
            '¿Desea desactivar esta lista de stock?',
            'warning'
        );

        if (!confirmacion) return;

        try {
            lista.estado = 'INACTIVA';
            await this.dexieService.listasStock.put(lista);
            await this.cargarListasStock();
            this.alertService.showAlert('Éxito', 'Lista desactivada correctamente', 'success');
        } catch (error) {
            this.alertService.showAlert('Error', 'No se pudo desactivar la lista', 'error');
        }
    }

    // ===============================================
    // GESTIÓN DE ITEMS EN LA LISTA
    // ===============================================

    abrirModalAgregarItem() {
        this.nuevoItem = {
            id: 0,
            listaStockId: this.nuevaLista.id || 0,
            codigo: '',
            descripcion: '',
            stockInicial: 0,
            stockActual: 0,
            stockMinimo: 0,
            stockMaximo: 0,
            unidadMedida: 'UND',
            estado: 'ACTIVO'
        };

        const modalElement = document.getElementById('modalAgregarItem');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    onItemSeleccionado(event: any) {
        const codigo = event.target.value;
        const item = this.itemsDisponibles.find(i => i.codigo === codigo);

        if (item) {
            this.nuevoItem.codigo = item.codigo;
            this.nuevoItem.descripcion = item.descripcion;
        }
    }

    // onItemSeleccionado(item: any) {
    //     this.nuevoItem.codigo = item.codigo;
    //     this.nuevoItem.descripcion = item.descripcion;
    // }


    agregarItemALista() {
        // Validaciones
        if (!this.nuevoItem.codigo || this.nuevoItem.stockInicial <= 0) {
            this.alertService.showAlert('Atención', 'Complete todos los campos requeridos', 'warning');
            return;
        }

        // Verificar si ya existe
        const existe = this.detalleListaActual.find(d => d.codigo === this.nuevoItem.codigo);
        if (existe) {
            this.alertService.showAlert('Atención', 'Este item ya está en la lista', 'warning');
            return;
        }

        // Agregar a la lista
        this.nuevoItem.id = this.detalleListaActual.length + 1;
        this.nuevoItem.stockActual = this.nuevoItem.stockInicial;
        this.detalleListaActual.push({ ...this.nuevoItem });

        // Cerrar modal
        const modalElement = document.getElementById('modalAgregarItem');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal?.hide();
        }

        this.alertService.showAlert('Éxito', 'Item agregado a la lista', 'success');
    }

    eliminarItemDeLista(index: number) {
        this.detalleListaActual.splice(index, 1);
    }

    // ===============================================
    // ACTUALIZACIÓN MASIVA DE STOCK
    // ===============================================

    async actualizarStockMasivo() {
        const confirmacion = await this.alertService.showConfirm(
            'Actualizar Stock',
            '¿Desea actualizar el stock de todos los items de esta lista?',
            'question'
        );

        if (!confirmacion) return;

        try {
            this.alertService.mostrarModalCarga();

            for (const item of this.detalleListaActual) {
                await this.dexieService.updateStock(
                    item.codigo,
                    this.nuevaLista.almacen,
                    0 // El stock actual ya está en item.stockActual
                );

                // Registrar movimiento
                await this.dexieService.saveMovimientoStock({
                    fecha: new Date().toISOString(),
                    tipo: 'AJUSTE',
                    codigo: item.codigo,
                    almacenOrigen: this.nuevaLista.almacen,
                    cantidad: item.stockActual,
                    usuario: this.usuario.documentoidentidad,
                    motivo: 'Actualización masiva desde lista'
                });
            }

            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Éxito', 'Stock actualizado correctamente', 'success');

        } catch (error) {
            console.error('Error actualizando stock:', error);
            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Error', 'No se pudo actualizar el stock', 'error');
        }
    }

    // ===============================================
    // VERIFICACIÓN CON REQUERIMIENTOS
    // ===============================================

    async verificarContraRequerimientos() {
        if (!this.listaSeleccionada) return;

        try {
            this.alertService.mostrarModalCarga();

            // Obtener requerimientos aprobados sin despachar
            const requerimientos = await this.dexieService.showRequerimiento();
            const requerimientosAprobados = requerimientos.filter(
                ( r: { estados: string; despachado: any; idalmacen: string | undefined; }) => r.estados === 'APROBADO' && !r.despachado && r.idalmacen === this.listaSeleccionada?.almacen
            );

            if (requerimientosAprobados.length === 0) {
                this.alertService.cerrarModalCarga();
                this.alertService.showAlert('Info', 'No hay requerimientos pendientes para este almacén', 'info');
                return;
            }

            // Crear reporte de disponibilidad
            const reporte: any[] = [];

            for (const req of requerimientosAprobados) {
                for (const detalle of req.detalle) {
                    const stockItem = this.detalleListaActual.find(d => d.codigo === detalle.codigo);

                    reporte.push({
                        requerimiento: req.idrequerimiento,
                        codigo: detalle.codigo,
                        descripcion: detalle.descripcion || detalle.producto,
                        cantidadSolicitada: detalle.cantidad,
                        stockDisponible: stockItem ? stockItem.stockActual : 0,
                        puedeDespachar: stockItem && stockItem.stockActual >= detalle.cantidad,
                        faltante: stockItem ? Math.max(0, detalle.cantidad - stockItem.stockActual) : detalle.cantidad
                    });
                }
            }

            this.alertService.cerrarModalCarga();

            // Mostrar resultados
            this.mostrarReporteDisponibilidad(reporte);

        } catch (error) {
            console.error('Error verificando requerimientos:', error);
            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Error', 'No se pudo verificar los requerimientos', 'error');
        }
    }

    mostrarReporteDisponibilidad(reporte: any[]) {
        const itemsCompletos = reporte.filter(r => r.puedeDespachar).length;
        const itemsParciales = reporte.filter(r => !r.puedeDespachar && r.stockDisponible > 0).length;
        const itemsFaltantes = reporte.filter(r => r.stockDisponible === 0).length;

        let html = `
      <div class="text-start">
        <h6>Resumen de Disponibilidad:</h6>
        <ul>
          <li><strong class="text-success">Pueden despacharse completos:</strong> ${itemsCompletos}</li>
          <li><strong class="text-warning">Despacho parcial:</strong> ${itemsParciales}</li>
          <li><strong class="text-danger">Sin stock:</strong> ${itemsFaltantes}</li>
        </ul>
      </div>
    `;

        this.alertService.showAlertAcept('Reporte de Disponibilidad', html, 'info');
    }

    // ===============================================
    // IMPORTACIÓN DESDE EXCEL
    // ===============================================

    onFileSelected(event: any) {
        this.archivoSeleccionado = event.target.files[0];
    }

    async importarDesdeExcel() {
        if (!this.archivoSeleccionado) {
            this.alertService.showAlert('Atención', 'Seleccione un archivo Excel', 'warning');
            return;
        }

        try {
            this.alertService.mostrarModalCarga();

            const reader = new FileReader();
            reader.onload = async (e: any) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Procesar datos
                this.datosImportacion = jsonData.map((row: any) => ({
                    codigo: row['CODIGO'] || row['codigo'],
                    descripcion: row['DESCRIPCION'] || row['descripcion'],
                    stockInicial: Number(row['STOCK_INICIAL'] || row['stock_inicial'] || 0),
                    stockMinimo: Number(row['STOCK_MINIMO'] || row['stock_minimo'] || 0),
                    stockMaximo: Number(row['STOCK_MAXIMO'] || row['stock_maximo'] || 0),
                    unidadMedida: row['UNIDAD_MEDIDA'] || row['unidad_medida'] || 'UND'
                }));

                // Agregar a la lista actual
                for (const dato of this.datosImportacion) {
                    if (dato.codigo && !this.detalleListaActual.find(d => d.codigo === dato.codigo)) {
                        this.detalleListaActual.push({
                            id: this.detalleListaActual.length + 1,
                            listaStockId: this.nuevaLista.id || 0,
                            codigo: dato.codigo,
                            descripcion: dato.descripcion,
                            stockInicial: dato.stockInicial,
                            stockActual: dato.stockInicial,
                            stockMinimo: dato.stockMinimo,
                            stockMaximo: dato.stockMaximo,
                            unidadMedida: dato.unidadMedida,
                            estado: 'ACTIVO'
                        });
                    }
                }

                this.alertService.cerrarModalCarga();
                this.alertService.showAlert('Éxito', `${this.datosImportacion.length} items importados`, 'success');
            };

            reader.readAsArrayBuffer(this.archivoSeleccionado);

        } catch (error) {
            console.error('Error importando:', error);
            this.alertService.cerrarModalCarga();
            this.alertService.showAlert('Error', 'No se pudo importar el archivo', 'error');
        }
    }

    descargarPlantilla() {
        const plantilla = [
            {
                CODIGO: 'ITEM001',
                DESCRIPCION: 'Producto Ejemplo',
                STOCK_INICIAL: 100,
                STOCK_MINIMO: 10,
                STOCK_MAXIMO: 500,
                UNIDAD_MEDIDA: 'UND'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(plantilla);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
        XLSX.writeFile(workbook, 'plantilla_stock.xlsx');
    }

    // ===============================================
    // EXPORTACIÓN Y REPORTES
    // ===============================================

    exportarListaExcel() {
        if (!this.listaSeleccionada) return;

        const dataExport = this.detalleListaActual.map(item => ({
            CODIGO: item.codigo,
            DESCRIPCION: item.descripcion,
            STOCK_INICIAL: item.stockInicial,
            STOCK_ACTUAL: item.stockActual,
            STOCK_MINIMO: item.stockMinimo,
            STOCK_MAXIMO: item.stockMaximo,
            UNIDAD_MEDIDA: item.unidadMedida,
            ESTADO: item.estado
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
        XLSX.writeFile(workbook, `lista_stock_${this.listaSeleccionada.nombre}.xlsx`);
    }

    volverAListado() {
        this.vistaActual = 'LISTADO';
        this.listaSeleccionada = null;
    }

    filtrarItems() {
        if (!this.busquedaItem) {
            this.itemsFiltrados = [...this.itemsDisponibles];
        } else {
            this.itemsFiltrados = this.itemsDisponibles.filter(item =>
                item.codigo.toLowerCase().includes(this.busquedaItem.toLowerCase()) ||
                item.descripcion.toLowerCase().includes(this.busquedaItem.toLowerCase())
            );
        }
    }
}