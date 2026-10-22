# -*- coding: utf-8 -*-
"""
Generador de video tutoriales interactivos (presentaciones HTML)
para los roles del Sistema Logística.

Uso:  python generar_videos.py
Salida: VIDEO_TUTORIAL_<ROL>.html  e  index.html  en esta misma carpeta.
"""

import os

# ---------------------------------------------------------------------------
# Plantilla HTML (auto-contenida, sin dependencias externas)
# ---------------------------------------------------------------------------

TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Video Tutorial — __TITULO_ROL__ (__IDROL__)</title>
<style>
  :root {{
    --accent: {accent};
    --bg: #0f172a; --panel: #1e293b; --panel2: #16213b;
    --text: #e2e8f0; --muted: #94a3b8; --border: #334155;
  }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family:'Segoe UI',system-ui,sans-serif; background:var(--bg); color:var(--text);
         display:flex; flex-direction:column; height:100vh; overflow:hidden; }}
  header {{ background:var(--panel); border-bottom:2px solid var(--accent);
           padding:12px 24px; display:flex; align-items:center; gap:16px; }}
  .badge {{ background:var(--accent); color:#fff; font-weight:700; padding:4px 12px;
           border-radius:6px; font-size:13px; letter-spacing:1px; }}
  header h1 {{ font-size:18px; font-weight:600; }}
  header .duracion {{ margin-left:auto; color:var(--muted); font-size:13px; }}
  main {{ flex:1; display:flex; overflow:hidden; }}
  .slide {{ flex:1; display:none; flex-direction:column; padding:32px 48px; overflow-y:auto; }}
  .slide.active {{ display:flex; }}
  .escena {{ color:var(--accent); font-size:12px; font-weight:700; letter-spacing:2px;
            text-transform:uppercase; margin-bottom:8px; }}
  .slide h2 {{ font-size:30px; margin-bottom:20px; }}
  .contenido {{ display:flex; gap:32px; flex:1; }}
  .col-izq {{ flex:1.1; display:flex; flex-direction:column; gap:16px; }}
  .col-der {{ flex:1; display:flex; align-items:flex-start; justify-content:center; }}
  .locucion {{ background:var(--panel2); border-left:4px solid var(--accent);
              padding:16px 20px; border-radius:0 8px 8px 0; }}
  .locucion::before {{ content:'🎙 NARRACIÓN'; display:block; color:var(--accent);
                       font-size:11px; font-weight:700; letter-spacing:1px; margin-bottom:8px; }}
  .locucion p {{ font-size:16px; line-height:1.6; font-style:italic; }}
  .pasos {{ background:var(--panel); border-radius:8px; padding:16px 20px; }}
  .pasos h3 {{ font-size:13px; color:var(--muted); letter-spacing:1px; margin-bottom:10px;
              text-transform:uppercase; }}
  .pasos li {{ list-style:none; padding:8px 0 8px 30px; position:relative; font-size:15px;
              border-bottom:1px solid var(--border); }}
  .pasos li:last-child {{ border-bottom:none; }}
  .pasos li::before {{ content:counter(step); counter-increment:step;
      position:absolute; left:0; top:6px; width:20px; height:20px; background:var(--accent);
      color:#fff; border-radius:50%; font-size:11px; font-weight:700;
      display:flex; align-items:center; justify-content:center; }}
  .pasos ol {{ counter-reset:step; }}
  .captura {{ max-width:100%; max-height:420px; border-radius:10px;
             border:2px solid var(--border); box-shadow:0 8px 30px rgba(0,0,0,.5); }}
  .captura-missing {{ border:2px dashed var(--border); border-radius:10px; padding:60px 30px;
             color:var(--muted); text-align:center; font-size:14px; }}
  footer {{ background:var(--panel); padding:12px 24px; display:flex; align-items:center; gap:16px; }}
  .btn {{ background:var(--accent); color:#fff; border:none; padding:10px 22px; border-radius:6px;
         font-size:14px; font-weight:600; cursor:pointer; }}
  .btn:hover {{ filter:brightness(1.15); }}
  .btn.sec {{ background:var(--border); }}
  .progreso-wrap {{ flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden; }}
  .progreso {{ height:100%; background:var(--accent); width:0%; transition:width .3s; }}
  .contador {{ color:var(--muted); font-size:13px; min-width:80px; text-align:center; }}
  .ayuda {{ color:var(--muted); font-size:11px; }}
  @media (max-width:820px) {{
    header {{ padding:10px 12px; gap:8px; }}
    header h1 {{ font-size:14px; }}
    .badge {{ font-size:11px; padding:3px 8px; }}
    .duracion {{ display:none; }}
    .slide {{ padding:18px 14px; }}
    .slide h2 {{ font-size:21px; margin-bottom:12px; }}
    .contenido {{ flex-direction:column; gap:14px; }}
    .captura {{ max-height:none; }}
    footer {{ padding:10px 10px; gap:8px; flex-wrap:wrap; }}
    .ayuda {{ display:none; }}
    .contador {{ min-width:60px; font-size:12px; }}
    .btn {{ padding:8px 14px; font-size:13px; }}
  }}
