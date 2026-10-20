# Manual de Funcionamiento del App Logistica

Fecha de referencia: 2026-09-14

## 1. Que es el sistema

Logistica es una aplicacion web para gestionar requerimientos internos, aprobaciones, compras, servicios, almacen, recepcion, inventario, kardex, reportes y configuraciones administrativas.

La aplicacion tiene dos partes:

- Frontend Angular: pantalla que usan los usuarios.
- API Logistica .NET: servidor que procesa operaciones y se conecta a SQL Server.

Adicionalmente se conecta al API Maestra para validar credenciales de usuarios.

## 2. Como ingresar

1. Abrir la aplicacion web.
2. Ingresar usuario y clave.
3. El sistema valida credenciales.
4. Si son correctas, carga el rol del usuario.
5. El sistema muestra el menu permitido y redirige al panel correspondiente.

Si el usuario no ve opciones esperadas, revisar:

- Rol asignado.
- Area asignada.
- Permisos del menu dinamico.
- Estado activo del usuario.

## 3. Pantalla principal

Despues del login, el usuario entra al layout principal. Desde ahi puede:

- Navegar por el menu lateral.
- Ver nombre y rol.
- Ver notificaciones.
- Entrar a dashboards.
- Cerrar sesion.

El menu puede variar por rol. Algunos usuarios tienen menu legacy y otros menu dinamico configurado desde administracion.

## 4. Roles principales

| Rol | Que puede hacer |
|---|---|
| Operativo | Crear requerimientos y revisar sus estados |
| Aprobador | Aprobar o rechazar requerimientos asignados |
| Logistica | Consolidar, cotizar, generar solicitudes y ordenes |
| Almacen | Despachar, recepcionar, revisar kardex e inventario |
| Finanzas | Revisar/aprobar ordenes de compra segun flujo |
| Administrador | Configurar usuarios, roles, flujos, menus y parametros |
| Sistemas | Soporte tecnico, versionamiento y configuracion avanzada |

## 5. Crear un requerimiento

Ruta:

```text
Menu -> Requerimientos
```

Pasos:

1. Seleccionar tipo de requerimiento.
2. Completar datos generales.
3. Agregar items, commodities, activos o servicios segun corresponda.
4. Adjuntar documentos si el flujo lo requiere.
5. Guardar o enviar.
6. Sincronizar si el requerimiento quedo temporalmente local.
7. Esperar aprobacion.

Resultado esperado:

- El requerimiento queda registrado.
- Se asigna aprobador si aplica.
- Aparece en bandeja de aprobacion.

## 6. Aprobar requerimientos

Rutas:

```text
Aprobaciones
Aprobaciones por Area
Dashboard Aprobaciones por Area
```

Pasos:

1. Entrar a la bandeja.
2. Revisar pendientes.
3. Abrir detalle.
4. Revisar cantidades, solicitante, area, motivo y adjuntos.
5. Aprobar o rechazar.
6. Si rechaza, registrar observacion.

Resultado esperado:

- Aprobado: avanza al siguiente nivel o pasa a logistica.
- Rechazado: vuelve con estado rechazado y observacion.

## 7. Consolidar requerimientos

Rutas:

```text
Consolidacion de Requerimientos
Flujo de Compras
Consolidacion Corporativa
```

Pasos:

1. Logistica revisa pendientes aprobados.
2. Filtra por empresa, item, almacen o tipo.
3. Selecciona lineas compatibles.
4. Crea consolidacion.
5. Revisa el detalle.
6. Decide si genera cotizacion, solicitud de compra u orden.

Resultado esperado:

- Las lineas quedan agrupadas.
- Se evita comprar o cotizar cada requerimiento por separado.

## 8. Gestionar cotizaciones

Rutas:

```text
Cotizaciones
Evaluacion de Proveedores
Maestro de Proveedores
```

Pasos:

1. Generar solicitud de cotizacion desde consolidacion.
2. Registrar propuestas de proveedores.
3. Comparar precios y condiciones.
4. Seleccionar proveedor ganador.
5. Cerrar cotizacion si corresponde.
6. Generar orden de compra.

Resultado esperado:

- Existe proveedor elegido.
- El sistema puede continuar hacia OC.

## 9. Solicitudes y ordenes de compra

Rutas:

```text
Solicitudes de Compra
Ordenes de Compra
Aprobacion Orden de Compra
Dashboard Finanzas
```

Pasos:

1. Crear solicitud de compra o generarla desde consolidacion.
2. Adjuntar documentos cuando aplique.
3. Enviar a aprobacion.
4. Aprobar solicitud.
5. Generar OC.
6. Enviar OC a aprobacion.
7. Aprobar OC.
8. Sincronizar con Spring/ERP.

Resultado esperado:

