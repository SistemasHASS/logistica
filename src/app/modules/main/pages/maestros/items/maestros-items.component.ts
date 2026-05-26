import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Item, MaestroItem, UnidadMedida } from '@/app/shared/interfaces/Tables';
import { ItemService } from '@/app/modules/main/services/items.service';
import { UnidadesMedidaService } from '@/app/modules/main/services/unidades-medida.service';
import { TableModule } from 'primeng/table';
import * as XLSX from 'xlsx';
import { SearchMLService } from '@/app/modules/main/services/search-ml.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-maestros-items',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './maestros-items.component.html',
  styleUrls: ['./maestros-items.component.scss'],
})
export class MaestrosItemsComponent implements OnInit {
  private readonly dexieService = inject(DexieService);
  private readonly alertService = inject(AlertService);
  private readonly itemService = inject(ItemService);
  private readonly searchML = inject(SearchMLService);
  private readonly unidadesSvc = inject(UnidadesMedidaService);

  expandedRows: { [s: string]: boolean } = {};

  pagina = 1;
  registrosPorPagina = 15;
  paginas: number[] = [];
  totalPaginas = 0;
  paginaActualData: MaestroItem[] = [];
  totalRegistros = 0;
  ordenColumna = '';
  ordenDireccion: 'asc' | 'desc' = 'asc';
  filtro = '';
  paginasVisibles = 5;
  listaItems: any[] = [];
  itemsFiltrados: MaestroItem[] = [];
  loadingCorrelativo = false;
  isEditMode = false;
  correlativoItem = '';

  item: MaestroItem = this.emptyItem();

  items: MaestroItem[] = [];
  isLoadingTable = signal(false);
  isLoading = signal(false);
  isProcessing = false;
  isImporting = false;

  modalItemAbierto = signal(false);
  modalImportAbierto = signal(false);
  unidadesMedida = signal<UnidadMedida[]>([]);

  archivoExcel: any = null;
  excelPreview: any[] = [];
  excelData: any[] = [];
  sugerencias: any[] = [];
  esEditar = false;

  async ngOnInit() {
    await Promise.all([
      this.sincronizaMaestroItem(),
      this.cargarUnidades(),
    ]);
  }

  async cargarUnidades() {
    try {
      const data = await this.unidadesSvc.listar(true);
      this.unidadesMedida.set(data);
      // Sincronizar caché local
      await this.dexieService.unidadesMedida.clear();
      await this.dexieService.unidadesMedida.bulkPut(data);
    } catch {
      // Fallback a caché Dexie
      await this.dexieService.seedUnidadesMedidaDefault();
      const cached = await this.dexieService.getUnidadesMedidaActivas();
      this.unidadesMedida.set(cached);
    }
  }

