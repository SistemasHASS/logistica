import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import { AreasService, Area } from '../../services/areas.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import {
  AprobacionAmbitosService, AmbitoOrganizacional, AsignacionAmbito, CambioAmbito,
  ConfiguracionAmbitos, ReglaAmbito, ResponsableReglaAmbito, ResultadoCambioAmbito,
  SimulacionRutaAmbito, TipoRequerimientoAmbito
} from '../../services/aprobacion-ambitos.service';

@Component({
  selector: 'app-config-ambitos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './config-ambitos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigAmbitosComponent implements OnChanges {
  @Input({ required: true }) ruc = '';
  private api = inject(AprobacionAmbitosService);
  private areasApi = inject(AreasService);
  private maestrasApi = inject(MaestrasService);
  private auth = inject(AdminLogisticaAuthService);
  private revision = 0;
  private vigenteDesde = () => {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  config = signal<ConfiguracionAmbitos>({ ambitos: [], areas: [], asignaciones: [], reglas: [], auditoria: [] });
  catalogo = signal<Area[]>([]);
  fundosMaestra = signal<any[]>([]);
  estadoFundos = signal<'idle' | 'cargando' | 'ok' | 'vacio' | 'error'>('idle');
  loading = signal(false);
  busy = signal(false);
  error = signal('');
  mensaje = signal('');
  simulacion = signal<SimulacionRutaAmbito | null>(null);
  tab = signal('estructura');
  motivo = '';
  ambito = this.nuevoAmbito();
  area = { idAmbito: 0, idarea: 0, activo: true };
  asignacion = this.nuevaAsignacion();
  regla = this.nuevaRegla();
  simulador: { idAreaAmbito: number; documentoidentidad: string; tipoRequerimiento: TipoRequerimientoAmbito } = {
    idAreaAmbito: 0, documentoidentidad: '', tipoRequerimiento: 'COMPRA'
  };
  readonly tabs = [
    { id: 'estructura', nombre: '1. Estructura' }, { id: 'asignaciones', nombre: '2. Asignaciones' },
    { id: 'reglas', nombre: '3. Reglas N1/N2' }, { id: 'simulador', nombre: 'Simulador' }, { id: 'auditoria', nombre: 'Auditoría' }
  ];

  ngOnChanges() {
    this.revision++;
    this.config.set({ ambitos: [], areas: [], asignaciones: [], reglas: [], auditoria: [] });
    this.catalogo.set([]);
    this.fundosMaestra.set([]);
    this.estadoFundos.set('idle');
    this.ambito = this.nuevoAmbito();
    this.area = { idAmbito: 0, idarea: 0, activo: true };
    this.asignacion = this.nuevaAsignacion();
    this.regla = this.nuevaRegla();
    this.simulador = { idAreaAmbito: 0, documentoidentidad: '', tipoRequerimiento: 'COMPRA' };
    this.simulacion.set(null);
    this.motivo = '';
    this.mensaje.set('');
    void this.cargar();
  }

  async cargar() {
    const revision = ++this.revision;
    this.error.set('');
    this.loading.set(!!this.ruc);
    if (!this.ruc) return;
    try {
      const [config, areas] = await Promise.all([
        firstValueFrom(this.api.obtenerConfiguracion(this.ruc)), firstValueFrom(this.areasApi.listarAreas(this.ruc))
      ]);
      if (revision !== this.revision) return;
      this.config.set(config);
      this.catalogo.set(Array.isArray(areas) ? areas : areas?.resultado || []);
      void this.cargarFundosMaestra(revision);
    } catch (e) {
      if (revision === this.revision) this.error.set(this.detalleError(e));
    } finally {
      if (revision === this.revision) this.loading.set(false);
    }
  }

  /**
   * Carga los fundos de la empresa seleccionada desde la API Maestra.
   * Un error de consulta no equivale a "sin fundos": se marca 'error' y el
   * alta de ámbitos de fundo queda bloqueada hasta reintentar.
   */
  private async cargarFundosMaestra(revision: number) {
    this.estadoFundos.set('cargando');
    this.fundosMaestra.set([]);
    try {
      const empresas = await this.maestrasApi.getEmpresas([]);
      if (revision !== this.revision) return;
      const lista = Array.isArray(empresas) ? empresas : [];
      const empresa = lista.find((e: any) => e.ruc === this.ruc);
      if (!empresa) {
        this.estadoFundos.set('vacio');
        return;
      }
      const resp = await firstValueFrom(this.maestrasApi.getFundos([{ idempresa: empresa.idempresa }]));
      if (revision !== this.revision) return;
      const fundos = (Array.isArray(resp) ? resp : []).filter((f: any) => f.empresa === empresa.empresa);
      this.fundosMaestra.set(fundos);
      this.estadoFundos.set(fundos.length ? 'ok' : 'vacio');
    } catch {
      if (revision === this.revision) {
        this.fundosMaestra.set([]);
        this.estadoFundos.set('error');
      }
    }
  }

  seleccionarFundoMaestro(id: number | string) {
    const fundo = this.fundosMaestra().find(f => f.id === Number(id));
    if (!fundo) return;
    this.ambito.codigoUnidad = fundo.codigoFundo;
    this.ambito.nombre = fundo.nombreFundo;
    this.ambito.idFundoMaestro = fundo.id;
    this.ambito.empresaFundoMaestro = fundo.empresa;
  }

  onTipoAmbitoChange() {
    if (this.ambito.tipoAmbito === 'ADMINISTRATIVO') {
      this.ambito.idFundoMaestro = null;
      this.ambito.empresaFundoMaestro = null;
    }
  }

  despliegueHabilitado() { return this.config().despliegue?.habilitado === true; }

  cambiarDespliegue(habilitado: boolean) {
    const cambio = this.cambio();
    if (cambio) void this.guardar(this.api.cambiarDespliegue({ habilitado, ...cambio }));
  }

  nombreAmbito(id: number | null) {
    return id === null ? 'Todos los ámbitos del tipo' : this.config().ambitos.find(a => a.idAmbito === id)?.nombre || String(id);
  }

  nombreArea(id: number | null) {
    return id === null ? 'Todas las áreas' : this.catalogo().find(a => a.idarea === id)?.nombre || String(id);
  }

  nombreAreaAmbito(id: number) {
    const area = this.config().areas.find(a => a.idAreaAmbito === id);
    return area ? `${this.nombreAmbito(area.idAmbito)} / ${area.nombre}` : String(id);
  }

  areasRegla() {
    return this.config().areas.filter(a => a.activo && a.idAmbito === this.regla.idAmbito);
  }

  ambitosRegla() {
    return this.config().ambitos.filter(a => a.activo && a.tipoAmbito === this.regla.tipoAmbito);
  }

  editarAmbito(value: AmbitoOrganizacional) { this.ambito = { ...value }; }
  editarAsignacion(value: AsignacionAmbito) {
    this.asignacion = { ...value, vigenteDesde: value.vigenteDesde.slice(0, 16), vigenteHasta: value.vigenteHasta?.slice(0, 16) || null };
  }
  editarRegla(value: ReglaAmbito, clonar = false) {
    this.regla = { ...value, idRegla: clonar ? 0 : value.idRegla, estado: 'BORRADOR',
      vigenteDesde: value.vigenteDesde.slice(0, 16), vigenteHasta: value.vigenteHasta?.slice(0, 16) || null,
      responsables: value.responsables.map(p => ({ ...p, vigenteDesde: p.vigenteDesde.slice(0, 16), vigenteHasta: p.vigenteHasta?.slice(0, 16) || null })) };
  }

  agregarResponsable(nivel = 1) {
    this.regla.responsables.push(this.nuevoResponsable(nivel,
      Math.max(0, ...this.regla.responsables.filter(p => p.nivel === nivel).map(p => p.orden)) + 1));
  }

  guardarAmbito() {
    const cambio = this.cambio();
    if (cambio) void this.guardar(this.api.guardarAmbito({ ...this.ambito, ...cambio }), () => this.ambito = this.nuevoAmbito());
  }
  guardarArea() {
    const cambio = this.cambio();
    if (cambio) void this.guardar(this.api.guardarArea({ ...this.area, ...cambio }));
  }
  guardarAsignacion() {
    const cambio = this.cambio();
    if (cambio) void this.guardar(this.api.guardarAsignacion({ ...this.asignacion, vigenteHasta: this.asignacion.vigenteHasta || null, ...cambio }),
      () => this.asignacion = this.nuevaAsignacion());
  }
  guardarRegla() {
    const cambio = this.cambio();
    if (cambio) void this.guardar(this.api.guardarRegla({ ...this.regla, ...cambio, vigenteHasta: this.regla.vigenteHasta || null,
      responsables: this.regla.responsables.map(p => ({ ...p, vigenteHasta: p.vigenteHasta || null })) }), () => this.regla = this.nuevaRegla());
  }
  cambiarEstado(regla: ReglaAmbito, estado: 'PUBLICADA' | 'INACTIVA') {
    const cambio = this.cambio();
    if (cambio) void this.guardar(this.api.cambiarEstado({ ...cambio, idRegla: regla.idRegla, estado }));
  }

  async simular() {
    if (this.busy()) return;
    const revision = this.revision;
    this.busy.set(true);
    this.error.set('');
    this.simulacion.set(null);
    try {
      const resultado = await firstValueFrom(this.api.simular({ ...this.simulador, ruc: this.ruc }));
      if (revision === this.revision) this.simulacion.set(resultado);
    } catch (e) {
      if (revision === this.revision) this.error.set(this.detalleError(e));
    } finally { this.busy.set(false); }
  }

  private cambio(): CambioAmbito | null {
    const usuario = this.auth.currentUser()?.usuario;
    if (!this.motivo.trim() || !usuario || !this.ruc) {
      this.error.set('Se requiere empresa, sesión administrativa y motivo del cambio.');
      return null;
    }
    return { ruc: this.ruc, usuario, motivo: this.motivo.trim() };
  }

  private async guardar(request: Observable<ResultadoCambioAmbito>, reset?: () => void) {
    if (this.busy() || this.loading()) return;
    const revision = this.revision;
    this.busy.set(true);
    this.error.set('');
    this.mensaje.set('');
    try {
      const resultado = await firstValueFrom(request);
      if (revision !== this.revision) return;
      if (resultado.success !== 1) throw new Error('No se confirmó el cambio.');
      reset?.();
      this.motivo = '';
      this.simulacion.set(null);
      this.mensaje.set('Configuración guardada. El flujo operativo anterior no ha sido reemplazado.');
      await this.cargar();
    } catch (e) {
      if (revision === this.revision) this.error.set(this.detalleError(e));
    } finally { this.busy.set(false); }
  }

  private detalleError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (error.error?.mensaje) return String(error.error.mensaje);
      if (error.error?.errors) return Object.values(error.error.errors).flat().join(' ');
      return 'No se pudo consultar o guardar la configuración. Verifique permisos y migraciones 852, 853 y 855.';
    }
    return error instanceof Error ? error.message : 'No se pudo completar la operación.';
  }

  nuevoAmbito(): AmbitoOrganizacional {
    return { idAmbito: 0, ruc: this.ruc, tipoAmbito: 'ADMINISTRATIVO', codigoUnidad: '', nombre: '',
      idFundoMaestro: null, empresaFundoMaestro: null, activo: true };
  }
  nuevaAsignacion(): AsignacionAmbito {
    return { idAreaAmbito: 0, documentoidentidad: '', puedeSolicitar: true, puedeAprobarN1: false, puedeAprobarN2: false,
      activo: true, vigenteDesde: this.vigenteDesde(), vigenteHasta: null };
  }
  nuevaRegla(): ReglaAmbito {
    return { idRegla: 0, tipoAmbito: 'ADMINISTRATIVO', idAmbito: null, idarea: null, tipoRequerimiento: 'COMPRA', niveles: 2,
      estado: 'BORRADOR', vigenteDesde: this.vigenteDesde(), vigenteHasta: null,
      responsables: [this.nuevoResponsable(1, 1), this.nuevoResponsable(2, 1)] };
  }
  private nuevoResponsable(nivel: number, orden: number): ResponsableReglaAmbito {
    return { nivel, orden, documentoidentidad: '', disponible: true, vigenteDesde: this.vigenteDesde(), vigenteHasta: null };
  }
}
