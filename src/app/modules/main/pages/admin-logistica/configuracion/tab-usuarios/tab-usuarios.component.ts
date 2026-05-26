import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { UsuariosService } from '@/app/modules/admin-logistica/tabs/usuarios/services/usuarios.service';
import { AdminLogisticaAuthService } from '@/app/modules/admin-logistica/auth/services/admin-logistica-auth.service';
import { UsuarioLogistica } from '@/app/modules/admin-logistica/tabs/usuarios/usuarios.component';
import { environment } from '@/environments/environment';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface ErpUsuario { nrodocumento: string; usuario: string; nombre: string; clave: string; }
interface EmpresaItem { ruc: string; razonSocial: string; }

@Component({
  selector: 'app-tab-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tab-usuarios.component.html',
  styleUrl: './tab-usuarios.component.scss',
})
export class TabUsuariosComponent implements OnInit {
  private dexieService = inject(DexieService);
  private usuariosSvc  = inject(UsuariosService);
  private authService  = inject(AdminLogisticaAuthService);
  private http         = inject(HttpClient);
  private fb           = inject(FormBuilder);
  private baseUrl      = environment.baseUrl;

  usuarioActual:    any = null;
  usuarios:         UsuarioLogistica[] = [];
  empresas:         EmpresaItem[] = [];
  erpResultados:    ErpUsuario[] = [];
  erpSeleccionado:  ErpUsuario | null = null;
  roles:            { id: string; nombre: string }[] = [];

  loading     = false;
  guardando   = false;
  buscandoErp = false;
  modalVisible = false;
  isEditing   = false;
  errorMsg    = '';
  successMsg  = '';
  errorErp    = '';
  busquedaErp = '';

  form: FormGroup = this.fb.group({
    id:           [null],
    ruc:          ['', [Validators.required]],
    nrodocumento: ['', [Validators.required]],
    usuario:      ['', [Validators.required]],
    nombre:       ['', [Validators.required]],
    email:        ['', [Validators.email]],
    idrol:        ['', [Validators.required]],
    activo:       [true],
  });

  private busquedaSubject = new Subject<string>();

  async ngOnInit() {
    this.usuarioActual = await this.dexieService.showUsuario();
    this.roles = this.authService.getAvailableRoles();
    this.cargarUsuarios();
    this.cargarEmpresas();

    this.busquedaSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe(q => {
      if (q.trim().length >= 3) this.ejecutarBusquedaErp(q.trim());
      else { this.erpResultados = []; this.errorErp = ''; }
    });
  }

  private cargarUsuarios() {
    this.loading = true;
    this.usuariosSvc.getUsuarios().subscribe({
      next: (data) => {
        const visibleUsers = this.authService.getVisibleUsers(data);
        // Deduplicar por usuario (DNI) - mantener el más reciente (mayor id)
        const uniqueUsers = visibleUsers.reduce((acc, user) => {
          const existing = acc.get(user.usuario);
          if (!existing || user.id > existing.id) {
            acc.set(user.usuario, user);
          }
          return acc;
        }, new Map<string, any>());
        this.usuarios = Array.from(uniqueUsers.values());
        this.loading = false;
      },
      error: () => { this.errorMsg = 'Error al cargar usuarios'; this.loading = false; }
    });
  }

  private cargarEmpresas() {
    this.http.post<EmpresaItem[]>(`${this.baseUrl}/api/logistica/listar-empresas`, {}).subscribe({
      next: (data) => { this.empresas = data ?? []; },
      error: () => {}
    });
  }

  onBusquedaErpInput(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    this.busquedaErp = q;
    this.busquedaSubject.next(q);
  }

  buscarManual() {
    const q = this.busquedaErp.trim();
    if (q.length < 3) { this.errorErp = 'Ingrese al menos 3 caracteres para buscar'; return; }
    this.ejecutarBusquedaErp(q);
  }

