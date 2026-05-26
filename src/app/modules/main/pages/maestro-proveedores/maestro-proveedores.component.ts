import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Proveedor, Usuario } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-maestro-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule],
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

  // Estado de carga
  cargando = false;

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

  private http = inject(HttpClient);
  private dexieService = inject(DexieService);
  private alertService = inject(AlertService);
  private baseUrl = environment.baseUrl;

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarProveedores();
  }

  async cargarUsuario() {
    const usuarioData = await this.dexieService.showUsuario();
    if (usuarioData) {
      this.usuario = usuarioData;
    }
  }

  private normalizarProveedor(p: any): Proveedor {
    return { ...p, documento: p.documento || p.RazonSocial || '' };
  }

  async cargarProveedores(forzarApi = false) {
    const debeRecargarApi = sessionStorage.getItem('proveedores_recargar_api') === '1';

    // 1. Carga inmediata desde Dexie
    const dexieRaw = await this.dexieService.showProveedores();
    const dexieData: Proveedor[] = dexieRaw.map((p: any) => this.normalizarProveedor(p));
    const hayDataEnDexie = dexieData.length > 0;

    // Detectar data corrupta: todos sin documento y sin RazonSocial
    const dexieCorrupto = hayDataEnDexie &&
      dexieData.every(p => !p.documento && !(p as any).RazonSocial);

    if (hayDataEnDexie && !dexieCorrupto) {
      this.proveedores = dexieData;
      this.aplicarFiltros();
      this.calcularContadores();
    }

    // 2. Llamar API si: Dexie vacío, corrupto, forzado externamente, o hay flag de nuevo registro
    const necesitaApi = !hayDataEnDexie || dexieCorrupto || forzarApi || debeRecargarApi;
    if (!necesitaApi) return;

    sessionStorage.removeItem('proveedores_recargar_api');
    // Mostrar loading solo si Dexie estaba vacío (primera carga)
    if (!hayDataEnDexie) this.cargando = true;

    try {
      const body = {
        documento: this.filtroDocumento || '',
        estado: this.filtroEstado !== 'TODOS' ? this.filtroEstado : ''
      };
      const data: any = await this.http
        .post(`${this.baseUrl}/api/logistica/listar-proveedores`, body)
        .toPromise();

      let proveedoresApi: Proveedor[] = [];
      if (Array.isArray(data)) {
        proveedoresApi = data;
      } else if (data && Array.isArray(data.value)) {
        proveedoresApi = data.value;
      } else if (typeof data === 'string') {
        try { proveedoresApi = JSON.parse(data); } catch { proveedoresApi = []; }
      } else if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length > 0 && Array.isArray(data[keys[0]])) {
          proveedoresApi = data[keys[0]];
        }
      }

      proveedoresApi = proveedoresApi.map((p: any) => this.normalizarProveedor(p));

      if (proveedoresApi.length > 0) {
        this.proveedores = proveedoresApi;
        await this.dexieService.clearProveedores();
        await this.dexieService.saveProveedores(proveedoresApi);
      }
    } catch {
      console.warn('[Proveedores] API no disponible, usando Dexie como fallback.');
    } finally {
      this.cargando = false;
      this.aplicarFiltros();
      this.calcularContadores();
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
    if (!this.proveedor.documento) {
      this.alertService.showAlert('Atención', 'Debe ingresar el nombre/razón social.', 'warning');
      return;
    }
    if (!this.proveedor.ruc) {
      this.alertService.showAlert('Atención', 'Debe ingresar el RUC/Documento.', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();
      const body = {
        ...this.proveedor,
        usuario: this.usuario.usuario || 'LOGISTICA'
      };
      const resp: any = await this.http
        .post(`${this.baseUrl}/api/logistica/registrar-proveedor`, body)
        .toPromise();

      this.alertService.cerrarModalCarga();

      const resultado = resp?.resultado || resp?.value?.resultado || 'ERROR';
      const mensaje   = resp?.mensaje   || resp?.value?.mensaje   || 'Error desconocido';

      if (resultado === 'OK') {
        this.alertService.showAlert('Éxito', mensaje, 'success');
        this.mostrarFormulario = false;
        sessionStorage.setItem('proveedores_recargar_api', '1');
        await this.cargarProveedores(true); // fuerza recarga API tras nuevo registro
      } else {
        this.alertService.showAlert('Error', mensaje, 'error');
      }
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

  eliminarProveedor(index: number) {
    this.alertService.showAlert('Info', 'Para desactivar un proveedor en SPRING contacte al administrador del sistema.', 'info');
  }

  cambiarEstado(proveedor: Proveedor) {
    this.alertService.showAlert('Info', 'Para cambiar el estado de un proveedor en SPRING contacte al administrador del sistema.', 'info');
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
        const doc = (p.documento || p.RazonSocial || '').toLowerCase();
        const ruc = (p.ruc || '').toLowerCase();
        const filtro = this.filtroDocumento.toLowerCase();
        cumpleFiltro = cumpleFiltro && (doc.includes(filtro) || ruc.includes(filtro));
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
