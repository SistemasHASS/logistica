import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { environment } from 'src/environments/environment';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsuariosComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private readonly apiBase = `${environment.baseUrl}/api/logistica/admin-logistica`;

  usuarios = signal<UsuarioLogistica[]>([]);
  loading = signal(false);
  guardando = signal(false);
  showModal = signal(false);
  isEdit = signal(false);
  errorMsg = signal<string | null>(null);

  erpResultados = signal<ErpUsuario[]>([]);
  erpBuscando = signal(false);
  erpSeleccionado = signal<ErpUsuario | null>(null);
  private erpSearch$ = new Subject<string>();

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
        documentoidentidad, nombreCompleto, email, telefono, ruc, usuarioCreacion: 'SISTEMA'
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