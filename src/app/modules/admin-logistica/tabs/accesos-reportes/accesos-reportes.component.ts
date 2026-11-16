import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';

export interface AccesoReporte {
  id: number;
  modulo: string;
  dni: string;
  nombre: string | null;
  ruc: string | null;
  rol: string | null;
  activo: boolean;
  usuarioAlta: string | null;
  fechaAlta: string | null;
}

export interface AreaAcceso {
  id: number;
  modulo: string;
  dni: string;
  idarea: number;
  nombreArea: string;
  tipoAmbito: string | null;
  nombreAmbito: string | null;
  activo: boolean;
  usuarioAlta: string | null;
  fechaAlta: string | null;
}

interface AreaCatalogo {
  idarea: number;
  nombre: string;
}

interface ModuloReporte {
  modulo: string;
  nombre: string;
  descripcion: string;
}

interface ConfigMenuReporte {
  menuVisible: boolean;
  soloConAcceso: boolean;
}

const MODULOS: ModuloReporte[] = [
  {
    modulo: 'ANALISIS_REQ_COMPRA',
    nombre: 'Análisis Req. Compra',
    descripcion: 'Reporte analítico del workflow de compras — acceso por DNI'
  },
  {
    modulo: 'SEGUIMIENTO_REQ_COMPRA',
    nombre: 'Seguimiento Req. Compra',
    descripcion: 'Reporte operativo del workflow — configura también las áreas visibles por usuario'
  },
  {
    modulo: 'SEGUIMIENTO_REQ_CONSUMO',
    nombre: 'Seguimiento Req. Consumo',
    descripcion: 'Seguimiento de despachos/atención de req. consumo — configura las áreas visibles por usuario'
  },
];

