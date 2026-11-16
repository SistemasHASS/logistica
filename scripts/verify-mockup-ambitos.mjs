export default async function run(page, ui) {
  const checks = [], errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (new URL(r.url()).origin !== 'http://127.0.0.1:4310') external.push(r.url()); });
  const assert = (ok, name) => { if (!ok) throw Error(name); checks.push(name); };
  const tab = n => page.locator('#navigation button').nth(n).click();
  const scope = id => page.locator(`[data-scope="${id}"]`).click();
  const click = name => page.getByRole('button', { name, exact: true }).click();
  const simulate = () => click('Simular ruta');
  const result = () => page.locator('#simulation-result').innerText();
  const toast = () => page.locator('#toast').innerText();
  const snapshot = () => page.locator('#content details pre').first().textContent();
  await page.getByRole('heading', { name: 'Así se configura una aprobación.', exact: true }).waitFor();
  await ui.snapshot();
  assert(await page.locator('#company-select option').count() === 5, 'Las cinco empresas proceden del maestro real');
  assert((await page.locator('.notice').innerText()).includes('11/11/2026'), 'La copia informa fecha y separación entre catálogo real y reglas de ejemplo');
  const cases = [
    ['20481121966', '000008', 1, 'fundo-1-1', '1:1', '0801', 'Fundo Hass - Dm'],
    ['20610773274', '000006', 2, 'fundo-2-2', '2:2', '0601', 'Fundo Berry - Dg'],
    ['20563196387', '000010', 4, 'fundo-4-3', '4:3', '1001', 'Fundo Cao - Cs']
  ];
  for (const [ruc, idempresa, empresa, id, key, code, name] of cases) {
    await page.locator('#company-select').selectOption(ruc);
    assert(await page.locator('#master-fund').count() === 0, `Administración sin fundo: ${ruc}`);
    assert((await page.locator('#company-mapping').innerText()).includes(idempresa), `Mapeo empresarial real: ${ruc}`);
    await scope(id);
    assert(await page.locator('#master-fund').inputValue() === key, `Referencia de fundo correcta: ${ruc}`);
    assert(await page.locator('#master-fund option').count() === 2, `Solo un fundo devuelto por el maestro de ${ruc}`);
    assert(await page.locator('[name="code"]').inputValue() === code && await page.locator('[name="unit"]').inputValue() === name, `Código y nombre exactos: ${name}`);
    assert(await page.locator('[name="unit"]').getAttribute('readonly') !== null, `Nombre maestro no editable: ${name}`);
    assert(!(await page.locator('#content').innerText()).includes('Activo (demo)'), `No se inventa el estado activo de ${name}`);
    await tab(3); await simulate();
    assert((await result()).includes('Ruta válida'), `La ruta de ejemplo acepta el fundo real: ${name}`);
    await click('Enviar solicitud de demostración');
    const frozen = JSON.parse(await snapshot());
    assert(frozen.master.ruc === ruc && frozen.master.empresa === empresa && frozen.master.codigoFundo === code && frozen.master.nombreFundo === name && frozen.master.source === 'API_MAESTRA_COPIA_LOCAL', `Snapshot conserva procedencia e identidad reales: ${name}`);
  }
  for (const ruc of ['20610757929', '20602226647']) {
    await page.locator('#company-select').selectOption(ruc);
    assert(await page.locator('#scopes button').count() === 1 && await page.locator('#master-fund').count() === 0, `No se fabrica un fundo donde el maestro devolvió vacío: ${ruc}`);
    assert((await page.locator('#content').innerText()).includes('La consulta no devolvió fundos'), `Respuesta vacía explicada: ${ruc}`);
  }
  await page.locator('#company-select').selectOption('20481121966');
  await scope('fundo-1-1'); await tab(3);
  await page.locator('[data-sim="fundKey"]').evaluate(s => s.add(new Option('Otra empresa', '2:2')));
  await page.locator('[data-sim="fundKey"]').selectOption('2:2'); await simulate();
  assert((await result()).includes('no pertenece a la empresa'), 'No se acepta un fundo real de otra empresa');
  await scope('fundo-1-1'); await simulate();
  await page.locator('[data-sim="preset"]').selectOption('selfN1'); await simulate();
  assert((await result()).includes('Omitido por solicitante'), 'La solicitud N1 conserva omisión auditada con fundo real');
  await click('Enviar solicitud de demostración');
  const frozen = await snapshot();
  await page.locator('#route-actor').selectOption('DEMO-F02'); await click('Aprobar paso pendiente');
  assert((await toast()).includes('Autoaprobación bloqueada'), 'La data real no habilita autoaprobación');
  await page.locator('#route-actor').selectOption('DEMO-F03'); await click('Aprobar paso pendiente');
  assert(await page.getByText('Cierres finales simulados: 1', { exact: true }).count() === 1, 'N2 independiente finaliza solo la demostración');
  await click('Aprobar paso pendiente');
  assert((await toast()).includes('No se repite el cierre'), 'El cierre no se duplica');
  await tab(0); await page.locator('#master-status').selectOption('offline');
  assert(await page.locator('#master-fund').isDisabled(), 'La simulación de fallo no permite códigos manuales');
  await tab(3); await simulate();
  assert((await result()).includes('no disponible'), 'No se envía sin copia habilitada para la prueba');
  await tab(4);
  assert(await snapshot() === frozen, 'El fallo simulado no cambia la procedencia histórica real');
  await tab(0); await page.locator('#master-status').selectOption('ok');
  await tab(3); await page.locator('[data-sim="preset"]').selectOption('missing'); await simulate();
  assert((await result()).includes('Envío bloqueado'), 'Sin N2 no se reducen niveles');
  await tab(5);
  assert((await page.locator('#content').innerText()).includes('CRÍTICO: comparar idfundo'), 'Se conserva la revisión de SP pendientes');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'La revisión es accesible en móvil');
  await page.reload(); await page.getByRole('heading', { name: 'Así se configura una aprobación.', exact: true }).waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'La estructura con datos reales no desborda en móvil');
  await page.setViewportSize({ width: 1440, height: 1100 }); await scope('fundo-1-1');
  await page.evaluate(() => window.scrollTo(0, 0));
  assert(errors.length === 0, 'Sin errores JavaScript');
  assert(external.length === 0, 'El navegador usa la copia local sin consultar servicios externos');
  return { resultado: 'Copia real verificada', total: checks.length, verificaciones: checks, erroresJavaScript: errors, solicitudesExternas: external };
}
