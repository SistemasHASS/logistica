import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaestrasService } from '../../../services/maestras.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Comodity, MaestroCommodity } from '@/app/shared/interfaces/Tables';
import { SubClasificacion } from '@/app/shared/interfaces/Tables';
import { CommodityService } from '@/app/modules/main/services/commoditys.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { TableModule } from 'primeng/table';
import * as XLSX from 'xlsx';
import { DropdownComponent } from '../../../components/dropdown/dropdown.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-maestros-comodities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule, DropdownComponent],
  templateUrl: './maestros-comodities.component.html',
  styleUrls: ['./maestros-comodities.component.scss'],
})
export class MaestrosComoditiesComponent implements OnInit {
  private readonly maestrasService = inject(MaestrasService);
  private readonly dexieService = inject(DexieService);
  private readonly alertService = inject(AlertService);
  private readonly commodityService = inject(CommodityService);

  modelo: any = this.createEmptyModelo();
  cuentaContable: any[] = [];

  pagina = 1;
  registrosPorPagina = 15;
  paginas: number[] = [];
  totalPaginas = 0;
  paginaActualData: Comodity[] = [];
  totalRegistros = 0;
  ordenColumna = '';
  ordenDireccion: 'asc' | 'desc' = 'asc';
  filtro = '';
  paginasVisibles = 5;

  archivoExcel: any = null;
  excelPreview: any[] = [];
  excelData: any[] = [];

  listaComodity: any[] = [];
  commoditysFiltrados: MaestroCommodity[] = [];

  isLoadingTable = signal(false);
  isLoading = signal(false);
  isProcessing = false;
  isImporting = false;

  modalCommodityAbierto = signal(false);
  modalImportAbierto = signal(false);

  commodity: MaestroCommodity = {
    id: 0,
    commodity01: '',
    clasificacion: '',
    codigoBarrasFlag: '',
    descripcionLocal: '',
    descripcionIngles: '',
    estado: '',
    ultimoUsuario: '',
    ultimaFechaModif: '',
  };

  commoditys: MaestroCommodity[] = [];

  listaClasificaciones: any[] = [];
  elementosGasto: any[] = [];
  partida: any[] = [];
  seleccionaPartida = '';

  readonly usuarioActual = 'MISESF';
  readonly fechaHoy = new Date().toISOString().slice(0, 10);

  async ngOnInit() {
    await this.sincronizaMaestroCommodity();
    this.cargarCombos();
  }

  async sincronizaMaestroCommodity() {
    this.isLoading.set(true);
    try {
      const count = await this.dexieService.countMaestroCommodity();
      if (count > 0) {
        await this.listaMaestroCommodity();
        return;
      }
      const resp = await firstValueFrom(this.commodityService.getCommodity([]));
      if (Array.isArray(resp) && resp.length) {
        await this.dexieService.saveMaestroCommodities(resp);
      }
      await this.listaMaestroCommodity();
    } catch (error) {
      console.error('Error sincronizando commodities:', error);
      this.alertService.showAlertError('Error al cargar los Commodities desde el servidor', 'Error');
      this.isLoading.set(false);
    }
  }

  async actualizarDesdeApi() {
    this.isLoading.set(true);
    try {
      const resp = await firstValueFrom(this.commodityService.getCommodity([]));
      if (Array.isArray(resp) && resp.length) {
        await this.dexieService.clearMaestroCommodity();
        await this.dexieService.saveMaestroCommodities(resp);
      }
      await this.listaMaestroCommodity();
    } catch (error) {
      console.error('Error actualizando commodities:', error);
      this.alertService.showAlertError('Error al actualizar los Commodities', 'Error');
      this.isLoading.set(false);
    }
  }