@Component({
  selector: 'app-accesos-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accesos-reportes.component.html',
  styleUrl: './accesos-reportes.component.scss',
})
export class AccesosReportesComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AdminLogisticaAuthService);
  private baseUrl = environment.baseUrl;

  readonly modulos = MODULOS;

  moduloSel   = signal<string>(MODULOS[0].modulo);
  accesos     = signal<AccesoReporte[]>([]);
  cargando    = signal(false);
  guardando   = signal(false);
  alertMsg    = signal('');
  alertTipo   = signal<'success' | 'danger'>('success');

  // alta
  dniNuevo    = '';
  buscandoUsr = signal(false);
  usrPreview  = signal<{ dni: string; nombre: string; ruc: string | null; rol: string | null; area: string | null } | null>(null);
  filtroTxt   = '';

  // visibilidad del ítem de menú en el layout principal
  configMenu   = signal<ConfigMenuReporte | null>(null);
  guardandoCfg = signal(false);

  // alcance por áreas del usuario seleccionado
  usrAreasSel    = signal<AccesoReporte | null>(null);
  areasOtorgadas = signal<AreaAcceso[]>([]);
  areasCatalogo  = signal<AreaCatalogo[]>([]);
  cargandoAreas  = signal(false);
  guardandoArea  = signal(false);
  areaNueva      = '';

  ngOnInit() { this.cargar(); }

  get moduloActual(): ModuloReporte {
    return MODULOS.find(m => m.modulo === this.moduloSel()) ?? MODULOS[0];
  }

  get accesosFiltrados(): AccesoReporte[] {
    const q = this.filtroTxt.trim().toLowerCase();
    if (!q) return this.accesos();
    return this.accesos().filter(a =>
      a.dni.includes(q) || (a.nombre ?? '').toLowerCase().includes(q) || (a.rol ?? '').toLowerCase().includes(q));
  }

  async cargar() {
    this.cargando.set(true);
    try {
      const [res, cfg]: any[] = await Promise.all([
        lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/listar-acceso-reporte`, [{ modulo: this.moduloSel() }])
        ),
        lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/listar-config-reporte-menu`, [{ modulo: this.moduloSel() }])
        ).catch(() => null)
      ]);
      this.accesos.set(Array.isArray(res) ? res : []);
      const fila = Array.isArray(cfg) ? cfg[0] : cfg;
      this.configMenu.set(fila ? {
        menuVisible: fila.menuVisible === true || fila.menuVisible === 1,
        soloConAcceso: fila.soloConAcceso === true || fila.soloConAcceso === 1
      } : { menuVisible: true, soloConAcceso: false });
    } catch {
      this.accesos.set([]);
      this.alerta('Error al cargar accesos', 'danger');
    } finally {
      this.cargando.set(false);
    }
  }

  cambiarModulo(m: string) {
    this.moduloSel.set(m);
    this.dniNuevo = '';
    this.usrPreview.set(null);
    this.configMenu.set(null);
    this.cerrarAreas();
    this.cargar();
  }

  async toggleConfig(campo: keyof ConfigMenuReporte) {
    const cfg = this.configMenu();
    if (!cfg || this.guardandoCfg()) return;
    const nuevo: ConfigMenuReporte = { ...cfg, [campo]: !cfg[campo] };
    this.guardandoCfg.set(true);
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-config-reporte-menu`, [{
          modulo: this.moduloSel(),
          menuVisible: nuevo.menuVisible,
          soloConAcceso: nuevo.soloConAcceso,
          usuarioAlta: this.auth.currentUser()?.usuario ?? 'admin'
        }])
      );
      if (res?.success) {
        this.configMenu.set(nuevo);
        // Avisa al layout principal (esta y otras pestañas) que recargue el menú
        localStorage.setItem('LAYOUT_CONFIG_INVALIDADO', Date.now().toString());
        this.alerta('Visibilidad de menú actualizada', 'success');
      } else {
        this.alerta(res?.mensaje || 'No se pudo guardar la configuración', 'danger');
      }
    } catch {
      this.alerta('Error al guardar la configuración', 'danger');
    } finally {
      this.guardandoCfg.set(false);
    }
  }

  async buscarUsuario() {
    const dni = this.dniNuevo.trim();
    if (!dni) return;
    this.buscandoUsr.set(true);
    this.usrPreview.set(null);
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/buscar-usuario-por-dni`, [{ dni }])
      );
      if (res && res.dni) {
        this.usrPreview.set(res);
      } else {
        this.usrPreview.set({ dni, nombre: '(sin registrar en logística)', ruc: null, rol: null, area: null });
      }
    } catch {
      this.usrPreview.set({ dni, nombre: '(no encontrado)', ruc: null, rol: null, area: null });
    } finally {
      this.buscandoUsr.set(false);
    }
  }

  async darAcceso() {
    const dni = this.dniNuevo.trim();
    if (!dni || this.guardando()) return;
    this.guardando.set(true);
    try {
      const p = this.usrPreview();
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-acceso-reporte`, [{
          modulo: this.moduloSel(),
          dni,
          nombre: p?.nombre?.startsWith('(') ? null : p?.nombre ?? null,
          ruc: p?.ruc ?? null,
          rol: p?.rol ?? null,
          accion: 'ALTA',
          usuarioAlta: this.auth.currentUser()?.usuario ?? 'admin'
        }])
      );
      if (res?.success) {
        this.alerta(`Acceso otorgado a ${dni}`, 'success');
        this.dniNuevo = '';
        this.usrPreview.set(null);
        await this.cargar();
      } else {
        this.alerta(res?.mensaje || 'No se pudo otorgar el acceso', 'danger');
      }
    } catch {
      this.alerta('Error al guardar el acceso', 'danger');
    } finally {
      this.guardando.set(false);
    }
  }

  async toggle(a: AccesoReporte) {
    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-acceso-reporte`, [{
          modulo: a.modulo, dni: a.dni, accion: 'TOGGLE',
          usuarioAlta: this.auth.currentUser()?.usuario ?? 'admin'
        }])
      );
      this.accesos.update(list => list.map(x => x.id === a.id ? { ...x, activo: !x.activo } : x));
    } catch {
      this.alerta('Error al cambiar estado', 'danger');
    }
  }

  async quitar(a: AccesoReporte) {
    if (!confirm(`¿Quitar acceso de ${a.dni} al reporte "${this.moduloActual.nombre}"?`)) return;
    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-acceso-reporte`, [{
          modulo: a.modulo, dni: a.dni, accion: 'ELIMINAR',
          usuarioAlta: this.auth.currentUser()?.usuario ?? 'admin'
        }])
      );
      this.accesos.update(list => list.filter(x => x.id !== a.id));
      this.alerta('Acceso eliminado', 'success');
    } catch {
      this.alerta('Error al eliminar el acceso', 'danger');
    }
  }

  /* ---------- alcance por áreas ---------- */

  get areasDisponibles(): AreaCatalogo[] {
    const usadas = new Set(this.areasOtorgadas().map(a => a.idarea));
    return this.areasCatalogo().filter(a => !usadas.has(a.idarea));
  }

  async abrirAreas(a: AccesoReporte) {
    if (this.usrAreasSel()?.dni === a.dni) { this.cerrarAreas(); return; }
    this.usrAreasSel.set(a);
    this.areaNueva = '';
    this.cargandoAreas.set(true);
    try {
      const [otorgadas, catalogo]: any[] = await Promise.all([
        lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/listar-areas-acceso-reporte`,
            [{ modulo: this.moduloSel(), dni: a.dni }])
        ),
        lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/listar-areas`,
            [{ ruc: a.ruc || this.auth.currentUser()?.ruc }])
        ).catch(() => [])
      ]);
      this.areasOtorgadas.set(Array.isArray(otorgadas) ? otorgadas : []);
      this.areasCatalogo.set(Array.isArray(catalogo) ? catalogo : []);
    } catch {
      this.areasOtorgadas.set([]);
      this.alerta('Error al cargar las áreas del usuario', 'danger');
    } finally {
      this.cargandoAreas.set(false);
    }
  }

  cerrarAreas() {
    this.usrAreasSel.set(null);
    this.areasOtorgadas.set([]);
    this.areaNueva = '';
  }

  async recargarAreas() {
    const a = this.usrAreasSel();
    if (!a) return;
    const res: any = await lastValueFrom(
      this.http.post(`${this.baseUrl}/api/logistica/listar-areas-acceso-reporte`,
        [{ modulo: this.moduloSel(), dni: a.dni }])
    ).catch(() => []);
    this.areasOtorgadas.set(Array.isArray(res) ? res : []);
  }

  async agregarArea() {
    const a = this.usrAreasSel();
    const idarea = +this.areaNueva;
    if (!a || !idarea || this.guardandoArea()) return;
    this.guardandoArea.set(true);
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-area-acceso-reporte`, [{
          modulo: this.moduloSel(), dni: a.dni, idarea, ruc: a.ruc,
          accion: 'ALTA',
          usuarioAlta: this.auth.currentUser()?.usuario ?? 'admin'
        }])
      );
      if (res?.success) {
        this.areaNueva = '';
        await this.recargarAreas();
      } else {
        this.alerta(res?.mensaje || 'No se pudo otorgar el área', 'danger');
      }
    } catch {
      this.alerta('Error al otorgar el área', 'danger');
    } finally {
      this.guardandoArea.set(false);
    }
  }

  async toggleArea(ar: AreaAcceso) {
    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-area-acceso-reporte`, [{
          modulo: ar.modulo, dni: ar.dni, idarea: ar.idarea, accion: 'TOGGLE',
          usuarioAlta: this.auth.currentUser()?.usuario ?? 'admin'
        }])
      );
      this.areasOtorgadas.update(list =>
        list.map(x => x.id === ar.id ? { ...x, activo: !x.activo } : x));
    } catch {
      this.alerta('Error al cambiar estado del área', 'danger');
    }
  }

  async quitarArea(ar: AreaAcceso) {
    if (!confirm(`¿Quitar el área "${ar.nombreArea}" del alcance de ${ar.dni}?`)) return;
    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-area-acceso-reporte`, [{
          modulo: ar.modulo, dni: ar.dni, idarea: ar.idarea, accion: 'ELIMINAR',
          usuarioAlta: this.auth.currentUser()?.usuario ?? 'admin'
        }])
      );
      this.areasOtorgadas.update(list => list.filter(x => x.id !== ar.id));
    } catch {
      this.alerta('Error al quitar el área', 'danger');
    }
  }

  alerta(msg: string, tipo: 'success' | 'danger') {
    this.alertMsg.set(msg);
    this.alertTipo.set(tipo);
    setTimeout(() => this.alertMsg.set(''), 4000);
  }
}