- OC aprobada.
- OC sincronizada.
- OC disponible para recepcion en almacen.

## 10. Recepcionar mercaderia

Ruta:

```text
Recepcion de Mercaderia
```

Pasos:

1. Listar OCs pendientes de recepcion.
2. Seleccionar OC.
3. Revisar detalle.
4. Registrar cantidad recibida.
5. Validar recepcion.
6. Confirmar ingreso a kardex.

Resultado esperado:

- Recepcion registrada.
- Stock actualizado.
- Movimiento visible en kardex.

## 11. Despachar requerimientos

Ruta:

```text
Despachos
```

Pasos:

1. Almacen revisa requerimientos pendientes.
2. Valida stock.
3. Despacha cantidad disponible.
4. Registra despacho.
5. Si queda saldo, el sistema genera saldo pendiente.

Resultado esperado:

- Requerimiento atendido total o parcialmente.
- Kardex/inventario refleja salida.
- Si hay saldo, queda pendiente de gestion.

## 12. Saldos pendientes y notificaciones

Rutas:

```text
Notificaciones
Reporte de Saldos
```

Funcionamiento:

- Cuando un despacho no cubre todo lo solicitado, queda saldo pendiente.
- El sistema puede enviar notificaciones.
- Logistica o jefatura decide si el saldo se consolida, compra o cierra.

El contador de notificaciones se actualiza automaticamente cada 30 segundos.

## 13. Servicios

Rutas:

```text
Solicitudes de Servicio
Consolidacion Servicios
Ordenes de Servicio
Aprobacion OS
Conformidad Servicios
```

Pasos:

1. Registrar solicitud de servicio.
2. Enviar a aprobacion si aplica.
3. Generar/cotizar orden de servicio.
4. Aprobar OS.
5. Ejecutar servicio.
6. Registrar conformidad.

Resultado esperado:

- Servicio aprobado.
- Orden completada.
- Conformidad registrada.

## 14. Kardex e inventario

Rutas:

```text
Kardex
Gestion de Inventario
Listas de Stock
Transferencias Almacen
```

Uso:

- Kardex muestra entradas, salidas y movimientos.
- Gestion de inventario permite revisar stock.
- Listas de stock ayudan a configurar y consultar disponibilidad.
- Transferencias permiten mover stock entre almacenes.

## 15. Devoluciones y reingresos

Rutas:

```text
Devoluciones a Proveedores
Devoluciones de Consumo
Reingresos
```

Uso:

- Devolucion a proveedor: retorna mercaderia al proveedor.
- Devolucion de consumo: registra devolucion interna de consumo.
- Reingreso: vuelve a ingresar stock o saldo al flujo.

Estas operaciones pueden impactar inventario y kardex.

## 16. Administracion

Rutas:

```text
Admin Login
Admin Logistica
Administracion
```

Permite configurar:

- Usuarios.
- Usuarios por area.
- Areas y subareas.
- Roles.
- Flujos de aprobacion.
- Aprobadores.
- Permisos.
- Menu dinamico.
- Parametros.
- Configuracion SMTP.
- Plantillas de correo.
- Plantillas PDF.
- Branding.
- Incrementos OC.
- Auditoria.
- Version API/app.

## 17. Cierre de sesion

Al cerrar sesion, el sistema revisa si existen requerimientos locales sin sincronizar.

Si hay pendientes, no permite salir y muestra cuantos registros faltan por sincronizar:

- Items.
- Commodity.
- Activo fijo.
- Activo menor.

Primero se deben sincronizar esos pendientes; luego se puede cerrar sesion.

## 18. Problemas frecuentes

### No puedo ingresar

Revisar usuario, clave, estado del usuario y disponibilidad del API Maestra.

### No veo mi menu

Revisar rol, permisos, menu dinamico y configuracion del usuario.

### No aparecen pendientes para aprobar

Revisar area asignada, documento de identidad, rol aprobador y flujo configurado.

### Una OC no sincroniza

Revisar estado de OC, datos de empresa, proveedor, adjuntos obligatorios y cola de sincronizacion Spring/ERP.

### No puedo cerrar sesion

Hay requerimientos locales sin sincronizar. Entrar a requerimientos y sincronizar pendientes.

### Stock no cuadra

Revisar movimientos de kardex, recepciones, despachos, devoluciones, reingresos y transferencias.

## 19. Recomendacion operativa

Para soporte o validacion funcional, seguir este orden:

1. Identificar usuario y rol.
2. Confirmar empresa/RUC y area.
3. Revisar pantalla usada.
4. Verificar estado del documento.
5. Revisar si hay adjuntos obligatorios.
6. Validar endpoint/API.
7. Revisar stored procedure o script SQL relacionado.
8. Confirmar si hay integracion pendiente con Spring/ERP.
