import { ConformidadServicioPdfService } from './conformidad-servicio-pdf.service';

describe('ConformidadServicioPdfService', () => {
  const svc = new ConformidadServicioPdfService();
  const empresa = { ruc: 'test-conformidad', razonSocial: 'Empresa', logoBase64: '', direccion: '', telefono: '' };

  it('representa fecha, resultado, observaciones e importes reales sin asumir IGV', () => {
    const html = svc.buildHtml({ fechaOS: '2026-11-09', estadoConformidad: 'NO_CONFORME',
      observacionesConformidad: 'Servicio incompleto', montoNeto: 100, montoIgv: 0, montoTotal: 100 }, empresa);
    expect(html).toContain('2026-11-09');
    expect(html).toContain('No Conforme');
    expect(html).toContain('Servicio incompleto');
    expect(html).toContain('100.00');
    expect(html).not.toContain('18.00');
  });

  it('instala el manejador de impresion despues de abrir el documento', () => {
    const win = { onload: null, focus: jasmine.createSpy('focus'), print: jasmine.createSpy('print'),
      document: { open: () => { win.onload = null; }, write: jasmine.createSpy('write'),
        close: () => { (win.onload as (() => void) | null)?.(); }, title: '' }
    };
    svc.imprimirConformidad('<html></html>', 'Conformidad', win as unknown as Window);
    expect(win.print).toHaveBeenCalled();
    expect(win.document.title).toBe('Conformidad');
  });

  it('recupera firmaBase64 y escapa contenido del servicio', () => {
    const html = svc.buildHtml({ firmaBase64: 'data:image/png;base64,YQ==',
      descripcion: '<script>bad()</script>', observacionesConformidad: '<img onerror="bad()">',
      items: [{ descripcionServicio: '<b>Servicio</b>' }] }, empresa);
    expect(html).toContain('src="data:image/png;base64,YQ=="');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>bad()');
    expect(html).toContain('&lt;b&gt;Servicio&lt;/b&gt;');
  });
});
