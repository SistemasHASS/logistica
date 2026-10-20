# Documentación de Roles — Sistema Logística

Paquete completo de documentación y capacitación, generado desde el código fuente (guards, rutas, permisos en BD).

**Portal navegable:** abrir [`index.html`](index.html) en el navegador, o levantar el servidor local para ver **también los Word/Markdown dentro del navegador**.

**Para usuarios finales:** [`portal-usuario.html`](portal-usuario.html) — centro de ayuda orientado al usuario: selecciona su rol (o entra directo con `#CODIGO_ROL`, p.ej. `#LOLOGIST`) y obtiene su video, tutorial, manual y tarjeta rápida. Publicado en IIS: `https://<servidor>:7642/documentacion/docs/manuales-roles/portal-usuario.html`

## Distribuir a usuarios finales

| Opción | Archivo | Requiere |
|---|---|---|
| **Ejecutable (recomendado)** | `../../VisorDocumentacion.exe` (raíz del proyecto) | Nada — un solo archivo de ~61 MB con TODA la documentación embebida (docs/ + archivos de la raíz). Doble clic → abre el portal. |
| Lanzador automático | [`../SERVIR_DOCUMENTACION.bat`](../SERVIR_DOCUMENTACION.bat) | Intenta exe → Python → PowerShell, lo que haya |
| Solo PowerShell | [`../servidor_docs.ps1`](../servidor_docs.ps1) | Nada (PowerShell viene con Windows) |
| Solo Python | [`../servidor_docs.py`](../servidor_docs.py) | Python 3 |

**Para distribuir:** copia `VisorDocumentacion.exe` a cualquier PC/carpeta compartida → el usuario hace doble clic → se abre `http://localhost:8791` con todo navegable (manuales, Word en el visor, videos, diagramas). También puedes poner el exe **dentro de una carpeta `docs/` actualizada** y usará esos archivos en vez de los embebidos.

**Recompilar el exe** tras actualizar documentación (desde la raíz del proyecto):
```
pyinstaller --onefile --name VisorDocumentacion ^
  --add-data "docs;proj/docs" ^
  --add-data "INFORME_SISTEMA_LOGISTICA_SOPORTE_TI.docx;proj" ^
  --add-data "INFORME_SISTEMA_LOGISTICA_SOPORTE_TI.md;proj" ^
  --add-data "IMPLEMENTACION_DESPACHOS.md;proj" ^
  --add-data "IMPLEMENTACION_FRONTEND_ADMIN.md;proj" ^
  --add-data "README.md;proj" ^
  --clean docs/servidor_docs.py
```

## Contenido

### Empieza aquí

| Recurso | Ubicación |
|---|---|
| Guía de primeros pasos (onboarding) | [GUIA_PRIMEROS_PASOS.md](GUIA_PRIMEROS_PASOS.md) |
| Video: Introducción al sistema | [VIDEO_TUTORIAL_GENERAL.mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_GENERAL.mp4) |
| Video: Flujo completo del proceso | [VIDEO_TUTORIAL_FLUJO.mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_FLUJO.mp4) |
| Diagrama del flujo (imprimible) | [diagrama-flujo.svg](diagrama-flujo.svg) · [png](diagrama-flujo.png) |
| Flujo interactivo (clic por paso) | [flujo-interactivo.html](flujo-interactivo.html) |

### Manuales

| Recurso | Ubicación |
|---|---|
| Manual completo de todos los roles | [MANUAL_ROLES_SISTEMA_COMPLETO.md](MANUAL_ROLES_SISTEMA_COMPLETO.md) |
| Consola `/admin-logistica` (21 pestañas) | [MANUAL_CONSOLA_ADMIN_LOGISTICA.md](MANUAL_CONSOLA_ADMIN_LOGISTICA.md) |
| Administración clásica `/administracion` | [MANUAL_ADMINISTRACION_CLASICA.md](MANUAL_ADMINISTRACION_CLASICA.md) |
| Manuales individuales por rol (11) | [roles/](roles/) |
| Versiones Word (.docx) de todo | [docx/](docx/) |
| Versiones HTML navegables (18) | [html-manuales/](html-manuales/) |

