// src/app/modules/main/pages/maestros/comodities/maestros-comodity.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaestrasService } from '../../../services/maestras.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Comodity, MaestroCommodity } from '@/app/shared/interfaces/Tables';
import { SubClasificacion } from '@/app/shared/interfaces/Tables';
import { CommodityService } from '@/app/modules/main/services/commoditys.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Table, TableModule } from 'primeng/table';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-maestros-comodities',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './maestros-comodities.component.html',
  styleUrls: ['./maestros-comodities.component.scss'],
})
export class MaestrosComoditiesComponent implements OnInit {
  // listaComodity: Comodity[] = [];
  modelo: any = this.createEmptyModelo();

  pagina: number = 1;
  registrosPorPagina: number = 15;

  paginas: number[] = [];
  totalPaginas: number = 0;

  paginaActualData: Comodity[] = [];
  totalRegistros: number = 0;

  ordenColumna: string = '';
  ordenDireccion: 'asc' | 'desc' = 'asc';

  filtro: string = '';

  paginasVisibles = 5;

  archivoExcel: any = null;
  excelPreview: any[] = [];
  excelData: any[] = [];

  listaComodity: any[] = [];
  commoditysFiltrados: MaestroCommodity[] = [];
  filtros: string = '';

  isLoadingTable: boolean = false;
  // estados loading
  isLoading: boolean = false; // carga inicial
  isProcessing: boolean = false; // procesando Excel
  isImporting: boolean = false; // enviando al API

  commodity: MaestroCommodity = {
    id: 0,
    commodity01: '',
    clasificacion: '',
    codigoBarrasFlag: '',
    descripcionLocal: '',
    descripcionIngles: '',
    // unidadporDefecto: '',
    // cuentaContableGasto: '',
    // elementoGasto: '',
    // clasificacionActivo: '',
    estado: '',
    ultimoUsuario: '',
    ultimaFechaModif: '',
    // montoReferencial: '',
    // montoReferencialMoneda: '',
    // descripcionEditableFlag: '',
    // igvExoneradoFlag: '',
  };

  commoditys: MaestroCommodity[] = [];

  // combos / datos auxiliares
  listaClasificaciones: any[] = []; // cargar desde Dexie o API
  elementosGasto: any[] = []; // cargar desde Dexie o API

  usuarioActual = 'MISESF';
  fechaHoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  constructor(
    private maestrasService: MaestrasService,
    private dexieService: DexieService,
    private alertService: AlertService,
    private commodityService: CommodityService
  ) {}

  ngOnInit(): void {
    this.sincronizaMaestroCommodity();
    this.cargarLista();
    this.cargarCombos();
  }

  async sincronizaMaestroCommodity() {
    const count = await this.dexieService.countMaestroCommodity();

    if (count > 0) {
      console.log('📌 Dexie ya tiene MaestroCommodity → NO se llama API');
      await this.listaMaestroCommodity();
      return;
    }

    console.log('📌 Dexie vacío → trayendo MaestroItems del API');

    const commodity = this.commodityService.getCommodity([]);
    commodity.subscribe(async (resp: any) => {
      if (!!resp && resp.length) {
        await this.dexieService.saveMaestroCommodities(resp);
        await this.listaMaestroCommodity();
      }
    });
  }

  async listaMaestroCommodity() {
    this.isLoading = true;
    this.isLoadingTable = true;
    this.paginaActualData = [];
    try {
      this.commoditys = await this.dexieService.showMaestroCommodity();
      this.commoditysFiltrados = [...this.commoditys]; // inicial
      // this.totalRegistros = this.items.length;
      this.totalRegistros = this.commoditysFiltrados.length;
      this.isLoading = false;
      this.isLoadingTable = false;
      // if (this.items.length > 0) {
      //   this.aplicarFiltros();
      // }
    } catch (error) {
      console.error('Error cargando maestro item', error);
      this.alertService.showAlertError('Error cargando los Items', 'Error');
    } finally {
      this.isLoading = false;
      this.isLoadingTable = false;
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
      { id: 1, descripcion: 'Activos Menores' },
      { id: 2, descripcion: 'Activos Fijos' },
    ];
    this.elementosGasto = [
      { id: 1, descripcion: 'Gasto Operativo' },
      { id: 2, descripcion: 'Gasto Capital' },
    ];
  }

  // abrir modal para nuevo
  nuevo() {
    this.modelo = this.createEmptyModelo();
    // abrir bootstrap modal por id
    const el = document.getElementById('modalMaestrosComodity') as any;
    if (el) {
      el.classList.add('show');
      el.style.display = 'block';
      el.setAttribute('aria-modal', 'true');
    }
  }

  // abrir modal y cargar datos existentes (editar)
  async editar(c: Comodity) {
    const full = await this.dexieService.showComodities(); // carga general
    // load comodity from dexie
    const comod = await (await this.dexieService).showComodities(); // not ideal but safe fallback
    // mejor: pedir dexie direct: assuming maestrasService has method showComodityById if needed
    this.modelo = {
      ...c,
      subClasificaciones: await this.dexieService.showSubClasificacionById(
        c.id
      ), // Convert to string to match expected type
    };

    const el = document.getElementById('modalMaestrosComodity') as any;
    if (el) {
      el.classList.add('show');
      el.style.display = 'block';
      el.setAttribute('aria-modal', 'true');
    }
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
    const el = document.getElementById('modalMaestrosComodity') as any;
    if (el) {
      el.classList.remove('show');
      el.style.display = 'none';
      el.removeAttribute('aria-modal');
    }
  }

  openImportModal() {
    const modal = document.getElementById('importExcelModal');
    (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
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
        const commodityConvertidos: MaestroCommodity[] = jsonData.map((fila: any) => ({
          id: 0,
          commodity01: fila['commodity01'] ?? '',
          descripcionLocal: fila['descripcionLocal'] ?? '',
          descripcionIngles: fila['descripcionIngles'] ?? '',
          clasificacion: fila['clasificacion'] ?? '',
          codigoBarrasFlag: fila['codigoBarrasFlag'] ?? '',
          estado: fila['estado'] ?? '',
          ultimoUsuario: fila['ultimoUsuario'] ?? '',
          ultimaFechaModif: fila['ultimaFechaModif'] ?? '',
        }));

        // 3️⃣ Enviar lote al API
        const resp = await this.commodityService.registrarCommodity(commodityConvertidos);

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
