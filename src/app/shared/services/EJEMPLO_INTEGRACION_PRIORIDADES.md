# Guía de Integración: Sistema de Prioridades con Plazos de Entrega

## Resumen

Este sistema permite mantener los valores que Spring espera (1, 2, 3) en el UI, mientras internamente se calcula la lógica de plazos de entrega según el tipo de requerimiento (COMPRA vs CONSUMO).

## Estructura de Archivos Creados

```
src/app/shared/
├── interfaces/
│   └── PrioridadRequerimiento.ts    # Interfaces y mapeos de prioridades
└── services/
    └── prioridad-requerimiento.service.ts  # Lógica de cálculo
```

---

## Paso 1: Importar el Servicio en RequerimientosComponent

```typescript
import { PrioridadRequerimientoService } from '@/app/shared/services/prioridad-requerimiento.service';
import { SubTipoCompra, ResultadoPrioridad } from '@/app/shared/interfaces/PrioridadRequerimiento';

export class RequerimientosComponent implements OnInit {
  // ... propiedades existentes ...

  // Nuevas propiedades para prioridades
  subTipoCompraSeleccionado: SubTipoCompra = 'NORMAL';
  esNoPlanificado: boolean = false;
  resultadoPrioridad?: ResultadoPrioridad;
  opcionesSubTipoCompra: { value: SubTipoCompra; label: string; dias: string }[] = [];

  constructor(
    // ... servicios existentes ...
    private prioridadService: PrioridadRequerimientoService
  ) {}

  ngOnInit() {
    // ... código existente ...
    
    // Cargar opciones de subtipo de compra
    this.opcionesSubTipoCompra = this.prioridadService.obtenerSubTiposCompra();
  }
}
```

---

## Paso 2: Calcular Prioridad al Cambiar Valores

```typescript
/**
 * Método que se ejecuta cuando cambia la prioridad o el tipo de requerimiento
 */
onPrioridadChange() {
  if (!this.SeleccionaPrioridadITEM || !this.TipoSelecionado) return;

  // Determinar tipo de requerimiento
  const tipo = this.TipoSelecionado as 'COMPRA' | 'CONSUMO' | 'TRANSFERENCIA';

  // Calcular prioridad interna con plazos
  this.resultadoPrioridad = this.prioridadService.calcularPrioridad(
    this.SeleccionaPrioridadITEM as '1' | '2' | '3',
    tipo,
    tipo === 'COMPRA' ? this.subTipoCompraSeleccionado : undefined,
    this.esNoPlanificado
  );

  console.log('Prioridad calculada:', this.resultadoPrioridad);
  // Resultado incluye:
  // - prioridadSpring: '1' | '2' | '3' (para enviar a Spring)
  // - etiquetaInterna: 'Normal', 'Urgente', etc.
  // - descripcionPlazo: 'Compra normal: 7 a 21 días'
  // - diasEntrega: número de días
  // - fechaEntregaEstimada: Date
  // - esUrgente: boolean
  // - requiereAprobacionEspecial: boolean
}

/**
 * Método que se ejecuta cuando cambia el subtipo de compra
 */
onSubTipoCompraChange() {
  this.onPrioridadChange();
}

/**
 * Método que se ejecuta cuando cambia el tipo de requerimiento
 */
onTipoChange() {
  // ... código existente ...

  // Recalcular prioridad
  this.onPrioridadChange();
}
```

---

## Paso 3: Actualizar el HTML para Mostrar Información Adicional

### Opción A: Agregar selector de subtipo (solo para COMPRA Normal)

```html
<div class="col-6">
  <label>Prioridad <span class="text-danger">*</span></label>
  <select class="form-select" 
          [(ngModel)]="SeleccionaPrioridadITEM"
          (change)="onPrioridadChange()">
    <option value="">Selecciona prioridad</option>
    <option value="1">Normal</option>
    <option value="2">Urgente</option>
    <option value="3">Muy Urgente</option>
  </select>
</div>

<!-- Mostrar subtipo solo para COMPRA con prioridad Normal -->
<div class="col-6" *ngIf="TipoSelecionado === 'COMPRA' && SeleccionaPrioridadITEM === '1'">
  <label>Tipo de Compra <span class="text-danger">*</span></label>
  <select class="form-select" 
          [(ngModel)]="subTipoCompraSeleccionado"
          (change)="onSubTipoCompraChange()">
    <option *ngFor="let opt of opcionesSubTipoCompra" [value]="opt.value">
      {{ opt.label }} ({{ opt.dias }})
    </option>
  </select>
</div>

<!-- Checkbox para No Planificado (solo COMPRA Normal) -->
<div class="col-6" *ngIf="TipoSelecionado === 'COMPRA' && SeleccionaPrioridadITEM === '1'">
  <div class="form-check mt-4">
    <input class="form-check-input" 
           type="checkbox" 
           id="noPlanificado"
           [(ngModel)]="esNoPlanificado"
           (change)="onPrioridadChange()">
    <label class="form-check-label" for="noPlanificado">
      Compra No Planificada
    </label>
  </div>
</div>
```

### Opción B: Mostrar información de plazo calculado

```html
<!-- Badge con información de plazo -->
<div class="col-12" *ngIf="resultadoPrioridad">
  <div class="alert alert-info d-flex align-items-center">
    <i class="bi {{ prioridadService.obtenerIconoPrioridad(resultadoPrioridad.prioridadSpring) }} me-2"></i>
    <div>
      <strong>{{ resultadoPrioridad.etiquetaInterna }}</strong>: 
      {{ resultadoPrioridad.descripcionPlazo }}
      <br>
      <small class="text-muted">
        Fecha estimada de entrega: 
        {{ prioridadService.formatearFechaEntrega(resultadoPrioridad.fechaEntregaEstimada) }}
      </small>
    </div>
  </div>
</div>
```

