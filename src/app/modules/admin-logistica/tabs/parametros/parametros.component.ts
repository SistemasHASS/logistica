import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ParametrosService, ParametrosConfig } from './services/parametros.service';

@Component({
  selector: 'app-parametros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, CardModule],
  templateUrl: './parametros.component.html',
  styleUrl: './parametros.component.scss',
})
export class ParametrosComponent implements OnInit {
  private parametrosService = inject(ParametrosService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  saving = signal(false);
  message = signal('');
  error = signal('');

  form: FormGroup = this.fb.group({
    // Parámetros de aprobación
    montoLimiteDirecto: [0],
    requiereAprobacionMonto: [5000],
    diasMaximoAprobacion: [3],
    
    // Parámetros de compra
    diasEntregaDefault: [7],
    diasCreditoDefault: [30],
    monedaDefault: ['PEN'],
    
    // Parámetros de sistema
    horarioCorte: ['18:00'],
    enviarNotificaciones: [true],
    consolidacionAutomatica: [false],
    
    // Límites
    maximoItemsPorReq: [50],
    maximoOCBorrador: [10]
  });

  monedas = [
    { codigo: 'PEN', nombre: 'Soles (S/)' },
    { codigo: 'USD', nombre: 'Dólares ($)' },
    { codigo: 'EUR', nombre: 'Euros (€)' },
  ];

  ngOnInit() {
    this.cargarParametros();
  }

  private cargarParametros() {
    this.loading.set(true);
    this.parametrosService.getParametros().subscribe({
      next: (config) => {
        if (config) {
          this.form.patchValue(config);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar parámetros');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  save() {
    this.saving.set(true);
    this.message.set('');
    this.error.set('');

    const data: ParametrosConfig = this.form.value;

    this.parametrosService.saveParametros(data).subscribe({
      next: () => {
        this.message.set('Parámetros guardados exitosamente');
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set('Error al guardar parámetros');
        this.saving.set(false);
        console.error(err);
      }
    });
  }

  reset() {
    this.form.reset({
      montoLimiteDirecto: 0,
      requiereAprobacionMonto: 5000,
      diasMaximoAprobacion: 3,
      diasEntregaDefault: 7,
      diasCreditoDefault: 30,
      monedaDefault: 'PEN',
      horarioCorte: '18:00',
      enviarNotificaciones: true,
      consolidacionAutomatica: false,
      maximoItemsPorReq: 50,
      maximoOCBorrador: 10
    });
  }
}