  private emptyItem(): MaestroItem {
    return {
      id: 0, item: '', itemTipo: '', linea: '', familia: '', subFamilia: '',
      descripcionLocal: '', descripcionIngles: '', descripcionCompleta: '',
      unidadCodigo: '', monedaCodigo: '', precioCosto: '', precioUnitarioLocal: '',
      precioUnitarioDolares: '', itemPrecioFlag: '', disponibleVentaFlag: '',
      itemProcedencia: '', manejoxLoteFlag: '', manejoxSerieFlag: '', manejoxKitFlag: '',
      afectoImpuestoVentasFlag: '', requisicionamientoAutomaticoFl: '',
      disponibleTransferenciaFlag: '', disponibleConsumoFlag: '', formularioFlag: '',
      manejoxUnidadFlag: '', isoAplicableFlag: '', cantidadDobleFlag: '',
      unidadReplicacion: '', cuentaInventario: '', cuentaGasto: '', cuentaServicioTecnico: '',
      factorEquivalenciaComercial: '', estado: '', ultimaFechaModif: '', ultimoUsuario: '',
      cuentaVentas: '', unidadCompra: '', controlCalidadFlag: '', cuentaTransito: '',
      cantidadDobleFactor: '', subFamiliaInferior: '', stockMinimo: '', stockMaximo: '',
      referenciaFiscalIngreso02: '',
    };
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.archivoExcel = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const excelRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      this.excelPreview = excelRows.slice(0, 10);
      this.excelData = excelRows;
    };
    reader.readAsArrayBuffer(file);
  }

  async sincronizaMaestroItem() {
    this.isLoading.set(true);
    try {
      const count = await this.dexieService.countMaestroItems();
      if (count > 0) {
        await this.listaMaestroItem();
        return;
      }
      const resp = await firstValueFrom(this.itemService.getItem([]));
      if (Array.isArray(resp) && resp.length) {
        await this.dexieService.saveMaestroItems(resp);
      }
      await this.listaMaestroItem();
    } catch (error) {
      console.error('Error sincronizando items:', error);
      this.alertService.showAlertError('Error al cargar los Items desde el servidor', 'Error');
      this.isLoading.set(false);
    }
  }

  async actualizarDesdeApi() {
    this.isLoading.set(true);
    try {
      const resp = await firstValueFrom(this.itemService.getItem([]));
      if (Array.isArray(resp) && resp.length) {
        await this.dexieService.clearMaestroItem();
        await this.dexieService.saveMaestroItems(resp);
      }
      await this.listaMaestroItem();
    } catch (error) {
      console.error('Error actualizando items:', error);
      this.alertService.showAlertError('Error al actualizar los Items', 'Error');
      this.isLoading.set(false);
    }
  }

  cerrarModal() {
    this.modalItemAbierto.set(false);
  }

  cerrarImportModal() {
    this.modalImportAbierto.set(false);
    this.excelPreview = [];
    this.excelData = [];
    this.archivoExcel = null;
  }

  abrirNuevoItem() {
    this.isEditMode = false;
    const filtro = {
      CompaniaCodigo: '999999',
      TipoComprobante: 'SY',
      Serie: 'WHIT',
    };
    const correlativo = this.itemService.ItemCorrelativo([filtro]);
    correlativo.subscribe(async (resp: any) => {
      if (!!resp && resp.length) {
        this.correlativoItem = resp[0].correlativoNuevo;
      }
    });

    this.item = {
      id: 0,
      item: this.correlativoItem,
      itemTipo: '',
      linea: '',
      familia: '',
      subFamilia: '',
      descripcionLocal: '',
      descripcionIngles: '',
      descripcionCompleta: '',
      unidadCodigo: '',
      monedaCodigo: '',
      precioCosto: '',
      precioUnitarioLocal: '',
      precioUnitarioDolares: '',
      itemPrecioFlag: '',
      disponibleVentaFlag: '',
      itemProcedencia: '',
      manejoxLoteFlag: '',
      manejoxSerieFlag: '',
      manejoxKitFlag: '',
      afectoImpuestoVentasFlag: '',
      requisicionamientoAutomaticoFl: '',
      disponibleTransferenciaFlag: '',
      disponibleConsumoFlag: '',
      formularioFlag: '',
      manejoxUnidadFlag: '',
      isoAplicableFlag: '',
      cantidadDobleFlag: '',
      unidadReplicacion: '',
      cuentaInventario: '',
      cuentaGasto: '',
      cuentaServicioTecnico: '',
      factorEquivalenciaComercial: '',
      estado: 'Activo',
      ultimaFechaModif: '',
      ultimoUsuario: '',
      cuentaVentas: '',
      unidadCompra: '',
      controlCalidadFlag: '',
      cuentaTransito: '',
      cantidadDobleFactor: '',
      subFamiliaInferior: '',
      stockMinimo: '',
      stockMaximo: '',
      referenciaFiscalIngreso02: '',
    };
    this.modalItemAbierto.set(true);
  }

  // buscar con IA desde el input principal
  async buscarSmartInput(valor: string) {
    this.filtro = valor;
    if (!valor || !valor.trim()) {
      this.itemsFiltrados = [...this.items];
      this.sugerencias = [];
      return;
    }

    const res = await this.searchML.buscar(valor, 50);
    // res puede contener items con _score si USE rankeó
    this.sugerencias = res;
    // opcional: si quieres mostrar solo resultados en la tabla
    this.itemsFiltrados = res.map((r: any) => (r.item ? r.item : r));
    this.totalRegistros = this.itemsFiltrados.length;
  }

  // Al escribir dentro del modal en descripcionLocal para prevenir duplicados
  async onDescripcionInput(valor: string) {
    if (!valor || !valor.trim()) {
      this.sugerencias = [];
      return;
    }
    const res = await this.searchML.buscar(valor, 6);
    this.sugerencias = res;
    // si el mejor tiene score alto, avisar duplicado
    if (res.length && res[0]._score && res[0]._score > 0.8) {
      // puedes mostrar advertencia o autofill
      // ejemplo: autocompletar datos para evitar duplicado
      // this.item.descripcionLocal = res[0].descripcionLocal;
      // this.alertService.showAlertAcept('Existe un item similar', 'Aviso', 'warning');
    }
  }

  usarSugerencia(sug: any) {
    // si sug viene como item object o string
    const item = sug.item ? sug.item : sug;
    this.filtro = item.descripcionLocal ?? item;
    this.itemsFiltrados = [item];
    this.sugerencias = [];
  }

  async listaMaestroItem() {
    this.isLoading.set(true);
    this.isLoadingTable.set(true);
    this.paginaActualData = [];
    try {
      this.items = await this.dexieService.showMaestroItem();
      this.itemsFiltrados = [...this.items];
      this.totalRegistros = this.itemsFiltrados.length;
    } catch (error) {
      console.error('Error cargando maestro item', error);
      this.alertService.showAlertError('Error cargando los Items', 'Error');
    } finally {
      this.isLoading.set(false);
      this.isLoadingTable.set(false);
    }
  }

  buscar() {
    this.pagina = 1;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let data = [...this.items];

    if (this.filtro.trim().length > 0) {
      const f = this.filtro.toLowerCase();

      data = data.filter(
        (x) =>
          x.item?.toLowerCase().includes(f) ||
          x.descripcionLocal?.toLowerCase().includes(f) ||
          x.descripcionCompleta?.toLowerCase().includes(f)
      );
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

    this.itemsFiltrados = data;
  }

  nuevo() {
    this.item = {
      id: 0,
      item: '',
      itemTipo: '',
      linea: '',
      familia: '',
      subFamilia: '',
      descripcionLocal: '',
      descripcionIngles: '',
      descripcionCompleta: '',
      unidadCodigo: '',
      monedaCodigo: '',
      precioCosto: '',
      precioUnitarioLocal: '',
      precioUnitarioDolares: '',
      itemPrecioFlag: '',
      disponibleVentaFlag: '',
      itemProcedencia: '',
      manejoxLoteFlag: '',
      manejoxSerieFlag: '',
      manejoxKitFlag: '',
      afectoImpuestoVentasFlag: '',
      requisicionamientoAutomaticoFl: '',
      disponibleTransferenciaFlag: '',
      disponibleConsumoFlag: '',
      formularioFlag: '',
      manejoxUnidadFlag: '',
      isoAplicableFlag: '',
      cantidadDobleFlag: '',
      unidadReplicacion: '',
      cuentaInventario: '',
      cuentaGasto: '',
      cuentaServicioTecnico: '',
      factorEquivalenciaComercial: '',
      estado: '',
      ultimaFechaModif: '',
      ultimoUsuario: '',
      cuentaVentas: '',
      unidadCompra: '',
      controlCalidadFlag: '',
      cuentaTransito: '',
      cantidadDobleFactor: '',
      subFamiliaInferior: '',
      stockMinimo: '',
      stockMaximo: '',
      referenciaFiscalIngreso02: '',
    };
  }

  editar(data: MaestroItem) {
    this.isEditMode = true;
    this.item = {
      id: data.id,
      item: data.item,
      itemTipo: data.itemTipo,
      linea: data.linea,
      familia: data.familia,
      subFamilia: data.subFamilia,
      descripcionLocal: data.descripcionLocal,
      descripcionIngles: data.descripcionIngles,
      descripcionCompleta: data.descripcionCompleta,
      unidadCodigo: data.unidadCodigo,
      monedaCodigo: data.monedaCodigo,
      precioCosto: data.precioCosto,
      precioUnitarioLocal: data.precioUnitarioLocal,
      precioUnitarioDolares: data.precioUnitarioDolares,
      itemPrecioFlag: data.itemPrecioFlag,
      disponibleVentaFlag: data.disponibleVentaFlag,
      itemProcedencia: data.itemProcedencia,
      manejoxLoteFlag: data.manejoxLoteFlag,
      manejoxSerieFlag: data.manejoxSerieFlag,
      manejoxKitFlag: data.manejoxKitFlag,
      afectoImpuestoVentasFlag: data.afectoImpuestoVentasFlag,
      requisicionamientoAutomaticoFl: data.requisicionamientoAutomaticoFl,
      disponibleTransferenciaFlag: data.disponibleTransferenciaFlag,
      disponibleConsumoFlag: data.disponibleConsumoFlag,
      formularioFlag: data.formularioFlag,
      manejoxUnidadFlag: data.manejoxUnidadFlag,
      isoAplicableFlag: data.isoAplicableFlag,
      cantidadDobleFlag: data.cantidadDobleFlag,
      unidadReplicacion: data.unidadReplicacion,
      cuentaInventario: data.cuentaInventario,
      cuentaGasto: data.cuentaGasto,
      cuentaServicioTecnico: data.cuentaServicioTecnico,
      factorEquivalenciaComercial: data.factorEquivalenciaComercial,
      estado: data.estado,
      ultimaFechaModif: data.ultimaFechaModif,
      ultimoUsuario: data.ultimoUsuario,
      cuentaVentas: data.cuentaVentas,
      unidadCompra: data.unidadCompra,
      controlCalidadFlag: data.controlCalidadFlag,
      cuentaTransito: data.cuentaTransito,
      cantidadDobleFactor: data.cantidadDobleFactor,
      subFamiliaInferior: data.subFamiliaInferior,
      stockMinimo: data.stockMinimo,
      stockMaximo: data.stockMaximo,
      referenciaFiscalIngreso02: data.referenciaFiscalIngreso02,
    };

    this.modalItemAbierto.set(true);
  }

  async guardar() {
    await this.itemService.registrarItem(this.item);
    this.items = await this.dexieService.showMaestroItem();
    this.alertService.showAlertAcept(
      'Item guardado correctamente',
      'Item',
      'success'
    );
  }

  openImportModal() {
    this.excelPreview = [];
    this.excelData = [];
    this.archivoExcel = null;
    this.modalImportAbierto.set(true);
  }

  downloadTemplate() {
    const plantilla = [
      {
        item: '',
        ItemTipo: '',
        Linea: '',
        Familia: '',
        SubFamilia: '',
        DescripcionLocal: '',
        DescripcionIngles: '',
        DescripcionCompleta: '',
        UnidadCodigo: '',
        MonedaCodigo: '',
        PrecioCosto: '',
        PrecioUnitarioLocal: '',
        PrecioUnitarioDolares: '',
        ItemPrecioFlag: '',
        DisponibleVentaFlag: '',
        ItemProcedencia: '',
        ManejoxLoteFlag: '',
        ManejoxSerieFlag: '',
        ManejoxKitFlag: '',
        AfectoImpuestoVentasFlag: '',
        RequisicionamientoAutomaticoFl: '',
        DisponibleTransferenciaFlag: '',
        DisponibleConsumoFlag: '',
        FormularioFlag: '',
        ManejoxUnidadFlag: '',
        ISOAplicableFlag: '',
        CantidadDobleFlag: '',
        UnidadReplicacion: '',
        CuentaInventario: '',
        CuentaGasto: '',
        CuentaServicioTecnico: '',
        FactorEquivalenciaComercial: '',
        Estado: '',
        UltimaFechaModif: '',
        UltimoUsuario: '',
        CuentaVentas: '',
        UnidadCompra: '',
        ControlCalidadFlag: '',
        CuentaTransito: '',
        CantidadDobleFactor: '',
        SubFamiliaInferior: '',
        StockMinimo: '',
        StockMaximo: '',
        ReferenciaFiscalIngreso02: '',
      },
    ];

    // Crear hoja
    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        'item',
        'ItemTipo',
        'Linea',
        'Familia',
        'SubFamilia',
        'DescripcionLocal',
        'DescripcionIngles',
        'DescripcionCompleta',
        'UnidadCodigo',
        'MonedaCodigo',
        'PrecioCosto',
        'PrecioUnitarioLocal',
        'PrecioUnitarioDolares',
        'ItemPrecioFlag',
        'DisponibleVentaFlag',
        'ItemProcedencia',
        'ManejoxLoteFlag',
        'ManejoxSerieFlag',
        'ManejoxKitFlag',
        'AfectoImpuestoVentasFlag',
        'RequisicionamientoAutomaticoFl',
        'DisponibleTransferenciaFlag',
        'DisponibleConsumoFlag',
        'FormularioFlag',
        'ManejoxUnidadFlag',
        'ISOAplicableFlag',
        'CantidadDobleFlag',
        'UnidadReplicacion',
        'CuentaInventario',
        'CuentaGasto',
        'CuentaServicioTecnico',
        'FactorEquivalenciaComercial',
        'Estado',
        'UltimaFechaModif',
        'UltimoUsuario',
        'CuentaVentas',
        'UnidadCompra',
        'ControlCalidadFlag',
        'CuentaTransito',
        'CantidadDobleFactor',
        'SubFamiliaInferior',
        'StockMinimo',
        'StockMaximo',
        'ReferenciaFiscalIngreso02',
      ],
    ]);

    // Crear libro
    const workbook = XLSX.utils.book_new();

    // Agregar hoja
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    // Descargar
    XLSX.writeFile(workbook, 'plantilla_items.xlsx');
  }

  selectSuggestionInModal(sug: any) {
    const it = sug.item ? sug.item : sug;
    // popular campos clave del modal para evitar duplicar
    this.item.descripcionLocal = it.descripcionLocal ?? '';
    this.item.item = it.item ?? this.item.item;
    // opcional: llenar otros campos o abrir modal en modo editar
    // this.alertService.showAlertAcept('Item similar encontrado', 'Atención', 'warning');
    this.sugerencias = [];
    this.esEditar = true;
  }

  async importarItems() {
    try {
      if (!this.archivoExcel) {
        this.alertService.showAlertAcept(
          'Seleccione un archivo',
          'Importación',
          'warning'
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = async (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        });

        if (!jsonData.length) {
          this.alertService.showAlertError('El archivo está vacío', 'Error');
          return;
        }

        // 🔥 MAPEAR FILAS A INTERFAZ MaestroItem
        const itemsConvertidos: MaestroItem[] = jsonData.map((fila: any) => ({
          id: 0,
          item: fila['item'] ?? '',
          itemTipo: fila['ItemTipo'] ?? '',
          linea: fila['Linea'] ?? '',
          familia: fila['Familia'] ?? '',
          subFamilia: fila['SubFamilia'] ?? '',
          descripcionLocal: fila['DescripcionLocal'] ?? '',
          descripcionIngles: fila['DescripcionIngles'] ?? '',
          descripcionCompleta: fila['DescripcionCompleta'] ?? '',
          unidadCodigo: fila['UnidadCodigo'] ?? '',
          monedaCodigo: fila['MonedaCodigo'] ?? '',
          precioCosto: fila['PrecioCosto'] ?? '',
          precioUnitarioLocal: fila['PrecioUnitarioLocal'] ?? '',
          precioUnitarioDolares: fila['PrecioUnitarioDolares'] ?? '',
          itemPrecioFlag: fila['ItemPrecioFlag'] ?? '',
          disponibleVentaFlag: fila['DisponibleVentaFlag'] ?? '',
          itemProcedencia: fila['ItemProcedencia'] ?? '',
          manejoxLoteFlag: fila['ManejoxLoteFlag'] ?? '',
          manejoxSerieFlag: fila['ManejoxSerieFlag'] ?? '',
          manejoxKitFlag: fila['ManejoxKitFlag'] ?? '',
          afectoImpuestoVentasFlag: fila['AfectoImpuestoVentasFlag'] ?? '',
          requisicionamientoAutomaticoFl:
            fila['RequisicionamientoAutomaticoFl'] ?? '',
          disponibleTransferenciaFlag:
            fila['DisponibleTransferenciaFlag'] ?? '',
          disponibleConsumoFlag: fila['DisponibleConsumoFlag'] ?? '',
          formularioFlag: fila['FormularioFlag'] ?? '',
          manejoxUnidadFlag: fila['ManejoxUnidadFlag'] ?? '',
          isoAplicableFlag: fila['ISOAplicableFlag'] ?? '',
          cantidadDobleFlag: fila['CantidadDobleFlag'] ?? '',
          unidadReplicacion: fila['UnidadReplicacion'] ?? '',
          cuentaInventario: fila['CuentaInventario'] ?? '',
          cuentaGasto: fila['CuentaGasto'] ?? '',
          cuentaServicioTecnico: fila['CuentaServicioTecnico'] ?? '',
          factorEquivalenciaComercial:
            fila['FactorEquivalenciaComercial'] ?? '',
          estado: fila['Estado'] ?? '',
          ultimaFechaModif: fila['UltimaFechaModif'] ?? '',
          ultimoUsuario: fila['UltimoUsuario'] ?? '',
          cuentaVentas: fila['CuentaVentas'] ?? '',
          unidadCompra: fila['UnidadCompra'] ?? '',
          controlCalidadFlag: fila['ControlCalidadFlag'] ?? '',
          cuentaTransito: fila['CuentaTransito'] ?? '',
          cantidadDobleFactor: fila['CantidadDobleFactor'] ?? '',
          subFamiliaInferior: fila['SubFamiliaInferior'] ?? '',
          stockMinimo: fila['StockMinimo'] ?? '',
          stockMaximo: fila['StockMaximo'] ?? '',
          referenciaFiscalIngreso02: fila['ReferenciaFiscalIngreso02'] ?? '',
        }));

        // 3️⃣ Enviar lote al API
        const resp = await this.itemService.registrarItem(itemsConvertidos);

        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert(
            'Éxito',
            'Requerimiento sincronizado correctamente',
            'success'
          );
        } else {
          this.alertService.showAlertError(
            'Error',
            'Hubo un problema al sincronizar el requerimiento'
          );
          console.error('Detalles del error:', resp);
        }

        // 4️⃣ Actualizar Dexie
        await this.dexieService.clearMaestroItem();
        await this.dexieService.saveMaestroItems(itemsConvertidos);

        // 5️⃣ Refrescar tabla
        await this.listaMaestroItem();

        // 6️⃣ Cerrar modal
        const modal = document.getElementById('importModal');
        (window as any).bootstrap.Modal.getOrCreateInstance(modal).hide();

        this.alertService.showAlertAcept(
          'Items importados correctamente',
          'Importación',
          'success'
        );
      };

      reader.readAsArrayBuffer(this.archivoExcel);
    } catch (err) {
      console.error(err);
      this.alertService.showAlertError('Ocurrió un error al importar', 'Error');
    }
  }
}
