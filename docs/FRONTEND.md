# LOGISTICA - Documentación Frontend

**Versión:** 1.0.45  
**Fecha:** 2026-03-03  
**Descripción:** Sistema de Logística

---

## 📋 Tabla de Contenidos

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Componentes](#componentes)
3. [Servicios](#servicios)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Tecnologías Utilizadas](#tecnologías-utilizadas)

---

## 🎯 Resumen del Proyecto

Sistema de gestión logística desarrollado con Angular 20, PrimeNG 20 y Bootstrap 5.

### Estadísticas del Proyecto

- **Total de Componentes:** 21
- **Total de Servicios:** 15
- **Versión de Angular:** 20.3.6
- **Versión de PrimeNG:** 20.3.0

---

## 🧩 Componentes

### Lista de Componentes (21)

| Componente | Selector | Métodos | Propiedades | Ruta |
|------------|----------|---------|-------------|------|
| **administracion** | `app-administracion` | 1 | 5 | `\src\app\modules\main\pages\administracion` |
| **aprobaciones** | `app-aprobaciones` | 91 | 190 | `\src\app\modules\main\pages\aprobaciones` |
| **consolidacion-requerimientos** | `app-consolidacion-requerimientos` | 67 | 126 | `\src\app\modules\main\pages\consolidacion-requerimientos` |
| **cotizaciones** | `app-cotizaciones` | 101 | 207 | `\src\app\modules\main\pages\cotizaciones` |
| **dashboard-compras** | `app-dashboard-compras` | 15 | 75 | `\src\app\modules\main\pages\dashboard-compras` |
| **devoluciones-proveedores** | `app-devoluciones-proveedores` | 26 | 90 | `\src\app\modules\main\pages\devoluciones-proveedores` |
| **evaluacion-proveedores** | `app-evaluacion-proveedores` | 22 | 81 | `\src\app\modules\main\pages\evaluacion-proveedores` |
| **gestion-inventario** | `app-gestion-inventario` | 33 | 66 | `\src\app\modules\main\pages\gestion-inventario` |
| **layout** | `app-layout` | 15 | 58 | `\src\app\modules\main\pages\layout` |
| **listas-stock** | `app-listas-stock` | 43 | 129 | `\src\app\modules\main\pages\listas-stock` |
| **maestro-proveedores** | `app-maestro-proveedores` | 27 | 50 | `\src\app\modules\main\pages\maestro-proveedores` |
| **maestros** | `app-maestros` | 2 | 6 | `\src\app\modules\main\pages\maestros` |
| **notificaciones-lista** | `app-notificaciones-lista` | 11 | 11 | `\src\app\modules\main\pages\notificaciones-lista` |
| **ordenes-compra** | `app-ordenes-compra` | 37 | 106 | `\src\app\modules\main\pages\ordenes-compra` |
| **parametros** | `app-parametros` | 140 | 98 | `\src\app\modules\main\pages\parametros` |
| **recepcion-mercaderia** | `app-recepcion-mercaderia` | 35 | 67 | `\src\app\modules\main\pages\recepcion-mercaderia` |
| **reportes-compras** | `app-reportes-compras` | 24 | 86 | `\src\app\modules\main\pages\reportes-compras` |
| **reporte_logistico** | `app-reporte_logistico` | 19 | 48 | `\src\app\modules\main\pages\reporte_logistico` |
| **requerimientos** | `app-requerimientos` | 303 | 1040 | `\src\app\modules\main\pages\requerimientos` |
| **saldo-requerimiento** | `app-saldo-requerimiento` | 28 | 86 | `\src\app\modules\main\pages\saldo-requerimiento` |
| **solicitudes-compra** | `app-solicitudes-compra` | 35 | 97 | `\src\app\modules\main\pages\solicitudes-compra` |

---

## 🔧 Servicios

### Lista de Servicios (15)

| Servicio | Métodos | Ruta |
|----------|---------|------|
| **aprobaciones** | 1 | `\src\app\modules\main\services\aprobaciones.service.ts` |
| **aprobadores** | 1 | `\src\app\modules\main\services\aprobadores.service.ts` |
| **commoditys** | 2 | `\src\app\modules\main\services\commoditys.service.ts` |
| **connectivity** | 1 | `\src\app\modules\main\services\connectivity.service.ts` |
| **cotizaciones** | 1 | `\src\app\modules\main\services\cotizaciones.service.ts` |
| **despachos** | 1 | `\src\app\modules\main\services\despachos.service.ts` |
| **items** | 2 | `\src\app\modules\main\services\items.service.ts` |
| **logistica** | 1 | `\src\app\modules\main\services\logistica.service.ts` |
| **maestras** | 1 | `\src\app\modules\main\services\maestras.service.ts` |
| **parametros** | 1 | `\src\app\modules\main\services\parametros.service.ts` |
| **reporte** | 1 | `\src\app\modules\main\services\reporte.service.ts` |
| **requerimientos** | 2 | `\src\app\modules\main\services\requerimientos.service.ts` |
| **saldo-requerimiento** | 1 | `\src\app\modules\main\services\saldo-requerimiento.service.ts` |
| **search-ml** | 6 | `\src\app\modules\main\services\search-ml.service.ts` |
| **sync** | 1 | `\src\app\modules\main\services\sync.service.ts` |

---

## 📁 Estructura del Proyecto

```
logistica/
├── src/
│   ├── app/
│   │   ├── modules/
│   │   │   └── main/
│   │   │       ├── pages/          # Componentes de páginas
│   │   │       ├── services/       # Servicios de negocio
│   │   │       └── components/     # Componentes compartidos
│   │   ├── shared/
│   │   │   ├── interfaces/         # Interfaces TypeScript
│   │   │   ├── services/           # Servicios compartidos
│   │   │   └── utils/              # Utilidades
│   │   └── services/               # Servicios globales
│   ├── environments/               # Configuraciones de entorno
│   └── styles/                     # Estilos globales
├── scripts/                        # Scripts de automatización
└── docs/                           # Documentación
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular:** 20.3.6
- **PrimeNG:** 20.3.0
- **Bootstrap:** 5.3.3
- **TypeScript:** Latest
- **RxJS:** 7.8.0

### Librerías Adicionales
- **Dexie:** 4.0.11 (IndexedDB)
- **SweetAlert2:** 11.15.10 (Alertas)
- **ExcelJS:** 4.4.0 (Exportación Excel)
- **jsPDF:** 3.0.4 (Generación PDF)
- **Moment.js:** 2.30.1 (Manejo de fechas)

### Herramientas de Desarrollo
- **Angular CLI:** 20.3.6
- **Service Worker:** PWA Support
- **Git:** Control de versiones

---

## 📝 Notas de Desarrollo

### Características Principales

1. **Gestión de Requerimientos**
   - Creación y seguimiento de requerimientos
   - Aprobación por jefatura
   - Consolidación de items

2. **Sistema de Cotizaciones**
   - Registro de cotizaciones
   - Comparación de proveedores
   - Estados: RECIBIDA → EN_EVALUACION → SELECCIONADA/RECHAZADA

3. **Notificaciones en Tiempo Real**
   - Notificaciones de stock
   - Notificaciones de aprobaciones
   - Sistema de alertas

4. **Almacenamiento Local**
   - IndexedDB con Dexie
   - Sincronización con backend
   - Modo offline

---

## 🔄 Flujos de Trabajo

### Flujo de Cotizaciones

1. Se genera solicitud de cotización desde consolidación
2. Proveedores envían cotizaciones (estado: RECIBIDA)
3. Al recibir 2+ cotizaciones → cambian a EN_EVALUACION automáticamente
4. Usuario compara cotizaciones
5. Selecciona ganadora → estado: SELECCIONADA
6. Otras cotizaciones → estado: RECHAZADA

---

## 📞 Contacto y Soporte

Para más información sobre el proyecto, contactar al equipo de desarrollo.

**Última actualización:** 2026-03-03
