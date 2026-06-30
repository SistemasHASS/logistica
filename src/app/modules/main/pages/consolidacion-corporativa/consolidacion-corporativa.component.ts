import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SumCantidadPipe } from '@/app/shared/pipes/sum-cantidad.pipe';

// =============================================
// Interfaces internas del mockup
// =============================================
export interface ItemRequerimiento {
  id: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  area: string;
  solicitante: string;
  fecha: string;
  tipo: string;
  empresa: 'HP' | 'BH' | 'CAO';
  seleccionado?: boolean;
}

export interface ItemConsolidadoEmpresa {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadTotal: number;
  detalle: { empresa: string; area: string; cantidad: number; solicitante: string }[];
  guardado: boolean;
  idConsolidacion?: string;
}

export interface ItemCorporativo {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadHP: number;
  cantidadBH: number;
  cantidadCAO: number;
  cantidadTotal: number;
  consolidadoHP: boolean;
  consolidadoBH: boolean;
  consolidadoCAO: boolean;
}

// =============================================
// Datos mock representativos
// =============================================
const MOCK_ITEMS: ItemRequerimiento[] = [
  { id: 1, codigo: 'MAT-001', descripcion: 'ACEITE HIDRAULICO 68', unidad: 'GLN', cantidad: 50, area: 'MANTENIMIENTO', solicitante: 'Juan Rios', fecha: '2026-06-10', tipo: 'COMPRA', empresa: 'HP' },
  { id: 2, codigo: 'MAT-001', descripcion: 'ACEITE HIDRAULICO 68', unidad: 'GLN', cantidad: 30, area: 'MAQUINARIA', solicitante: 'Pedro Salas', fecha: '2026-06-11', tipo: 'COMPRA', empresa: 'HP' },
  { id: 3, codigo: 'MAT-002', descripcion: 'FILTRO DE AIRE MOTOR', unidad: 'UND', cantidad: 12, area: 'MANTENIMIENTO', solicitante: 'Juan Rios', fecha: '2026-06-10', tipo: 'COMPRA', empresa: 'HP' },
  { id: 4, codigo: 'MAT-003', descripcion: 'GRASA MULTIPROPÓSITO', unidad: 'KG', cantidad: 25, area: 'CAMPO', solicitante: 'Luis Torres', fecha: '2026-06-12', tipo: 'COMPRA', empresa: 'HP' },
  { id: 5, codigo: 'MAT-004', descripcion: 'MANGUERA HIDRÁULICA 1/2"', unidad: 'MT', cantidad: 100, area: 'MAQUINARIA', solicitante: 'Pedro Salas', fecha: '2026-06-13', tipo: 'COMPRA', empresa: 'HP' },

  { id: 6, codigo: 'MAT-001', descripcion: 'ACEITE HIDRAULICO 68', unidad: 'GLN', cantidad: 40, area: 'MANTENIMIENTO', solicitante: 'Ana Vera', fecha: '2026-06-10', tipo: 'COMPRA', empresa: 'BH' },
  { id: 7, codigo: 'MAT-002', descripcion: 'FILTRO DE AIRE MOTOR', unidad: 'UND', cantidad: 8, area: 'MANTENIMIENTO', solicitante: 'Ana Vera', fecha: '2026-06-10', tipo: 'COMPRA', empresa: 'BH' },
  { id: 8, codigo: 'MAT-005', descripcion: 'PERNO HEXAGONAL 3/4"', unidad: 'UND', cantidad: 200, area: 'TALLER', solicitante: 'Carlos Mendez', fecha: '2026-06-11', tipo: 'COMPRA', empresa: 'BH' },
  { id: 9, codigo: 'MAT-006', descripcion: 'DISCO DE CORTE 9"', unidad: 'UND', cantidad: 50, area: 'TALLER', solicitante: 'Carlos Mendez', fecha: '2026-06-12', tipo: 'COMPRA', empresa: 'BH' },

  { id: 10, codigo: 'MAT-001', descripcion: 'ACEITE HIDRAULICO 68', unidad: 'GLN', cantidad: 60, area: 'MAQUINARIA', solicitante: 'Maria Leon', fecha: '2026-06-09', tipo: 'COMPRA', empresa: 'CAO' },
  { id: 11, codigo: 'MAT-003', descripcion: 'GRASA MULTIPROPÓSITO', unidad: 'KG', cantidad: 15, area: 'CAMPO', solicitante: 'Maria Leon', fecha: '2026-06-10', tipo: 'COMPRA', empresa: 'CAO' },
  { id: 12, codigo: 'MAT-007', descripcion: 'CEMENTO PORTLAND 42.5', unidad: 'BLS', cantidad: 80, area: 'CIVIL', solicitante: 'Jose Ruiz', fecha: '2026-06-11', tipo: 'COMPRA', empresa: 'CAO' },
  { id: 13, codigo: 'MAT-002', descripcion: 'FILTRO DE AIRE MOTOR', unidad: 'UND', cantidad: 6, area: 'MANTENIMIENTO', solicitante: 'Maria Leon', fecha: '2026-06-12', tipo: 'COMPRA', empresa: 'CAO' },
];

