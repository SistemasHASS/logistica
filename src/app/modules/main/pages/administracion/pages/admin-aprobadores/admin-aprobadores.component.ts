import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminAprobadoresService } from '../../services/admin-aprobadores.service';
import { AdminUsuariosService } from '../../services/admin-usuarios.service';
import { AdminAreasService } from '../../services/admin-areas.service';
import { AprobacionOCService } from '@/app/services/aprobacion-oc.service';
import { AprobacionOSService } from '@/app/services/aprobacion-os.service';
import { ConfigFlujoAprobacionService } from '@/app/modules/admin-logistica/services/config-flujo-aprobacion.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

type ModuloAprobador = 'REQ' | 'OC' | 'OS' | 'N2';

@Component({
  selector: 'app-admin-aprobadores',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './admin-aprobadores.component.html',
  styleUrls: ['./admin-aprobadores.component.scss'],
})
export class AdminAprobadoresComponent implements OnInit, OnDestroy {

  aprobadores: any[] = [];
  usuarios: any[] = [];
  areas: any[] = [];

  loading = false;
  guardando = false;
  showModal = false;
  isEdit = false;
  private editando: any = null;
  private destroy$ = new Subject<void>();

  modulos: { value: ModuloAprobador; label: string }[] = [
    { value: 'REQ', label: 'Requerimientos (SC)' },
    { value: 'OC',  label: 'Órdenes de Compra' },
    { value: 'OS',  label: 'Órdenes de Servicio' },
    { value: 'N2',  label: 'Aprobación Nivel 2' },
  ];

  rolesPorModulo: Record<ModuloAprobador, { value: string; label: string }[]> = {
    REQ: [
      { value: 'JEFE_AREA', label: 'Jefe de Área' },
      { value: 'OPLOGIST',  label: 'Operador Logística (OPLOGIST)' },
      { value: 'ALLOGIST',  label: 'Almacenero Logística (ALLOGIST)' },
      { value: 'APLOGIST',  label: 'Aprobador Logística (APLOGIST)' },
      { value: 'APSC',      label: 'Aprobador de Solicitudes (APSC)' },
      { value: 'LOLOGIST',  label: 'Jefe de Logística (LOLOGIST)' },
      { value: 'JLOLOGIST', label: 'Jefatura de Logística (JLOLOGIST)' },
      { value: 'FINANZAS',  label: 'Finanzas' },
      { value: 'GERENTE',   label: 'Gerencia' },
      { value: 'TI',        label: 'TI' },
    ],
    OC: [
      { value: 'LOLOGIST',  label: 'Jefe de Logística (LOLOGIST)' },
      { value: 'JLOLOGIST', label: 'Jefatura de Logística (JLOLOGIST)' },
      { value: 'FINANZAS',  label: 'Finanzas' },
      { value: 'GERENTE',   label: 'Gerencia' },
    ],
    OS: [
      { value: 'LOLOGIST',  label: 'Jefe de Logística (LOLOGIST)' },
      { value: 'JLOLOGIST', label: 'Jefatura de Logística (JLOLOGIST)' },
      { value: 'FINANZAS',  label: 'Finanzas' },
      { value: 'GERENTE',   label: 'Gerencia' },
    ],
    N2: [
      { value: 'GERENTE',    label: 'Gerente' },
      { value: 'SUBGERENTE', label: 'Subgerente' },
    ],
  };

  form: {
    id: number | null;
    modulo: ModuloAprobador;
    documentoidentidad: string | null;
    rol: string;
    idarea: number | null;
    montoMinimo: number;
    montoMaximo: number;
    nivel: number;
    orden: number;
    disponible: boolean;
    email: string;
    telefono: string;
  } = this.formVacio();

