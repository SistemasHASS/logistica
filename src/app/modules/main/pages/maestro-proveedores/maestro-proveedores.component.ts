import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Proveedor, Usuario } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-maestro-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './maestro-proveedores.component.html',
  styleUrls: ['./maestro-proveedores.component.scss'],
})
export class MaestroProveedoresComponent implements OnInit {
  // Listas
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];

  // Usuario
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
    rol: '',
  };

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  proveedor: Proveedor = this.nuevoProveedor();

  // Filtros
  filtroDocumento: string = '';
  filtroEstado: string = 'TODOS';
  filtroTipoPersona: string = 'TODOS';

  // Contadores
  totalProveedores = 0;
  proveedoresActivos = 0;
  proveedoresInactivos = 0;

  // Modal detalle
  modalDetalleAbierto = false;
  proveedorDetalle: Proveedor | null = null;

  // Opciones
  tiposPersona = ['NATURAL', 'JURIDICA'];
  estados = ['ACTIVO', 'INACTIVO'];
  tiposPago = ['CONTADO', 'CREDITO_15', 'CREDITO_30', 'CREDITO_45', 'CREDITO_60'];
  monedas = ['PEN', 'USD'];
  tiposServicio = ['BIENES', 'SERVICIOS', 'MIXTO'];

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarProveedores();
    this.aplicarFiltros();
    this.calcularContadores();
  }

  async cargarUsuario() {
    const usuarioData = await this.dexieService.showUsuario();
    if (usuarioData) {
      this.usuario = usuarioData;
    }
  }

  async cargarProveedores() {
    try {
      this.alertService.mostrarModalCarga();
      this.proveedores = await this.dexieService.showProveedores();
      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar los proveedores.', 'error');
    }
  }

  calcularContadores() {
    this.totalProveedores = this.proveedores.length;
    this.proveedoresActivos = this.proveedores.filter(p => p.Estado === 'ACTIVO').length;
    this.proveedoresInactivos = this.proveedores.filter(p => p.Estado === 'INACTIVO').length;
  }

  nuevoProveedor(): Proveedor {
    return {
      id: 0,
      TipoPersona: 'JURIDICA',
      documento: '',
      ruc: '',
      Estado: 'ACTIVO',
      TipoPago: 'CREDITO_30',
      MonedaPago: 'PEN',
      detraccion: 'NO',
      TipoServicio: 'BIENES',
    };
  }

  nuevoProveedorForm() {
    this.proveedor = this.nuevoProveedor();
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async guardarProveedor() {
    // Validaciones
    if (!this.proveedor.documento) {
      this.alertService.showAlert('Atención', 'Debe ingresar el nombre/razón social.', 'warning');
      return;
    }

    if (!this.proveedor.ruc) {
      this.alertService.showAlert('Atención', 'Debe ingresar el RUC.', 'warning');
      return;
    }

    if (this.proveedor.ruc.length !== 11) {
      this.alertService.showAlert('Atención', 'El RUC debe tener 11 dígitos.', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (this.modoEdicion) {
        // Actualizar
        await this.dexieService.saveProveedor(this.proveedor);
        this.proveedores[this.editIndex] = { ...this.proveedor };
      } else {
        // Crear nuevo
        this.proveedor.id = Date.now(); // ID temporal
        await this.dexieService.saveProveedor(this.proveedor);
        this.proveedores.push({ ...this.proveedor });
      }

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Éxito', 'Proveedor guardado correctamente.', 'success');

      this.mostrarFormulario = false;
      this.aplicarFiltros();
      this.calcularContadores();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al guardar el proveedor.', 'error');
    }
  }

  editarProveedor(index: number) {
    const proveedorOriginal = this.proveedoresFiltrados[index];
    this.editIndex = this.proveedores.findIndex(p => p.id === proveedorOriginal.id);
    this.proveedor = { ...proveedorOriginal };
    this.mostrarFormulario = true;
    this.modoEdicion = true;
  }

  async eliminarProveedor(index: number) {
    const proveedor = this.proveedoresFiltrados[index];

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      `¿Está seguro de eliminar al proveedor ${proveedor.documento}?`,
      'warning'
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.proveedores.delete(proveedor.id);
      
      const indexOriginal = this.proveedores.findIndex(p => p.id === proveedor.id);
      if (indexOriginal > -1) {
        this.proveedores.splice(indexOriginal, 1);
      }

      this.alertService.showAlert('Éxito', 'Proveedor eliminado correctamente.', 'success');
      this.aplicarFiltros();
      this.calcularContadores();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      this.alertService.showAlert('Error', 'Ocurrió un error al eliminar el proveedor.', 'error');
    }
  }

  async cambiarEstado(proveedor: Proveedor) {
    const nuevoEstado = proveedor.Estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      `¿Desea cambiar el estado del proveedor a ${nuevoEstado}?`,
      'info'
    );

    if (!confirmacion) return;

    try {
      proveedor.Estado = nuevoEstado;
      await this.dexieService.saveProveedor(proveedor);
      
      this.alertService.showAlert('Éxito', 'Estado actualizado correctamente.', 'success');
      this.calcularContadores();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      this.alertService.showAlert('Error', 'Ocurrió un error al cambiar el estado.', 'error');
    }
  }

  verDetalle(proveedor: Proveedor) {
    this.proveedorDetalle = proveedor;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.proveedorDetalle = null;
  }

  cancelarFormulario() {
    const confirmar = confirm('¿Seguro que deseas cancelar? Se perderán los cambios no guardados.');
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  // Filtros
  aplicarFiltros() {
    this.proveedoresFiltrados = this.proveedores.filter(p => {
      let cumpleFiltro = true;

      if (this.filtroDocumento) {
        cumpleFiltro = cumpleFiltro && (
          p.documento.toLowerCase().includes(this.filtroDocumento.toLowerCase()) ||
          p.ruc.includes(this.filtroDocumento)
        );
      }

      if (this.filtroEstado !== 'TODOS') {
        cumpleFiltro = cumpleFiltro && p.Estado === this.filtroEstado;
      }

      if (this.filtroTipoPersona !== 'TODOS') {
        cumpleFiltro = cumpleFiltro && p.TipoPersona === this.filtroTipoPersona;
      }

      return cumpleFiltro;
    });
  }

  limpiarFiltros() {
    this.filtroDocumento = '';
    this.filtroEstado = 'TODOS';
    this.filtroTipoPersona = 'TODOS';
    this.aplicarFiltros();
  }

  // Utilidades
  obtenerClaseEstado(estado: string): string {
    return estado === 'ACTIVO' ? 'badge-success' : 'badge-secondary';
  }

  obtenerEtiquetaTipoPago(tipo: string): string {
    const etiquetas: { [key: string]: string } = {
      'CONTADO': 'Contado',
      'CREDITO_15': 'Crédito 15 días',
      'CREDITO_30': 'Crédito 30 días',
      'CREDITO_45': 'Crédito 45 días',
      'CREDITO_60': 'Crédito 60 días',
    };
    return etiquetas[tipo] || tipo;
  }

  obtenerEtiquetaMoneda(moneda: string): string {
    return moneda === 'PEN' ? 'Soles (S/)' : 'Dólares ($)';
  }

  validarRUC() {
    if (this.proveedor.ruc && this.proveedor.ruc.length === 11) {
      // Validación básica de RUC peruano
      const primerDigito = this.proveedor.ruc.charAt(0);
      if (primerDigito === '2') {
        this.proveedor.TipoPersona = 'JURIDICA';
      } else if (primerDigito === '1') {
        this.proveedor.TipoPersona = 'NATURAL';
      }
    }
  }
}