### Visores en el navegador

| Visor | Uso |
|---|---|
| [visor-docx.html](visor-docx.html) | Renderiza cualquier `.docx` en el navegador: `visor-docx.html?doc=docx/MANUAL.docx` (también rutas `../` a docs raíz) |
| [visor-md.html](visor-md.html) | Renderiza cualquier `.md` con formato: `visor-md.html?doc=MANUAL.md` |

### Referencia rápida

| Recurso | Ubicación |
|---|---|
| Cheat sheets imprimibles por rol | [cheat-sheets.html](cheat-sheets.html) |
| FAQ y troubleshooting | [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) |
| Glosario (navegable + texto) | [glosario.html](glosario.html) · [GLOSARIO.md](GLOSARIO.md) |
| **Anexo: inventario documental** | [anexo.html](anexo.html) |

## Roles del sistema

| Código | Rol | Manual | Tutorial HTML | Video MP4 |
|---|---|---|---|---|
| TILOGIST | Admin Sistema | [manual](roles/MANUAL_ROL_TILOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_TILOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_TILOGIST.mp4) |
| ADLOGIST | Admin Logística | [manual](roles/MANUAL_ROL_ADLOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_ADLOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_ADLOGIST.mp4) |
| JLOLOGIST | Jefe Logística | [manual](roles/MANUAL_ROL_JLOLOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_JLOLOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_JLOLOGIST.mp4) |
| JEMLOGIST | Jefe Licitaciones | [manual](roles/MANUAL_ROL_JEMLOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_JEMLOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_JEMLOGIST.mp4) |
| LOLOGIST | Operador Logística | [manual](roles/MANUAL_ROL_LOLOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_LOLOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_LOLOGIST.mp4) |
| EMLOGIST | Operador Licitaciones | [manual](roles/MANUAL_ROL_EMLOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_EMLOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_EMLOGIST.mp4) |
| ALLOGIST | Almacén | [manual](roles/MANUAL_ROL_ALLOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_ALLOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_ALLOGIST.mp4) |
| OPLOGIST | Operativo Campo | [manual](roles/MANUAL_ROL_OPLOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_OPLOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_OPLOGIST.mp4) |
| APLOGIST | Aprobador Consumo | [manual](roles/MANUAL_ROL_APLOGIST.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_APLOGIST.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_APLOGIST.mp4) |
| FINANZAS | Finanzas | [manual](roles/MANUAL_ROL_FINANZAS.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_FINANZAS.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_FINANZAS.mp4) |
| GERENTE | Gerente | [manual](roles/MANUAL_ROL_GERENTE.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_GERENTE.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_GERENTE.mp4) |
| ADMINPANEL | Panel Administración | [consola](MANUAL_CONSOLA_ADMIN_LOGISTICA.md) · [clásica](MANUAL_ADMINISTRACION_CLASICA.md) | [ver](video-tutoriales/VIDEO_TUTORIAL_ADMINPANEL.html) | [mp4](video-tutoriales/mp4/VIDEO_TUTORIAL_ADMINPANEL.mp4) |

## Regenerar

```
cd docs/manuales-roles
python video-tutoriales/generar_videos.py           # tutoriales HTML + index
python video-tutoriales/generar_videos_reales.py    # MP4 narrados (ffmpeg + edge-tts)
python docx/convertir_a_docx.py                     # md -> docx (pypandoc-binary)
python generar_html_manuales.py                     # md -> html-manuales/ (pypandoc)
```

## Fuentes

`src/app/app.routes.ts` · `src/app/modules/auth/guard/*` · `src/app/modules/main/guards/role.guard.ts` · `src/app/modules/admin-logistica/*` · `LOGISTICA_ConfiguracionPermiso` · capturas en `docs/capturas_manual/`.