  private ejecutarBusquedaErp(q: string) {
    this.buscandoErp = true;
    this.errorErp = '';
    this.erpResultados = [];
    this.usuariosSvc.buscarEnErp(q).subscribe({
      next: (data) => { this.erpResultados = data; this.buscandoErp = false; },
      error: (err) => {
        this.errorErp = err.status === 404
          ? 'No se encontraron usuarios activos con ese criterio en el ERP'
          : 'Error al consultar el sistema ERP';
        this.buscandoErp = false;
      }
    });
  }

  seleccionarErp(u: ErpUsuario) {
    this.erpSeleccionado = u;
    this.erpResultados = [];
    this.busquedaErp = `${u.nrodocumento} — ${u.nombre}`;
    this.form.patchValue({ nrodocumento: u.nrodocumento, usuario: u.usuario, nombre: u.nombre });
  }

  abrirCrear() {
    console.log('🔵 abrirCrear() llamado - modalVisible antes:', this.modalVisible);
    this.isEditing = false;
    this.form.reset({ activo: true, idrol: '', ruc: '' });
    this.erpResultados = [];
    this.erpSeleccionado = null;
    this.busquedaErp = '';
    this.errorErp = '';
    this.errorMsg = '';
    this.modalVisible = true;
    console.log('🔵 abrirCrear() completado - modalVisible después:', this.modalVisible);
  }

  abrirEditar(u: UsuarioLogistica) {
    this.isEditing = true;
    this.form.patchValue({ id: u.id, usuario: u.usuario, nombre: u.nombre, email: u.email, idrol: u.idrol, activo: u.activo });
    this.erpResultados = [];
    this.erpSeleccionado = null;
    this.errorErp = '';
    this.errorMsg = '';
    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.isEditing && !this.erpSeleccionado) {
      this.errorErp = 'Debe seleccionar un usuario del ERP antes de continuar';
      return;
    }

    this.guardando = true;
    const data = this.form.value;
    const rolNombre = this.roles.find(r => r.id === data.idrol)?.nombre ?? data.idrol;

    if (this.isEditing) {
      const payload = { ...data, rol: rolNombre, actualizadoPor: this.usuarioActual?.usuario ?? 'SYSTEM' };
      this.usuariosSvc.actualizarUsuario(data.id, payload).subscribe({
        next: () => { this.guardando = false; this.cerrarModal(); this.cargarUsuarios(); this.mostrarExito('Usuario actualizado correctamente'); },
        error: (err) => { this.guardando = false; this.errorMsg = err.error?.mensaje ?? 'Error al actualizar'; }
      });
    } else {
      const payload = {
        ruc:          data.ruc,
        nrodocumento: data.nrodocumento,
        usuario:      data.usuario,
        nombre:       data.nombre,
        email:        data.email || null,
        idrol:        data.idrol,
        rol:          rolNombre,
        idEmpresa:    data.ruc,
        creadoPor:    this.usuarioActual?.usuario ?? 'SYSTEM',
      };
      this.usuariosSvc.crearUsuario(payload).subscribe({
        next: () => { this.guardando = false; this.cerrarModal(); this.cargarUsuarios(); this.mostrarExito('Usuario creado correctamente'); },
        error: (err) => { this.guardando = false; this.errorMsg = err.error?.mensaje ?? 'Error al crear usuario'; }
      });
    }
  }

  toggleActivo(u: UsuarioLogistica) {
    this.usuariosSvc.cambiarEstado(u.id, !u.activo).subscribe({
      next: () => this.cargarUsuarios(),
      error: () => { this.errorMsg = 'Error al cambiar estado'; }
    });
  }

  private mostrarExito(msg: string) {
    this.successMsg = msg;
    setTimeout(() => { this.successMsg = ''; }, 3500);
  }

  getRolNombre(idrol: string): string {
    return this.roles.find(r => r.id === idrol)?.nombre ?? idrol;
  }
}
