import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { AprobadoresService } from '@/app/modules/main/services/aprobadores.service';
import { Aprobador, Nivel, TipoDocumento } from 'src/app/shared/interfaces/Tables';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-aprobadores-mantenedor',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './aprobadores-mantenedor.component.html',
  styleUrls: ['./aprobadores-mantenedor.component.scss']
})
export class AprobadoresMantenedorComponent implements OnInit {
  form: FormGroup;
  niveles: Nivel[] = [];
  tipos: TipoDocumento[] = [];
  aprobadores: Aprobador[] = [];
  cargando = false;
  seleccionadoNivel: number | null = null;
  seleccionadoTipo: string = 'REQ';

  mensaje = '';

  constructor(private fb: FormBuilder, private svc: AprobadoresService) {
    this.form = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]],
      nombres: ['', [Validators.required]],
      correo: ['', [Validators.email]],
      idNivel: [null, [Validators.required]],
      idTipoDocumento: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarNiveles();
    this.cargarTiposDocumento();
  }

  cargarNiveles() {
    this.cargando = true;
    this.svc.listarNiveles().pipe(finalize(()=> this.cargando = false))
      .subscribe(res => this.niveles = res, err => this.handleError(err));
  }

  cargarTiposDocumento() {
    // Si no tienes endpoint, setea manualmente:
    this.tipos = [
      { idTipoDocumento: 1, codigo: 'REQ', descripcion: 'Requerimiento' },
      { idTipoDocumento: 2, codigo: 'OC', descripcion: 'Orden Compra' },
      { idTipoDocumento: 3, codigo: 'OS', descripcion: 'Orden Servicio' }
    ];
    // Si tienes endpoint, usa svc.listarTiposDocumento()
  }

  onSeleccionNivel(nivelId: number) {
    this.seleccionadoNivel = nivelId;
    // por defecto se usa el tipo seleccionado
    this.cargarAprobadores(nivelId, this.seleccionadoTipo);
  }

  onSeleccionTipo(codigo: string) {
    this.seleccionadoTipo = codigo;
    if (this.seleccionadoNivel) {
      this.cargarAprobadores(this.seleccionadoNivel, this.seleccionadoTipo);
    }
  }

  cargarAprobadores(idNivel: number, codigoDocumento: string) {
    this.cargando = true;
    this.svc.listarAprobadores(idNivel, codigoDocumento)
      .pipe(finalize(()=> this.cargando = false))
      .subscribe(list => this.aprobadores = list, err => this.handleError(err));
  }

  registrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const a: Aprobador = {
      dni: this.form.value.dni,
      nombres: this.form.value.nombres,
      correo: this.form.value.correo,
      idNivel: +this.form.value.idNivel,
      idTipoDocumento: +this.form.value.idTipoDocumento
    };
    this.cargando = true;
    this.svc.registrarAprobador(a)
      .pipe(finalize(()=> this.cargando = false))
      .subscribe(_ => {
        this.mensaje = 'Aprobador registrado';
        // refrescar lista si corresponde
        if (a.idNivel) this.cargarAprobadores(a.idNivel, this.seleccionadoTipo);
        this.form.reset();
      }, err => this.handleError(err));
  }

  confirmarDesactivar(item: Aprobador) {
    if (!confirm(`¿Desactivar a ${item.nombres} (${item.dni})?`)) return;
    this.cargando = true;
    this.svc.desactivarAprobador(item.idAprobador!)
      .pipe(finalize(()=> this.cargando = false))
      .subscribe(_ => {
        this.mensaje = 'Aprobador desactivado';
        if (this.seleccionadoNivel) this.cargarAprobadores(this.seleccionadoNivel, this.seleccionadoTipo);
      }, err => this.handleError(err));
  }

  private handleError(err: any) {
    console.error(err);
    this.mensaje = err?.message || 'Ocurrió un error';
  }
}
