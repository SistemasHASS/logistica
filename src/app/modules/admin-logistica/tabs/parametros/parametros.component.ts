import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ParametrosService, ParametrosConfig, Parametro } from './services/parametros.service';

const PARAMETROS_NUMERICOS = [
  'montoLimiteDirecto',
  'requiereAprobacionMonto',
  'diasMaximoAprobacion',
  'diasEntregaDefault',
  'diasCreditoDefault',
  'maximoItemsPorReq',
  'maximoOCBorrador',
];

const PARAMETROS_BOOLEANOS = ['enviarNotificaciones', 'consolidacionAutomatica'];

@Component({
  selector: 'app-parametros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, CardModule, TableModule, TooltipModule],
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

  parametros = signal<Parametro[]>([]);
  parametrosOriginales = signal<Parametro[]>([]);
  editandoId = signal<string | null>(null);
  valorEdicion = signal('');

  form: FormGroup = this.fb.group({
    montoLimiteDirecto: [0],
    requiereAprobacionMonto: [5000],
    diasMaximoAprobacion: [3],
    diasEntregaDefault: [7],
    diasCreditoDefault: [30],
    monedaDefault: ['PEN'],
    horarioCorte: ['18:00'],
    enviarNotificaciones: [true],
    consolidacionAutomatica: [false],
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
    this.form.valueChanges.subscribe(value => {
      this.actualizarParametrosDesdeConfig(value as ParametrosConfig);
    });
  }

  private cargarParametros() {
    this.loading.set(true);
    this.parametrosService.getParametros().subscribe({
      next: (lista) => {
        this.parametros.set(lista);
        this.parametrosOriginales.set(lista.map(p => ({ ...p })));
        this.form.patchValue(this.listaAConfig(lista), { emitEvent: false });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar parámetros');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  private listaAConfig(lista: Parametro[]): ParametrosConfig {
    const get = (key: string, defaultValue: any) => {
      const p = lista.find(x => x.parametro === key);
      return p ? this.convertirValor(key, p.valor) : defaultValue;
    };

    return {
      montoLimiteDirecto: get('montoLimiteDirecto', 0),
      requiereAprobacionMonto: get('requiereAprobacionMonto', 5000),
      diasMaximoAprobacion: get('diasMaximoAprobacion', 3),
      diasEntregaDefault: get('diasEntregaDefault', 7),
      diasCreditoDefault: get('diasCreditoDefault', 30),
      monedaDefault: get('monedaDefault', 'PEN'),
      horarioCorte: get('horarioCorte', '18:00'),
      enviarNotificaciones: get('enviarNotificaciones', true),
      consolidacionAutomatica: get('consolidacionAutomatica', false),
      maximoItemsPorReq: get('maximoItemsPorReq', 50),
      maximoOCBorrador: get('maximoOCBorrador', 10)
    };
  }

  private convertirValor(key: string, valor: string): any {
    if (PARAMETROS_NUMERICOS.includes(key)) {
      const n = Number(valor);
      return isNaN(n) ? 0 : n;
    }
    if (PARAMETROS_BOOLEANOS.includes(key)) {
      return valor === '1' || valor.toLowerCase() === 'true';
    }
    return valor;
  }

  save() {
    this.saving.set(true);
    this.message.set('');
    this.error.set('');

    const data = this.parametros().reduce((acc, p) => {
      acc[p.parametro] = p.valor;
      return acc;
    }, {} as Record<string, string>);

    this.parametrosService.saveParametros(data).subscribe({
      next: () => {
        this.message.set('Parámetros guardados exitosamente');
        this.saving.set(false);
        this.parametrosOriginales.set(this.parametros().map(p => ({ ...p })));
      },
      error: (err) => {
        this.error.set('Error al guardar parámetros');
        this.saving.set(false);
        console.error(err);
      }
    });
  }

  reset() {
    const originales = this.parametrosOriginales().map(p => ({ ...p }));
    this.parametros.set(originales);
    this.form.reset(this.listaAConfig(originales), { emitEvent: false });
  }

  editarParametro(p: Parametro) {
    this.editandoId.set(p.parametro);
    this.valorEdicion.set(p.valor);
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.valorEdicion.set('');
  }

  guardarParametro(p: Parametro) {
    this.actualizarValor(p.parametro, this.valorEdicion());
    this.editandoId.set(null);
    this.valorEdicion.set('');
  }

  cambiarValorCheckbox(p: Parametro, checked: boolean) {
    this.actualizarValor(p.parametro, checked ? '1' : '0');
  }

  cambiarValorSelect(p: Parametro, valor: string) {
    this.actualizarValor(p.parametro, valor);
  }

  private actualizarValor(parametro: string, valor: string) {
    this.parametros.update(lista => lista.map(p =>
      p.parametro === parametro ? { ...p, valor } : p
    ));
    this.form.patchValue(this.listaAConfig(this.parametros()), { emitEvent: false });
  }

  tipoInput(parametro: string): 'number' | 'text' | 'time' | 'select' | 'checkbox' {
    if (PARAMETROS_NUMERICOS.includes(parametro)) return 'number';
    if (parametro === 'horarioCorte') return 'time';
    if (parametro === 'monedaDefault') return 'select';
    if (PARAMETROS_BOOLEANOS.includes(parametro)) return 'checkbox';
    return 'text';
  }

  esBooleano(parametro: string): boolean {
    return this.tipoInput(parametro) === 'checkbox';
  }

  valorBooleano(p: Parametro): boolean {
    return p.valor === '1' || p.valor.toLowerCase() === 'true';
  }

  monedaNombre(codigo: string): string {
    return this.monedas.find(m => m.codigo === codigo)?.nombre ?? codigo;
  }

  private actualizarParametrosDesdeConfig(config: ParametrosConfig) {
    this.parametros.update(lista => lista.map(p => {
      const valor = this.configValueToString(p.parametro, config);
      return valor !== undefined ? { ...p, valor } : p;
    }));
  }

  private configValueToString(parametro: string, config: ParametrosConfig): string | undefined {
    const map: Record<string, any> = config as any;
    if (!(parametro in map)) return undefined;
    const value = map[parametro];
    if (typeof value === 'boolean') return value ? '1' : '0';
    return String(value ?? '');
  }
}