---

## Paso 4: Guardar Información Adicional en el Requerimiento

```typescript
async guardarRequerimiento() {
  // ... validaciones existentes ...

  // Calcular prioridad antes de guardar
  this.onPrioridadChange();

  const requerimiento = {
    // ... campos existentes ...
    prioridad: this.SeleccionaPrioridadITEM, // Valor para Spring (1, 2, 3)
    
    // Campos adicionales internos (agregar a la interfaz Requerimiento)
    prioridadInterna: this.resultadoPrioridad?.etiquetaInterna,
    diasEntrega: this.resultadoPrioridad?.diasEntrega,
    fechaEntregaEstimada: this.resultadoPrioridad?.fechaEntregaEstimada.toISOString(),
    esUrgente: this.resultadoPrioridad?.esUrgente,
    requiereAprobacionEspecial: this.resultadoPrioridad?.requiereAprobacionEspecial,
    subTipoCompra: this.TipoSelecionado === 'COMPRA' ? this.subTipoCompraSeleccionado : undefined,
    esNoPlanificado: this.esNoPlanificado,
    
    // ... resto de campos ...
  };

  // Guardar en Dexie
  await this.dexieService.saveRequerimiento(requerimiento);
}
```

---

## Paso 5: Actualizar Interfaz Requerimiento (Tables.ts)

```typescript
export interface Requerimiento {
  // ... campos existentes ...
  
  // Prioridad Spring (se mantiene para enviar a ERP)
  prioridad: string; // '1', '2', '3'
  
  // Campos internos de prioridad (opcionales)
  prioridadInterna?: string; // 'Normal', 'Urgente', 'Emergencia', etc.
  diasEntrega?: number;
  fechaEntregaEstimada?: string;
  esUrgente?: boolean;
  requiereAprobacionEspecial?: boolean;
  subTipoCompra?: 'NORMAL' | 'IMPORTACION' | 'FABRICACION';
  esNoPlanificado?: boolean;
}
```

---

## Paso 6: Mostrar en Tabla de Requerimientos

```html
<p-table [value]="requerimientos">
  <ng-template pTemplate="header">
    <tr>
      <th>Nro. Requerimiento</th>
      <th>Prioridad</th>
      <th>Plazo</th>
      <th>Fecha Entrega</th>
      <!-- ... otras columnas ... -->
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-req>
    <tr>
      <td>{{ req.idrequerimiento }}</td>
      <td>
        <span class="badge bg-{{ prioridadService.obtenerColorPrioridad(req.prioridad) }}">
          <i class="bi {{ prioridadService.obtenerIconoPrioridad(req.prioridad) }}"></i>
          {{ req.prioridadInterna || 'Normal' }}
        </span>
      </td>
      <td>{{ req.diasEntrega }} días</td>
      <td>{{ req.fechaEntregaEstimada | date:'dd/MM/yyyy' }}</td>
      <!-- ... otras columnas ... -->
    </tr>
  </ng-template>
</p-table>
```

---

## Mapeo de Prioridades

### COMPRA

| Prioridad Spring | Subtipo | Plazo | Descripción |
|-----------------|---------|-------|-------------|
| 1 (Normal) | Normal | 7-21 días | Compra estándar |
| 1 (Normal) | Importación | 120 días | Compra internacional |
| 1 (Normal) | Fabricación | 45 días | Fabricación a medida |
| 1 (Normal) | No Planificado | 7-21 días | Compra no planificada |
| 2 (Urgente) | - | 48 horas | Compra urgente |
| 3 (Muy Urgente) | - | 24 horas | Emergencia |

### CONSUMO

| Prioridad Spring | Plazo | Descripción |
|-----------------|-------|-------------|
| 1 (Normal) | Mismo día | Consumo normal |
| 2 (Urgente) | Dentro del día | Consumo urgente |
| 3 (Muy Urgente) | 6 horas | Emergencia |

---

## Ventajas de este Sistema

1. ✅ **Compatibilidad con Spring**: Los valores 1, 2, 3 se mantienen sin cambios
2. ✅ **Lógica interna flexible**: Plazos diferentes según tipo de requerimiento
3. ✅ **Trazabilidad**: Se guarda tanto el valor Spring como la lógica interna
4. ✅ **Extensible**: Fácil agregar nuevos tipos de prioridad
5. ✅ **UI informativa**: Usuario ve plazos reales de entrega
6. ✅ **Cálculo automático**: Fechas de entrega calculadas automáticamente

---

## Notas Importantes

- El dropdown **siempre envía valores 1, 2, 3** a Spring (sin cambios)
- La lógica interna calcula plazos **solo para uso interno**
- Los campos adicionales (`prioridadInterna`, `diasEntrega`, etc.) son **opcionales**
- Si no necesitas mostrar la información adicional en el UI, simplemente no la uses
- El servicio está diseñado para ser **independiente** del componente

---

## Ejemplo de Uso Mínimo (Sin UI adicional)

Si solo quieres calcular la fecha de entrega sin mostrar nada adicional:

```typescript
// Al guardar el requerimiento
const resultado = this.prioridadService.calcularPrioridad(
  this.SeleccionaPrioridadITEM as '1' | '2' | '3',
  this.TipoSelecionado as 'COMPRA' | 'CONSUMO'
);

// Guardar solo la fecha estimada
requerimiento.fechaEntregaEstimada = resultado.fechaEntregaEstimada.toISOString();
requerimiento.prioridad = this.SeleccionaPrioridadITEM; // Sigue siendo 1, 2 o 3
```

El dropdown del UI **no cambia**, Spring recibe los mismos valores, pero internamente tienes la lógica de plazos.
