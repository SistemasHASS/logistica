import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

export interface EmpresaBD {
  id?: number;
  ruc: string;
  razonSocial: string;
  direccion: string;
  telefono: string;
  email: string;
  logoBase64: string;
  correoEnvio: string;
  correoNombre: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSeguro: boolean;
  activo?: boolean;
}

const DEFAULT: EmpresaBD = {
  ruc: '', razonSocial: '', direccion: '', telefono: '', email: '',
  logoBase64: '', correoEnvio: '', correoNombre: '',
  smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', smtpSeguro: true,
};

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empresa.component.html',
  styleUrl: './empresa.component.scss',
})
export class EmpresaComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  empresa    = signal<EmpresaBD>({ ...DEFAULT });
  empresas   = signal<EmpresaBD[]>([]);
  cargando   = signal(false);
  guardando  = signal(false);
  alertMsg   = signal('');
  alertTipo  = signal<'success' | 'danger'>('success');
  tabActivo  = signal<'datos' | 'smtp'>('datos');
  modoNuevo  = signal(false);

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    const rucActual = this.empresa().ruc;
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-empresas`, {})
      );
      const arr: EmpresaBD[] = Array.isArray(res) ? res : [];
      this.empresas.set(arr);
      if (arr.length > 0) {
        // Mantener la selección actual por RUC, sino la primera
        const seleccion = (rucActual ? arr.find(e => e.ruc === rucActual) : null)
          ?? arr.find(e => e.activo)
          ?? arr[0];
        this.empresa.set({ ...DEFAULT, ...seleccion });
      }
    } catch {
      this.alerta('Error al cargar empresas', 'danger');
    } finally {
      this.cargando.set(false);
    }
  }

  seleccionar(emp: EmpresaBD) {
    this.empresa.set({ ...DEFAULT, ...emp });
    this.modoNuevo.set(false);
  }

  nuevaEmpresa() {
    this.empresa.set({ ...DEFAULT });
    this.modoNuevo.set(true);
  }

  patch(partial: Partial<EmpresaBD>) {
    this.empresa.update(e => ({ ...e, ...partial }));
  }

  onLogoChange(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.patch({ logoBase64: reader.result as string });
    reader.readAsDataURL(file);
  }

  eliminarLogo() {
    this.patch({ logoBase64: '' });
  }

  async guardar() {
    const emp = this.empresa();
    if (!emp.razonSocial?.trim() || !emp.ruc?.trim()) {
      this.alerta('RUC y Razón Social son obligatorios', 'danger');
      return;
    }
    this.guardando.set(true);
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-config-empresa`, emp)
      );
      // El SP retorna la fila completa guardada (incluye logoBase64 de BD)
      const guardada: EmpresaBD = {
        ...DEFAULT,
        ...(res && typeof res === 'object' ? res : {}),
      };
      this.empresa.set(guardada);
      this.modoNuevo.set(false);
      this.alerta('Empresa guardada correctamente');
      // Recargar lista y reseleccionar la empresa guardada por RUC
      await this.cargar();
      const rucGuardado = guardada.ruc;
      const match = this.empresas().find(e => e.ruc === rucGuardado);
      if (match) this.empresa.set(match);
    } catch {
      this.alerta('Error al guardar empresa', 'danger');
    } finally {
      this.guardando.set(false);
    }
  }

  private alerta(msg: string, tipo: 'success' | 'danger' = 'success') {
    this.alertMsg.set(msg);
    this.alertTipo.set(tipo);
    setTimeout(() => this.alertMsg.set(''), 3500);
  }
}