@Component({
  selector: 'app-consolidacion-corporativa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule, CheckboxModule, ButtonModule, TagModule, TooltipModule, SumCantidadPipe],
  templateUrl: './consolidacion-corporativa.component.html',
  styleUrls: ['./consolidacion-corporativa.component.scss'],
})
export class ConsolidacionCorporativaComponent implements OnInit {

  // =============================================
  // Tab activa principal
  // =============================================
  tabActiva: 'HP' | 'BH' | 'CAO' | 'CORPORATIVO' = 'HP';

  // =============================================
  // Datos por empresa
  // =============================================
  itemsHP = signal<ItemRequerimiento[]>([]);
  itemsBH = signal<ItemRequerimiento[]>([]);
  itemsCAO = signal<ItemRequerimiento[]>([]);

  // Consolidados guardados por empresa (pre-guardado)
  consolidadoHP = signal<ItemConsolidadoEmpresa[]>([]);
  consolidadoBH = signal<ItemConsolidadoEmpresa[]>([]);
  consolidadoCAO = signal<ItemConsolidadoEmpresa[]>([]);

  // =============================================
  // Estado de guardado por empresa
  // =============================================
  guardadoHP = signal(false);
  guardadoBH = signal(false);
  guardadoCAO = signal(false);
  guardandoHP = signal(false);
  guardandoBH = signal(false);
  guardandoCAO = signal(false);

