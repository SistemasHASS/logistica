import { Injectable } from '@angular/core';
import { ConformidadNota } from './conformidad-almacen.service';
import { PlantillaAlmacen } from '@/app/modules/admin-logistica/tabs/almacen/almacen.component';

@Injectable({ providedIn: 'root' })
export class ConformidadPdfService {

  /**
   * Genera el HTML del documento de conformidad con las dos firmas:
   * - Izquierda: firma predeterminada del almacenero (ALLOGIST), configurada en Admin Almacén
   * - Derecha: firma dibujada por quien da la conformidad (RECIBI CONFORME)
   */
  descargarPdf(nota: ConformidadNota, plantilla: PlantillaAlmacen | null, firmaConformidadBase64: string, nombreFirmante: string): void {
    const html = this.buildHtml(nota, plantilla, firmaConformidadBase64, nombreFirmante);
    const ventana = window.open('', '_blank', 'width=900,height=700');
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
    }, 600);
  }

  buildHtml(nota: ConformidadNota, plantilla: PlantillaAlmacen | null, firmaConformidadBase64: string, nombreFirmante: string): string {
    const firmaBase64 = firmaConformidadBase64;
    const firmante = nombreFirmante;
    const titulo = plantilla?.tituloDocumento
      ? plantilla.tituloDocumento.toUpperCase()
      : (nota.tipo === 'NI' ? 'NOTA DE INGRESO' : 'NOTA DE SALIDA');

    const estadoBadge = nota.estado === 'CONFORME'
      ? '<span style="background:#198754;color:#fff;padding:3px 12px;border-radius:4px;font-size:13px;font-weight:700">✔ CONFORME</span>'
      : '<span style="background:#dc3545;color:#fff;padding:3px 12px;border-radius:4px;font-size:13px;font-weight:700">✘ NO CONFORME</span>';

    const mostrarCantCompra  = plantilla?.mostrarCantidadCompra ?? true;
    const mostrarCantPend    = plantilla?.mostrarCantidadPendiente ?? false;
    const mostrarCodInterno  = plantilla?.mostrarCodInterno ?? false;
    const mostrarUbic        = plantilla?.mostrarUbicacionFisica ?? false;

    const thExtras = `
      ${mostrarUbic       ? '<th>Ubic. Física</th>' : ''}
      ${mostrarCodInterno ? '<th>Cód. Interno</th>' : ''}
    `;
    const tdExtras = (it: any) => `
      ${mostrarUbic       ? '<td style="text-align:center">--</td>' : ''}
      ${mostrarCodInterno ? `<td style="text-align:center">${it.codigo}</td>` : ''}
    `;

    const filas = nota.items.map(it => `
      <tr>
        <td style="text-align:center">${it.item}</td>
        <td style="text-align:center">${it.codigo}</td>
        ${tdExtras(it)}
        <td style="padding-left:6px">${it.descripcion}</td>
        <td style="text-align:center">${it.unidad}</td>
        ${nota.tipo === 'NI'
          ? `<td style="text-align:right">${it.cantidadDespachada}</td>
             ${mostrarCantCompra ? `<td style="text-align:right">${it.cantidadDespachada}</td>` : ''}
             ${mostrarCantPend   ? '<td style="text-align:right">0.00</td>' : ''}`
          : `<td style="text-align:right">${it.cantidadDespachada}</td>
             <td style="text-align:right">${it.cantidadRecibida ?? it.cantidadDespachada}</td>
             ${mostrarCantPend ? '<td style="text-align:right">0.00</td>' : ''}`
        }
        <td style="text-align:center">${it.ceco ?? '-'}</td>
      </tr>`).join('');

    const thCantidades = nota.tipo === 'NI'
      ? `<th>Cant. Ingreso</th>
         ${mostrarCantCompra ? '<th>Cant. Compra</th>' : ''}
         ${mostrarCantPend   ? '<th>Cant. Pendiente</th>' : ''}`
      : `<th>Cant. Salida</th>
         <th>Cant. Requerida</th>
         ${mostrarCantPend ? '<th>Cant. Pendiente</th>' : ''}`;

    // Datos de empresa (multiempresa)
    const razonSocialEmp = plantilla?.razonSocial || 'Hass Perú S.A.';
    const logoEmp        = plantilla?.logoEmpresaBase64 ?? '';
    const logoHtml       = logoEmp
      ? `<img src="${logoEmp.startsWith('data:') ? logoEmp : 'data:image/png;base64,' + logoEmp}"
              alt="Logo" style="max-height:55px;max-width:110px;object-fit:contain">`
      : '';

    // Firma izquierda: almacenero predeterminado (ALLOGIST) configurado en Admin Almacén
    const firmaAlmacenBase64   = plantilla?.firmaAlmacenBase64 ?? '';
    const nombreAlmacenero     = plantilla?.nombreAlmacenero ?? '';
    const dniAlmacenero        = plantilla?.dniAlmacenero ?? '';
    const rolAlmacenero        = plantilla?.firmante1 ?? 'ALMACEN';

    // Firma derecha: quien da la conformidad (LOLOGIST / OPLOGIST)
    const firma2Label = plantilla?.firmante2 ?? (nota.tipo === 'NI' ? 'RECIBI CONFORME' : 'RECIBI CONFORME');

    const fechaConf = nota.fechaConformidad
      ? nota.fechaConformidad.substring(0, 10).split('-').reverse().join('/')
      : new Date().toLocaleDateString('es-PE');

    const obsHtml = nota.observaciones
      ? `<div style="margin-top:8px;padding:6px 10px;background:#f8f9fa;border-left:3px solid #aaa;font-size:11px">
           <strong>Observaciones:</strong> ${nota.observaciones}
         </div>`
      : '';

    const pieHtml = plantilla?.piePagina
      ? `<div style="text-align:center;font-size:10px;color:#888;margin-top:12px;border-top:1px solid #ddd;padding-top:6px">${plantilla.piePagina}</div>`
      : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${titulo} — ${nota.numeroNota}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #222; background: #fff; padding: 20px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a3a6b; padding-bottom: 8px; margin-bottom: 10px; }
  .empresa { font-size: 15px; font-weight: 700; color: #1a3a6b; }
  .empresa-sub { font-size: 10px; color: #666; margin-top: 2px; }
  .doc-info { text-align: right; }
  .doc-titulo { font-size: 14px; font-weight: 700; color: #1a3a6b; letter-spacing: 0.5px; }
  .doc-numero { font-size: 12px; color: #333; margin-top: 3px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-bottom: 8px; padding: 6px 8px; background: #f4f7fb; border-radius: 4px; }
  .meta-row { display: flex; gap: 6px; font-size: 11px; }
  .meta-label { font-weight: 600; color: #444; min-width: 80px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px; }
  th { background: #1a3a6b; color: #fff; padding: 5px 6px; text-align: center; font-size: 10.5px; }
  td { padding: 4px 6px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f8faff; }
  .total-row td { font-weight: 600; background: #eef2f9 !important; border-top: 2px solid #1a3a6b; }
  .estado-row { margin: 8px 0; }
  .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
  .firma-box { text-align: center; }
  .firma-img { max-width: 180px; max-height: 80px; display: block; margin: 0 auto 4px; border-bottom: 1px solid #333; padding-bottom: 2px; }
  .firma-linea { border-top: 1px solid #333; width: 80%; margin: 48px auto 4px; }
  .firma-nombre { font-size: 11px; font-weight: 700; color: #222; }
  .firma-rol { font-size: 10px; color: #666; }
  .firma-fecha { font-size: 10px; color: #888; margin-top: 2px; }
  .btn-print { position: fixed; top: 16px; right: 16px; background: #1a3a6b; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; cursor: pointer; font-size: 13px; z-index: 999; }
  .btn-print:hover { background: #133060; }
</style>
</head>
<body>

<button class="btn-print no-print" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>

<!-- ENCABEZADO -->
<div class="header">
  <div style="display:flex;align-items:center;gap:12px">
    ${logoHtml}
    <div>
      <div class="empresa">${razonSocialEmp}</div>
      <div class="empresa-sub">Sistema de Logística</div>
    </div>
  </div>
  <div class="doc-info">
    <div class="doc-titulo">${titulo}</div>
    <div class="doc-numero">${nota.numeroNota}</div>
    <div style="margin-top:4px">${estadoBadge}</div>
  </div>
</div>

<!-- DATOS -->
<div class="meta">
  <div class="meta-row"><span class="meta-label">Fecha:</span> ${nota.fecha?.substring(0,10).split('-').reverse().join('/') ?? '-'}</div>
  <div class="meta-row"><span class="meta-label">Almacén:</span> ${nota.almacen}</div>
  <div class="meta-row"><span class="meta-label">Documento:</span> ${nota.referencia}</div>
  <div class="meta-row"><span class="meta-label">Área / Ref.:</span> ${nota.descripcionRef}</div>
</div>

<!-- TABLA ÍTEMS -->
<table>
  <thead>
    <tr>
      <th>#</th><th>Código</th>${thExtras}
      <th style="text-align:left;padding-left:6px">Descripción</th>
      <th>Unidad</th>
      ${thCantidades}
      <th>C.Costos</th>
    </tr>
  </thead>
  <tbody>
    ${filas}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="3" ${thExtras ? 'colspan="4"' : ''} style="text-align:right;font-size:10.5px">Total ítems:</td>
      <td style="text-align:center">${nota.items.length}</td>
      <td colspan="99"></td>
    </tr>
  </tfoot>
</table>

${obsHtml}

<!-- ESTADO -->
<div class="estado-row" style="margin-top:10px">
  <strong>Estado de conformidad:</strong>&nbsp;${estadoBadge}
  &nbsp;&nbsp; <strong>Fecha:</strong> ${fechaConf}
</div>

<!-- FIRMAS -->
<div class="firmas">
  <!-- IZQUIERDA: Almacenero (ALLOGIST) — firma predeterminada configurada en Admin Almacén -->
  <div class="firma-box">
    ${firmaAlmacenBase64
      ? `<img class="firma-img" src="${firmaAlmacenBase64}" alt="Firma almacenero">`
      : '<div class="firma-linea"></div>'
    }
    <div class="firma-nombre">${nombreAlmacenero || '___________________________'}</div>
    ${dniAlmacenero ? `<div class="firma-rol" style="font-weight:400;color:#555">DNI: ${dniAlmacenero}</div>` : ''}
    <div class="firma-rol">${rolAlmacenero}</div>
  </div>
  <!-- DERECHA: Quien da la conformidad (LOLOGIST / OPLOGIST) — firma dibujada en el modal -->
  <div class="firma-box">
    ${firmaBase64
      ? `<img class="firma-img" src="${firmaBase64}" alt="Firma conformidad">`
      : '<div class="firma-linea"></div>'
    }
    <div class="firma-nombre">${firmante}</div>
    <div class="firma-rol">${firma2Label}</div>
    ${firmaBase64 ? `<div class="firma-fecha">Firmado digitalmente el ${fechaConf}</div>` : ''}
  </div>
</div>

${pieHtml}

<div style="text-align:right;font-size:9px;color:#aaa;margin-top:12px">
  Documento generado el ${new Date().toLocaleDateString('es-PE')} — Sistema Logística
</div>

</body>
</html>`;
  }
}
