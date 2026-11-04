import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AdminEmpresasService, Empresa } from '../../services/admin-empresas.service';
import { AdminPerfilesService } from '../../services/admin-perfiles.service';

export interface UsuarioLogistica {
  idUsuario: number;
  documentoidentidad: string | null;
  nombreCompleto: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  ruc: string | null;
  idUsuarioMaestro: number | null;
  fechaCreacion: string;
  usuarioCreacion: string | null;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
}

export interface ErpUsuario {
  nrodocumento: string;
  usuario: string;
  nombre: string;
}

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsuariosComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private empresasService = inject(AdminEmpresasService);
  private perfilesService = inject(AdminPerfilesService);
  private readonly apiBase = `${environment.baseUrl}/api/logistica/admin-logistica`;

  usuarios = signal<UsuarioLogistica[]>([]);
  empresas = signal<Empresa[]>([]);
  filtroRuc = signal('');
  empresasPorRuc = computed(() => new Map(this.empresas().map(e => [e.ruc, e.razonSocial])));
  usuariosFiltrados = computed(() => {
    const ruc = this.filtroRuc();
    const lista = this.usuarios();
    if (!ruc) return lista;
    if (ruc === '__SIN__') return lista.filter(u => !u.ruc);
    return lista.filter(u => u.ruc === ruc);
  });
  loading = signal(false);
  guardando = signal(false);
  showModal = signal(false);
  isEdit = signal(false);
  errorMsg = signal<string | null>(null);

  erpResultados = signal<ErpUsuario[]>([]);
  erpBuscando = signal(false);
  erpSeleccionado = signal<ErpUsuario | null>(null);
  private erpSearch$ = new Subject<string>();

  // Perfiles del usuario
  showPerfilesModal = signal(false);
  perfilesCatalogo = signal<any[]>([]);
  perfilesAsignados = signal<Set<number>>(new Set());
  usuarioPerfilSel = signal<UsuarioLogistica | null>(null);
  procesandoPerfil = signal(false);

  adminUser = JSON.parse(localStorage.getItem('ADMIN_USER') || '{}');
  private get actor(): string {
    return this.adminUser?.documentoidentidad || this.adminUser?.usuario || 'ADMIN';
  }

  form: FormGroup = this.fb.group({
    idUsuario:          [null],
    documentoidentidad: ['', Validators.required],
    nombreCompleto:     ['', Validators.required],
    email:              ['', Validators.email],
    telefono:           [''],
    ruc:                [''],
    activo:             [true],
  });

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarEmpresas();
    this.cargarPerfiles();
    this.erpSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.trim().length < 3) { this.erpResultados.set([]); return of(null); }
        this.erpBuscando.set(true);
        return this.http.get<ErpUsuario[]>(`${this.apiBase}/usuarios/buscar-erp?q=${encodeURIComponent(q.trim())}`);
      })
    ).subscribe({
      next: (res) => {
        if (res) this.erpResultados.set(Array.isArray(res) ? res : []);
        this.erpBuscando.set(false);
        this.cdr.markForCheck();
      },
      error: () => { this.erpBuscando.set(false); this.erpResultados.set([]); this.cdr.markForCheck(); }
    });
  }

  cargarUsuarios(): void {
    this.loading.set(true);
    this.http.get<UsuarioLogistica[]>(`${this.apiBase}/logistica-usuarios`).subscribe({
      next: (res) => { this.usuarios.set(Array.isArray(res) ? res : []); this.loading.set(false); this.cdr.markForCheck(); },
      error: () => { this.loading.set(false); this.errorMsg.set('Error al cargar usuarios'); this.cdr.markForCheck(); }
    });
  }

  cargarEmpresas(): void {
    this.empresasService.listarEmpresas().subscribe({
      next: (res) => {
        let lista: Empresa[] = [];
        if (res?.resultado) {
          try { lista = JSON.parse(res.resultado); } catch { lista = res.resultado; }
        } else if (Array.isArray(res)) {
          lista = res;
        }
        this.empresas.set(lista || []);
        this.cdr.markForCheck();
      },
      error: () => { this.empresas.set([]); this.cdr.markForCheck(); }
    });
  }

  nombreEmpresa(ruc: string | null): string {
    if (!ruc) return '—';
    return this.empresasPorRuc().get(ruc) ?? ruc;
  }

  /* ============ PERFILES DEL USUARIO ============ */

  cargarPerfiles(): void {
    this.perfilesService.listarPerfiles({}).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.resultado ? JSON.parse(res.resultado) : []);
        this.perfilesCatalogo.set((data || []).filter((p: any) => p.activo));
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  abrirPerfiles(u: UsuarioLogistica): void {
    this.usuarioPerfilSel.set(u);
    this.perfilesAsignados.set(new Set());
    this.errorMsg.set(null);
    this.showPerfilesModal.set(true);

    this.perfilesService.listarPerfilesUsuario({
      ruc: u.ruc, nrodocumento: u.documentoidentidad
    }).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.resultado ? JSON.parse(res.resultado) : []);
        this.perfilesAsignados.set(new Set(
          (data || []).filter((p: any) => p.activo).map((p: any) => p.idperfil)
        ));
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  cerrarPerfiles(): void {
    this.showPerfilesModal.set(false);
    this.usuarioPerfilSel.set(null);
  }

  tienePerfil(idperfil: number): boolean {
    return this.perfilesAsignados().has(idperfil);
  }

  async togglePerfilUsuario(p: any, checked: boolean): Promise<void> {
    const u = this.usuarioPerfilSel();
    if (!u || this.procesandoPerfil()) return;
    this.procesandoPerfil.set(true);
    try {
      const r = checked
        ? await this.perfilesService.asignarPerfilUsuario({
            ruc: u.ruc, nrodocumento: u.documentoidentidad,
            idperfil: p.idperfil, usuarioAsigna: this.actor
          })
        : await this.perfilesService.quitarPerfilUsuario({
            ruc: u.ruc, nrodocumento: u.documentoidentidad,
            idperfil: p.idperfil, usuarioModifica: this.actor
          });

      if (r?.exito === false) {
        this.errorMsg.set(r.error || 'Error al actualizar perfil');
      } else {
        const s = new Set(this.perfilesAsignados());
        checked ? s.add(p.idperfil) : s.delete(p.idperfil);
        this.perfilesAsignados.set(s);
      }
    } catch {
      this.errorMsg.set('Error al actualizar perfil');
    } finally {
      this.procesandoPerfil.set(false);
      this.cdr.markForCheck();
    }
  }

  onBuscarErp(event: Event): void {
    this.erpSearch$.next((event.target as HTMLInputElement).value);
  }

  seleccionarErp(erp: ErpUsuario): void {
    this.erpSeleccionado.set(erp);
    this.erpResultados.set([]);
    this.form.patchValue({
      documentoidentidad: erp.nrodocumento,
      nombreCompleto:     erp.nombre,
    });
    this.cdr.markForCheck();
  }

  abrirCrear(): void {
    this.isEdit.set(false);
    this.erpSeleccionado.set(null);
    this.erpResultados.set([]);
    this.errorMsg.set(null);
    this.form.reset({ activo: true });
    this.showModal.set(true);
  }

  abrirEditar(u: UsuarioLogistica): void {
    this.isEdit.set(true);
    this.erpSeleccionado.set(null);
    this.erpResultados.set([]);
    this.errorMsg.set(null);
    this.form.patchValue({
      idUsuario:          u.idUsuario,
      documentoidentidad: u.documentoidentidad,
      nombreCompleto:     u.nombreCompleto,
      email:              u.email,
      telefono:           u.telefono,
      ruc:                u.ruc,
      activo:             u.activo,
    });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
    this.erpSeleccionado.set(null);
    this.erpResultados.set([]);
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorMsg.set(null);

    if (this.isEdit()) {
      const { idUsuario, nombreCompleto, email, telefono, activo } = this.form.value;
      this.http.put(`${this.apiBase}/logistica-usuarios/${idUsuario}`, {
        nombreCompleto, email, telefono, activo, usuarioModificacion: 'SISTEMA'
      }).subscribe({
        next: () => { this.guardando.set(false); this.cerrarModal(); this.cargarUsuarios(); },
        error: (err) => { this.guardando.set(false); this.errorMsg.set(err.error?.mensaje || 'Error al actualizar'); this.cdr.markForCheck(); }
      });
    } else {
      const { documentoidentidad, nombreCompleto, email, telefono, ruc } = this.form.value;
      this.http.post(`${this.apiBase}/logistica-usuarios`, {
        documentoidentidad, nombreCompleto, email, telefono, ruc: ruc || null, usuarioCreacion: 'SISTEMA'
      }).subscribe({
        next: () => { this.guardando.set(false); this.cerrarModal(); this.cargarUsuarios(); },
        error: (err) => { this.guardando.set(false); this.errorMsg.set(err.error?.mensaje || 'Error al crear usuario'); this.cdr.markForCheck(); }
      });
    }
  }

  toggleEstado(u: UsuarioLogistica): void {
    const nuevoActivo = !u.activo;
    this.http.patch(`${this.apiBase}/logistica-usuarios/${u.idUsuario}/estado`, {
      activo: nuevoActivo, usuarioModificacion: 'SISTEMA'
    }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => alert(err.error?.mensaje || 'Error al cambiar estado')
    });
  }
}