</style>
</head>
<body>
<header>
  <span class="badge">__IDROL__</span>
  <h1>Video Tutorial — __TITULO_ROL__</h1>
  <span class="duracion">Duración estimada: __DURACION__</span>
</header>
<main>
__SLIDES__
</main>
<footer>
  <button class="btn sec" onclick="anterior()">◀ Anterior</button>
  <button class="btn" onclick="siguiente()">Siguiente ▶</button>
  <button class="btn sec" id="btnPlay" onclick="togglePlay()">▶ Reproducir</button>
  <div class="progreso-wrap"><div class="progreso" id="prog"></div></div>
  <span class="contador" id="contador"></span>
  <span class="ayuda">← → navegar · Espacio: siguiente · P: reproducir</span>
</footer>
<script>
  const slides = document.querySelectorAll('.slide');
  let actual = 0, timer = null;
  function mostrar(i) {{
    actual = Math.max(0, Math.min(i, slides.length - 1));
    slides.forEach((s, k) => s.classList.toggle('active', k === actual));
    document.getElementById('prog').style.width = ((actual + 1) / slides.length * 100) + '%';
    document.getElementById('contador').textContent = (actual + 1) + ' / ' + slides.length;
  }}
  function siguiente() {{ mostrar(actual + 1); }}
  function anterior() {{ mostrar(actual - 1); }}
  function togglePlay() {{
    const b = document.getElementById('btnPlay');
    if (timer) {{ clearInterval(timer); timer = null; b.textContent = '▶ Reproducir'; return; }}
    b.textContent = '⏸ Pausar';
    timer = setInterval(() => {{
      if (actual >= slides.length - 1) {{ togglePlay(); return; }}
      siguiente();
    }}, 12000);
  }}
  document.addEventListener('keydown', e => {{
    if (e.key === 'ArrowRight' || e.key === ' ') {{ e.preventDefault(); siguiente(); }}
    if (e.key === 'ArrowLeft') anterior();
    if (e.key.toLowerCase() === 'p') togglePlay();
  }});
  mostrar(0);
