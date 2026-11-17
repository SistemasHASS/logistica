export default async function run(page, ui) {
  const ruc = '20000000001';
  const otroRuc = '20000000002';
  const requests = [];
  const cambios = [];
  const errores = [];
  page.on('pageerror', error => errores.push(error.message));
  const config = {
    ambitos: [
      { idAmbito: 1, ruc, tipoAmbito: 'ADMINISTRATIVO', codigoUnidad: 'ADM', nombre: 'Administración de prueba', activo: true },
      { idAmbito: 2, ruc, tipoAmbito: 'FUNDO', codigoUnidad: 'NORTE', nombre: 'Fundo de prueba', activo: true }
    ],
    areas: [{ idAreaAmbito: 10, ruc, idAmbito: 1, idarea: 1, nombre: 'Sistemas', activo: true },
      { idAreaAmbito: 11, ruc, idAmbito: 2, idarea: 1, nombre: 'Sistemas', activo: true }],
    asignaciones: [{ idAreaAmbito: 10, documentoidentidad: 'TEST_N1', puedeSolicitar: true, puedeAprobarN1: true,
      puedeAprobarN2: false, activo: true, vigenteDesde: '2026-01-01T00:00:00', vigenteHasta: null }],
    reglas: [{ idRegla: 1, tipoAmbito: 'ADMINISTRATIVO', idAmbito: 1, idarea: 1, tipoRequerimiento: 'COMPRA', niveles: 2,
      estado: 'PUBLICADA', vigenteDesde: '2026-01-01T00:00:00', vigenteHasta: null,
      responsables: [{ nivel: 1, documentoidentidad: 'TEST_N1', orden: 1, disponible: true, vigenteDesde: '2026-01-01T00:00:00', vigenteHasta: null },
        { nivel: 2, documentoidentidad: 'TEST_N2', orden: 1, disponible: true, vigenteDesde: '2026-01-01T00:00:00', vigenteHasta: null }] }],
    auditoria: []
  };
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON() || {};
    requests.push(path);
    let data = [];
    if (path.endsWith('/listar-empresas')) data = [{ ruc, nombre: 'Empresa de prueba A' }, { ruc: otroRuc, nombre: 'Empresa de prueba B' }];
    else if (path.endsWith('/listar-config-flujo')) data = ['CONSUMO', 'COMPRA', 'SERVICIO'].map(tipoRequerimiento => ({ tipoRequerimiento, modo: 'UN_NIVEL', activo: true, nivel2Habilitado: 'N' }));
    else if (path.endsWith('/areas/listar')) data = [{ idarea: 1, ruc: body.ruc, nombre: 'Sistemas', descripcion: 'Sistemas', activo: true }];
    else if (path.endsWith('/aprobacion-ambitos/configuracion')) data = body.ruc === ruc ? config : { ambitos: [], areas: [], asignaciones: [], reglas: [], auditoria: [] };
    else if (path.endsWith('/aprobacion-ambitos/guardar-ambito')) {
      cambios.push(body);
      config.ambitos.push({ ...body, idAmbito: 3 });
      data = { success: 1, idAmbito: 3 };
    } else if (path.endsWith('/simular-ruta-aprobacion-ambito')) data = {
      idRegla: 1, niveles: 2, responsableN1: 'TEST_N1', responsableN2: 'TEST_N2',
      omitirN1: body.documentoidentidad === 'TEST_N1', valido: true, mensaje: 'Ruta válida'
    };
    else if (path.includes('/aprobacion-ambitos/')) throw new Error(`Operación no prevista en la prueba: ${path}`);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data),
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  });
  await page.addInitScript(() => {
    localStorage.setItem('admin_logistica_token', 'SESION_SINTETICA_SOLO_MOCK');
    localStorage.setItem('admin_logistica_user', JSON.stringify({ id: 1, usuario: 'TEST_ADMIN', nombre: 'Administrador de prueba',
      email: '', idrol: 'ADLOGIST', rol: 'ADLOGIST', idempresa: 'TEST', ruc: '20000000001', token: 'SESION_SINTETICA_SOLO_MOCK' }));
  });
  await page.goto('http://localhost:4200/#/admin-logistica/config-flujo-aprobacion');
  try {
    await page.getByRole('button', { name: 'Configurar administración y fundos (nuevo)', exact: true }).waitFor({ timeout: 20000 });
  } catch (error) {
    throw new Error(JSON.stringify({ error: String(error), urlActual: page.url(), snapshot: await ui.snapshot({ full: true }), requests, errores }));
  }
  const antes = await ui.snapshot();
  if (requests.some(p => p.includes('/aprobacion-ambitos/'))) throw new Error('La configuración nueva se consultó antes de abrirla');
  await page.getByRole('button', { name: 'Configurar administración y fundos (nuevo)', exact: true }).click();
  const panel = page.locator('app-config-ambitos');
  await panel.getByRole('cell', { name: 'Administración de prueba', exact: true }).waitFor();
  await ui.snapshot();
  await panel.getByLabel('Nombre', { exact: true }).fill('Administración adicional de prueba');
  await panel.getByLabel('Código de unidad / fundo').fill('ADM2');
  if (await panel.getByRole('button', { name: 'Guardar ámbito', exact: true }).isEnabled()) throw new Error('Se permite guardar sin motivo');
  await panel.getByLabel('Motivo del cambio', { exact: false }).fill('Verificación con API simulada');
  await panel.getByRole('button', { name: 'Guardar ámbito', exact: true }).click();
  await panel.getByRole('cell', { name: 'Administración adicional de prueba', exact: true }).waitFor();
  if (cambios.length !== 1 || cambios[0].ruc !== ruc || cambios[0].usuario !== 'TEST_ADMIN') throw new Error('Contrato de guardado no válido');
  await panel.getByRole('button', { name: '2. Asignaciones', exact: true }).click();
  await panel.getByRole('button', { name: 'Editar asignación', exact: true }).click();
  if (!await panel.getByLabel('Crear requerimientos', { exact: true }).isChecked()
    || !await panel.getByLabel('Aprobar N1', { exact: true }).isChecked()) throw new Error('No se conservaron permisos independientes');
  await panel.getByRole('button', { name: '3. Reglas N1/N2', exact: true }).click();
  if (await panel.getByRole('button', { name: 'Editar borrador', exact: true }).count()) throw new Error('Una regla publicada ofrece edición directa');
  await panel.getByRole('button', { name: 'Copiar a borrador', exact: true }).click();
  if (await panel.getByRole('button', { name: 'Quitar responsable 1', exact: true }).count() !== 1) throw new Error('No se copiaron responsables');
  await panel.getByRole('button', { name: 'Simulador', exact: true }).click();
  await ui.snapshot();
  await panel.getByRole('combobox', { name: /^Área \/ ámbito/ }).selectOption({ label: 'Administración de prueba / Sistemas' });
  await panel.getByLabel('Solicitante', { exact: true }).fill('TEST_N1');
  await panel.getByRole('button', { name: 'Simular ruta', exact: true }).click();
  await panel.getByText('Ruta válida', { exact: true }).waitFor();
  await panel.getByText('N1: TEST_N1 (se omite por solicitud propia)', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Empresa de prueba B/ }).click();
  await panel.getByRole('button', { name: '1. Estructura', exact: true }).click();
  await panel.getByText('No hay ámbitos configurados.', { exact: true }).waitFor();
  if (await panel.getByLabel('Nombre', { exact: true }).inputValue()) throw new Error('Se conservaron datos de edición de otra empresa');
  await page.setViewportSize({ width: 390, height: 844 });
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (errores.length) throw new Error(errores.join('\n'));
  return { resultado: 'Verificaciones de interfaz correctas con todas las APIs simuladas', cambiosSimulados: cambios.length,
    erroresJavaScript: errores, desbordeMovil: desborde, aperturaOptativa: true, snapshotInicial: antes };
}
