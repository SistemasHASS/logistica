import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AprobacionOCService } from '@/app/services/aprobacion-oc.service';
import { AprobacionOSService } from '@/app/services/aprobacion-os.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-aprobadores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule, DialogModule, TagModule],
  templateUrl: './aprobadores.component.html',
  styleUrl: './aprobadores.component.scss',
})
export class AprobadoresComponent implements OnInit {
  private ocSvc = inject(AprobacionOCService);
  private osSvc = inject(AprobacionOSService);
  private authSvc = inject(AdminLogisticaAuthService);

  tipoOrden = signal<'OC' | 'OS'>('OC');

  usuariosOC = signal<any[]>([]);
  flujosOC = signal<any[]>([]);
  usuariosOS = signal<any[]>([]);
  flujosOS = signal<any[]>([]);

  loadingUsuarios = signal(false);
  loadingFlujos = signal(false);
  guardando = signal(false);

  modalUsuario = signal(false);
  modalFlujo = signal(false);
  isEditingUsuario = signal(false);
  isEditingFlujo = signal(false);

  usuarioForm: any = null;
  flujoForm: any = null;

  rolesAprobador = [
    { label: 'Finanzas', value: 'FINANZAS' },
    { label: 'Jefatura de Logística', value: 'JLOLOGIST' },
    { label: 'Jefe de Logística', value: 'LOLOGIST' },
    { label: 'Gerencia', value: 'GERENTE' },
  ];

  get usuario() {
    return this.authSvc.currentUser();
  }

  ngOnInit(): void {
    this.cargarTodo();
  }

  cambiarTipoOrden(tipo: 'OC' | 'OS') {
    if (this.tipoOrden() === tipo) return;
    this.tipoOrden.set(tipo);
    this.cargarTodo();
  }

  cargarTodo() {
    this.cargarUsuarios();
    this.cargarFlujos();
  }

  async cargarUsuarios() {
    this.loadingUsuarios.set(true);
    try {
      if (this.tipoOrden() === 'OC') {
        const res = await lastValueFrom(this.ocSvc.listarUsuariosAprobadores());
        this.usuariosOC.set(this.toArray(res));
      } else {
        const res = await lastValueFrom(this.osSvc.listarUsuariosAprobadores());
        this.usuariosOS.set(this.toArray(res));
      }
    } catch {
      alert('Error al cargar usuarios aprobadores');
    } finally {
      this.loadingUsuarios.set(false);
    }
  }

  async cargarFlujos() {
    this.loadingFlujos.set(true);
    try {
      if (this.tipoOrden() === 'OC') {
        const res = await lastValueFrom(this.ocSvc.listarFlujos());
        this.flujosOC.set(this.toArray(res));
      } else {
        const res = await lastValueFrom(this.osSvc.listarFlujosAprobacion());
        this.flujosOS.set(this.toArray(res));
      }
    } catch {
      alert('Error al cargar flujos de aprobación');
    } finally {
      this.loadingFlujos.set(false);
    }
  }

  usuariosActuales(): any[] {
    return this.tipoOrden() === 'OC' ? this.usuariosOC() : this.usuariosOS();
  }

  flujosActuales(): any[] {
    return this.tipoOrden() === 'OC' ? this.flujosOC() : this.flujosOS();
  }

  // =============================================
  // USUARIOS APROBADORES
  // =============================================

  nuevoUsuario() {
    this.isEditingUsuario.set(false);
    this.usuarioForm = {
      idUsuarioAprobador: null,
      documentoIdentidad: '',
      nombreCompleto: '',
      email: '',
      rol: '',
      montoMinimo: 0,
      montoMaximo: 0,
      nivel: 1,
      activo: true,
    };
    this.modalUsuario.set(true);
  }

  editarUsuario(u: any) {
    this.isEditingUsuario.set(true);
    this.usuarioForm = { ...u };
    this.modalUsuario.set(true);
  }

