import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfigFlujoAprobacionService, ConfigFlujo, AprobadorNivel2 } from '../../services/config-flujo-aprobacion.service';
import { ParametrosService } from '../../tabs/parametros/services/parametros.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import { EmpresasMaestrasService } from '../../services/empresas-maestras.service';

@Component({
  selector: 'app-config-flujo-aprobacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    DialogModule,
    TagModule
  ],
  templateUrl: './config-flujo-aprobacion.component.html',
  styleUrls: ['./config-flujo-aprobacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigFlujoAprobacionComponent implements OnInit {
  private configSvc = inject(ConfigFlujoAprobacionService);
  private parametrosSvc = inject(ParametrosService);
  private authSvc = inject(AdminLogisticaAuthService);
  private empresasSvc = inject(EmpresasMaestrasService);
  private fb = inject(FormBuilder);

  empresas = this.empresasSvc.empresas;
  cargandoEmpresas = this.empresasSvc.cargando;

  rucSeleccionado = signal<string>('');
  configs = signal<ConfigFlujo[]>([]);
  aprobadores = signal<AprobadorNivel2[]>([]);
  nivel2Global = signal<boolean>(false);
  loading = signal(false);
  loadingAprobadores = signal(false);
  guardando = signal(false);
  guardandoGlobal = signal(false);

  modalAprobador = signal(false);
  isEditingAprobador = signal(false);

  tiposConfigurables = ['CONSUMO', 'COMPRA', 'SERVICIO'];

  rolesNivel2 = [
    { label: 'GERENTE', value: 'GERENTE' },
    { label: 'SUBGERENTE', value: 'SUBGERENTE' }
  ];

  formAprobador: FormGroup = this.fb.group({
    idAprobadorN2: [0],
    ruc: ['', Validators.required],
    documentoidentidad: ['', Validators.required],
    nombreCompleto: ['', Validators.required],
    rol: ['GERENTE', Validators.required],
    orden: [1, [Validators.required, Validators.min(1)]],
    disponible: [true]
  });

  private userSignal = this.authSvc.currentUser;

  aprobadorVigente = computed(() => this.aprobadores().find(a => a.esVigente));

  get user() {
    return this.userSignal();
  }

  async ngOnInit() {
    await this.empresasSvc.cargarEmpresas();
    const userRuc = this.userSignal()?.ruc;
    if (userRuc) {
      this.rucSeleccionado.set(userRuc);
    } else if (this.empresas().length > 0) {
      this.rucSeleccionado.set(this.empresas()[0].ruc);
    }
    this.cargarConfig();
    this.cargarAprobadores();
  }

  onEmpresaChange(ruc: string) {
    this.rucSeleccionado.set(ruc);
    this.cargarConfig();
    this.cargarAprobadores();
  }

  cargarConfig() {
    this.loading.set(true);
    this.configSvc.listarConfigFlujo(this.rucSeleccionado()).subscribe({
      next: (res) => {
        const data: ConfigFlujo[] = Array.isArray(res) ? res : res?.resultado || [];
        this.configs.set(data);
        if (data.length > 0) {
          this.nivel2Global.set(data[0].nivel2Habilitado === 'S');
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        alert('Error al cargar configuración de flujo');
      }
    });
  }

  cargarAprobadores() {
    this.loadingAprobadores.set(true);
    this.configSvc.listarAprobadoresNivel2(this.rucSeleccionado()).subscribe({
      next: (res) => {
        const data: AprobadorNivel2[] = Array.isArray(res) ? res : res?.resultado || [];
        this.aprobadores.set(data);
        this.loadingAprobadores.set(false);
      },
      error: () => {
        this.loadingAprobadores.set(false);
        alert('Error al cargar aprobadores nivel 2');
      }
    });
  }

  configDe(tipo: string): ConfigFlujo {
    return this.configs().find(c => c.tipoRequerimiento === tipo)
      || { tipoRequerimiento: tipo, modo: 'UN_NIVEL', activo: true, nivel2Habilitado: 'N' };
  }

  setModo(tipo: string, modo: 'UN_NIVEL' | 'DOS_NIVELES') {
    this.configs.update(list =>
      list.map(c => c.tipoRequerimiento === tipo ? { ...c, modo } : c)
    );
    if (!this.configs().some(c => c.tipoRequerimiento === tipo)) {
      this.configs.update(list => [...list, { tipoRequerimiento: tipo, modo, activo: true, nivel2Habilitado: 'N' }]);
    }
  }

  toggleGlobal() {
    const nuevo = !this.nivel2Global();
    this.guardandoGlobal.set(true);
    this.parametrosSvc.saveParametro('REQ_NIVEL2_HABILITADO', nuevo ? 'S' : 'N').subscribe({
      next: () => {
        this.nivel2Global.set(nuevo);
        this.guardandoGlobal.set(false);
      },
      error: () => {
        this.guardandoGlobal.set(false);
        alert('Error al actualizar el parámetro global');
      }
    });
  }

  guardarConfiguracion() {
    const ruc = this.rucSeleccionado();
    const usuario = this.user?.usuario || '';

    const pendientes = this.tiposConfigurables.map(tipo => ({
      ruc,
      tipoRequerimiento: tipo,
      modo: this.configDe(tipo).modo,
      activo: true,
      usuario
    }));

    this.guardando.set(true);
    let errores: string[] = [];
    let completados = 0;

    for (const cfg of pendientes) {
      this.configSvc.guardarConfigFlujo(cfg).subscribe({
        next: (res) => {
          const item = Array.isArray(res) ? res[0] : res;
          if (item && item.success === 0) {
            errores.push(`${cfg.tipoRequerimiento}: ${item.mensaje}`);
          }
          completados++;
          if (completados === pendientes.length) {
            this.guardando.set(false);
            if (errores.length) {
              alert(errores.join('\n'));
            } else {
              alert('Configuración guardada correctamente');
            }
            this.cargarConfig();
          }
        },
        error: (err) => {
          errores.push(`${cfg.tipoRequerimiento}: ${err.error?.message || 'Error al guardar'}`);
          completados++;
          if (completados === pendientes.length) {
            this.guardando.set(false);
            alert(errores.join('\n'));
            this.cargarConfig();
          }
        }
      });
    }
  }

  // =============================================
  // MANTENEDOR DE CADENA NIVEL 2
  // =============================================

  abrirCrearAprobador() {
    this.isEditingAprobador.set(false);
    const siguienteOrden = this.aprobadores().length + 1;
    this.formAprobador.reset({
      idAprobadorN2: 0,
      ruc: this.rucSeleccionado(),
      rol: siguienteOrden === 1 ? 'GERENTE' : 'SUBGERENTE',
      orden: siguienteOrden,
      disponible: true
    });
    this.modalAprobador.set(true);
  }

  abrirEditarAprobador(a: AprobadorNivel2) {
    this.isEditingAprobador.set(true);
    this.formAprobador.patchValue({
      idAprobadorN2: a.idAprobadorN2,
      ruc: a.ruc,
      documentoidentidad: a.documentoidentidad,
      nombreCompleto: a.nombreCompleto,
      rol: a.rol,
      orden: a.orden,
      disponible: a.disponible
    });
    this.modalAprobador.set(true);
  }

  guardarAprobador() {
    if (this.formAprobador.invalid) {
      this.formAprobador.markAllAsTouched();
      return;
    }
    const data = {
      ...this.formAprobador.value,
      usuario: this.user?.usuario || ''
    };
    this.configSvc.guardarAprobadorNivel2(data).subscribe({
      next: (res) => {
        const item = Array.isArray(res) ? res[0] : res;
        if (item && item.success === 0) {
          alert(item.mensaje);
          return;
        }
        this.cerrarModalAprobador();
        this.cargarAprobadores();
      },
      error: (err) => alert(err.error?.message || 'Error al guardar aprobador')
    });
  }

  eliminarAprobador(a: AprobadorNivel2) {
    if (!confirm(`¿Retirar a ${a.nombreCompleto} de la cadena de aprobación?`)) return;
    this.configSvc.eliminarAprobadorNivel2(a.idAprobadorN2).subscribe({
      next: () => this.cargarAprobadores(),
      error: (err) => alert(err.error?.message || 'Error al eliminar aprobador')
    });
  }

  moverAprobador(a: AprobadorNivel2, direccion: -1 | 1) {
    this.configSvc.reordenarAprobadorNivel2(this.rucSeleccionado(), a.idAprobadorN2, direccion).subscribe({
      next: () => this.cargarAprobadores(),
      error: (err) => alert(err.error?.message || 'Error al reordenar')
    });
  }

  toggleDisponible(a: AprobadorNivel2) {
    this.configSvc.toggleDisponibleAprobadorN2(a.idAprobadorN2, !a.disponible).subscribe({
      next: (res) => {
        const item = Array.isArray(res) ? res[0] : res;
        if (item?.aprobadorVigente && item.aprobadorVigente !== 'SIN VIGENTE') {
          console.log('Aprobador vigente:', item.aprobadorVigente);
        }
        this.cargarAprobadores();
      },
      error: (err) => alert(err.error?.message || 'Error al cambiar disponibilidad')
    });
  }

  cerrarModalAprobador() {
    this.modalAprobador.set(false);
    this.formAprobador.reset();
  }

  esPrimero(a: AprobadorNivel2): boolean {
    return this.aprobadores()[0]?.idAprobadorN2 === a.idAprobadorN2;
  }

  esUltimo(a: AprobadorNivel2): boolean {
    const list = this.aprobadores();
    return list[list.length - 1]?.idAprobadorN2 === a.idAprobadorN2;
  }

  refresh() {
    this.cargarConfig();
    this.cargarAprobadores();
  }
}
