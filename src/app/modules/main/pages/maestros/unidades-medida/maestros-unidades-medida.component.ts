import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UnidadMedida } from '@/app/shared/interfaces/Tables';
import { UnidadesMedidaService } from '@/app/modules/main/services/unidades-medida.service';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-maestros-unidades-medida',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './maestros-unidades-medida.component.html',
  styleUrls: ['./maestros-unidades-medida.component.scss'],
})
export class MaestrosUnidadesMedidaComponent implements OnInit {
  private readonly dexie  = inject(DexieService);
  private readonly api    = inject(UnidadesMedidaService);
  private readonly alert  = inject(AlertService);

  isLoading    = signal(false);
  modalAbierto = signal(false);
  isEditMode   = false;
  modoOffline  = false;

  filtro   = '';
  unidades = signal<UnidadMedida[]>([]);

  unidadesFiltradas = computed(() => {
    const f = this.filtro.toLowerCase().trim();
    if (!f) return this.unidades();
    return this.unidades().filter(
      (u) =>
        u.codigo.toLowerCase().includes(f) ||
        u.descripcion.toLowerCase().includes(f) ||
        u.abreviatura.toLowerCase().includes(f) ||
        u.tipo.toLowerCase().includes(f)
    );
  });

  tiposUnidad: UnidadMedida['tipo'][] = [
    'UNIDAD', 'PESO', 'VOLUMEN', 'LONGITUD', 'AREA', 'TIEMPO', 'OTRO',
  ];

  modelo: UnidadMedida = this.emptyModelo();

  private readonly usuarioActual: string;
  private readonly fechaHoy: string;

  constructor() {
    const raw = localStorage.getItem('usuario');
    const u   = raw ? JSON.parse(raw) : null;
    this.usuarioActual = u?.usuario ?? 'SISTEMA';
    const d = new Date();
    this.fechaHoy = d.toISOString().slice(0, 10);
  }

  async ngOnInit() {
    await this.cargar();
  }

  private emptyModelo(): UnidadMedida {
    return {
      codigo: '', descripcion: '', abreviatura: '',
      tipo: 'UNIDAD', estado: 'A',
      ultimoUsuario: this.usuarioActual,
      ultimaFechaModif: this.fechaHoy,
    };
  }

  async cargar() {
    this.isLoading.set(true);
    try {
      const data = await this.api.listar();
      this.unidades.set(data);
      this.modoOffline = false;
      // Sincronizar caché Dexie con los datos del servidor
      await this.dexie.unidadesMedida.clear();
      await this.dexie.unidadesMedida.bulkPut(data);
    } catch {
      // Fallback a Dexie si la API no está disponible
      this.modoOffline = true;
      await this.dexie.seedUnidadesMedidaDefault();
      const cached = await this.dexie.getUnidadesMedida();
      this.unidades.set(cached);
    } finally {
      this.isLoading.set(false);
    }
  }

  nuevo() {
    this.isEditMode = false;
    this.modelo = this.emptyModelo();
    this.modalAbierto.set(true);
  }

  editar(u: UnidadMedida) {
    this.isEditMode = true;
    this.modelo = { ...u };
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  async guardar() {
    if (!this.modelo.codigo.trim() || !this.modelo.descripcion.trim()) {
      this.alert.showAlertError('Código y Descripción son obligatorios', 'Validación');
      return;
    }
    this.modelo.ultimoUsuario    = this.usuarioActual;
    this.modelo.ultimaFechaModif = this.fechaHoy;
    try {
      const res = await this.api.guardar(this.modelo);
      // Si el backend devuelve el id asignado, persistirlo también en Dexie
      if (res?.id) this.modelo.id = res.id;
      await this.dexie.saveUnidadMedida(this.modelo);
      await this.cargar();
      this.cerrarModal();
      this.alert.showAlertAcept(
        `Unidad "${this.modelo.descripcion}" guardada correctamente`,
        'Unidades de Medida',
        'success'
      );
    } catch {
      this.alert.showAlertError('No se pudo guardar. Verifique la conexión con el servidor.', 'Error');
    }
  }

  async toggleEstado(u: UnidadMedida) {
    const updated: UnidadMedida = {
      ...u,
      estado: u.estado === 'A' ? 'I' : 'A',
      ultimoUsuario:    this.usuarioActual,
      ultimaFechaModif: this.fechaHoy,
    };
    try {
      await this.api.guardar(updated);
      await this.dexie.saveUnidadMedida(updated);
      await this.cargar();
    } catch {
      this.alert.showAlertError('No se pudo cambiar el estado.', 'Error');
    }
  }

  async eliminar(u: UnidadMedida) {
    if (!u.id) return;
    try {
      await this.api.eliminar(u.id);
      await this.dexie.deleteUnidadMedida(u.id);
      await this.cargar();
      this.alert.showAlertAcept(`Unidad "${u.descripcion}" eliminada`, 'Unidades de Medida', 'success');
    } catch {
      this.alert.showAlertError('No se pudo eliminar.', 'Error');
    }
  }

  get totalActivas()   { return this.unidades().filter((u) => u.estado === 'A').length; }
  get totalInactivas() { return this.unidades().filter((u) => u.estado === 'I').length; }
}
