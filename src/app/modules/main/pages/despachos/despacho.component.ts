import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { CommodityService } from '@/app/modules/main/services/commoditys.service';
import { Usuario, Stock, OrdenCompra, DetalleDespacho, Despacho } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';

declare var bootstrap: any;

export enum EstadoRequerimiento {
  APROBADO = 'APROBADO',
  ATENCION_PARCIAL = 'ATENCION_PARCIAL',
  ATENCION_COMPLETA = 'ATENCION_COMPLETA',
  DESPACHADO_COMPLETO = 'DESPACHADO_COMPLETO',
}
@Component({
  selector: 'app-despachos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DatePickerModule],
  templateUrl: './despacho.component.html',
  styleUrls: ['despacho.component.scss'],
})
export class DespachoComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  // Make Math available in template
  public Math = Math;

  // Listas principales
  requerimientosAprobadosAll: any[] = [];
  requerimientos: any[] = [];
  requerimientosAprobados: any[] = [];
  stockDisponible: Stock[] = [];
  ordenesCompraGeneradas: OrdenCompra[] = [];
  items: any[] = []; // detalle del requerimiento seleccionado
  turnos: any[] = [];
  labores: any[] = [];
  cecos: any[] = [];
  almacenes: any[] = [];
  clasificaciones: any[] = [];
  tipoGastos: any[] = [];
  servicios: any[] = [];
  servicioAF: any[] = [];
  servicioAFM: any[] = [];
  fundos: any[] = [];
  cultivos: any[] = [];
  areas: any[] = [];
  proyectos: any[] = [];
  detalle: any[] = []; // items a despachar (detalle atención)
  subcommodity: any[] = [];

  filtroServicios: any[] = [];
  filtroServiciosAF: any[] = [];
  filtroServiciosAFM: any[] = [];

  filterItem: any[] = [];
  filterCommodity: any[] = [];

  filtro: string = '';
  totalRegistros: number = 0;
  pagina: number = 1;
  ordenColumna: string = '';
  ordenDireccion: 'asc' | 'desc' = 'asc';

  fechaInicio?: Date;
  fechaFin?: Date;

  // Modal detalle despacho
  requerimientoSeleccionado: any = null;
  detalleDespacho: any[] = [];
  loading = false;
  selected: any = null;
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

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private requerimientosService: RequerimientosService,
    private maestrasService: MaestrasService,
    private commodityService: CommodityService
  ) { }

  async ngOnInit() {
    await this.cargarUsuario();
    await this.sincronizarTablasMaestras();
    await this.sincronizaAprobados();
    // await this.cargarRequerimientosAprobados();
    await this.cargarStockDisponible();
  }

  async cargarRequerimientos() {
    this.requerimientos = await this.dexieService.requerimientos
      .where('estados')
      .anyOf('APROBADO', 'ATENCION_PARCIAL', 'ATENCION_COMPLETA')
      .toArray();
  }

  async sincronizarTablasMaestras() {
    try {
      this.alertService.mostrarModalCarga();

      const fundos = this.maestrasService.getFundos([
        { idempresa: this.usuario.idempresa },
      ]);
      fundos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveFundos(resp);
          await this.ListarFundos();
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Exito!',
            'Sincronizado con exito',
            'success'
          );
        }
      });

      const cultivos = this.maestrasService.getCultivos([
        { idempresa: this.usuario?.idempresa },
      ]);
      cultivos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCultivos(resp);
          await this.ListarCultivos();
        }
      });

      const areas = this.maestrasService.getAreas([
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' },
      ]);
      areas.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAreas(resp);
          await this.ListarAreas();
        }
      });

      const almacenes = this.maestrasService.getAlmacenes([
        { ruc: this.usuario?.ruc },
      ]);
      almacenes.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAlmacenes(resp);
          await this.ListarAlmacenes();
        }
      });

      const proyectos = this.maestrasService.getProyectos([
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      proyectos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveProyectos(resp);
          await this.ListarProyectos();
        }
      });

      const items = this.maestrasService.getItems([{ ruc: this.usuario?.ruc }]);
      items.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveItemComoditys(resp);
          await this.ListarItems();
        }
      });

      const clasificaciones = this.maestrasService.getClasificaciones([{}]);
      clasificaciones.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveClasificaciones(resp);
          await this.ListarClasificaciones();
        }
      });

      const cecos = await this.maestrasService.getCecos([
        { aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      cecos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCecos(resp);
          await this.ListarCecos();
        }
      });

      const subcommodity = await this.commodityService.getSubCommodity([]);
      subcommodity.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveMaestroSubCommodities(resp);
          await this.ListarSubcommodity();
        }
      });

      const tipoGastos = this.maestrasService.getTipoGastos([{}]);
      tipoGastos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveTipoGastos(resp);
          await this.ListarTipoGastos();
        }
      });
    } catch (error: any) {
      console.error(error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrio un error</p><p>',
        'error'
      );
    }
  }

  async ListarFundos() {
    this.fundos = await this.dexieService.showFundos();
  }

  async ListarCultivos() {
    this.cultivos = await this.dexieService.showCultivos();
  }

  async ListarAreas() {
    this.areas = await this.dexieService.showAreas();
  }

  async ListarAlmacenes() {
    this.almacenes = await this.dexieService.showAlmacenes();
  }

  async ListarProyectos() {
    this.proyectos = await this.dexieService.showProyectos();
  }

  async ListarItems() {
    this.items = await this.dexieService.showItemComoditys();
    this.filterItem = this.items.filter((item) => item.tipoclasificacion === 'I');
  }

  async ListarClasificaciones() {
    this.clasificaciones = await this.dexieService.showClasificaciones();
  }

  async ListarTurnos() {
    this.turnos = await this.dexieService.showTurnos();
  }

  async ListarLabores() {
    this.labores = await this.dexieService.showLabores();
  }

  async ListarCecos() {
    this.cecos = await this.dexieService.showCecos();
  }

  async ListarSubcommodity() {
    this.subcommodity = await this.dexieService.showMaestroSubCommodity();
  }

  async ListarTipoGastos() {
    this.tipoGastos = await this.dexieService.showTipoGastos();
  }

  async ListarServicios() {
    this.servicios = await this.dexieService.showMaestroCommodity();
    this.filtroServicios = this.servicios.filter(
      (serv) => serv.clasificacion === 'SER'
    );
  }

  async ListarServiciosAF() {
    this.servicioAF = await this.dexieService.showMaestroCommodity();
    this.filtroServiciosAF = this.servicioAF.filter(
      (servaf) => servaf.clasificacion === 'ACT'
    );
  }

  async ListarServiciosAFM() {
    this.servicioAFM = await this.dexieService.showMaestroCommodity();
    this.filtroServiciosAFM = this.servicioAFM.filter(
      (servaf) => servaf.clasificacion === 'ATM'
    );
  }

  getDescripcionProducto(codigo: any) {
    const p = this.filterItem.find((x) => x.codigo === codigo);
    return p ? p.descripcion : codigo;
  }

  getDescripcionSubCommodity(codigo: any) {
    const p = this.subcommodity.find((x) => x.commodity === codigo);
    return p ? p.descripcionLocal : codigo;
  }

  obtenerProyectosUnicos(detalle: any[]): string[] {
    if (!detalle || !detalle.length) return [];

    return [...new Set(detalle.map(d => d.proyecto))];
  }

  verDetalle(r: any) {
    this.selected = r;
    this.detalle = r.detalle;

    const modal = new bootstrap.Modal(document.getElementById('modalAtencion'));
    modal.show();
  }

  buscar() {
    this.pagina = 1;
    this.aplicarFiltros();
    if (this.table) {
      this.table.first = 0; // 👈 vuelve a la página 1
    }
  }

  aplicarFiltros() {
    let data = [...this.requerimientosAprobadosAll];

    if (this.filtro.trim().length > 0) {
      const f = this.filtro.toLowerCase();

      data = data.filter(
        (x) =>
          x.glosa?.toLowerCase().includes(f) ||
          x.tipo?.toLowerCase().includes(f) ||
          x.idrequerimiento?.toString().includes(f) ||
          x.estados?.toLowerCase().includes(f) ||
          this.formatearFecha(x.fechaAprobacion).includes(f) ||
          x.detalle?.some((d: any) =>
            d.proyecto?.toLowerCase().includes(f))
      );
    }

    /* 📅 FILTRO POR RANGO DE FECHAS */
    if (this.fechaInicio || this.fechaFin) {
      data = data.filter(x => {
        const fecha = new Date(x.fechaAprobacion);

        if (this.fechaInicio && fecha < this.fechaInicio) return false;
        if (this.fechaFin && fecha > this.fechaFin) return false;

        return true;
      });
    }

    // Ordenamiento si deseas mantenerlo
    if (this.ordenColumna) {
      data.sort((a: any, b: any) => {
        const valorA = a[this.ordenColumna] ?? '';
        const valorB = b[this.ordenColumna] ?? '';

        return this.ordenDireccion === 'asc'
          ? valorA > valorB
            ? 1
            : -1
          : valorA < valorB
            ? 1
            : -1;
      });
    }

    this.requerimientosAprobados = data;
    this.totalRegistros = data.length;
  }

  limpiarFecha() {
    // si ambas fechas están vacías → vuelve a todo
    if (!this.fechaInicio && !this.fechaFin) {
      this.buscar();
    }
  }

  calcularAtencion(d: any): number {
    debugger
    const solicitada = d.cantidad ?? 0;
    const atendida = d.atendida ?? 0;
    const pendiente = solicitada - atendida;

    const almacen = this.selected?.almacen; // 🔥 CLAVE

    if (!almacen) return 0;

    const stock = this.obtenerStock(d.codigo, almacen);

    return Math.max(0, Math.min(stock, pendiente));
  }


  async registrarAtencion() {
    if (!this.detalle.length) {
      this.alertService.showAlert(
        'Aviso',
        'No hay items para despachar',
        'warning'
      );
      return;
    }

    for (const d of this.detalle) {
      const registro = await this.dexieService.detalles
        .where('idrequerimiento')
        // .equals(d.idrequerimiento)
        .equals(this.selected.idrequerimiento)
        .and((x) => x.codigo === d.codigo)
        .first();

      if (registro) {
        registro.atendida = (registro.atendida || 0) + d.cantidad;
        await this.dexieService.detalles.put(registro);
      }
    }

    this.alertService.showAlert(
      'Éxito',
      'Despacho registrado correctamente',
      'success'
    );
    this.detalle = [];
    this.selected = null;
  }

  async abrirDespachoFinal(req: any) {
    this.selected = req;

    this.detalleDespacho = await this.dexieService.detalles
      .where('idrequerimiento')
      .equals(req.idrequerimiento)
      .toArray();

    new bootstrap.Modal(document.getElementById('modalDespacho')).show();
  }

  // async confirmarDespacho() {
  //   try {
  //     for (const d of this.detalleDespacho) {

  //       // Validar stock antes
  //       const stockActual = this.obtenerStock(d.codigo, d.almacen);
  //       if (stockActual < d.atendida) {
  //         this.alertService.showAlert(
  //           'Stock insuficiente',
  //           `No hay stock suficiente para ${d.producto}`,
  //           'warning'
  //         );
  //         return;
  //       }

  //       // Descontar stock (por almacén)
  //       await this.actualizarStock(d.codigo, d.almacen, -d.atendida);
  //     }

  //     // Estado correcto según lógica
  //     this.selected.estado = EstadoRequerimiento.DESPACHADO_COMPLETO;

  //     await this.dexieService.requerimientos.put(this.selected);

  //     this.alertService.showAlert(
  //       'Despacho',
  //       'Salida registrada correctamente',
  //       'success'
  //     );

  //     this.cargarRequerimientos();

  //   } catch (error) {
  //     console.error(error);
  //     this.alertService.showAlert(
  //       'Error',
  //       'Ocurrió un error al confirmar el despacho',
  //       'error'
  //     );
  //   }
  // }

  async confirmarDespacho() {
    try {

      // 🔒 Validación básica
      if (!this.selected || !this.detalleDespacho.length) {
        this.alertService.showAlert(
          'Despacho',
          'No hay información para despachar',
          'warning'
        );
        return;
      }

      const usuario = (await this.dexieService.getUsuarioLogueado())?.usuario || 'SYSTEM';

      // 🔹 Cabecera despacho
      const despacho: Despacho = {
        numeroDespacho: `DES-${Date.now()}`,
        fecha: new Date().toISOString(),
        almacen: this.selected.idalmacen,
        usuarioDespacha: usuario,
        estado: 'PENDIENTE',
        detalle: [],
      };

      let atender: any | number = 0;

      for (const d of this.detalleDespacho) {
        atender = this.calcularAtencion(d); // 🔥 CLAVE
        if (atender <= 0) continue;
        // 🔻 Descontar stock
        await this.actualizarStock(d.codigo, this.selected.almacen, -atender);
      }

      // 🔹 Detalle despacho
      const detalles: DetalleDespacho[] = this.detalleDespacho.map(d => ({
        despachoId: 0, // se asigna en Dexie
        detalleRecepcionId: d.id || 0,
        codigo: d.codigo,
        descripcion: d.producto,
        cantidad: atender,
        unidadMedida: d.unidadMedida || '',
        precioUnitario: 0,
        descuento: 0,
        subtotal: 0,
        impuesto: 0,
        total: 0,
        estado: 'COMPLETO'
      }));

      // 🚀 Confirmar despacho completo
      const despachoId = await this.dexieService.confirmarDespachoCompleto(
        despacho,
        detalles,
        usuario,
        this.selected
      );

      // ✅ UI feedback
      this.alertService.showAlert(
        'Despacho',
        `Despacho N° ${despachoId} confirmado correctamente`,
        'success'
      );

      // 🔄 Refrescar data
      await this.cargarRequerimientos();
      await this.cargarStockDisponible();

      // ❌ Cerrar modal
      const modal = document.getElementById('modalDespacho');
      if (modal) {
        (window as any).bootstrap.Modal.getInstance(modal)?.hide();
      }

    } catch (error: any) {

      console.error('Error confirmando despacho:', error);

      this.alertService.showAlert(
        'Error',
        error?.message || 'No se pudo confirmar el despacho',
        'error'
      );
    }
  }


  generarNumeroDespacho(): string {
    const fecha = new Date();
    return `DSP-${fecha.getFullYear()}${(fecha.getMonth() + 1)
      .toString().padStart(2, '0')}${fecha.getDate()
        .toString().padStart(2, '0')}-${Date.now()}`;
  }

  async guardarDespacho(): Promise<number> {
    const despacho: Despacho = {
      numeroDespacho: this.generarNumeroDespacho(),
      fecha: new Date().toISOString(),
      almacen: this.selected.almacen,
      usuarioDespacha: this.usuario.documentoidentidad,
      estado: 'APROBADO',
      observaciones: this.selected.observaciones || '',
      detalle: [] // ❗ NO se persiste
    };

    // 1️⃣ Guardar cabecera
    const despachoId = await this.dexieService.despachos.add(despacho);
    console.log('✅ Despacho guardado:', despacho);
    // 2️⃣ Guardar detalle
    for (const d of this.detalleDespacho) {
      const detalle: DetalleDespacho = {
        despachoId,
        detalleRecepcionId: d.detalleRecepcionId,
        codigo: d.codigo,
        descripcion: d.descripcion,
        cantidad: d.atendida,
        unidadMedida: d.unidadMedida,
        precioUnitario: d.precioUnitario,
        descuento: d.descuento ?? 0,
        subtotal: d.subtotal,
        impuesto: d.impuesto,
        total: d.total,
        marca: d.marca,
        modelo: d.modelo,
        especificaciones: d.especificaciones,
        fechaEntregaEstimada: d.fechaEntregaEstimada,
        estado: 'COMPLETO',
        observaciones: d.observaciones
      };

      await this.dexieService.detalleDespachos.add(detalle);
      console.log('✅ Detalle de despacho guardado:', detalle);
    }

    return despachoId;
  }

  // async confirmarDespacho() {
  //   for (const d of this.detalleDespacho) {
  //     await this.actualizarStock(d.codigo, -d.atendida);
  //   }

  //   this.selected.estado = EstadoRequerimiento.DESPACHADO_COMPLETO;
  //   await this.dexieService.requerimientos.put(this.selected);

  //   this.alertService.showAlert(
  //     'Despacho',
  //     'Salida registrada correctamente',
  //     'success'
  //   );
  //   this.cargarRequerimientos();
  // }

  /**
   * Actualiza el stock tanto en memoria como en la base de datos local
   * @param codigo Código del producto
   * @param almacenOrCantidad Código del almacén (opcional) o cantidad a sumar/restar
   * @param cantidad Cantidad a sumar/restar (usar negativo para restar)
   */
  // async actualizarStock(
  //   codigo: string,
  //   almacenOrCantidad: string | number,
  //   cantidad?: number
  // ) {
  //   // Manejar ambos casos: (codigo, cantidad) y (codigo, almacen, cantidad)
  //   let almacen: string | undefined;
  //   let cant: number;

  //   if (cantidad !== undefined) {
  //     // Caso con 3 parámetros: (codigo, almacen, cantidad)
  //     almacen = almacenOrCantidad as string;
  //     cant = cantidad;

  //     // Actualizar en memoria
  //     const stock = this.stockDisponible.find(
  //       (s) => s.codigo === codigo && s.almacen === almacen
  //     );

  //     if (stock) {
  //       stock.cantidad += cant; // cantidad negativa para restar en despacho
  //       if (stock.cantidad < 0) stock.cantidad = 0;
  //     } else if (cant > 0) {
  //       // si no existe en la lista local, agregarlo con la cantidad (si la cantidad es positiva)
  //       this.stockDisponible.push({
  //         codigo,
  //         descripcion: '',
  //         almacen: almacen as string,
  //         cantidad: cant,
  //         unidadMedida: '',
  //         ultimaActualizacion: new Date().toISOString(),
  //       });
  //     }
  //   } else {
  //     // Caso con 2 parámetros: (codigo, cantidad)
  //     cant = almacenOrCantidad as number;

  //     // Actualizar en Dexie
  //     const itemStock = await this.dexieService.stock
  //       .where('codigo')
  //       .equals(codigo)
  //       .first();

  //     if (itemStock) {
  //       itemStock.cantidad += cant;
  //       if (itemStock.cantidad < 0) itemStock.cantidad = 0;
  //       await this.dexieService.stock.put(itemStock);
  //     }
  //   }
  // }

  async actualizarStock(
    codigo: string,
    almacen: string,
    cantidad: number
  ) {
    // ====== MEMORIA ======
    const stockLocal = this.stockDisponible.find(
      s => s.codigo === codigo && s.almacen === almacen
    );

    if (stockLocal) {
      stockLocal.cantidad += cantidad;
      if (stockLocal.cantidad < 0) stockLocal.cantidad = 0;
    }

    // ====== DEXIE ======
    const itemStock = await this.dexieService.stock
      .where({ codigo, almacen })
      .first();

    if (itemStock) {
      itemStock.cantidad += cantidad;
      if (itemStock.cantidad < 0) itemStock.cantidad = 0;
      await this.dexieService.stock.put(itemStock);
    }
  }

  async cargarUsuario() {
    const usuario = await this.dexieService.showUsuario();
    if (usuario) {
      this.usuario = usuario;
    }
  }

  // Carga solo los requerimientos del store (Dexie)
  async cargarRequerimientosAprobados() {
    this.loading = true;
    const requerimientos = await this.dexieService.showRequerimiento();
    console.log('Requerimientos desde Dexie:', requerimientos);
    this.requerimientosAprobadosAll = (requerimientos || []).filter(
      (r: { estados: string; }) => r.estados === 'APROBADO'
    );
    // inicialmente se muestra todo
    this.requerimientosAprobados = [...this.requerimientosAprobadosAll];
    this.totalRegistros = this.requerimientosAprobados.length;
    this.loading = false;
    console.log('Requerimientos aprobados:', this.requerimientosAprobados);
  }

  obtenerRol() {
    if (this.usuario.idrol.includes('ALLOGIST')) return 'ALLOGIST';
    if (this.usuario.idrol.includes('APLOGIST')) return 'APLOGIST';
    return '';
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';
    const d = new Date(fecha);

    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();

    return `${dia}/${mes}/${anio}`;
  }

  async sincronizaAprobados() {
    try {
      const requerimmientos = this.requerimientosService.getRequerimientosAprobados([]);

      requerimmientos.subscribe(async (resp: any) => {

        if (!!resp && resp.length) {

          // Limpiar Stores para evitar duplicados
          await this.dexieService.requerimientos.clear();
          await this.dexieService.detalles.clear();

          // Guardar requerimientos
          await this.dexieService.requerimientos.bulkAdd(resp);

          // Guardar detalles
          const detallesPlanos = [];
          for (const req of resp) {
            if (req.detalle?.length) {
              for (const det of req.detalle) {
                detallesPlanos.push({
                  ...det,
                  idrequerimiento: req.idrequerimiento
                });
              }
            }
          }

          await this.dexieService.detalles.bulkAdd(detallesPlanos);

          console.log('✅ Requerimientos y detalles guardados correctamente');
          await this.cargarRequerimientosAprobados();
        }
      });

    } catch (error: any) {
      console.error(error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrió un error</p>',
        'error'
      );
    }
  }

  // Simula carga de stock (reemplaza por llamada real al backend si tienes)
  // async cargarStockDisponible() {
  //   this.requerimientosService.obtenerReporteSaldos([]).subscribe(async (resp: any) => {
  //     if (!!resp && resp.length) {
  //       await this.dexieService.saveStocks(resp);
  //       this.stockDisponible = await this.dexieService.showStock();
  //     }
  //   });

  //   // this.stockDisponible = [
  //   //   {
  //   //     codigo: 'ITEM001',
  //   //     descripcion: 'Producto A',
  //   //     unidadMedida: 'UN',
  //   //     ultimaActualizacion: new Date().toISOString().split('T')[0],
  //   //     almacen: 'ALM01',
  //   //     cantidad: 100,
  //   //   },
  //   //   {
  //   //     codigo: 'ITEM002',
  //   //     descripcion: 'Producto B',
  //   //     unidadMedida: 'UN',
  //   //     ultimaActualizacion: new Date().toISOString().split('T')[0],
  //   //     almacen: 'ALM01',
  //   //     cantidad: 50,
  //   //   },
  //   //   {
  //   //     codigo: 'ITEM003',
  //   //     descripcion: 'Producto C',
  //   //     unidadMedida: 'UN',
  //   //     ultimaActualizacion: new Date().toISOString().split('T')[0],
  //   //     almacen: 'ALM01',
  //   //     cantidad: 0,
  //   //   },
  //   // ];
  // }

  cargarStockDisponible() {
    this.requerimientosService.obtenerReporteSaldos([]).subscribe({
      next: async (resp: any[]) => {
        if (resp?.length) {
          await this.dexieService.saveStocks(resp);
          this.stockDisponible = await this.dexieService.showStock();
        }
      },
      error: () => {
        this.alertService.showAlert(
          'Error',
          'No se pudo cargar el stock',
          'error'
        );
      }
    });
  }

  obtenerStock(codigo: string, almacen: string): number {
    const stock = this.stockDisponible.find(
      (s) => s.codigo === codigo && s.almacen === almacen
    );
    return stock ? stock.cantidad : 0;
  }

  /* ---------------------------
     NUEVOS MÉTODOS: flujo despacho
     --------------------------- */

  // 1) Al hacer click en "Atender" — carga detalle del requerimiento y prepara items
  async onVerItems(req: any) {
    try {
      this.selected = req;
      this.detalle = []; // limpiar detalle de atención

      // Trae detalles desde Dexie (ajusta el nombre 'detalles' si tu store es distinto)
      const detalles = await this.dexieService.detalles
        .where('idrequerimiento')
        .equals(req.idrequerimiento)
        .toArray();

      // mapear y calcular pendientes/stock
      this.items = (detalles || []).map((d: any) => {
        const atendida = d.atendida || 0;
        const solicitada = d.cantidad || d.cantidadSolicitada || 0;
        const pendiente = Math.max(0, solicitada - atendida);
        const stock = this.obtenerStock(
          d.codigo,
          req.idalmacen || d.almacen || 'ALM01'
        );

        return {
          ...d,
          cantidadSolicitada: solicitada,
          atendida: atendida,
          pendiente: pendiente,
          stock: stock,
          cantidadAtender: 0, // campo temporal enlazado en el input
        };
      });

      // Si quieres abrir un modal, lo puedes hacer aquí
      // const modalEl = document.getElementById('modalDetalles'); ...
    } catch (err) {
      console.error('Error cargando items:', err);
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar los items',
        'error'
      );
    }
  }

  // 2) Agregar item al detalle de atención
  onAgregar(item: any) {
    try {
      const cantidad = Number(item.cantidadAtender) || 0;

      if (cantidad <= 0) {
        this.alertService.showAlert(
          'Aviso',
          'Ingrese cantidad a atender',
          'warning'
        );
        return;
      }

      if (cantidad > item.pendiente) {
        this.alertService.showAlert(
          'Aviso',
          'La cantidad excede lo pendiente',
          'warning'
        );
        return;
      }

      if (cantidad > item.stock) {
        // Permitimos parcialmente y generamos orden de compra para faltantes
        // pero aquí prevenimos enviar más de lo que hay en stock.
        this.alertService.showAlert(
          'Aviso',
          'No hay suficiente stock. Ajusta la cantidad.',
          'warning'
        );
        return;
      }

      // Si ya existe en detalle, sumar
      const idx = this.detalle.findIndex((d) => d.codigo === item.codigo);
      if (idx >= 0) {
        this.detalle[idx].cantidad += cantidad;
      } else {
        this.detalle.push({
          idRequerimientoDetalle: item.idRequerimientoDetalle || item.id,
          codigo: item.codigo,
          descripcion: item.descripcion || item.producto,
          cantidad: cantidad,
          idrequerimiento: this.selected.idrequerimiento,
          idalmacen: this.selected.idalmacen,
        });
      }

      // Actualizar campos en items para reflectar visualmente
      item.cantidadAtender = 0;
    } catch (err) {
      console.error('onAgregar error', err);
    }
  }

  // 3) Quitar del detalle de atención
  onQuitar(index: number) {
    this.detalle.splice(index, 1);
  }

  // 4) Limpiar detalle
  onLimpiar() {
    this.detalle = [];
  }

  // 5) Imprimir (usa la sección #contenidoPDF)
  onImprimir() {
    const contenido = document.getElementById('contenidoPDF');
    if (!contenido) return;

    const w = window.open('', '_blank');
    if (!w) {
      this.alertService.showAlert(
        'Error',
        'No se pudo abrir ventana de impresión',
        'error'
      );
      return;
    }

    w.document.write(`
      <html>
        <head>
          <title>Imprimir Atención</title>
          <link rel="stylesheet" href="/assets/styles.css" />
          <style>
            /* adapta estilos impresos si quieres */
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 6px; }
          </style>
        </head>
        <body>
          ${contenido.innerHTML}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  // 6) Generar PDF (versión simple: abre vista para imprimir — si tienes jsPDF/html2pdf puedes integrarlo)
  onGenerarPDF() {
    // Reutilizamos impresión en nueva ventana; si quieres lo reemplazo por html2pdf/jsPDF
    this.onImprimir();
  }

  // 7) Registrar Atención (persistir en Dexie / backend)
  async onRegistrar() {
    if (!this.selected) {
      this.alertService.showAlert(
        'Aviso',
        'Seleccione un requerimiento',
        'warning'
      );
      return;
    }

    if (!this.detalle || this.detalle.length === 0) {
      this.alertService.showAlert(
        'Aviso',
        'No hay items en el detalle para registrar',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      // 1) Validar stock otra vez y generar orden de compra automática para faltantes
      const itemsFaltantes: any[] = [];
      for (const d of this.detalle) {
        const stock = this.obtenerStock(
          d.codigo,
          d.idalmacen || this.selected.idalmacen
        );
        if (stock < d.cantidad) {
          itemsFaltantes.push({
            ...d,
            faltante: d.cantidad - stock,
            disponible: stock,
          });
        }
      }

      if (itemsFaltantes.length > 0) {
        // Genera orden de compra automática como ya tenías
        await this.generarOrdenCompraAutomatica(itemsFaltantes);
        // Opcional: notificar al usuario
      }

      // 2) Actualizar stock y actualizar detalle en Dexie (marcar atendida)
      for (const d of this.detalle) {
        // actualizar stock local
        await this.actualizarStock(
          d.codigo,
          d.idalmacen || this.selected.idalmacen,
          -d.cantidad
        );

        // actualizar detalle del requerimiento en Dexie:
        // buscamos el registro por idRequerimientoDetalle o por codigo/idrequerimiento
        let claveDetalle =
          d.idRequerimientoDetalle || d.idRequerimientoDetalle === 0
            ? d.idRequerimientoDetalle
            : null;

        if (claveDetalle) {
          // si tu store tiene clave primaria, usa put
          try {
            const registro = await this.dexieService.detalles.get(claveDetalle);
            if (registro) {
              registro.atendida = (registro.atendida || 0) + d.cantidad;
              await this.dexieService.detalles.put(registro);
            } else {
              // buscar por idrequerimiento + codigo
              const reg = await this.dexieService.detalles
                .where({
                  idrequerimiento: this.selected.idrequerimiento,
                  codigo: d.codigo,
                })
                .first();
              if (reg) {
                reg.atendida = (reg.atendida || 0) + d.cantidad;
                await this.dexieService.detalles.put(reg);
              }
            }
          } catch (e) {
            console.warn(
              'No se pudo actualizar detalle por id, intentando por keys',
              e
            );
          }
        } else {
          // buscar por idrequerimiento + codigo
          const reg = await this.dexieService.detalles
            .where('idrequerimiento')
            .equals(this.selected.idrequerimiento)
            .and((r: any) => r.codigo === d.codigo)
            .first();

          if (reg) {
            reg.atendida = (reg.atendida || 0) + d.cantidad;
            await this.dexieService.detalles.put(reg);
          }
        }
      }

      // 3) Marcar requerimiento como parcialmente o completamente atendido
      await this.recalcularEstadoRequerimiento(this.selected.idrequerimiento);

      // 4) Guardar registro de despacho (opcional: store 'despachos' en Dexie)
      const despachoRecord = {
        id: Date.now(),
        numeroDespacho: `DESP-${Date.now()}`,
        fecha: new Date().toISOString(),
        almacen: this.selected.almacen || 'ALMACEN_DEFAULT',
        detalle: this.detalle.map((item) => ({
          despachoId: Date.now(),
          detalleRecepcionId: item.id || 0,
          codigo: item.codigo || '',
          descripcion: item.descripcion || '',
          cantidad: item.cantidad || 0,
          unidadMedida: item.unidadMedida || 'UN',
          precioUnitario: item.precioUnitario || 0,
          descuento: item.descuento || 0,
          subtotal: (item.cantidad || 0) * (item.precioUnitario || 0),
          impuesto: 0, // You might need to calculate this based on your tax logic
          total: (item.cantidad || 0) * (item.precioUnitario || 0),
          estado: 'PENDIENTE' as const,
          observaciones: item.observaciones || '',
        })),
        usuarioDespacha: this.usuario.documentoidentidad,
        estado: 'PENDIENTE' as const,
        observaciones: `Despacho para requerimiento ${this.selected.idrequerimiento}`,
      };
      try {
        if (this.dexieService.despachos) {
          await this.dexieService.despachos.add(despachoRecord);
        } else {
          console.log(
            'Dexie store "despachos" no definido, imprime en consola:',
            despachoRecord
          );
        }
      } catch (e) {
        console.warn('No se pudo guardar despacho en Dexie:', e);
      }

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Atención registrada correctamente',
        'success'
      );

      // limpiar vista y recargar datos
      this.detalle = [];
      await this.cargarRequerimientosAprobados();
      this.selected = null;
      this.items = [];
    } catch (err) {
      console.error('Error registrando atención:', err);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'No se pudo registrar la atención',
        'error'
      );
    }
  }

  // Recalcula el estado del requerimiento en base a sus detalles (pendiente/completo)
  async recalcularEstadoRequerimiento(idrequerimiento: any) {
    const detalles = await this.dexieService.detalles
      .where('idrequerimiento')
      .equals(idrequerimiento)
      .toArray();

    let pendiente = false;
    for (const d of detalles) {
      // const solicitada = Number(d.cantidad || d.cantidadSolicitada || 0);
      const solicitada = Number(d.cantidad || 0);
      const atendida = Number(d.atendida || 0);
      if (atendida < solicitada) {
        pendiente = true;
        break;
      }
    }

    // actualizar requerimiento en Dexie
    const req = await this.dexieService.requerimientos.get(idrequerimiento);
    if (req) {
      req.estados = pendiente ? 'APROBADO' : 'DESPACHADO'; // ajusta nomenclatura según tu sistema
      await this.dexieService.requerimientos.put(req);
    }
  }

  // Generar orden de compra para items faltantes (ya tenías esta lógica; la reutilizo)
  async generarOrdenCompraAutomatica(itemsFaltantes: any[]) {
    const nuevaOrden: OrdenCompra = {
      id: Date.now(),
      numeroOrden: `OC-${Date.now()}`, // Required field
      solicitudCompraId: 0, // You'll need to provide this
      fecha: new Date().toISOString(),
      fechaEntrega: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(), // 7 days from now
      proveedor: '', // You'll need to provide a default or get it from somewhere
      nombreProveedor: '', // You'll need to provide a default or get it from somewhere
      rucProveedor: '', // You'll need to provide a default or get it from somewhere
      direccionEntrega: '', // You'll need to provide a default or get it from somewhere
      montoTotal: 0, // You'll need to calculate this
      moneda: 'PEN', // Default currency, adjust as needed
      formaPago: 'CONTADO', // Default payment method, adjust as needed
      condicionesPago: 'CONTADO', // Default payment terms, adjust as needed
      plazoEntrega: 7, // 7 days, adjust as needed
      detalle: itemsFaltantes.map((item) => ({
        codigo: item.codigo,
        ordenCompraId: 0,
        descripcion: item.descripcion || item.producto,
        cantidad: item.faltante || item.cantidad - (item.disponible || 0),
        cantidadRecibida: 0,
        cantidadPendiente:
          item.faltante || item.cantidad - (item.disponible || 0),
        unidadMedida: 'UND', // Default unit, adjust as needed
        precioUnitario: 0, // You'll need to provide a price
        descuento: 0,
        subtotal: 0, // Calculate as cantidad * precioUnitario
        impuesto: 0, // Calculate based on your tax rate
        total: 0, // Calculate as subtotal + impuesto - descuento
        estado: 'PENDIENTE',
      })),
      usuarioGenera: this.usuario.usuario, // Assuming you have user info
      estado: 'GENERADA',
    };

    this.ordenesCompraGeneradas.push(nuevaOrden);

    // Guardar orden en Dexie si tienes store
    try {
      if (this.dexieService.ordenesCompra) {
        await this.dexieService.ordenesCompra.add(nuevaOrden);
      } else {
        console.log('Orden generada (no hay store ordenesCompra):', nuevaOrden);
      }
    } catch (e) {
      console.warn('No se pudo guardar orden de compra:', e);
    }

    console.log('Orden de compra generada:', nuevaOrden);
  }
}
