export default async function run(page, ui) {
  const ruc = '20000000001';
  const stockRequests = [];
  const mutaciones = [];
  const errores = [];
  let modoStock = 'ok';
  page.on('pageerror', error => errores.push(error.message));
  const detalles = [
    { id: 1, codigo: '000078', descripcionItem: 'Producto de prueba A', cantidad: 10 },
    { id: 2, codigo: '000079', descripcionItem: 'Producto de prueba B', cantidad: 15 },
    { id: 3, codigo: '000080', descripcionItem: 'Producto de prueba C', cantidad: 5 }
  ];
  const requerimientos = ['CONSUMO', 'COMPRA', 'SERVICIO'].map((itemtipo, index) => ({
    idrequerimiento: `QA-${index + 1}`, itemtipo, idclasificacion: itemtipo === 'SERVICIO' ? 'SER' : 'ITE',
    nombreSolicitante: `Solicitante ${itemtipo}`, nombreArea: 'Área de prueba', fecha: '2026-11-12',
    estados: 'APROBACION1', glosa: `Prueba ${itemtipo}`, detalles, ruc
  }));
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.includes('/api/')) {
      const body = request.postData() ? request.postDataJSON() : {};
      let data = [];
      if (url.pathname.endsWith('/get-fundos')) data = [{ id: 'QA-FUNDO', fundo: 'Fundo de prueba' }];
      if (url.pathname.endsWith('/get-items-cmmdty')) data = detalles.map((d, i) => ({ id: d.codigo, codigo: d.codigo, descripcion: d.descripcionItem, precio: [12, 8, 20][i] }));
      if (url.pathname.endsWith('/listar-item')) data = detalles.map(d => ({ item: d.codigo, descripcionLocal: d.descripcionItem }));
      if (url.pathname.endsWith('/obtener-requerimientos-pendientes-gerencia') || url.pathname.endsWith('/requerimientos-pendientes-area-detalle')) data = requerimientos;
      if (url.pathname.endsWith('/consultar-stock-detalle-aprobacion')) {
        stockRequests.push(body);
        if (modoStock === 'error') {
          await route.fulfill({ status: 500, contentType: 'application/json', body: '{"mensaje":"Error simulado"}' });
          return;
        }
        data = modoStock === 'sin-almacen' ? { estado: 'SIN_ALMACEN', idalmacen: '', items: [] }
          : { estado: 'OK', idalmacen: 'H001', items: detalles.map((d, i) => ({ codigo: d.codigo, stockActual: [25, 6, 0][i] })) };
      }
      if (/\/(aprobar-requerimiento|registra-requerimientos|generar-salida|registrar-despacho)/.test(url.pathname)) mutaciones.push(url.pathname);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      return;
    }
    if (url.hostname === '127.0.0.1' && url.port === '4201') await route.continue();
    else await route.fulfill({ status: 200, body: '' });
  });
  await page.addInitScript(() => {
    localStorage.setItem('admin_logistica_token', 'SESION_SINTETICA_SOLO_MOCK');
    localStorage.setItem('admin_logistica_user', JSON.stringify({ usuario: 'TEST_APROBADOR', nombre: 'Aprobador de prueba',
      idrol: 'GERENTE', rol: 'GERENTE', idempresa: '000008', ruc: '20000000001', token: 'SESION_SINTETICA_SOLO_MOCK' }));
  });
  await page.setViewportSize({ width: 1500, height: 950 });
  await page.goto('http://127.0.0.1:4201/#/admin-logistica/aprobar-gerencia');
  await page.locator('app-aprobaciones-area').waitFor();
  await page.getByRole('row').filter({ hasText: 'Solicitante CONSUMO' }).waitFor();
  await page.locator('.swal2-container').waitFor({ state: 'hidden' });
  const snapshotInicial = await ui.snapshot();
  const abrir = async tipo => {
    const row = page.getByRole('row').filter({ hasText: `Solicitante ${tipo}` });
    await row.getByRole('button', { name: 'Ver', exact: true }).click();
    await page.getByRole('dialog', { name: `Detalle del Requerimiento - ${tipo}`, exact: true }).waitFor();
    return page.getByRole('dialog', { name: `Detalle del Requerimiento - ${tipo}`, exact: true });
  };
  let dialog = await abrir('CONSUMO');
  await dialog.locator('tbody tr').first().getByRole('cell', { name: '25', exact: true }).waitFor();
  const headersConsumo = await dialog.locator('thead th').allTextContents();
  if (headersConsumo[4].trim() !== 'Stock actual' || headersConsumo.length !== 10) throw new Error('Columnas de consumo incorrectas');
  const stock = await dialog.locator('tbody .stock-detalle-columna').allTextContents();
  if (JSON.stringify(stock.map(s => s.trim())) !== JSON.stringify(['25', '6', '0'])) throw new Error('Stocks incorrectos');
  await dialog.getByRole('checkbox').nth(1).uncheck();
  const seleccion = await dialog.getByRole('checkbox').evaluateAll(elements => elements.map(e => e.checked));
  modoStock = 'error';
  await dialog.getByRole('button', { name: 'Actualizar stock', exact: true }).click();
  await dialog.getByText('No se pudo consultar el stock del almacén y empresa del requerimiento. Puedes reintentar.', { exact: true }).waitFor();
  if ((await dialog.locator('tbody .stock-detalle-columna').allTextContents()).some(t => t.trim() !== 'No disponible')) throw new Error('Un error aparece como stock cero');
  if (JSON.stringify(seleccion) !== JSON.stringify(await dialog.getByRole('checkbox').evaluateAll(elements => elements.map(e => e.checked)))) throw new Error('La consulta modificó la selección');
  if (!await dialog.getByRole('button', { name: 'Aprobar', exact: true }).last().isEnabled()) throw new Error('El error bloqueó la aprobación');
  modoStock = 'sin-almacen';
  await dialog.getByRole('button', { name: 'Actualizar stock', exact: true }).click();
  await dialog.getByText('No es posible consultar el stock: el requerimiento no tiene almacén.', { exact: true }).waitFor();
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  modoStock = 'ok';
  dialog = await abrir('COMPRA');
  await dialog.locator('tbody tr').first().getByRole('cell', { name: '25', exact: true }).waitFor();
  if (await dialog.locator('thead th').count() !== 12) throw new Error('Columnas de compra incorrectas');
  const total = await dialog.locator('tfoot').innerText();
  if (!total.includes('340')) throw new Error(`Total de compra incorrecto: ${total}`);
  if (await dialog.locator('tfoot td').first().getAttribute('colspan') !== '10') throw new Error('Pie de compra desalineado');
  await page.setViewportSize({ width: 390, height: 844 });
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  const consultasAntesServicio = stockRequests.length;
  dialog = await abrir('SERVICIO');
  if (await dialog.getByRole('columnheader', { name: 'Stock actual', exact: true }).count()) throw new Error('Servicio muestra stock');
  if (await dialog.getByRole('button', { name: 'Actualizar stock', exact: true }).count()) throw new Error('Servicio permite consultar stock');
  if (stockRequests.length !== consultasAntesServicio) throw new Error('Servicio consultó stock');
  if (mutaciones.length) throw new Error(`La consulta provocó mutaciones: ${mutaciones.join(', ')}`);
  if (stockRequests.some(r => r.ruc !== ruc || r.documentoidentidad !== 'TEST_APROBADOR' || !r.modoGerencia)) throw new Error('Contexto de stock incorrecto');
  if (errores.length) throw new Error(errores.join('\n'));
  return { resultado: 'Interfaz verificada con todas las APIs simuladas', consultasStock: stockRequests.length,
    consumo: stock.map(s => s.trim()), compra: total, sinStockEnServicios: true,
    seleccionConservada: true, aprobacionNoBloqueada: true, mutaciones, erroresJavaScript: errores,
    desbordeMovil: desborde, snapshotInicial };
}
