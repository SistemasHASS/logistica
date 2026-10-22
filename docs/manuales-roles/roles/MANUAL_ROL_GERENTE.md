# Manual de Usuario — Gerente (GERENTE)

| Campo | Valor |
|---|---|
| Código de rol | `GERENTE` |
| Nombre | Gerencia |
| Pantalla inicial | Definida por menú configurado en BD (recomendado: dashboard + aprobaciones) |
| Video tutorial | [../video-tutoriales/VIDEO_TUTORIAL_GERENTE.html](../video-tutoriales/VIDEO_TUTORIAL_GERENTE.html) |

---

## 1. ¿Quién eres?

Eres la **gerencia**: das el visto bueno final a las Órdenes de Compra y Órdenes de Servicio de mayor relevancia y supervisas indicadores financieros.

## 2. Acceso

Login → el sistema muestra el menú configurado para tu rol. Si al entrar no ves opciones, pide al administrador que configure el menú de GERENTE (se recomienda: Dashboard + Aprobaciones + Reportes).

## 3. Pantallas disponibles

| Pantalla | Qué haces |
|---|---|
| Dashboard Finanzas | Indicadores de órdenes y gasto |
| Aprobación OC | Aprobar/rechazar órdenes de compra |
| Aprobación OS | Aprobar/rechazar órdenes de servicio |
| Reporte Requerimientos / Logístico / Catálogo | Consultas abiertas |

## 4. Procedimientos frecuentes

### Aprobar una Orden de Compra

1. **Aprobación OC** → lista de pendientes.
2. Abre la orden: proveedor, líneas, monto total, cotizaciones adjuntas, trazabilidad de la solicitud.
3. **Aprobar** (la orden continúa a emisión) o **Rechazar** con motivo.

### Aprobar una Orden de Servicio

Mismo flujo en **Aprobación OS**.

## 5. Restricciones

- Alcance de aprobación y consulta únicamente; no operas requerimientos, compras ni almacén.
- Tu menú depende totalmente de la configuración en BD — coordina con TI para ajustarlo.

## 6. Problemas comunes

| Problema | Solución |
|---|---|
| Entro y no veo menú | El rol GERENTE no tiene redirect propio: pide a TI configurar `MENU_JSON`/`ITEMS_VISIBLES` |
| Quiero ver más reportes | Los reportes abiertos están disponibles; reportes adicionales requieren configuración del menú |