  // =============================================
  // Consolidación corporativa
  // =============================================
  itemsCorporativos = computed<ItemCorporativo[]>(() => {
    const hp = this.consolidadoHP();
    const bh = this.consolidadoBH();
    const cao = this.consolidadoCAO();

    const mapa = new Map<string, ItemCorporativo>();

    const agregar = (items: ItemConsolidadoEmpresa[], empresa: 'HP' | 'BH' | 'CAO') => {
      for (const item of items) {
        if (!mapa.has(item.codigo)) {
          mapa.set(item.codigo, {
            codigo: item.codigo,
            descripcion: item.descripcion,
            unidad: item.unidad,
            cantidadHP: 0,
            cantidadBH: 0,
            cantidadCAO: 0,
            cantidadTotal: 0,
            consolidadoHP: false,
            consolidadoBH: false,
            consolidadoCAO: false,
          });
        }
        const entry = mapa.get(item.codigo)!;
        if (empresa === 'HP') { entry.cantidadHP += item.cantidadTotal; entry.consolidadoHP = item.guardado; }
        if (empresa === 'BH') { entry.cantidadBH += item.cantidadTotal; entry.consolidadoBH = item.guardado; }
        if (empresa === 'CAO') { entry.cantidadCAO += item.cantidadTotal; entry.consolidadoCAO = item.guardado; }
        entry.cantidadTotal = entry.cantidadHP + entry.cantidadBH + entry.cantidadCAO;
      }
    };

    agregar(hp, 'HP');
    agregar(bh, 'BH');
    agregar(cao, 'CAO');

    return Array.from(mapa.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  puedeConsolidarCorporativo = computed(() =>
    this.guardadoHP() || this.guardadoBH() || this.guardadoCAO()
  );

  todasEmpresasConsolidadas = computed(() =>
    this.guardadoHP() && this.guardadoBH() && this.guardadoCAO()
  );

  // =============================================
  // Filtros
  // =============================================
  filtroHP = '';
  filtroBH = '';
  filtroCAO = '';
  filtroCorpCodigo = '';
  filtroCorporativoAplicado = signal('');

  // =============================================
  // Modal detalle consolidado
  // =============================================
  modalDetalleAbierto = false;
  itemDetalleActual: ItemConsolidadoEmpresa | null = null;

  // =============================================
  // Modal pre-consolidado empresa
  // =============================================
  modalPreConsolidadoAbierto = false;
  preConsolidadoActual: { empresa: string; items: ItemConsolidadoEmpresa[] } | null = null;

  // =============================================
  // Estado OC corporativa
  // =============================================
  generandoOC = signal(false);
  ocGenerada = signal(false);

  // =============================================
  // Resumen computed
  // =============================================
  totalItemsHP = computed(() => this.itemsHP().length);
  totalItemsBH = computed(() => this.itemsBH().length);
  totalItemsCAO = computed(() => this.itemsCAO().length);

  seleccionadosHP = computed(() => this.itemsHP().filter(i => i.seleccionado).length);
  seleccionadosBH = computed(() => this.itemsBH().filter(i => i.seleccionado).length);
  seleccionadosCAO = computed(() => this.itemsCAO().filter(i => i.seleccionado).length);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.itemsHP.set(MOCK_ITEMS.filter(i => i.empresa === 'HP').map(i => ({ ...i, seleccionado: false })));
    this.itemsBH.set(MOCK_ITEMS.filter(i => i.empresa === 'BH').map(i => ({ ...i, seleccionado: false })));
    this.itemsCAO.set(MOCK_ITEMS.filter(i => i.empresa === 'CAO').map(i => ({ ...i, seleccionado: false })));
  }

  // =============================================
  // Navegación de tabs
  // =============================================
  cambiarTab(tab: 'HP' | 'BH' | 'CAO' | 'CORPORATIVO'): void {
    this.tabActiva = tab;
  }

  // =============================================
  // Filtrado de items por empresa
  // =============================================
  get itemsHPFiltrados(): ItemRequerimiento[] {
    const f = this.filtroHP.toLowerCase();
    return this.itemsHP().filter(i =>
      !f || i.codigo.toLowerCase().includes(f) || i.descripcion.toLowerCase().includes(f) || i.area.toLowerCase().includes(f)
    );
  }

  get itemsBHFiltrados(): ItemRequerimiento[] {
    const f = this.filtroBH.toLowerCase();
    return this.itemsBH().filter(i =>
      !f || i.codigo.toLowerCase().includes(f) || i.descripcion.toLowerCase().includes(f) || i.area.toLowerCase().includes(f)
    );
  }

  get itemsCAOFiltrados(): ItemRequerimiento[] {
    const f = this.filtroCAO.toLowerCase();
    return this.itemsCAO().filter(i =>
      !f || i.codigo.toLowerCase().includes(f) || i.descripcion.toLowerCase().includes(f) || i.area.toLowerCase().includes(f)
    );
  }

  get itemsCorporativosFiltrados(): ItemCorporativo[] {
    const f = this.filtroCorporativoAplicado().toLowerCase();
    return this.itemsCorporativos().filter(i =>
      !f || i.codigo.toLowerCase().includes(f) || i.descripcion.toLowerCase().includes(f)
    );
  }

  // =============================================
  // Selección de items
  // =============================================
  toggleSeleccionHP(item: ItemRequerimiento): void {
    this.itemsHP.update(list => list.map(i => i.id === item.id ? { ...i, seleccionado: !i.seleccionado } : i));
  }

  toggleSeleccionBH(item: ItemRequerimiento): void {
    this.itemsBH.update(list => list.map(i => i.id === item.id ? { ...i, seleccionado: !i.seleccionado } : i));
  }

  toggleSeleccionCAO(item: ItemRequerimiento): void {
    this.itemsCAO.update(list => list.map(i => i.id === item.id ? { ...i, seleccionado: !i.seleccionado } : i));
  }

  seleccionarTodos(empresa: 'HP' | 'BH' | 'CAO', valor: boolean): void {
    if (empresa === 'HP') this.itemsHP.update(l => l.map(i => ({ ...i, seleccionado: valor })));
    if (empresa === 'BH') this.itemsBH.update(l => l.map(i => ({ ...i, seleccionado: valor })));
    if (empresa === 'CAO') this.itemsCAO.update(l => l.map(i => ({ ...i, seleccionado: valor })));
  }

  todosMarcados(empresa: 'HP' | 'BH' | 'CAO'): boolean {
    const lista = empresa === 'HP' ? this.itemsHP() : empresa === 'BH' ? this.itemsBH() : this.itemsCAO();
    return lista.length > 0 && lista.every(i => i.seleccionado);
  }

  // =============================================
  // Consolidar items por empresa → pre-guardar
  // =============================================
  private agruparItemsSeleccionados(items: ItemRequerimiento[]): ItemConsolidadoEmpresa[] {
    const mapa = new Map<string, ItemConsolidadoEmpresa>();
    for (const item of items.filter(i => i.seleccionado)) {
      if (!mapa.has(item.codigo)) {
        mapa.set(item.codigo, {
          codigo: item.codigo,
          descripcion: item.descripcion,
          unidad: item.unidad,
          cantidadTotal: 0,
          detalle: [],
          guardado: false,
        });
      }
      const entry = mapa.get(item.codigo)!;
      entry.cantidadTotal += item.cantidad;
      entry.detalle.push({ empresa: item.empresa, area: item.area, cantidad: item.cantidad, solicitante: item.solicitante });
    }
    return Array.from(mapa.values());
  }

  preConsolidarEmpresa(empresa: 'HP' | 'BH' | 'CAO'): void {
    const items = empresa === 'HP' ? this.itemsHP() : empresa === 'BH' ? this.itemsBH() : this.itemsCAO();
    const seleccionados = items.filter(i => i.seleccionado);
    if (seleccionados.length === 0) return;

    const agrupados = this.agruparItemsSeleccionados(items);
    this.preConsolidadoActual = { empresa, items: agrupados };
    this.modalPreConsolidadoAbierto = true;
    this.cdr.markForCheck();
  }

  confirmarGuardadoEmpresa(): void {
    if (!this.preConsolidadoActual) return;
    const { empresa, items } = this.preConsolidadoActual;

    const conGuardado = items.map(i => ({ ...i, guardado: true, idConsolidacion: `CONS-${empresa}-${Date.now()}` }));

    if (empresa === 'HP') { this.consolidadoHP.set(conGuardado); this.guardadoHP.set(true); }
    if (empresa === 'BH') { this.consolidadoBH.set(conGuardado); this.guardadoBH.set(true); }
    if (empresa === 'CAO') { this.consolidadoCAO.set(conGuardado); this.guardadoCAO.set(true); }

    this.modalPreConsolidadoAbierto = false;
    this.preConsolidadoActual = null;
    this.cdr.markForCheck();
  }

  cancelarPreConsolidado(): void {
    this.modalPreConsolidadoAbierto = false;
    this.preConsolidadoActual = null;
  }

  // =============================================
  // Ver detalle de item consolidado por empresa
  // =============================================
  verDetalleConsolidado(item: ItemConsolidadoEmpresa): void {
    this.itemDetalleActual = item;
    this.modalDetalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarDetalleConsolidado(): void {
    this.modalDetalleAbierto = false;
    this.itemDetalleActual = null;
  }

  // =============================================
  // Helpers consolidación corporativa
  // =============================================
  aplicarFiltroCorporativo(): void {
    this.filtroCorporativoAplicado.set(this.filtroCorpCodigo);
  }

  limpiarFiltroCorporativo(): void {
    this.filtroCorpCodigo = '';
    this.filtroCorporativoAplicado.set('');
  }

  generarOCCorporativa(): void {
    if (!this.puedeConsolidarCorporativo()) return;
    this.generandoOC.set(true);
    setTimeout(() => {
      this.generandoOC.set(false);
      this.ocGenerada.set(true);
      this.cdr.markForCheck();
    }, 1800);
  }

  // =============================================
  // Utilidades
  // =============================================
  getTagSeverity(guardado: boolean): 'success' | 'warn' {
    return guardado ? 'success' : 'warn';
  }

  getTagLabel(guardado: boolean): string {
    return guardado ? 'Consolidado' : 'Pendiente';
  }

  trackByCodigo(_: number, item: any): string {
    return item.codigo;
  }

  trackById(_: number, item: any): number {
    return item.id;
  }
}