  async guardarUsuario() {
    const f = this.usuarioForm;
    if (!f?.documentoIdentidad || !f?.nombreCompleto || !f?.rol) {
      alert('Documento de identidad, nombre completo y rol son obligatorios.');
      return;
    }

    this.guardando.set(true);
    try {
      const payload = { ...f, usuarioCreacion: this.usuario?.usuario || '' };
      let respuesta: any;

      if (this.tipoOrden() === 'OC') {
        respuesta = await lastValueFrom(this.ocSvc.guardarUsuarioAprobador(payload));
      } else {
        respuesta = f.idUsuarioAprobador
          ? await lastValueFrom(this.osSvc.actualizarUsuarioAprobador(payload))
          : await lastValueFrom(this.osSvc.crearUsuarioAprobador(payload));
      }

      if (respuesta?.status === 'success' || respuesta?.success) {
        this.cerrarModalUsuario();
        await this.cargarUsuarios();
      } else {
        alert(respuesta?.mensaje || 'Error al guardar usuario aprobador');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al guardar usuario aprobador');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminarUsuario(u: any) {
    if (!confirm(`¿Desactivar al aprobador ${u.nombreCompleto}?`)) return;

    try {
      const respuesta = this.tipoOrden() === 'OC'
        ? await lastValueFrom(this.ocSvc.eliminarUsuarioAprobador(u.idUsuarioAprobador))
        : await lastValueFrom(this.osSvc.eliminarUsuarioAprobador(u.idUsuarioAprobador));

      if (respuesta?.status === 'success' || respuesta?.success) {
        await this.cargarUsuarios();
      } else {
        alert(respuesta?.mensaje || 'Error al eliminar usuario aprobador');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar usuario aprobador');
    }
  }

  cerrarModalUsuario() {
    this.modalUsuario.set(false);
    this.usuarioForm = null;
  }

  // =============================================
  // FLUJOS DE APROBACIÓN
  // =============================================

  nuevoFlujo() {
    this.isEditingFlujo.set(false);
    this.flujoForm = {
      idFlujoAprobacion: null,
      nombre: '',
      descripcion: '',
      montoMinimo: 0,
      montoMaximo: 0,
      niveles: 1,
      activo: true,
    };
    this.modalFlujo.set(true);
  }

  editarFlujo(f: any) {
    this.isEditingFlujo.set(true);
    this.flujoForm = { ...f };
    this.modalFlujo.set(true);
  }

  async guardarFlujo() {
    const f = this.flujoForm;
    if (!f?.nombre) {
      alert('Debe seleccionar el rol aprobador del flujo.');
      return;
    }

    this.guardando.set(true);
    try {
      const payload = { ...f, usuarioCreacion: this.usuario?.usuario || '' };
      let respuesta: any;

      if (this.tipoOrden() === 'OC') {
        respuesta = f.idFlujoAprobacion
          ? await lastValueFrom(this.ocSvc.actualizarFlujoAprobacion(payload))
          : await lastValueFrom(this.ocSvc.crearFlujoAprobacion(payload));
      } else {
        respuesta = f.idFlujoAprobacion
          ? await lastValueFrom(this.osSvc.actualizarFlujoAprobacion(payload))
          : await lastValueFrom(this.osSvc.crearFlujoAprobacion(payload));
      }

      if (respuesta?.status === 'success' || respuesta?.success) {
        this.cerrarModalFlujo();
        await this.cargarFlujos();
      } else {
        alert(respuesta?.mensaje || 'Error al guardar flujo de aprobación');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al guardar flujo de aprobación');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminarFlujo(f: any) {
    if (!confirm(`¿Desactivar el flujo "${f.nombre}"?`)) return;

    try {
      const respuesta = this.tipoOrden() === 'OC'
        ? await lastValueFrom(this.ocSvc.eliminarFlujo(f.idFlujoAprobacion))
        : await lastValueFrom(this.osSvc.eliminarFlujoAprobacion(f.idFlujoAprobacion));

      if (respuesta?.status === 'success' || respuesta?.success) {
        await this.cargarFlujos();
      } else {
        alert(respuesta?.mensaje || 'Error al eliminar flujo');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar flujo');
    }
  }

  cerrarModalFlujo() {
    this.modalFlujo.set(false);
    this.flujoForm = null;
  }

  // =============================================
  // UTILIDADES
  // =============================================

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto ?? 0);
  }

  nombreRol(rol: string): string {
    return this.rolesAprobador.find(r => r.value === rol)?.label || rol;
  }

  private toArray(res: any): any[] {
    if (!res) return [];
    let data = res;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return []; }
    }
    if (!Array.isArray(data) && data?.resultado) {
      data = typeof data.resultado === 'string' ? JSON.parse(data.resultado) : data.resultado;
    }
    if (Array.isArray(data) && data.length === 1 && Array.isArray(data[0])) {
      data = data[0];
    }
    return Array.isArray(data) ? data : [];
  }
}