  constructor(
    private adminAprobadoresService: AdminAprobadoresService,
    private adminUsuariosService: AdminUsuariosService,
    private adminAreasService: AdminAreasService,
    private ocService: AprobacionOCService,
    private osService: AprobacionOSService,
    private configFlujoService: ConfigFlujoAprobacionService,
    private userService: UserService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarAprobadores();
    this.cargarUsuarios();
    this.cargarAreas();

    this.userService.usuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        if (usuario && usuario.ruc && usuario.documentoidentidad) {
          this.cargarAprobadores();
          this.cargarUsuarios();
          this.cargarAreas();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private formVacio() {
    return {
      id: null as number | null,
      modulo: 'REQ' as ModuloAprobador,
      documentoidentidad: null as string | null,
      rol: '',
      idarea: null as number | null,
      montoMinimo: 0,
      montoMaximo: 999999999,
      nivel: 1,
      orden: 1,
      disponible: true,
      email: '',
      telefono: ''
    };
  }

  private bodyBase() {
    const usuario = this.userService.getUsuario();
    return {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };
  }

  cargarAprobadores() {
    this.loading = true;

    this.adminAprobadoresService.listarAprobadores(this.bodyBase()).subscribe({
      next: (response) => {
        this.aprobadores = this.parseLista(response);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar aprobadores:', error);
        this.alertService.showAlertError('Error', 'Error al cargar aprobadores');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarUsuarios() {
    this.adminUsuariosService.listarUsuarios(this.bodyBase()).subscribe({
      next: (response) => {
        this.usuarios = this.parseLista(response);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.usuarios = [];
        this.cdr.detectChanges();
      }
    });
  }

  cargarAreas() {
    this.adminAreasService.listarAreas(this.bodyBase()).subscribe({
      next: (response) => {
        this.areas = this.parseLista(response);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
        this.areas = [];
        this.cdr.detectChanges();
      }
    });
  }

  private parseLista(response: any): any[] {
    let lista: any[] = [];

    if (Array.isArray(response)) {
      lista = response;
    } else if (response && typeof response === 'object') {
      const data = response.resultado ?? response.data ?? response.result ?? response.response;
      if (typeof data === 'string') {
        try { lista = JSON.parse(data); } catch { lista = []; }
      } else if (Array.isArray(data)) {
        lista = data;
      }
    }

    return Array.isArray(lista) ? lista : [];
  }

  private parseResultado(res: any): any {
    let resultado = res;
    if (resultado && typeof resultado.resultado === 'string') {
      try { resultado = JSON.parse(resultado.resultado); } catch { /* dejar como está */ }
    }
    return resultado;
  }

  nombreUsuario(u: any): string {
    return u?.nombreCompleto ?? u?.nombre ?? u?.usuarioNombre ?? u?.usuario ?? '';
  }

  estadoTexto(aprobador: any): string {
    const e = aprobador?.estado;
    if (e === true || e === 1) return 'ACTIVO';
    if (e === false || e === 0) return 'INACTIVO';
    return (e ?? 'ACTIVO').toString().toUpperCase();
  }

  rolesActuales() {
    return this.rolesPorModulo[this.form.modulo] ?? [];
  }

  onCambioModulo() {
    this.form.rol = '';
  }

  onCambioUsuario() {
    const u = this.usuarios.find(x => x?.documentoidentidad === this.form.documentoidentidad);
    if (u) {
      this.form.email = u.email ?? this.form.email;
      this.form.telefono = u.telefono ?? this.form.telefono;
      this.form.idarea = u.idarea ?? this.form.idarea;
    }
  }

  openCreate() {
    this.isEdit = false;
    this.form = this.formVacio();
    this.showModal = true;
  }

  esEditable(aprobador: any): boolean {
    return ['REQ', 'OC', 'OS', 'N2'].includes(aprobador?.tipo);
  }

  openEdit(aprobador: any) {
    this.isEdit = true;
    this.editando = aprobador;

    // El aprobador puede no existir en el catálogo LOGISTICA_UsuariosPorArea;
    // se agrega como opción temporal para que el select muestre su nombre
    const doc = aprobador.documentoidentidad;
    if (doc && !this.usuarios.some(u => u?.documentoidentidad === doc)) {
      this.usuarios = [
        ...this.usuarios,
        { documentoidentidad: doc, nombreCompleto: aprobador.usuarioNombre, email: aprobador.correo }
      ];
    }

    this.form = {
      ...this.formVacio(),
      id: aprobador.id,
      modulo: aprobador.tipo as ModuloAprobador,
      documentoidentidad: aprobador.documentoidentidad ?? null,
      rol: aprobador.rol ?? '',
      idarea: aprobador.idarea ?? null,
      nivel: aprobador.tipo === 'N2' ? 1 : (aprobador.nivel ?? 1),
      orden: aprobador.tipo === 'N2' ? (aprobador.nivel ?? 1) : 1,
      email: aprobador.correo ?? '',
      telefono: aprobador.telefono ?? ''
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async save() {
    if (!this.form.documentoidentidad) {
      this.alertService.showAlertError('Error', 'Debe seleccionar un usuario');
      return;
    }
    if (!this.form.rol) {
      this.alertService.showAlertError('Error', 'Debe seleccionar un rol');
      return;
    }

    const usuario = this.userService.getUsuario();
    if (!usuario || !usuario.ruc || !usuario.documentoidentidad) {
      this.alertService.showAlertError('Error', 'No se encontró información del usuario. Por favor, recargue la página.');
      return;
    }

    const usuarioSel = this.usuarios.find(x => x?.documentoidentidad === this.form.documentoidentidad);
    const nombreCompleto = this.nombreUsuario(usuarioSel);
    const usuarioCreacion = usuario.documentoidentidad;

    try {
      this.guardando = true;
      let res: any;

      switch (this.form.modulo) {
        case 'REQ':
          // Marca esAprobador=1 en LOGISTICA_UsuariosPorArea.
          // El SP sobreescribe la fila completa: hay que enviar todos los campos.
          {
            const src = this.isEdit ? this.editando : usuarioSel;
            res = await lastValueFrom(this.adminUsuariosService.actualizarUsuarioPorArea({
              idUsuarioArea: this.isEdit ? this.form.id : usuarioSel?.idUsuarioArea,
              ruc: usuario.ruc,
              documentoidentidad: this.form.documentoidentidad,
              nombreCompleto: this.isEdit ? (this.editando?.usuarioNombre ?? nombreCompleto) : nombreCompleto,
              email: this.form.email || null,
              telefono: this.form.telefono || null,
              idarea: this.form.idarea,
              idsubarea: src?.idsubarea ?? null,
              rol: this.form.rol,
              esJefeArea: src?.esJefeArea ?? false,
              esAprobador: true,
              activo: true
            }));
          }
          break;

        case 'OC':
          res = await lastValueFrom(this.ocService.guardarUsuarioAprobador({
            idUsuarioAprobador: this.isEdit ? this.form.id : undefined,
            documentoIdentidad: this.form.documentoidentidad,
            nombreCompleto,
            email: this.form.email || null,
            rol: this.form.rol,
            montoMinimo: this.form.montoMinimo ?? 0,
            montoMaximo: this.form.montoMaximo ?? 999999999,
            nivel: this.form.nivel,
            activo: true,
            usuarioCreacion
          }));
          break;

        case 'OS':
          const payloadOS = {
            id: this.isEdit ? this.form.id : undefined,
            documentoIdentidad: this.form.documentoidentidad,
            nombreCompleto,
            rol: this.form.rol,
            nivelMaximo: this.form.nivel,
            activo: true,
            usuarioCreacion
          };
          res = await lastValueFrom(
            this.isEdit
              ? this.osService.actualizarUsuarioAprobador(payloadOS)
              : this.osService.crearUsuarioAprobador(payloadOS)
          );
          break;

        case 'N2':
          res = await lastValueFrom(this.configFlujoService.guardarAprobadorNivel2({
            idAprobadorN2: this.isEdit ? this.form.id! : undefined,
            ruc: usuario.ruc,
            documentoidentidad: this.form.documentoidentidad,
            nombreCompleto,
            rol: this.form.rol as 'GERENTE' | 'SUBGERENTE',
            orden: this.form.orden,
            disponible: this.form.disponible,
            usuario: usuarioCreacion
          }));
          break;
      }

      const resultado = this.parseResultado(res);
      if (resultado && (resultado.success === false || resultado.error)) {
        this.alertService.showAlertError('Error', resultado.mensaje || resultado.error || 'No se pudo crear el aprobador');
        return;
      }

      this.alertService.showAlertAcept('Éxito', resultado?.mensaje || 'Aprobador creado exitosamente', 'success');
      this.closeModal();
      this.cargarAprobadores();
    } catch (error: any) {
      console.error('Error al crear aprobador:', error);
      const msg = error?.error?.mensaje || error?.error?.message || 'Error al crear aprobador';
      this.alertService.showAlertError('Error', msg);
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  esEliminable(aprobador: any): boolean {
    // LEG es catálogo legacy sin endpoint de gestión
    return ['REQ', 'OC', 'OS', 'N2'].includes(aprobador?.tipo);
  }

  async eliminar(aprobador: any) {
    if (!this.esEliminable(aprobador)) {
      this.alertService.showAlertError('No disponible', 'Este aprobador se gestiona en su módulo correspondiente');
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      '¿Está seguro de eliminar este aprobador?',
      `${aprobador.usuarioNombre} — ${aprobador.flujoNombre}`,
      'warning'
    );

    if (!confirmacion) return;

    try {
      let res: any;
      switch (aprobador.tipo as ModuloAprobador) {
        case 'REQ':
          // Quitar el flag esAprobador conservando el resto de la fila
          res = await lastValueFrom(this.adminUsuariosService.actualizarUsuarioPorArea({
            idUsuarioArea: aprobador.id,
            ruc: aprobador.ruc,
            documentoidentidad: aprobador.documentoidentidad,
            nombreCompleto: aprobador.usuarioNombre,
            email: aprobador.correo,
            telefono: aprobador.telefono,
            idarea: aprobador.idarea,
            idsubarea: aprobador.idsubarea,
            rol: aprobador.rol,
            esJefeArea: aprobador.esJefeArea ?? false,
            esAprobador: false,
            activo: true
          }));
          break;
        case 'OC':  res = await lastValueFrom(this.ocService.eliminarUsuarioAprobador(aprobador.id)); break;
        case 'OS':  res = await lastValueFrom(this.osService.eliminarUsuarioAprobador(aprobador.id)); break;
        case 'N2':  res = await lastValueFrom(this.configFlujoService.eliminarAprobadorNivel2(aprobador.id)); break;
      }

      const resultado = this.parseResultado(res);
      if (resultado && (resultado.success === false || resultado.error)) {
        this.alertService.showAlertError('Error', resultado.mensaje || resultado.error || 'No se pudo eliminar el aprobador');
        return;
      }

      this.alertService.showAlertAcept('Éxito', 'Aprobador eliminado exitosamente', 'success');
      this.cargarAprobadores();
    } catch (error: any) {
      console.error('Error al eliminar aprobador:', error);
      const msg = error?.error?.mensaje || error?.error?.message || 'Error al eliminar aprobador';
      this.alertService.showAlertError('Error', msg);
    }
  }
}
