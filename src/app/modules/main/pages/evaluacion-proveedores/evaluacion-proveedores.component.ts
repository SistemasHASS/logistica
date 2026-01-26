import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import {
  EvaluacionProveedor,
  CriterioEvaluacionProveedor,
  Proveedor,
  OrdenCompra,
  RecepcionOrdenCompra,
  DevolucionProveedor,
  Usuario,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

interface ProveedorConMetricas {
  proveedor: string;
  nombreProveedor: string;
  rucProveedor: string;
  totalOrdenes: number;
  ordenesRecibidas: number;
  devoluciones: number;
  montoTotal: number;
  tasaCumplimiento: number;
  ultimaEvaluacion?: EvaluacionProveedor;
}

@Component({
  selector: 'app-evaluacion-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './evaluacion-proveedores.component.html',
  styleUrls: ['./evaluacion-proveedores.component.scss'],
})
export class EvaluacionProveedoresComponent implements OnInit {
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

  // Datos
  evaluaciones: EvaluacionProveedor[] = [];
  proveedores: Proveedor[] = [];
  ordenesCompra: OrdenCompra[] = [];
  recepciones: RecepcionOrdenCompra[] = [];
  devoluciones: DevolucionProveedor[] = [];

  // Proveedores con métricas
  proveedoresConMetricas: ProveedorConMetricas[] = [];

  // Tabs
  tabActiva: 'lista' | 'nueva' | 'ranking' = 'lista';

  // Formulario
  evaluacion: EvaluacionProveedor = this.nuevaEvaluacion();
  modoEdicion = false;

  // Filtros
  filtroPeriodo: string = '';
  filtroProveedor: string = '';
  filtroNivel: string = 'TODOS';

  // Criterios predefinidos
  criteriosPredefinidos = [
    { criterio: 'CALIDAD' as const, descripcion: 'Calidad de productos/servicios', peso: 30 },
    { criterio: 'TIEMPO_ENTREGA' as const, descripcion: 'Cumplimiento de plazos de entrega', peso: 25 },
    { criterio: 'PRECIO' as const, descripcion: 'Competitividad de precios', peso: 20 },
    { criterio: 'SERVICIO' as const, descripcion: 'Atención y servicio al cliente', peso: 15 },
    { criterio: 'DOCUMENTACION' as const, descripcion: 'Documentación completa y correcta', peso: 10 },
  ];

  // Modal detalle
  modalDetalleAbierto = false;
  evaluacionDetalle: EvaluacionProveedor | null = null;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarDatos();
    this.calcularMetricasProveedores();
  }

  async cargarUsuario() {
    const usuarioData = await this.dexieService.showUsuario();
    if (usuarioData) {
      this.usuario = usuarioData;
    }
  }

  async cargarDatos() {
    try {
      this.alertService.mostrarModalCarga();

      this.proveedores = await this.dexieService.showProveedores();
      this.ordenesCompra = await this.dexieService.showOrdenesCompra();
      this.recepciones = await this.dexieService.showRecepcionesOrdenCompra();
      
      try {
        this.devoluciones = await this.dexieService.showDevolucionesProveedor();
      } catch {
        this.devoluciones = [];
      }

      try {
        this.evaluaciones = await this.dexieService.showEvaluacionesProveedor();
      } catch {
        this.evaluaciones = [];
      }

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar los datos.', 'error');
    }
  }

  calcularMetricasProveedores() {
    const proveedoresMap = new Map<string, ProveedorConMetricas>();

    // Procesar órdenes de compra
    this.ordenesCompra.forEach(orden => {
      const key = orden.proveedor;
      if (!proveedoresMap.has(key)) {
        proveedoresMap.set(key, {
          proveedor: orden.proveedor,
          nombreProveedor: orden.nombreProveedor,
          rucProveedor: orden.rucProveedor,
          totalOrdenes: 0,
          ordenesRecibidas: 0,
          devoluciones: 0,
          montoTotal: 0,
          tasaCumplimiento: 0,
        });
      }

      const metricas = proveedoresMap.get(key)!;
      metricas.totalOrdenes++;
      metricas.montoTotal += orden.montoTotal;

      if (orden.estado === 'RECIBIDA_TOTAL' || orden.estado === 'RECIBIDA_PARCIAL') {
        metricas.ordenesRecibidas++;
      }
    });

    // Procesar devoluciones
    this.devoluciones.forEach(dev => {
      const key = dev.proveedor;
      if (proveedoresMap.has(key)) {
        proveedoresMap.get(key)!.devoluciones++;
      }
    });

    // Calcular tasa de cumplimiento y agregar última evaluación
    proveedoresMap.forEach((metricas, key) => {
      metricas.tasaCumplimiento = metricas.totalOrdenes > 0
        ? ((metricas.ordenesRecibidas - metricas.devoluciones) / metricas.totalOrdenes) * 100
        : 0;

      // Buscar última evaluación
      const evaluacionesProveedor = this.evaluaciones
        .filter(e => e.proveedor === key)
        .sort((a, b) => new Date(b.fechaEvaluacion).getTime() - new Date(a.fechaEvaluacion).getTime());

      if (evaluacionesProveedor.length > 0) {
        metricas.ultimaEvaluacion = evaluacionesProveedor[0];
      }
    });

    this.proveedoresConMetricas = Array.from(proveedoresMap.values())
      .sort((a, b) => b.montoTotal - a.montoTotal);
  }

  nuevaEvaluacion(): EvaluacionProveedor {
    const fecha = new Date();
    const periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

    return {
      proveedor: '',
      nombreProveedor: '',
      rucProveedor: '',
      periodo,
      fechaEvaluacion: fecha.toISOString().split('T')[0],
      criterios: this.criteriosPredefinidos.map(c => ({
        evaluacionId: 0,
        criterio: c.criterio,
        descripcion: c.descripcion,
        peso: c.peso,
        calificacion: 0,
        puntajePonderado: 0,
      })),
      calificacionTotal: 0,
      nivel: 'REGULAR',
      usuarioEvalua: this.usuario.documentoidentidad || '',
      estado: 'BORRADOR',
    };
  }

  nuevaEvaluacionForm() {
    this.evaluacion = this.nuevaEvaluacion();
    this.modoEdicion = false;
    this.tabActiva = 'nueva';
  }

  seleccionarProveedor(proveedor: ProveedorConMetricas) {
    this.evaluacion.proveedor = proveedor.proveedor;
    this.evaluacion.nombreProveedor = proveedor.nombreProveedor;
    this.evaluacion.rucProveedor = proveedor.rucProveedor;
  }

  calcularPuntajePonderado(criterio: CriterioEvaluacionProveedor) {
    criterio.puntajePonderado = (criterio.calificacion * criterio.peso) / 100;
    this.calcularCalificacionTotal();
  }

  calcularCalificacionTotal() {
    this.evaluacion.calificacionTotal = this.evaluacion.criterios.reduce(
      (sum, c) => sum + c.puntajePonderado,
      0
    );

    // Determinar nivel
    if (this.evaluacion.calificacionTotal >= 9) {
      this.evaluacion.nivel = 'EXCELENTE';
    } else if (this.evaluacion.calificacionTotal >= 7) {
      this.evaluacion.nivel = 'BUENO';
    } else if (this.evaluacion.calificacionTotal >= 5) {
      this.evaluacion.nivel = 'REGULAR';
    } else {
      this.evaluacion.nivel = 'DEFICIENTE';
    }
  }

  async guardarEvaluacion() {
    // Validaciones
    if (!this.evaluacion.proveedor) {
      this.alertService.showAlert('Atención', 'Debe seleccionar un proveedor.', 'warning');
      return;
    }

    if (this.evaluacion.criterios.some(c => c.calificacion === 0)) {
      this.alertService.showAlert('Atención', 'Debe calificar todos los criterios.', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      this.evaluacion.usuarioEvalua = this.usuario.documentoidentidad;
      this.evaluacion.estado = 'FINALIZADA';

      await this.dexieService.saveEvaluacionProveedor(this.evaluacion);

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Éxito', 'Evaluación guardada correctamente.', 'success');

      this.tabActiva = 'lista';
      await this.cargarDatos();
      this.calcularMetricasProveedores();
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al guardar la evaluación.', 'error');
    }
  }

  verDetalle(evaluacion: EvaluacionProveedor) {
    this.evaluacionDetalle = evaluacion;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.evaluacionDetalle = null;
  }

  cancelarFormulario() {
    const confirmar = confirm('¿Seguro que deseas cancelar? Se perderán los cambios no guardados.');
    if (!confirmar) return;
    this.tabActiva = 'lista';
  }

  // Filtros
  evaluacionesFiltradas(): EvaluacionProveedor[] {
    let filtradas = [...this.evaluaciones];

    if (this.filtroPeriodo) {
      filtradas = filtradas.filter(e => e.periodo === this.filtroPeriodo);
    }

    if (this.filtroProveedor) {
      filtradas = filtradas.filter(
        e => e.nombreProveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase())
      );
    }

    if (this.filtroNivel !== 'TODOS') {
      filtradas = filtradas.filter(e => e.nivel === this.filtroNivel);
    }

    return filtradas.sort((a, b) => 
      new Date(b.fechaEvaluacion).getTime() - new Date(a.fechaEvaluacion).getTime()
    );
  }

  limpiarFiltros() {
    this.filtroPeriodo = '';
    this.filtroProveedor = '';
    this.filtroNivel = 'TODOS';
  }

  // Utilidades
  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatearPeriodo(periodo: string): string {
    if (!periodo) return '-';
    const [año, mes] = periodo.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(mes) - 1]} ${año}`;
  }

  obtenerClaseNivel(nivel: string): string {
    const clases: { [key: string]: string } = {
      EXCELENTE: 'badge-success',
      BUENO: 'badge-info',
      REGULAR: 'badge-warning',
      DEFICIENTE: 'badge-danger',
    };
    return clases[nivel] || 'badge-secondary';
  }

  obtenerColorCalificacion(calificacion: number): string {
    if (calificacion >= 9) return '#27ae60';
    if (calificacion >= 7) return '#3498db';
    if (calificacion >= 5) return '#f39c12';
    return '#e74c3c';
  }

  obtenerIconoCriterio(criterio: string): string {
    const iconos: { [key: string]: string } = {
      CALIDAD: 'icon-award',
      TIEMPO_ENTREGA: 'icon-clock',
      PRECIO: 'icon-dollar-sign',
      SERVICIO: 'icon-users',
      DOCUMENTACION: 'icon-file-text',
    };
    return iconos[criterio] || 'icon-check';
  }

  rankingProveedores(): ProveedorConMetricas[] {
    return this.proveedoresConMetricas
      .filter(p => p.ultimaEvaluacion)
      .sort((a, b) => {
        const calA = a.ultimaEvaluacion?.calificacionTotal || 0;
        const calB = b.ultimaEvaluacion?.calificacionTotal || 0;
        return calB - calA;
      });
  }
}