  async listaMaestroCommodity() {
    this.isLoading.set(true);
    this.isLoadingTable.set(true);
    this.paginaActualData = [];
    try {
      this.commoditys = await this.dexieService.showMaestroCommodity();
      this.commoditysFiltrados = [...this.commoditys];
      this.totalRegistros = this.commoditysFiltrados.length;
    } catch (error) {
      console.error('Error cargando maestro commodity', error);
      this.alertService.showAlertError('Error cargando los Commodities', 'Error');
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
    let data = [...this.commoditys];

    if (this.filtro.trim().length > 0) {
      const f = this.filtro.toLowerCase();

      data = data.filter(
        (x) =>
          x.commodity01?.toLowerCase().includes(f) ||
          x.descripcionLocal?.toLowerCase().includes(f) ||
          x.descripcionIngles?.toLowerCase().includes(f)
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

    this.commoditysFiltrados = data;
  }

  createEmptyModelo() {
    return {
      id: 0,
      codigo: '',
      clasificacion: '',
      descripcionLocal: '',
      descripcionIngles: '',
      cuentaContableGasto: '',
      elementoGasto: '',
      clasificacionActivo: '',
      estado: 'A',
      ultimaModificacionUsuario: this.usuarioActual,
      ultimaModificacionFecha: this.fechaHoy,
      subClasificaciones: [] as SubClasificacion[],
    };
  }

  async cargarLista() {
    this.listaComodity = await this.dexieService.showComodities();
  }

  async cargarCombos() {
    // ejemplo de carga, ajusta a tus datos reales (puedes sacar de dexie o API)
    this.listaClasificaciones = [
      { id: 1, descripcion: 'Activos Menores', clasificacion: 'ACM' },
      { id: 2, descripcion: 'Activos Fijos', clasificacion: 'ACF' },
      { id: 2, descripcion: 'Cargos Directos', clasificacion: 'CDR' },
      { id: 2, descripcion: 'Activos en Leasing', clasificacion: 'LEA' },
      { id: 2, descripcion: 'Servicios', clasificacion: 'SER' },
    ];
    this.partida = [
      { id: 1, codigo: '0804.40.00.00', descripcion: 'Paltas' },
      { id: 2, codigo: '0810.40.00.00', descripcion: 'Arándanos' },
      { id: 3, codigo: '0811.90.99.00', descripcion: 'Arándano Congelado' },
    ];
    this.elementosGasto = [
      {
        id: 1,
        codigo: '01101',
        descripcion: 'Costo Agua',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },
      {
        id: 2,
        codigo: '01102',
        descripcion: 'Costo Certificaciones Fundo',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },
      {
        id: 3,
        codigo: '01103',
        descripcion: 'Costo MO Mantenimiento',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },
      {
        id: 4,
        codigo: '01104',
        descripcion: 'Costo Seguridad y Salud',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },
      {
        id: 5,
        codigo: '01105',
        descripcion: 'Costo Servicio Movilidad',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },
      {
        id: 6,
        codigo: '01106',
        descripcion: 'Costo Servicios',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },
      {
        id: 7,
        codigo: '01107',
        descripcion: 'Costo Sueldos',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },
      {
        id: 8,
        codigo: '01108',
        descripcion: 'Gasto de Administracion',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },
      {
        id: 9,
        codigo: '01109',
        descripcion: 'Ajuste de Inventario',
        grupoCodigo: '011',
        grupoDescripcion: 'CF Costos Comunes',
      },

      {
        id: 10,
        codigo: '01210',
        descripcion: 'Covid-19',
        grupoCodigo: '012',
        grupoDescripcion: 'CF Costos No Comunes',
      },
      {
        id: 11,
        codigo: '01211',
        descripcion: 'Mant Cerco y caminos',
        grupoCodigo: '012',
        grupoDescripcion: 'CF Costos No Comunes',
      },
      {
        id: 12,
        codigo: '01212',
        descripcion: 'Recalce',
        grupoCodigo: '012',
        grupoDescripcion: 'CF Costos No Comunes',
      },

      {
        id: 13,
        codigo: '02101',
        descripcion: 'Costo Gestion Comercial',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 14,
        codigo: '02102',
        descripcion: 'Costo MO Cosecha Green Sking',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 15,
        codigo: '02103',
        descripcion: 'Costo MO Cosechador',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 16,
        codigo: '02104',
        descripcion: 'Costo MO embolsado china en planta',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 17,
        codigo: '02105',
        descripcion: 'Costo MO Empaque Hand Pack',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 18,
        codigo: '02106',
        descripcion: 'Costo MO Empaque Katto',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 19,
        codigo: '02107',
        descripcion: 'Costo MO Estiba & desestiba de Cosecha',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 20,
        codigo: '02108',
        descripcion: 'Costo MO indirecta de acopio',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 21,
        codigo: '02109',
        descripcion: 'Costo MO Levantamiento de fruta',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 22,
        codigo: '02110',
        descripcion: 'Costo MO Limpieza de fruto',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 23,
        codigo: '02111',
        descripcion: 'Costo MO Limpieza Jabas, jarras y otros',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 24,
        codigo: '02112',
        descripcion: 'Costo MO Supervision en Packing (avopack)',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 25,
        codigo: '02113',
        descripcion: 'Costo MO Supervisor Cosecha',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 26,
        codigo: '02114',
        descripcion: 'Costo MO Supervisor Cosecha Green Sking',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 27,
        codigo: '02115',
        descripcion: 'Costo Otros servicio en planta',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 28,
        codigo: '02116',
        descripcion: 'Costo Seguro Comercial',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 29,
        codigo: '02117',
        descripcion: 'Costo Servicio de empaque en planta',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 30,
        codigo: '02118',
        descripcion: 'Costo Servicio de Frio planta',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 31,
        codigo: '02119',
        descripcion: 'Costo Servicio Movilidad Cosecha',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 32,
        codigo: '02120',
        descripcion: 'Costo Servicio Movilidad Packing',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 33,
        codigo: '02121',
        descripcion: 'Costo Servicio Op. logistico',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 34,
        codigo: '02122',
        descripcion: 'Costo Servicio transporte fundo/packing',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 35,
        codigo: '02123',
        descripcion: 'Otros Gastos',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },
      {
        id: 36,
        codigo: '02124',
        descripcion: 'Ajuste de Inventario',
        grupoCodigo: '021',
        grupoDescripcion: 'CV Costos Comunes',
      },

      {
        id: 37,
        codigo: '03101',
        descripcion: 'Consumo combustible',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 38,
        codigo: '03102',
        descripcion: 'Consumo Fertilizante',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 39,
        codigo: '03103',
        descripcion: 'Consumo Pesticida',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 40,
        codigo: '03104',
        descripcion: 'Consumo suministros',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 41,
        codigo: '03106',
        descripcion: 'Salarios',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 42,
        codigo: '03107',
        descripcion: 'Sueldos',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 43,
        codigo: '03108',
        descripcion: 'Agua',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 44,
        codigo: '03112',
        descripcion: 'Movilidad',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 45,
        codigo: '03113',
        descripcion: 'Costo Servicios',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 46,
        codigo: '03115',
        descripcion: 'Tributos',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 47,
        codigo: '03116',
        descripcion: 'Generales',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 48,
        codigo: '03118',
        descripcion: 'Amortizacion',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 49,
        codigo: '03119',
        descripcion: 'Depreciacion',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },
      {
        id: 50,
        codigo: '03120',
        descripcion: 'Modulo de Costos',
        grupoCodigo: '031',
        grupoDescripcion: 'Costo Campo',
      },

      {
        id: 51,
        codigo: '03201',
        descripcion: 'Consumo materia prima',
        grupoCodigo: '032',
        grupoDescripcion: 'Costo Packing',
      },
      {
        id: 52,
        codigo: '03208',
        descripcion: 'Costo de Packing',
        grupoCodigo: '032',
        grupoDescripcion: 'Costo Packing',
      },
      {
        id: 53,
        codigo: '03211',
        descripcion: 'Servicio de frio',
        grupoCodigo: '032',
        grupoDescripcion: 'Costo Packing',
      },

      {
        id: 54,
        codigo: '03403',
        descripcion: 'Other expenses',
        grupoCodigo: '034',
        grupoDescripcion: 'Gasto Venta',
      },
      {
        id: 55,
        codigo: '03405',
        descripcion: 'Seguro Comercial',
        grupoCodigo: '034',
        grupoDescripcion: 'Gasto Venta',
      },
      {
        id: 56,
        codigo: '03406',
        descripcion: 'Servicio Operador Logistico',
        grupoCodigo: '034',
        grupoDescripcion: 'Gasto Venta',
      },
      {
        id: 57,
        codigo: '03410',
        descripcion: 'Gestion Comercial',
        grupoCodigo: '034',
        grupoDescripcion: 'Gasto Venta',
      },
    ];
  }

  nuevo() {
    this.modelo = this.createEmptyModelo();
    this.modalCommodityAbierto.set(true);
  }

  async editar(c: Comodity) {
    this.modelo = {
      ...c,
      subClasificaciones: await this.dexieService.showSubClasificacionById(c.id),
    };
    this.modalCommodityAbierto.set(true);
  }

  // subclasificaciones
  agregarSubClasificacion() {
    const newSub: SubClasificacion = {
      id: 0,
      comodityId: this.modelo.id || 0,
      subClase: '',
      descripcion: '',
      unidad: 'UNI',
      cuentaGasto: '',
      elementoGasto: '',
      clasificacionActivo: '',
      legacyNumber: '',
    };
    this.modelo.subClasificaciones.push(newSub);
  }

  eliminarSubClasificacion(index: number) {
    const sub = this.modelo.subClasificaciones[index];
    if (sub && sub.id && sub.id > 0) {
      // si ya existía en DB, marcar para eliminar o borrarlo
      this.maestrasService.maestrasDexieDeleteSub?.(sub.id).catch(() => {}); // opcional (no obligatorio)
    }
    this.modelo.subClasificaciones.splice(index, 1);
  }

  // Guardar comodity + subclas
  async guardar() {
    // valida mínimo
    if (!this.modelo.codigo || !this.modelo.descripcionLocal) {
      alert('Código y Descripción obligatorios');
      return;
    }

    // normalizar ids temporales
    if (!this.modelo.id || this.modelo.id === 0) {
      this.modelo.id = Date.now(); // id temporal; Dexie lo guardará
    }
    // asignar comodityId en subclas
    this.modelo.subClasificaciones = this.modelo.subClasificaciones.map(
      (s: SubClasificacion) => ({ ...s, comodityId: this.modelo.id })
    );

    // llamar al servicio que guarda en Dexie y en API
    await this.maestrasService.saveComodityWithSubclas(
      this.modelo as Comodity,
      this.modelo.subClasificaciones as SubClasificacion[]
    );

    // recargar lista y cerrar modal
    await this.cargarLista();
    this.cerrarModal();
  }

  cerrarModal() {
    this.modalCommodityAbierto.set(false);
  }

  cerrarImportModal() {
    this.modalImportAbierto.set(false);
    this.excelPreview = [];
    this.excelData = [];
    this.archivoExcel = null;
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
        commodity01: '',
        descripcionLocal: '',
        descripcionIngles: '',
        clasificacion: '',
        codigoBarrasFlag: '',
        estado: '',
        ultimoUsuario: '',
        ultimaFechaModif: '',
      },
    ];

    // Crear hoja
    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        'commodity01',
        'descripcionLocal',
        'descripcionIngles',
        'clasificacion',
        'codigoBarrasFlag',
        'estado',
        'ultimoUsuario',
        'ultimaFechaModif',
      ],
    ]);

    // Crear libro
    const workbook = XLSX.utils.book_new();

    // Agregar hoja
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    // Descargar
    XLSX.writeFile(workbook, 'plantilla_commodity.xlsx');
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

      this.excelPreview = excelRows.slice(0, 10); // Mostrar sample
      this.excelData = excelRows;

      console.log('Excel importado:', this.excelData);
    };

    reader.readAsArrayBuffer(file);
  }

  async importarCommodity() {
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
        const commodityConvertidos: MaestroCommodity[] = jsonData.map(
          (fila: any) => ({
            id: 0,
            commodity01: fila['commodity01'] ?? '',
            descripcionLocal: fila['descripcionLocal'] ?? '',
            descripcionIngles: fila['descripcionIngles'] ?? '',
            clasificacion: fila['clasificacion'] ?? '',
            codigoBarrasFlag: fila['codigoBarrasFlag'] ?? '',
            estado: fila['estado'] ?? '',
            ultimoUsuario: fila['ultimoUsuario'] ?? '',
            ultimaFechaModif: fila['ultimaFechaModif'] ?? '',
          })
        );

        // 3️⃣ Enviar lote al API
        const resp = await this.commodityService.registrarCommodity(
          commodityConvertidos
        );

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
        await this.dexieService.clearMaestroCommodity();
        await this.dexieService.saveMaestroCommodities(commodityConvertidos);

        // 5️⃣ Refrescar tabla
        await this.listaMaestroCommodity();

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