</script>
</body>
</html>
"""

IMG = "../../capturas_manual/{file}"

# ---------------------------------------------------------------------------
# Contenido por rol
# ---------------------------------------------------------------------------

ROLES = {
    "GENERAL": {
        "titulo": "Introducción al Sistema",
        "accent": "#334155",
        "duracion": "~7 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido al Sistema Logística. Este tutorial general te muestra cómo entrar, moverte por la aplicación y trabajar incluso sin internet. Aplica a todos los roles.",
             [], None),
            ("Cómo ingresar",
             "Abre la URL de la aplicación e ingresa con tu usuario y contraseña corporativos. El sistema valida tus credenciales y te lleva directo a tu pantalla según tu rol.",
             ["Abrir la URL de la app", "Escribir usuario y contraseña", "Clic en Ingresar", "Esperar la redirección automática"],
             "01_login.png"),
            ("Tu pantalla inicial",
             "Cada rol aterriza en su propio dashboard: el operativo en Mis Requerimientos, almacén en Despachos, aprobadores en su bandeja, administradores en su panel.",
             ["Identificar tu dashboard", "Revisar las tarjetas de indicadores"],
             "12_dashboard_operativo.png"),
            ("El menú lateral",
             "Tus opciones están agrupadas por tema en el menú de la izquierda. Solo ves lo que tu rol puede hacer.",
             ["Abrir y cerrar grupos del menú", "El grupo de la pantalla actual se abre solo"],
             "14_notificaciones.png"),
            ("Notificaciones",
             "La campana muestra avisos cada 30 segundos. Un aviso típico: saldos pendientes por consolidar.",
             ["Ver el contador en el menú", "Clic en el aviso para ir a Notificaciones"],
             "14_notificaciones.png"),
            ("Trabajo sin internet",
             "La app funciona offline: requerimientos y datos se guardan en tu equipo y se envían al sincronizar.",
             ["Parámetros → Sincronizar para bajar maestras", "Crear requerimientos sin conexión", "Sincronizar al recuperar señal"],
             "05_parametros.png"),
            ("Cierre de sesión seguro",
             "Antes de salir, el sistema verifica que no tengas pendientes. Si los hay, te bloquea hasta sincronizarlos.",
             ["Sincronizar pendientes", "Cerrar sesión desde el menú"],
             None),
            ("Cierre",
             "Ya conoces lo esencial. Sigue con el video tutorial de tu rol específico para dominar tus tareas.",
             [], None),
        ],
    },
    "FLUJO": {
        "titulo": "Flujo Completo del Proceso",
        "accent": "#0e7490",
        "duracion": "~9 min",
        "slides": [
            ("El ciclo completo",
             "Este tutorial muestra el proceso de punta a punta: del requerimiento a la conformidad, y qué rol actúa en cada paso.",
             [], None),
            ("Paso 1 — Crear el requerimiento",
             "El operativo de campo o licitaciones crea el requerimiento de ítems, commodities o activos.",
             ["Roles: OPLOGIST, EMLOGIST (también LO, AL, AD, JL)", "Pantalla: Requerimientos", "Guardar y sincronizar"],
             "13_requerimientos.png"),
            ("Paso 2 — Aprobación por área",
             "El jefe de área revisa y aprueba o rechaza el requerimiento. Sin este paso no avanza.",
             ["Rol: APLOGIST", "Pantalla: Aprobaciones por Área", "Aprobar → pasa a logística · Rechazar → vuelve al solicitante"],
             "16_aprobaciones_area.png"),
            ("Paso 3 — Consolidación",
             "Logística agrupa las líneas aprobadas para comprarlas juntas, incluso entre empresas.",
             ["Rol: LOLOGIST", "Pantalla: Consolidación de Requerimientos / Compras / Corporativa"],
             "38_consolidacion_compras.png"),
            ("Paso 4 — Cotización y Orden",
             "Se registran cotizaciones, se elige la ganadora y se emite la Orden de Compra o de Servicio.",
             ["Cotizaciones → elegir ganadora", "Generar OC/OS y enviar a aprobación"],
             "41_cotizaciones.png"),
            ("Paso 5 — Aprobación de la orden",
             "Jefatura de logística, licitaciones, finanzas y gerencia aprueban según el flujo configurado.",
             ["Roles: JLOLOGIST, JEMLOGIST, FINANZAS, GERENTE", "Pantalla: Aprobación OC / OS"],
             "18_aprobaciones_oc.png"),
            ("Paso 6 — Recepción",
             "Almacén recepciona la mercadería contra la OC aprobada; entra a stock y kardex.",
             ["Rol: ALLOGIST", "Pantalla: Recepción de Mercadería"],
             "24_recepcion_mercaderia.png"),
            ("Paso 7 — Despacho y conformidad",
             "Almacén despacha al solicitante y este confirma la recepción con la conformidad.",
             ["Despachos → confirmar salida", "Solicitante → Conformidad de Despacho"],
             "23_despachos.png"),
            ("Paso 8 — Control y reportes",
             "El ciclo cierra con kardex, inventario, devoluciones y reportes de seguimiento.",
             ["Kardex e Inventario", "Reportes de Compras, Saldos, Despachos"],
             "26_kardex.png"),
            ("Cierre",
             "Ese es el ciclo completo. Cada rol tiene su video tutorial con el detalle de su parte del proceso.",
             [], None),
        ],
    },
    "TILOGIST": {
        "titulo": "Admin Sistema",
        "accent": "#dc2626",
        "duracion": "~8 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido al video tutorial del rol Administrador de Sistema. En esta guía aprenderás a navegar por la plataforma, administrar usuarios y usar las consolas de administración.",
             [], None),
            ("Inicio de sesión",
             "Ingresa con tu usuario y contraseña corporativos. El sistema te llevará automáticamente al Dashboard de Admin Sistema.",
             ["Abrir la URL de la aplicación", "Escribir usuario y contraseña", "Clic en Ingresar", "Verificar que cargue el Dashboard TI"],
             "01_login.png"),
            ("Tu panel de inicio",
             "El Dashboard Admin Sistema resume el estado de la plataforma: usuarios, empresas y accesos rápidos.",
             ["Revisar tarjetas de indicadores", "Ubicar el menú lateral izquierdo", "Ver el contador de notificaciones arriba a la derecha"],
             "02_dashboard_admin.png"),
            ("Consola Admin Logística",
             "Además de la app, tienes una consola administrativa en /admin-logistica con login propio. Ahí gestionas usuarios, permisos y configuración.",
             ["Abrir /admin-logistica/login", "Iniciar sesión", "Recorrer las pestañas del menú lateral de la consola"],
             "09_admin_logistica.png"),
            ("Crear un usuario",
             "Desde la pestaña Usuarios puedes crear cuentas de cualquier rol. Eres el único que puede crear otros TILOGIST.",
             ["Consola → pestaña Usuarios", "Clic en Nuevo usuario", "Completar datos y asignar rol (o varios separados por coma)", "Guardar"],
             None),
            ("Permisos por rol",
             "En Permisos por Rol asignas o quitas las claves ADMINLG que controlan qué pestañas de la consola ve cada rol.",
             ["Consola → Permisos por Rol", "Seleccionar el rol", "Activar/desactivar claves", "Guardar cambios"],
             None),
            ("Administración clásica",
             "La administración histórica está en /administracion, protegida por un login adicional en /admin-login.",
             ["Abrir /admin-login e ingresar", "Explorar: usuarios, roles, áreas, flujos, SMTP, plantillas, branding"],
             "10_administracion.png"),
            ("Buenas prácticas",
             "Recuerda: los cambios de menú se aplican al recargar. Nunca compartas tu cuenta admin. Revisa Auditoría ante dudas.",
             ["Usar Auditoría para rastrear cambios", "Probar cambios de menú con un rol de prueba primero"],
             None),
        ],
    },
    "ADLOGIST": {
        "titulo": "Admin Logística",
        "accent": "#ea580c",
        "duracion": "~8 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido al tutorial del rol Administrador de Logística. Combinas operación del flujo con la configuración funcional del sistema.",
             [], None),
            ("Inicio de sesión",
             "Ingresa con tu cuenta. El sistema te lleva al Dashboard Admin Logística.",
             ["Abrir la app", "Login con usuario y contraseña", "Verificar el Dashboard Admin Logística"],
             "01_login.png"),
            ("Recorrido por tu menú",
             "Tu menú acordeón incluye paneles, requerimientos, compras, aprobaciones y reportes.",
             ["Abrir grupo Mi Panel → dashboards disponibles", "Abrir Compras → ver el flujo completo", "Abrir Aprobaciones → Aprobación OC y por Área"],
             "02_dashboard_admin.png"),
            ("Aprobar requerimientos por área",
             "Cuando cubres a un jefe de área, apruebas sus requerimientos desde Aprobaciones por Área.",
             ["Menú Aprobaciones → Aprobaciones por Área", "Abrir un requerimiento pendiente", "Revisar ítems y cantidades", "Aprobar o Rechazar con motivo"],
             "16_aprobaciones_area.png"),
            ("Aprobar una Orden de Compra",
             "Las OC llegan a tu bandeja para validación.",
             ["Aprobaciones → Aprobación OC", "Abrir la OC", "Revisar líneas, montos y adjuntos", "Aprobar o Rechazar"],
             "18_aprobaciones_oc.png"),
            ("Consola de administración",
             "En /admin-logistica gestionas usuarios (todos menos TILOGIST), áreas, flujos de aprobación, permisos y parámetros.",
             ["Login en /admin-logistica", "Pestaña Usuarios → crear usuario", "Pestaña Flujo Aprobación Área → definir aprobadores", "Pestaña Permisos por Rol → ajustar claves"],
             "09_admin_logistica.png"),
            ("Cierre",
             "Ya conoces las dos caras de tu rol: operar el flujo y administrar la configuración. Consulta el manual escrito para el detalle.",
             [], None),
        ],
    },
    "JLOLOGIST": {
        "titulo": "Jefe de Logística",
        "accent": "#7c3aed",
        "duracion": "~9 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido, Jefe de Logística. Tú supervisas el ciclo completo: apruebas requerimientos, órdenes y gestionas compras.",
             [], None),
            ("Inicio y tu dashboard",
             "Al entrar verás el Dashboard Logística con los pendientes del área.",
             ["Login normal", "Revisar indicadores del dashboard", "Abrir el menú acordeón lateral"],
             "35_dashboard_logistica.png"),
            ("Tu menú acordeón",
             "Tu menú es especial: grupos colapsables con todo el flujo logístico.",
             ["Recorrer: Panel, Configuración, Requerimientos, Compras, Almacén, Aprobaciones, Reportes", "El grupo activo se abre solo según la pantalla"],
             None),
            ("Aprobar requerimientos por área",
             "Aprueba o rechaza los requerimientos que te llegan de las áreas.",
             ["Aprobaciones → Aprobaciones por Área", "Abrir pendiente → revisar", "Aprobar o Rechazar con motivo"],
             "16_aprobaciones_area.png"),
            ("Consolidar y generar OC",
             "Consolida líneas aprobadas, cotiza y genera la Orden de Compra.",
             ["Compras → Consolidación Compras → seleccionar líneas", "Cotizaciones → registrar y elegir ganadora", "Órdenes de Compra → generar y enviar a aprobación"],
             "38_consolidacion_compras.png"),
            ("Aprobar OC y OS",
             "Como jefatura también decides sobre las órdenes.",
             ["Aprobación OC → revisar y decidir", "Aprobación OS → mismo flujo"],
             "19_aprobaciones_os.png"),
            ("Crear usuarios operativos",
             "Desde la consola admin puedes crear usuarios de roles operativos.",
             ["Entrar a /admin-logistica/login", "Pestaña Usuarios → Nuevo", "Roles disponibles: LOLOGIST, EMLOGIST, ALLOGIST, OPLOGIST, APLOGIST"],
             "09_admin_logistica.png"),
            ("Cierre",
             "Supervisas el flujo de punta a punta. Los reportes te ayudan a dar seguimiento diario.",
             ["Reportes → Reportes de Compras para seguimiento"],
             "47_reportes_compras.png"),
        ],
    },
    "JEMLOGIST": {
        "titulo": "Jefe de Licitaciones",
        "accent": "#0d9488",
        "duracion": "~6 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido, Jefe de Licitaciones. Tu función central es aprobar las órdenes de compra y servicio del flujo.",
             [], None),
            ("Inicio y dashboard",
             "Entras al Dashboard de Jefatura de Licitaciones con tus pendientes.",
             ["Login", "Revisar OC/OS pendientes e indicadores"],
             "52_dashboard_jemlogist.png"),
            ("Aprobar Orden de Compra",
             "Revisa y decide sobre las OC que llegan a tu bandeja.",
             ["Aprobaciones → Aprobación OC", "Abrir la OC", "Verificar proveedor, montos y adjuntos", "Aprobar o Rechazar con motivo"],
             "18_aprobaciones_oc.png"),
            ("Aprobar Orden de Servicio",
             "El mismo procedimiento aplica para las Órdenes de Servicio.",
             ["Aprobaciones → Aprobación OS", "Revisar detalle del servicio", "Decidir"],
             "19_aprobaciones_os.png"),
            ("Conformidad de servicios",
             "Cuando un servicio se ejecuta, registras la conformidad.",
             ["Conformidad de Servicios → seleccionar OS", "Confirmar cantidades y fechas"],
             "46_conformidad_servicios.png"),
            ("Cierre",
             "Tu aprobación mantiene el flujo andando. Usa el dashboard para priorizar.",
             [], None),
        ],
    },
    "LOLOGIST": {
        "titulo": "Operador Logística",
        "accent": "#2563eb",
        "duracion": "~10 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido, Operador de Logística. Eres quien ejecuta el ciclo completo: compras y almacén.",
             [], None),
            ("Inicio y dashboard",
             "Entras al Dashboard Logística: requerimientos aprobados por consolidar, compras en curso y alertas.",
             ["Login", "Identificar pendientes de consolidación", "Revisar notificaciones"],
             "35_dashboard_logistica.png"),
            ("Consolidar requerimientos",
             "Agrupa las líneas aprobadas para comprar.",
             ["Consolidación Requerimientos → seleccionar líneas aprobadas", "Consolidación Corporativa si aplica multiempresa"],
             "37_consolidacion_requerimientos.png"),
            ("Solicitud de Compra y cotización",
             "Genera la SC, registra cotizaciones y elige ganadora.",
             ["Solicitudes de Compra → crear con adjuntos", "Cotizaciones → registrar ofertas y seleccionar"],
             "41_cotizaciones.png"),
            ("Generar la Orden de Compra",
             "Emite la OC y envíala a aprobación.",
             ["Órdenes de Compra → generar desde cotización/SC", "Adjuntar documentos → enviar a aprobar", "Seguir estado hasta aprobada"],
             "42_ordenes_compra.png"),
            ("Recepción de mercadería",
             "Cuando el proveedor entrega, recepcionas contra la OC.",
             ["Recepción de Mercadería → buscar OC aprobada", "Ingresar cantidades, lotes y documentos", "Confirmar → actualiza stock y kardex"],
             "24_recepcion_mercaderia.png"),
            ("Despacho y kardex",
             "Despachas al solicitante y controlas el inventario.",
             ["Despachos → confirmar salida", "Kardex → revisar movimientos", "Transferencias / Devoluciones según necesidad"],
             "23_despachos.png"),
            ("Reportes y cierre",
             "Cierra el día revisando los reportes de compras y saldos.",
             ["Reportes de Compras", "Reporte de Saldos / Despachos"],
             "47_reportes_compras.png"),
        ],
    },
    "EMLOGIST": {
        "titulo": "Operador Licitaciones",
        "accent": "#0891b2",
        "duracion": "~7 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido, Operador de Licitaciones y Empaque. Creas requerimientos y haces seguimiento de tus solicitudes.",
             [], None),
            ("Inicio de sesión y sincronización",
             "Antes de crear requerimientos debes sincronizar las maestras en Parámetros.",
             ["Login", "Parámetros → Sincronizar", "Esperar a que descarguen las maestras"],
             "05_parametros.png"),
            ("Tu panel",
             "El Dashboard Operativo muestra el estado de tus requerimientos.",
             ["Ver pendientes, aprobados y en compra"],
             "12_dashboard_operativo.png"),
            ("Crear un requerimiento",
             "Crea solicitudes de ítems, commodities, activos fijos o menores.",
             ["Requerimientos → Nuevo", "Elegir tipo y completar cabecera", "Agregar líneas con cantidades", "Guardar y sincronizar"],
             "13_requerimientos.png"),
            ("Conformidades y devoluciones",
             "Confirma lo que recibes y devuelve lo que no uses.",
             ["Conformidad de Despacho → confirmar recepción", "Conformidad de Servicios → conformar servicio", "Devoluciones de Consumo → devolver material"],
             "25_conformidad_almacen.png"),
            ("Reingresos",
             "Material que retorna al almacén se registra como reingreso, aprobado por el jefe de área.",
             ["Reingresos → nuevo reingreso", "Seguimiento hasta aprobación"],
             "31_reingresos.png"),
            ("Cierre y buenas prácticas",
             "Sincroniza siempre antes de salir: el sistema no te deja cerrar sesión con pendientes.",
             ["Sincronizar pendientes", "Cerrar sesión"],
             None),
        ],
    },
    "ALLOGIST": {
        "titulo": "Almacén",
        "accent": "#ca8a04",
        "duracion": "~9 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido al tutorial del rol Almacén. Operas la parte física: despachos, recepciones, kardex e inventario.",
             [], None),
            ("Inicio — Gestión de Despachos",
             "Tu pantalla inicial es la Gestión de Despachos: lo que está listo para salir.",
             ["Login → entras directo a Despachos", "Revisar despachos pendientes"],
             "23_despachos.png"),
            ("Despachar material",
             "Confirma la salida de material contra el requerimiento aprobado.",
             ["Abrir despacho pendiente", "Verificar stock disponible", "Confirmar despacho"],
             "22_dashboard_despacho.png"),
            ("Recepción de mercadería",
             "Recepciona las OC aprobadas cuando llega el proveedor.",
             ["Recepción de Mercadería → buscar OC", "Ingresar cantidades y lotes", "Confirmar → entra a stock"],
             "24_recepcion_mercaderia.png"),
            ("Kardex e inventario",
             "Controla movimientos y saldos por ítem.",
             ["Kardex → filtrar por ítem/almacén", "Gestión de Inventario → ajustes y conteos", "Listas de Stock → listas predefinidas"],
             "26_kardex.png"),
            ("Transferencias y devoluciones",
             "Mueve stock entre almacenes y procesa devoluciones.",
             ["Transferencias → origen y destino", "Devoluciones a Proveedores → registrar", "Devoluciones de Consumo → aprobar/rechazar (eres jefe de almacén)"],
             "32_transferencias_almacen.png"),
            ("Reingresos y evaluación",
             "Procesa reingresos y evalúa a los proveedores.",
             ["Reingresos → procesar material que retorna", "Evaluación de Proveedores → calificar por criterio"],
             "07_evaluacion_proveedores.png"),
            ("Reportes y cierre",
             "Usa los reportes de saldos y despachos para el control diario.",
             ["Reporte de Saldos", "Reporte de Despachos"],
             "34_reporte_despachos.png"),
        ],
    },
    "OPLOGIST": {
        "titulo": "Operativo Campo",
        "accent": "#16a34a",
        "duracion": "~7 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido, usuario de campo. Aquí aprenderás a crear requerimientos y dar seguimiento, incluso sin internet.",
             [], None),
            ("Sincronizar primero",
             "Antes de todo, sincroniza las maestras en Parámetros. Sin eso no puedes crear requerimientos.",
             ["Login", "Parámetros → Sincronizar", "Verificar descarga de ítems, almacenes, centros de costo"],
             "05_parametros.png"),
            ("Tu panel — Mis Requerimientos",
             "Tu pantalla inicial muestra el estado de tus solicitudes.",
             ["Ver estados: pendiente, aprobado, en compra, despachado"],
             "12_dashboard_operativo.png"),
            ("Crear un requerimiento",
             "Solicita ítems, commodities, activos fijos o menores.",
             ["Requerimientos → Nuevo", "Tipo + cabecera (área, almacén, fecha, glosa)", "Agregar líneas con cantidades", "Guardar"],
             "13_requerimientos.png"),
            ("Trabajo sin internet",
             "Todo se guarda localmente. Cuando recuperes señal, sincroniza.",
             ["Crear offline normal", "Sincronizar desde Parámetros al tener red", "El sistema bloquea el cierre de sesión si hay pendientes"],
             None),
            ("Conformidad y devoluciones",
             "Cuando te despachan, confirma la recepción. Lo que no uses, devuélvelo.",
             ["Conformidad de Despacho → confirmar cantidades", "Devoluciones de Consumo → devolver material", "Reingresos → material que retorna al almacén"],
             "25_conformidad_almacen.png"),
            ("Cierre",
             "Listo. Recuerda: sincroniza al entrar y antes de salir.",
             [], None),
        ],
    },
    "APLOGIST": {
        "titulo": "Aprobador Consumo / Jefe de Área",
        "accent": "#9333ea",
        "duracion": "~6 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido, Jefe de Área. Los requerimientos de tu equipo llegan a tu bandeja para aprobación.",
             [], None),
            ("Tu dashboard de aprobaciones",
             "Entras al Dashboard de Aprobaciones por Área con tus contadores.",
             ["Login", "Ver pendientes, aprobados y rechazados de tu área"],
             "15_dashboard_aprobaciones_area.png"),
            ("Aprobar un requerimiento",
             "Revisa y decide cada solicitud de tu área.",
             ["Aprobaciones por Área → abrir pendiente", "Revisar ítems, cantidades, centro de costo, adjuntos", "Aprobar → avanza a compras · Rechazar → con motivo, vuelve al solicitante"],
             "16_aprobaciones_area.png"),
            ("Aprobar reingresos",
             "Los reingresos de material también pasan por ti.",
             ["Reingresos → abrir solicitud", "Revisar y decidir"],
             "31_reingresos.png"),
            ("Reportes de tu gestión",
             "Consulta el historial y la trazabilidad de tus decisiones.",
             ["Reporte Aprobaciones Área → filtrar por fecha/estado", "Reporte Requerimientos Aprobados"],
             "20_reporte_aprobaciones_area.png"),
            ("Cierre",
             "Tu aprobación es el primer filtro del proceso. Revisa la bandeja al menos una vez al día.",
             [], None),
        ],
    },
    "FINANZAS": {
        "titulo": "Finanzas",
        "accent": "#475569",
        "duracion": "~5 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido, área de Finanzas. Tu rol es el control presupuestal de las órdenes.",
             [], None),
            ("Dashboard Finanzas",
             "Tu pantalla inicial: montos pendientes y estado de las órdenes.",
             ["Login → Dashboard Finanzas", "Identificar OC/OS pendientes de aprobación"],
             "53_dashboard_finanzas.png"),
            ("Aprobar Orden de Compra",
             "Valida montos, moneda y respaldo presupuestal.",
             ["Aprobación OC → abrir orden", "Revisar proveedor, líneas y total", "Aprobar o Rechazar con motivo"],
             "18_aprobaciones_oc.png"),
            ("Aprobar Orden de Servicio",
             "El mismo control aplica a los servicios.",
             ["Aprobación OS → revisar detalle y monto", "Decidir"],
             "19_aprobaciones_os.png"),
            ("Cierre",
             "Tu aprobación habilita la emisión de la orden. Consulta los reportes abiertos cuando lo necesites.",
             [], None),
        ],
    },
    "ADMINPANEL": {
        "titulo": "Panel de Administración",
        "accent": "#be185d",
        "duracion": "~10 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido al video tutorial del panel de administración del Sistema Logística. Aquí recorreremos las dos consolas: la administración clásica y la consola Admin Logística.",
             [], None),
            ("Las dos puertas de entrada",
             "Hay dos accesos administrativos: /admin-login para la administración clásica, y /admin-logistica/login para la consola moderna. Cada una tiene su propia sesión.",
             ["Abrir /admin-login e ingresar con credenciales de administrador", "Esto genera el token que habilita /administracion", "Para la consola moderna: /admin-logistica/login con tu usuario"],
             "01_login.png"),
            ("Administración clásica",
             "El módulo /administracion reúne la configuración histórica del sistema en un layout con menú propio.",
             ["Dashboard del módulo", "Usuarios, Roles, Perfiles", "Áreas y Usuarios por Área", "Flujos y Aprobadores"],
             "10_administracion.png"),
            ("Correo, plantillas y branding",
             "Desde la administración clásica se configura todo lo visual y el envío de correos.",
             ["Config SMTP: servidor de correo saliente", "Plantilla de Correo y Plantilla PDF de órdenes", "Proveedores Email", "Configuración de Colores y Branding por empresa"],
             None),
            ("Menús dinámicos por rol",
             "Aquí se edita el menú que verá cada rol en la app: grupos, ítems, iconos y rutas.",
             ["Menús Layout: tipo accordion, nav o list", "Menús Dinámicos: editor del MENU_JSON", "Permisos Menú Dinámico e ITEMS_VISIBLES", "Plantillas de Menú para aplicar a varios roles"],
             None),
            ("Consola Admin Logística",
             "La consola moderna en /admin-logistica tiene 21 pestañas controladas por permisos ADMINLG.",
             ["Dashboard con contadores de pendientes", "Bandeja de Aprobaciones unificada", "Aprobar Consumo, Solicitud de Compra y Solicitud de Servicio"],
             "09_admin_logistica.png"),
            ("Usuarios y estructura",
             "Desde la consola creas usuarios según tu rol y defines la estructura de áreas.",
             ["Usuarios: crear cuenta y asignar rol", "Áreas: crear áreas organizacionales", "Usuarios por Área: qué jefe aprueba cada área", "Flujo Aprobación Área: niveles por tipo de requerimiento"],
             "06_aprobadores.png"),
            ("Configuración funcional",
             "Las pestañas de configuración ajustan el comportamiento del módulo.",
             ["Empresa: RUC y razón social", "Parámetros: moneda y valores por defecto", "Formato PDF: signatarios de la orden", "Incremento OC: porcentaje permitido con control de versiones"],
             "05_parametros.png"),
            ("Permisos por rol y auditoría",
             "Controla qué pestañas de la consola ve cada rol y audita todas las acciones.",
             ["Permisos por Rol: activar o quitar claves ADMINLG", "Auditoría: filtrar por creación, actualización, eliminación, aprobación", "Migrar Adjuntos: utilidad de migración de archivos"],
             None),
            ("Cierre",
             "Regla práctica: correo, branding y menús se configuran en la administración clásica. Aprobaciones, usuarios por área y permisos de consola, en Admin Logística.",
             [], None),
        ],
    },
    "GERENTE": {
        "titulo": "Gerente",
        "accent": "#b91c1c",
        "duracion": "~5 min",
        "slides": [
            ("Bienvenida",
             "Bienvenido. Como Gerencia das el visto bueno final a las órdenes más relevantes.",
             [], None),
            ("Acceso y menú",
             "Tu menú lo configura el administrador: normalmente Dashboard, Aprobaciones y Reportes.",
             ["Login", "Si no ves menú, solicita a TI la configuración"],
             "01_login.png"),
            ("Aprobar Orden de Compra",
             "Revisa y decide las OC pendientes de tu nivel.",
             ["Aprobación OC → abrir orden", "Ver proveedor, montos y cotizaciones adjuntas", "Aprobar o Rechazar con motivo"],
             "18_aprobaciones_oc.png"),
            ("Aprobar Orden de Servicio y Dashboard",
             "También decides sobre servicios y supervisas indicadores financieros.",
             ["Aprobación OS", "Dashboard Finanzas → indicadores de gasto"],
             "53_dashboard_finanzas.png"),
            ("Cierre",
             "Tu firma cierra el ciclo de aprobación. Los reportes te dan la vista consolidada.",
             [], None),
        ],
    },
}

# ---------------------------------------------------------------------------
# Generación
# ---------------------------------------------------------------------------

def slide_html(idx, escena, locucion, pasos, imagen):
    pasos_html = ""
    if pasos:
        lis = "\n".join(f"          <li>{p}</li>" for p in pasos)
        pasos_html = f"""<div class="pasos"><h3>En pantalla</h3><ol>
{lis}
        </ol></div>"""
    img_html = ""
    if imagen:
        img_html = f'<img class="captura" src="{IMG.format(file=imagen)}" alt="{escena}" onerror="this.outerHTML=\'<div class=captura-missing>Captura: {imagen}</div>\'">'
    return f"""<section class="slide">
    <div class="escena">Escena {idx}</div>
    <h2>{escena}</h2>
    <div class="contenido">
      <div class="col-izq">
        <div class="locucion"><p>{locucion}</p></div>
        {pasos_html}
      </div>
      <div class="col-der">{img_html}</div>
    </div>
  </section>"""


def generar():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    generados = []
    for idrol, data in ROLES.items():
        slides_html = "\n".join(
            slide_html(i + 1, s[0], s[1], s[2], s[3])
            for i, s in enumerate(data["slides"])
        )
        html = (TEMPLATE
                .replace("{accent}", data["accent"])
                .replace("{{", "{").replace("}}", "}")
                .replace("__TITULO_ROL__", data["titulo"])
                .replace("__IDROL__", idrol)
                .replace("__DURACION__", data["duracion"])
                .replace("__SLIDES__", slides_html))
        fname = f"VIDEO_TUTORIAL_{idrol}.html"
        with open(os.path.join(out_dir, fname), "w", encoding="utf-8") as f:
            f.write(html)
        generados.append((idrol, data["titulo"], data["duracion"], fname))
        print(f"  OK {fname}")

    # index.html hub
    cards = "\n".join(
        f'''    <div class="card" style="border-top-color:{ROLES[r]["accent"]}">
      <a class="card-main" href="{fn}">
        <span class="code" style="background:{ROLES[r]["accent"]}">{r}</span>
        <strong>{t}</strong><small>Duración: {d}</small>
        <span class="go">Ver tutorial →</span></a>
      <a class="mp4" href="mp4/VIDEO_TUTORIAL_{r}.mp4">🎬 Descargar MP4 narrado</a>
    </div>'''
        for r, t, d, fn in generados)
    index = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Video Tutoriales — Sistema Logística</title>
<style>
  body{{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:40px}}
  h1{{margin-bottom:8px}} p{{color:#94a3b8;margin-bottom:32px}}
  .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}}
  .card{{display:flex;flex-direction:column;justify-content:space-between;gap:10px;background:#1e293b;border-radius:12px;
        padding:20px;border-top:4px solid #fff}}
  .card:hover{{background:#263349}}
  .card-main{{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:#e2e8f0}}
  .code{{align-self:flex-start;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:5px}}
  .card small{{color:#94a3b8}} .go{{color:#60a5fa;font-size:13px;margin-top:6px}}
  .mp4{{color:#34d399;font-size:13px;text-decoration:none}} .mp4:hover{{text-decoration:underline}}
</style></head><body>
<h1>Video Tutoriales — Sistema Logística</h1>
<p>Presentaciones interactivas por rol. Usa ← → para navegar, Espacio para avanzar, P para reproducción automática.</p>
<div class="grid">
{cards}
</div></body></html>"""
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(index)
    print("  OK index.html")


if __name__ == "__main__":
    generar()
