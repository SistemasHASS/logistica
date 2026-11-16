'use strict';

let RUC = '20481121966';
const masterCapturedAt = '2026-11-11T17:25:28.6858949Z';
const companies = [
  { ruc: '20481121966', name: 'Hass Perú', idempresa: '000008', empresa: 1, firstScope: 'admin' },
  { ruc: '20610773274', name: 'Berry Harvest S.A.', idempresa: '000006', empresa: 2, firstScope: 'admin-2' },
  { ruc: '20610757929', name: 'Blueberry Investment', idempresa: '000007', empresa: 5, firstScope: 'admin-5' },
  { ruc: '20602226647', name: 'Wawahuasi', idempresa: '000009', empresa: 3, firstScope: 'admin-3' },
  { ruc: '20563196387', name: 'Corporación Agrícola Olmos S.A', idempresa: '000010', empresa: 4, firstScope: 'admin-4' }
];
const masterFundos = [
  { key: '1:1', ruc: '20481121966', empresa: 1, id: 1, fundo: 1, codigoFundo: '0801', nombreFundo: 'Fundo Hass - Dm' },
  { key: '2:2', ruc: '20610773274', empresa: 2, id: 2, fundo: 2, codigoFundo: '0601', nombreFundo: 'Fundo Berry - Dg' },
  { key: '4:3', ruc: '20563196387', empresa: 4, id: 3, fundo: 3, codigoFundo: '1001', nombreFundo: 'Fundo Cao - Cs' }
];
const today = new Date().toLocaleDateString('en-CA');
const since = `${new Date().getFullYear() - 1}-01-01`;
const people = [
  ['A01', 'Carolina Vega', 'Analista de Sistemas'], ['A02', 'Ana Torres', 'Jefa de Sistemas'],
  ['A03', 'Pedro Ramos', 'Coordinador de Sistemas'], ['A04', 'Carlos Medina', 'Gerente administrativo'],
  ['A05', 'Sofía Rojas', 'Subgerente administrativa'], ['F01', 'Jorge Díaz', 'Técnico de riego'],
  ['F02', 'Elena Vargas', 'Responsable N1 de ejemplo'], ['F03', 'Luis Herrera', 'Responsable N2 de ejemplo'],
  ['F04', 'Rosa Cruz', 'Suplente N2 de ejemplo'], ['F05', 'Diego Paredes', 'Alterno N1 de ejemplo'],
  ['F06', 'Marta León', 'Alterno N2 de ejemplo']
].map(([id, name, role]) => ({ id: `DEMO-${id}`, name, role }));
const tabs = ['Estructura', 'Asignaciones', 'Reglas N1/N2', 'Simulador', 'Trazabilidad', 'Revisión de SP'];
const areas = [{ id: 1, name: 'Sistemas' }, { id: 2, name: 'Riego' }, { id: 3, name: 'Contabilidad' }, { id: 4, name: 'Sanidad' }, { id: 5, name: 'Mantenimiento' }];
const clone = value => structuredClone(value);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const person = id => people.find(p => p.id === id) || { id, name: id, role: 'Sin persona de ejemplo' };
const display = id => `${person(id).name} · ${id}`;
const option = (value, label, selected) => `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;
const personOptions = selected => people.map(p => option(p.id, `${p.name} · ${p.id}`, selected)).join('');
const badge = (text, kind = '') => `<span class="badge ${kind}">${esc(text)}</span>`;
const button = (label, action, attrs = '', kind = 'secondary') => `<button type="button" class="button ${kind}" data-action="${action}" ${attrs}>${esc(label)}</button>`;
const check = (name, label, value) => `<label class="check"><input type="checkbox" name="${name}" ${value ? 'checked' : ''}>${label}</label>`;
const inDate = (value, date) => Boolean(value.from) && value.from <= date && (!value.until || date < value.until);
const member = (id, request = true, n1 = false, n2 = false) => ({ id, request, n1, n2, active: true, from: since, until: '' });
const responsible = (level, id, order = 1) => ({ level, id, order, available: true, from: since, until: '' });
let state;

function seed() {
  RUC = companies[0].ruc;
  const scopes = []; const rules = []; let nextRule = 1;
  const makeRule = (s, rows, scopeType = 'AREA') => ({ id: `REGLA-${String(nextRule++).padStart(3, '0')}`, ruc: s.ruc, ambitType: s.type,
    ambitId: scopeType === 'TIPO' ? null : s.ambitId, areaId: scopeType === 'AREA' ? s.areaId : null, scopeType,
    type: s.type === 'ADMINISTRATIVO' ? 'COMPRA' : 'CONSUMO', levels: 2, from: since, until: '', status: 'PUBLICADA', saved: true, rows });
  for (const c of companies) {
    const admin = { id: c.firstScope, ruc: c.ruc, fundKey: null, ambitId: scopes.length + 1, areaId: 1, type: 'ADMINISTRATIVO', code: 'ADM-CENTRAL', unit: 'Administración central', area: 'Sistemas', active: true, areaActive: true,
      members: [member('DEMO-A01'), member('DEMO-A02', true, true), member('DEMO-A03', true, true), member('DEMO-A04', true, false, true), member('DEMO-A05', true, false, true)] };
    scopes.push(admin);
    rules.push(makeRule(admin, [responsible(1, 'DEMO-A02'), responsible(1, 'DEMO-A03', 2), responsible(2, 'DEMO-A04'), responsible(2, 'DEMO-A05', 2)]));
    for (const f of masterFundos.filter(f => f.ruc === c.ruc && f.empresa === c.empresa)) {
      const s = { id: `fundo-${f.empresa}-${f.id}`, ruc: c.ruc, fundKey: f.key, ambitId: scopes.length + 1, areaId: 2, type: 'FUNDO', code: f.codigoFundo, unit: f.nombreFundo, area: 'Riego', active: true, areaActive: true,
        members: [member('DEMO-F01'), member('DEMO-F02', true, true), member('DEMO-F03', true, false, true), member('DEMO-F04', true, false, true)] };
      scopes.push(s);
      rules.push(makeRule(s, [responsible(1, 'DEMO-F02'), responsible(2, 'DEMO-F03'), responsible(2, 'DEMO-F04', 2)]));
    }
  }
  const hassFund = scopes.find(s => s.ruc === RUC && s.type === 'FUNDO');
  if (hassFund) rules.push(makeRule(hassFund, [responsible(1, 'DEMO-F02'), responsible(2, 'DEMO-F04')], 'TIPO'));
  state = { scopes, rules, selected: 'admin', tab: 0, sequence: nextRule, drafts: {}, audit: [], routes: [], activeRoute: null, actor: '', reassign: '', revisionRequest: null, assignment: 'DEMO-A01', sim: initialSimulation('admin'),
    masterStatus: Object.fromEntries(companies.map(c => [c.ruc, 'ok'])), catalogues: Object.fromEntries(companies.map(c => [c.ruc, areas.map(a => ({ ...a, ruc: c.ruc }))])) };
  for (const s of scopes) state.drafts[s.id] = { ...clone(rules.find(r => r.ambitId === s.ambitId)), id: '', status: 'BORRADOR', saved: false };
  document.getElementById('reason').value = 'Capacitación: configurar responsables por empresa y ámbito';
  record('EJEMPLO_CARGADO', null, { empresa: 'Hass Perú', datos: 'Empresas y fundos reales de API Maestra; personas, áreas y reglas de ejemplo', fechaConsultaUTC: masterCapturedAt, reglas: rules.length }, 'Carga inicial de ejemplos, no es una operación real');
  render();
}

function administrative(id) { return id === 'admin' || state?.scopes?.find(s => s.id === id)?.type === 'ADMINISTRATIVO'; }
function initialSimulation(id) {
  const s = state?.scopes?.find(s => s.id === id);
  return { type: administrative(id) ? 'COMPRA' : 'CONSUMO', requester: administrative(id) ? 'DEMO-A01' : 'DEMO-F01', date: today, preset: 'normal', fundKey: s?.fundKey || '',
    description: id === 'admin' ? 'Compra de 4 monitores para el equipo de Sistemas.' : ['norte', 'sur'].includes(id) ? 'Solicitud de 20 válvulas para mantenimiento del sistema de riego.' : `Solicitud de materiales para ${s?.area || 'el área'}.`, result: null };
}
function company() { return companies.find(c => c.ruc === RUC); }
function companyScopes() { return state.scopes.filter(s => s.ruc === RUC); }
function areaCatalog() { return state.catalogues[RUC]; }
function companyRoutes() { return state.routes.filter(r => r.snapshot.rule.ruc === RUC); }
function availableFundos() { return state.masterStatus[RUC] === 'ok' ? masterFundos.filter(f => f.ruc === RUC && f.empresa === company().empresa) : []; }
function masterFund(key, ruc = RUC) {
  if (state.masterStatus[ruc] !== 'ok') throw Error('Maestro simulado no disponible o sin resultados validados. No se permite ingreso manual ni se borran configuraciones existentes.');
  const c = companies.find(c => c.ruc === ruc); const f = masterFundos.find(f => f.key === key);
  if (!c || !f || f.ruc !== ruc || f.empresa !== c.empresa) throw Error('El fundo no pertenece a la empresa seleccionada. No se compara solo por código o nombre.');
  return f;
}
function validateScopeMaster(s) {
  if (s.ruc !== RUC || !areaCatalog().some(a => a.id === s.areaId && a.name === s.area)) throw Error('El área no pertenece al catálogo de la empresa seleccionada.');
  if (s.type === 'ADMINISTRATIVO') { if (s.fundKey) throw Error('Un ámbito administrativo no debe tener fundo.'); return null; }
  const f = masterFund(s.fundKey, s.ruc);
  if (f.codigoFundo !== s.code || f.nombreFundo !== s.unit) throw Error('La referencia al maestro requiere conciliación; no se modifica una ruta histórica automáticamente.');
  return f;
}
function changeCompany(ruc) {
  const c = companies.find(c => c.ruc === ruc); if (!c) throw Error('Empresa no válida.');
  RUC = c.ruc; state.tab = 0; state.activeRoute = null; state.actor = ''; state.reassign = ''; state.revisionRequest = null;
  for (const s of companyScopes()) {
    if (!state.drafts[s.id].saved) {
      const matching = state.rules.filter(r => r.ruc === RUC && r.ambitId === s.ambitId && r.areaId === s.areaId);
      const base = matching.find(r => r.status === 'PUBLICADA') || matching[0];
      state.drafts[s.id] = base ? { ...clone(base), id: '', status: 'BORRADOR', saved: false } : { id: '', ruc: RUC, ambitType: s.type, ambitId: s.ambitId, areaId: s.areaId, scopeType: 'AREA', type: s.type === 'ADMINISTRATIVO' ? 'COMPRA' : 'CONSUMO', levels: 2, from: since, until: '', status: 'BORRADOR', saved: false, rows: [] };
    }
  }
  document.getElementById('reason').value = ''; document.getElementById('toast').hidden = true;
  selectScope(c.firstScope);
}
function scope() { return companyScopes().find(s => s.id === state.selected); }
function matches(rule, s) { return rule.ruc === s.ruc && rule.ambitType === s.type && (rule.ambitId === null || rule.ambitId === s.ambitId) && (rule.areaId === null || rule.areaId === s.areaId); }
function specificity(rule) { return rule.areaId !== null ? 3 : rule.ambitId !== null ? 2 : 1; }
function qualified(s, id, level, date) { return s.members.some(m => m.id === id && m.active && inDate(m, date) && (level === 0 ? m.request : level === 1 ? m.n1 : m.n2)); }
function candidates(rule, s, level, date) { return rule.rows.filter(p => p.level === level && p.available && inDate(p, date) && qualified(s, p.id, level, date)).sort((a, b) => a.order - b.order); }
function reason() { const text = document.getElementById('reason').value.trim(); if (!text) throw Error('Escribe un motivo antes de guardar, publicar, inactivar o reasignar.'); return text; }
function record(action, before, after, why = document.getElementById('reason').value.trim(), routeId = null) {
  const routeEvent = ['CREACION_RUTA', 'OMISION_N1', 'APROBACION', 'RECHAZO', 'CIERRE_FINAL_SIMULADO', 'REASIGNACION', 'INVALIDACION'].includes(action);
  routeId ??= routeEvent ? state.activeRoute : null;
  const actor = action === 'CREACION_RUTA' ? currentRoute().snapshot.requester : ['OMISION_N1', 'CIERRE_FINAL_SIMULADO'].includes(action) ? 'SISTEMA (DEMO)' : 'DEMO-ADMIN';
  state.audit.unshift({ action, before: clone(before), after: clone(after), reason: why, routeId, actor, ruc: RUC, at: new Date().toLocaleString('es-PE'), scope: routeEvent ? currentRoute().snapshot.scope.id : state.selected });
}
function notify(text, error = false) {
  const el = document.getElementById('toast'); el.textContent = text; el.className = error ? 'error' : ''; el.hidden = false;
}
function clearResult() { state.sim.result = null; }
function navigate(tab) { state.tab = tab; if (tab === 4 && !currentRoute()) state.activeRoute = companyRoutes().at(-1)?.id || null; render(); }
function selectScope(id) { if (!companyScopes().some(s => s.id === id)) throw Error('El ámbito no pertenece a la empresa seleccionada.'); state.selected = id; state.assignment = administrative(id) ? 'DEMO-A01' : 'DEMO-F01'; state.sim = initialSimulation(id); render(); }
function panel(title, subtitle, contents, extra = '') { return `<section class="panel"><div class="panel-heading"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div>${extra}</div>${contents}</section>`; }
function nameScope(s) { return `${s.unit} / ${s.area}`; }
function organizationTree() {
  return [...new Set(companyScopes().map(s => s.ambitId))].map(id => {
    const unit = companyScopes().find(s => s.ambitId === id);
    return `<div class="branch"><strong>${esc(unit.type)} / ${esc(unit.unit)}</strong> <span>${esc(unit.code)}${unit.fundKey ? ' · maestro ' + esc(unit.fundKey) : ' · sin fundo'}</span>${companyScopes().filter(s => s.ambitId === id).map(s => `<div class="branch">${esc(s.area)} <span>idAreaAmbito de ejemplo: ${s.linkId || s.ambitId * 10}</span></div>`).join('')}</div>`;
  }).join('');
}
function permissions(m) { return `<div class="permission">${m.request ? badge('Solicitar') : ''}${m.n1 ? badge('N1', 'green') : ''}${m.n2 ? badge('N2', 'green') : ''}</div>`; }
function routeMarkup(n1, n2, omitted = false, steps = null) {
  const items = steps || [{ level: 1, id: n1, status: omitted ? 'OMITIDO_SOLICITANTE' : 'PENDIENTE' }, ...(n2 ? [{ level: 2, id: n2, status: 'PENDIENTE' }] : [])];
  return `<div class="route">${items.map(p => `<div class="route-step ${p.status === 'OMITIDO_SOLICITANTE' ? 'omitted' : p.status === 'APROBADO' ? 'approved' : p.status === 'RECHAZADO' ? 'rejected' : ''}"><span class="eyebrow">NIVEL ${p.level}</span><strong>${esc(person(p.id).name)}</strong><p>${esc(person(p.id).role)}</p>${badge(p.status === 'OMITIDO_SOLICITANTE' ? 'Omitido por solicitante' : p.status, p.status === 'APROBADO' ? 'green' : p.status === 'OMITIDO_SOLICITANTE' ? 'amber' : '')}<p>${esc(p.id)}</p></div>`).join('')}</div>`;
}
function render() {
  document.getElementById('company-select').innerHTML = companies.map(c => option(c.ruc, c.name, RUC)).join('');
  document.getElementById('company-mapping').textContent = `RUC ${RUC} · idempresa ${company().idempresa} · empresa ${company().empresa} (API Maestra · copia local)`;
  document.getElementById('navigation').innerHTML = tabs.map((name, i) => `<button class="nav-button ${state.tab === i ? 'active' : ''}" data-action="tab" data-tab="${i}" ${state.tab === i ? 'aria-current="step"' : ''}><span class="nav-number">${i + 1}</span>${name}</button>`).join('');
  document.getElementById('scopes').innerHTML = companyScopes().map(s => `<button class="scope-button ${s.id === state.selected ? 'active' : ''}" data-action="scope" data-scope="${s.id}" aria-pressed="${s.id === state.selected}"><strong>${esc(s.type === 'ADMINISTRATIVO' ? 'Administración' : s.unit)}</strong><span>${esc(s.area)} · ${s.type === 'ADMINISTRATIVO' ? 'Compra' : 'Consumo'}</span></button>`).join('');
  document.getElementById('content').innerHTML = [structureView, assignmentView, rulesView, simulatorView, historyView, spReviewView][state.tab]();
  document.getElementById('guide').innerHTML = guideView();
}

function structureView() {
  const s = scope(); const isFund = s.type === 'FUNDO'; const funds = availableFundos();
  const masterRows = masterFundos.filter(f => f.ruc === RUC && f.empresa === company().empresa);
  const fundField = isFund ? `<label class="full">Fundo del maestro de la empresa<select id="master-fund" name="fundKey" ${funds.length ? 'required' : 'disabled'}>${option('', 'Seleccione un fundo del maestro real (copia local)', '')}${funds.map(f => option(f.key, `${f.codigoFundo} · ${f.nombreFundo} · ${f.id}`, s.fundKey)).join('')}</select></label>` : '<label class="full">Fundo<input disabled value="No aplica — ámbito administrativo"></label>';
  return panel('01 / Estructura organizacional', 'Un catálogo de áreas por empresa; habilitaciones independientes por administración o fundo maestro.',
    `<form data-form="structure"><div class="grid"><label>Empresa / RUC<input disabled value="${esc(company().name)} · ${RUC}"></label><label>Tipo de ámbito<select disabled>${option(s.type, s.type, s.type)}</select></label>${fundField}<label>${isFund ? 'Código del fundo (desde maestro)' : 'Código de unidad administrativa'}<input name="code" value="${esc(s.code)}" maxlength="50" readonly required></label><label>${isFund ? 'Nombre del fundo (desde maestro)' : 'Nombre de unidad administrativa'}<input name="unit" value="${esc(s.unit)}" maxlength="150" ${isFund ? 'readonly' : ''} required></label><label>Área del catálogo único de la empresa<select name="area">${areaCatalog().map(a => option(a.name, a.name, s.area)).join('')}</select></label><div class="checks">${check('active', 'Ámbito habilitado para logística', s.active)}${check('areaActive', 'Área habilitada en este ámbito', s.areaActive)}</div></div>
    <div class="callout">${isFund ? '<strong>El fundo no se crea ni se renombra aquí.</strong> Al seleccionar otro fundo se habilita un ámbito independiente. Código y nombre provienen del maestro real (copia local); no se heredan aprobadores del fundo anterior.' : '<strong>Administración no requiere fundo.</strong> El código administrativo no se cambia después de crear la unidad. Las áreas se toman del mismo catálogo utilizado por los fundos.'}</div>
    ${isFund && !funds.length ? '<div class="callout red">Maestro sin datos validados: no se habilitan fundos ni se publican rutas de fundo. No hay alternativa de registro manual. Las configuraciones existentes no se borran.</div>' : ''}
    <p class="section-lead">Elegir otra área habilita un vínculo nuevo, sin copiar permisos ni reemplazar el área anterior.</p><div class="actions"><button class="button" ${isFund && !funds.length ? 'disabled' : ''}>Guardar estructura en la demo</button>${button('Siguiente: asignaciones', 'tab', 'data-tab="1"')}</div></form>`) +
    panel('Maestro de fundos · datos reales', `Copia consultada en API Maestra el ${masterCapturedAt}. No es una conexión en vivo. El endpoint no devolvió un campo de estado activo; no se ha inferido.`, 
      `<label>Estado de la consulta simulada<select id="master-status">${option('ok', 'Disponible · respuesta validada de la empresa', state.masterStatus[RUC])}${option('offline', 'Sin conexión · conservar configuración, bloquear nuevos envíos', state.masterStatus[RUC])}${option('empty', 'Respuesta vacía · sin fundos validados para seleccionar', state.masterStatus[RUC])}</select></label><div class="callout">Mapeo devuelto por API Maestra: RUC ${RUC} → idempresa ${esc(company().idempresa)} → empresa maestra ${company().empresa}. Los identificadores no son intercambiables. ${masterRows.length ? 'Solo se muestran los fundos devueltos para esta empresa.' : '<strong>La consulta no devolvió fundos para esta empresa. No se han creado sustitutos ficticios.</strong>'}</div><div class="table-wrap"><table><thead><tr><th>Identidad de maestro</th><th>Código / nombre</th><th>Estado de referencia</th></tr></thead><tbody>${masterRows.map(f => `<tr><td>${esc(f.id)}<small>Empresa maestra ${f.empresa}</small></td><td>${esc(f.codigoFundo)} · ${esc(f.nombreFundo)}</td><td>${badge('Devuelto por API Maestra', 'green')}${state.masterStatus[RUC] !== 'ok' ? '<small>Referencia ilustrativa; consulta actual no validada</small>' : ''}</td></tr>`).join('')}</tbody></table></div>`) +
    panel('Catálogo único de áreas de la empresa', 'Este catálogo se comparte entre Administración y Fundos; no hay un catálogo duplicado por cada fundo.',
      `<div class="table-wrap"><table><thead><tr><th>Área</th><th>Identidad de catálogo</th><th>Ámbitos habilitados</th></tr></thead><tbody>${areaCatalog().map(a => `<tr><td>${esc(a.name)}</td><td>${RUC} / ${a.id}</td><td>${esc(companyScopes().filter(s => s.areaId === a.id).map(s => s.unit).join(', ') || 'Todavía sin habilitar')}</td></tr>`).join('')}</tbody></table></div>`) +
    panel('Vista de la organización', 'La misma área Riego puede tener responsables distintos en cada fundo de la misma empresa.', `<div class="tree"><strong>${esc(company().name)} · ${RUC}</strong>${organizationTree()}</div>`);
}
function assignmentView() {
  const s = scope(); const m = s.members.find(p => p.id === state.assignment) || member(state.assignment, false);
  return panel('02 / Asignaciones de personas', 'Solicitar, aprobar N1 y aprobar N2 son permisos independientes.', `<form data-form="assignment"><div class="grid"><label>Área y ámbito<input disabled value="${esc(nameScope(s))}"></label><label>Persona / identificador de ejemplo<select id="assignment-person">${personOptions(state.assignment)}</select></label><label>Vigente desde<input name="from" type="date" value="${esc(m.from)}" required></label><label>Vigente hasta (opcional, fecha exclusiva)<input name="until" type="date" value="${esc(m.until)}"></label><div class="full checks">${check('request', 'Puede crear requerimientos', m.request)}${check('n1', 'Puede aprobar N1', m.n1)}${check('n2', 'Puede aprobar N2', m.n2)}${check('active', 'Asignación activa', m.active)}</div></div><div class="actions"><button class="button">Guardar asignación en la demo</button>${button('Siguiente: reglas N1/N2', 'tab', 'data-tab="2"')}</div></form><div class="callout">En producción, reemplaza DEMO-A02 o DEMO-F02 por el <strong>documento de identidad real del usuario registrado</strong>. Los nombres y cargos de esta demo solo ayudan a comprender el ejemplo.</div>`) + panel('Asignaciones de este ámbito', nameScope(s), `<div class="table-wrap"><table><thead><tr><th>Persona</th><th>Permisos</th><th>Vigencia</th><th>Acción</th></tr></thead><tbody>${s.members.map(p => `<tr><td><strong>${esc(person(p.id).name)}</strong><small>${esc(p.id)} · ${esc(person(p.id).role)}</small></td><td>${permissions(p)}${p.active ? '' : badge('Inactiva', 'red')}</td><td>${esc(p.from)}<small>Hasta ${esc(p.until || 'sin fecha fin')}</small></td><td>${button('Editar', 'member', `data-person="${p.id}"`, 'secondary small')}</td></tr>`).join('')}</tbody></table></div><div class="callout"><strong>Asignaciones múltiples:</strong> Las personas y permisos son ejemplos independientes de los datos reales de empresas y fundos. Una asignación en un fundo no autoriza automáticamente en otra empresa ni en Administración.</div>`);
}
function rulesView() {
  const s = scope(); const d = state.drafts[s.id]; const related = state.rules.filter(r => matches(r, s));
  return panel('03 / Matriz N1 y N2', 'Una regla publicada no se edita. Copia a borrador, inactiva la anterior con motivo y publica la nueva.', `<div class="table-wrap"><table><thead><tr><th>Regla y alcance</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${related.map(r => `<tr><td><strong>${r.id}</strong><small>${r.scopeType === 'AREA' ? 'Área específica' : r.scopeType === 'AMBITO' ? 'Unidad / ámbito' : 'General para ' + r.ambitType}</small></td><td>${r.type}<small>${r.levels} niveles</small></td><td>${badge(r.status, r.status === 'PUBLICADA' ? 'green' : '')}</td><td>${button('Copiar a borrador', 'copy-rule', `data-rule="${r.id}"`, 'secondary small')} ${r.status === 'PUBLICADA' ? button('Inactivar', 'deactivate-rule', `data-rule="${r.id}"`, 'danger small') : ''}</td></tr>`).join('')}</tbody></table></div><div class="callout">La regla de área tiene prioridad sobre la regla general. Se toma <strong>una regla completa</strong>, nunca el N1 de una y el N2 de otra. Las dos reglas específicas de Riego son distintas por fundo.</div>`) + panel('Editor de borrador', d.saved ? 'Borrador guardado localmente. Revisa las validaciones antes de publicar.' : 'Ejemplo ya llenado: cambia los valores y guarda. No modifica las reglas publicadas.', `<form data-form="draft"><div class="grid three"><label>Tipo de ámbito<input disabled value="${s.type}"></label><label>Alcance<select data-draft-field="scopeType">${option('AREA', 'Empresa + ámbito + área', d.scopeType)}${option('AMBITO', 'Empresa + ámbito / unidad', d.scopeType)}${option('TIPO', 'Empresa + tipo de ámbito', d.scopeType)}</select></label><label>Tipo de requerimiento<select data-draft-field="type">${['CONSUMO', 'COMPRA', 'SERVICIO'].map(t => option(t, t, d.type)).join('')}</select></label><label>Niveles<select data-draft-field="levels">${option(1, 'Un nivel', d.levels)}${option(2, 'Dos niveles', d.levels)}</select></label><label>Vigente desde<input type="date" data-draft-field="from" value="${esc(d.from)}" required></label><label>Vigente hasta (opcional)<input type="date" data-draft-field="until" value="${esc(d.until)}"></label></div><div class="inline-title"><h3>Titulares y suplentes</h3>${badge(d.saved ? 'BORRADOR GUARDADO' : 'BORRADOR')}</div><p class="section-lead">Orden 1 = primera alternativa. Orden 2, 3… = suplencias; no son aprobaciones consecutivas.</p>${d.rows.map((p, i) => `<div class="responsible-row"><label>Nivel<select data-row="${i}" data-field="level">${option(1, 'N1', p.level)}${option(2, 'N2', p.level)}</select></label><label>Persona<select data-row="${i}" data-field="id">${personOptions(p.id)}</select></label><label>Orden<input type="number" min="1" max="100" data-row="${i}" data-field="order" value="${p.order}" required></label><div class="extra"><label>Desde<input type="date" data-row="${i}" data-field="from" value="${esc(p.from)}" required></label><label>Hasta<input type="date" data-row="${i}" data-field="until" value="${esc(p.until)}"></label><label class="check"><input type="checkbox" data-row="${i}" data-field="available" ${p.available ? 'checked' : ''}>Disponible</label>${button('Quitar', 'remove-responsible', `data-row="${i}"`, 'danger small')}</div></div>`).join('')}<div class="actions">${button('Añadir N1 / suplente', 'add-responsible', 'data-level="1"')}${button('Añadir N2 / suplente', 'add-responsible', 'data-level="2"')}<button class="button">Guardar borrador</button>${button('Publicar borrador', 'publish', '', 'secondary')}</div></form><div class="callout amber">Para publicar otra regla con el mismo alcance, tipo y vigencia, inactiva primero la anterior. Si falta un N2 independiente en una regla de dos niveles, la publicación se bloquea.</div><div class="actions">${button('Siguiente: simular', 'tab', 'data-tab="3"')}</div>`);
}
function findRule(s, sim) {
  const rules = state.rules.filter(r => r.status === 'PUBLICADA' && matches(r, s) && r.type === sim.type && inDate(r, sim.date));
  const priority = Math.max(0, ...rules.map(specificity)); const top = rules.filter(r => specificity(r) === priority);
  if (!top.length) throw Error(`No existe una regla publicada y vigente para ${nameScope(s)} / ${sim.type}. Un borrador no autoriza envíos.`);
  if (top.length > 1) throw Error('Existen reglas ambiguas con la misma prioridad. No se combinan ni se elige una al azar.');
  return clone(top[0]);
}
function resolve() {
  const s = scope(); const sim = state.sim;
  if (!s.active || !s.areaActive) throw Error('El ámbito o su área están inactivos.');
  const fund = validateScopeMaster(s);
  if (fund) {
    const requested = masterFund(sim.fundKey);
    if (requested.key !== fund.key) throw Error('El fundo del requerimiento no coincide con el fundo del área-ámbito. Compartir el área Riego no autoriza usar la ruta de otro fundo.');
  } else if (sim.fundKey) throw Error('Una solicitud administrativa no utiliza fundo organizacional.');
  if (!qualified(s, sim.requester, 0, sim.date)) throw Error('El solicitante no tiene permiso vigente para crear en esta área y ámbito.');
  const rule = findRule(s, sim); let variant = '';
  if (sim.preset === 'absent') { const first = candidates(rule, s, 2, sim.date)[0]; if (first) rule.rows.find(p => p.level === 2 && p.id === first.id).available = false; variant = 'Titular N2 no disponible; se evalúa su siguiente suplente.'; }
  if (sim.preset === 'missing') { rule.rows.filter(p => p.level === 2).forEach(p => p.available = false); variant = 'Todos los N2 están no disponibles.'; }
  if (sim.preset === 'single') { rule.levels = 1; rule.rows = rule.rows.filter(p => p.level !== 2); variant = 'Ruta de un nivel sin N2 de excepción.'; }
  const n1 = candidates(rule, s, 1, sim.date)[0];
  if (!n1) throw Error('No existe un N1 disponible, vigente y autorizado para este ámbito.');
  if (sim.preset === 'same') { rule.rows = [...rule.rows.filter(p => p.level !== 2), responsible(2, n1.id)]; variant = 'N1 y N2 son la misma identidad y no existe alternativa independiente.'; }
  const omitted = n1.id === sim.requester; const needsN2 = rule.levels === 2 || omitted;
  const n2 = needsN2 ? candidates(rule, s, 2, sim.date).find(p => p.id !== sim.requester && p.id !== n1.id) : null;
  if (needsN2 && !n2) throw Error(`${omitted ? 'El solicitante coincide con N1: se omite N1, pero ' : ''}no existe un N2 independiente, disponible y autorizado. El requerimiento queda bloqueado; no se reduce a un nivel ni se autoaprueba.`);
  return { valid: true, rule, n1: n1.id, n2: n2?.id || null, omitted, variant, scope: clone(s), requester: sim.requester, description: sim.description, date: sim.date,
    master: fund ? { source: 'API_MAESTRA_COPIA_LOCAL', capturedAt: masterCapturedAt, ruc: RUC, idempresa: company().idempresa, empresa: company().empresa, idFundo: fund.id, codigoFundo: fund.codigoFundo, nombreFundo: fund.nombreFundo } : null };
}
function requestFundField() {
  return scope().type === 'FUNDO' ? `<label class="full">Fundo del requerimiento (debe coincidir con el ámbito)<select data-sim="fundKey">${option('', 'Seleccione un fundo de la empresa', '')}${availableFundos().map(f => option(f.key, `${f.codigoFundo} · ${f.nombreFundo} · ${f.id}`, state.sim.fundKey)).join('')}</select></label>` : '<label class="full">Fundo organizacional del requerimiento<input disabled value="No aplica — solicitud administrativa"></label>';
}
function simulatorView() {
  const sim = state.sim; const result = sim.result;
  return panel('04 / Simula antes de enviar', 'Prueba la ruta sin alterar la configuración publicada. Las variaciones son temporales y solo pertenecen a esta demo.', `<form data-form="simulate"><div class="grid"><label>Área / ámbito<input disabled value="${esc(nameScope(scope()))}"></label>${requestFundField()}<label>Tipo de requerimiento<select data-sim="type">${['CONSUMO', 'COMPRA', 'SERVICIO'].map(t => option(t, t, sim.type)).join('')}</select></label><label>Solicitante<select data-sim="requester">${personOptions(sim.requester)}</select></label><label>Fecha para validar vigencias<input type="date" data-sim="date" value="${esc(sim.date)}" required></label><label class="full">Caso para probar<select data-sim="preset">${[['normal', 'Solicitud normal'], ['selfN1', 'El solicitante es el N1'], ['selfN2', 'El solicitante es el N2 titular'], ['absent', 'El N2 titular está ausente'], ['missing', 'Ningún N2 está disponible'], ['single', 'Solicitante N1: un nivel sin excepción'], ['same', 'N1 y N2 con la misma identidad, sin alternativa']].map(([v, l]) => option(v, l, sim.preset)).join('')}</select></label><label class="full">Descripción del requerimiento de ejemplo<textarea data-sim="description" maxlength="500" required>${esc(sim.description)}</textarea></label></div><div class="actions"><button class="button">Simular ruta</button>${button('Enviar solicitud de demostración', 'send')}</div></form><div id="simulation-result">${result ? result.valid ? `<div class="callout green"><strong>Ruta válida · ${result.rule.id}</strong><div>${result.omitted ? 'N1 omitido por solicitud propia. Se exige aprobación independiente de N2.' : result.n2 ? 'N1 independiente → N2 independiente. Ambos niveles son necesarios.' : 'Ruta de un nivel: N1 debe ser independiente del solicitante.'}</div></div>${routeMarkup(result.n1, result.n2, result.omitted)}<div class="rule-reason">Se eligió <strong>${result.rule.id}</strong> por ${result.rule.scopeType === 'AREA' ? 'su mayor especificidad: empresa + ámbito + área' : result.rule.scopeType === 'AMBITO' ? 'su alcance por unidad / ámbito' : 'ser la regla general del tipo de ámbito'}. Todos los responsables proceden de esta misma regla.${result.variant ? `<div class="callout amber">Variación temporal: ${esc(result.variant)} No se modificó ninguna regla publicada.</div>` : ''}</div>` : `<div class="callout red" role="alert"><strong>Envío bloqueado</strong><div>${esc(result.message)}</div><div>No hay aprobación final ni efectos de saldos o SPRING.</div></div>` : '<div class="callout">Empieza con una solicitud normal. Después selecciona “El solicitante es el N1” para ver la omisión auditada, o “El solicitante es el N2 titular” para ver la suplencia independiente.</div>'}</div>`) + panel('Qué ocurriría al enviar', 'Esta parte ilustra el diseño del flujo operativo; todavía no representa una función terminada de la aplicación.', '<div class="metric-row"><div class="metric"><small>REGLA Y RESPONSABLES</small><strong>Congelados</strong></div><div class="metric"><small>APROBACIÓN PROPIA</small><strong>No permitida</strong></div><div class="metric"><small>SIN N2 VÁLIDO</small><strong>Bloqueo</strong></div></div><div class="actions">' + button('Ir a trazabilidad', 'tab', 'data-tab="4"') + '</div>');
}
function currentRoute() { return companyRoutes().find(r => r.id === state.activeRoute); }
function historyView() {
  const route = currentRoute(); const pending = route?.steps.find(p => p.status === 'PENDIENTE');
  const routeSection = route ? `<label>Ruta de ejemplo<select id="history-route">${companyRoutes().map(r => option(r.id, `${r.request} · versión ${r.version} · ${r.status}`, route.id)).join('')}</select></label><div class="legend">${badge(route.request)}${badge(`Versión ${route.version}`)}${badge(route.status, route.status === 'APROBADO' ? 'green' : '')}${badge(route.snapshot.rule.id)}</div><p class="rule-reason"><strong>${esc(route.snapshot.description)}</strong><br>${esc(nameScope(route.snapshot.scope))}<br>Solicitante: ${esc(display(route.snapshot.requester))}</p>${routeMarkup(null, null, false, route.steps)}<div class="grid"><label>Persona que intenta decidir<select id="route-actor">${personOptions(state.actor || pending?.id || route.snapshot.requester)}</select></label><label>Comentario de decisión<input id="decision-reason" maxlength="500" placeholder="Obligatorio si rechazas"></label></div><div class="actions">${button('Aprobar paso pendiente', 'approve', '', '')}${button('Rechazar paso pendiente', 'reject', '', 'danger')}${button('Invalidar para editar / nueva versión', 'invalidate', '', 'secondary')}</div>${route.status === 'PENDIENTE' && pending ? `<div class="callout"><strong>Reasignación administrativa de N${pending.level}</strong><p>Solo cambia un paso pendiente. Conserva el responsable inicial y todas las decisiones anteriores. Requiere el motivo de configuración de la parte superior.</p><div class="grid"><label>Nuevo responsable<select id="reassign-person">${personOptions(state.reassign || pending.id)}</select></label><div class="actions">${button('Reasignar paso pendiente', 'reassign')}</div></div></div>` : ''}<div class="callout ${route.status === 'APROBADO' ? 'green' : ''}"><strong>Cierres finales simulados: ${route.effects}</strong><br>${route.status === 'APROBADO' ? 'La demo cuenta un único cierre al terminar todos los pasos. Repetir la aprobación se bloquea.' : 'No hay cierre final mientras falte un paso o la ruta esté rechazada/invalidada.'}<br>Saldos y SPRING: <strong>no ejecutados; sin conexión</strong>.</div><details><summary>Ver snapshot inicial de esta versión (no cambia al editar reglas)</summary><pre>${esc(JSON.stringify(route.snapshot, null, 2))}</pre></details>` : '<div class="empty">Todavía no enviaste una solicitud de demostración.</div><div class="actions">' + button('Ir al simulador y enviar', 'tab', 'data-tab="3"') + '</div>';
  return panel('05 / Ruta, decisiones e historial', 'Proyección interactiva del flujo. Todas las acciones de esta sección son simuladas y no habilitan funciones reales.', routeSection, badge('SOLO DEMO', 'amber')) + panel('Auditoría local', 'Usuario, fecha, motivo, valores anteriores y nuevos. Se pierde al recargar la página.', `<div class="table-wrap"><table><thead><tr><th>Evento / fecha</th><th>Actor</th><th>Motivo y detalle</th></tr></thead><tbody>${state.audit.filter(event => event.ruc === RUC).map(event => `<tr><td><strong>${esc(event.action)}</strong><small>${esc(event.routeId || 'Configuración')} · ${esc(event.at)}</small></td><td>${esc(event.actor)}</td><td>${esc(event.reason)}<details><summary>Antes / después</summary><pre>${esc(JSON.stringify({ anterior: event.before, nuevo: event.after }, null, 2))}</pre></details></td></tr>`).join('')}</tbody></table></div>`);
}
function spReviewView() {
  const rows = [
    ['852 · tablas', 'Ámbitos y vínculos por RUC, sin referencia obligatoria al maestro de fundos.', 'Definir identificador maestro estable; referencia empresa–fundo; fundo nulo para Administración; unicidad y procedencia. No basta un código libre.'],
    ['855 · guardarAmbitoOrganizacional', 'Recibe código y nombre manuales, controla duplicados e inmutabilidad.', 'Validar pertenencia y existencia en una fuente confiable; obtener código/nombre del maestro, no del navegador. No crear fundos desde logística.'],
    ['855 · guardarAreaAmbito / publicar regla', 'Valida área local por empresa y cobertura de responsables.', 'Conciliar idarea del maestro con LOGISTICA_Areas; comprobar referencia de fundo vigente al habilitar y publicar.'],
    ['853 · resolverRutaAmbito', 'Valida ámbito, asignaciones, prioridad única e independencia N1/N2.', 'Incorporar verificación del vínculo maestro mediante backend o réplica controlada. Una función SQL no consulta una API HTTP por sí sola.'],
    ['857 · registrarRutaAmbito', 'Comprueba RUC e idarea; incluye idfundo en la huella del contenido.', 'CRÍTICO: comparar idfundo del requerimiento con el fundo maestro del ámbito; conservar identificadores de empresa y fundo en el snapshot. La huella no sustituye esa validación inicial.'],
    ['858 · decidirRutaAmbito / reasignarPasoRutaAmbito', 'Tiene guardas transaccionales, autorización por vínculo, independencia y auditoría.', 'Definir política ante inactivación o ausencia en maestro; no reasignar silenciosamente de fundo. Completar invalidación y nueva versión para cambios organizacionales.'],
    ['859 · consultas', 'Consulta solicitantes y pendientes por RUC y área-ámbito.', 'Exponer referencia/nombre del fundo maestro y diagnóstico de validación sin mezclar empresas.'],
    ['854 / 856 · pruebas SQL', 'Escenarios preparados; no ejecutados en esta demo.', 'Agregar cruce empresa/fundo, mismo código en dos empresas, idfundo incompatible, maestro no disponible, áreas reconciliadas y preservación histórica.'],
    ['Integración y efectos finales', '858 encola SALDOS y SPRING al finalizar; no demuestra que los efectos ya se procesen.', 'Completar consumidores idempotentes, compatibilidad VARCHAR del identificador y conexiones operativas optativas. La demo no valida SQL Server ni integraciones.']
  ];
  return panel('06 / Qué falta revisar en los SP', 'Revisión estática de los scripts locales. Esta pantalla no instala, ejecuta ni modifica procedimientos.',
    '<div class="callout amber"><strong>El mockup muestra el comportamiento esperado, no una corrección ya aplicada al backend.</strong> No activar el flujo hasta resolver las referencias maestras, probar las transacciones y validar las integraciones.</div><div class="table-wrap"><table><thead><tr><th>Script / procedimiento</th><th>Lo que ya está escrito</th><th>Pendiente de revisión o implementación</th></tr></thead><tbody>' + rows.map(([file, existing, missing]) => `<tr><td><strong>${esc(file)}</strong></td><td>${esc(existing)}</td><td>${esc(missing)}</td></tr>`).join('') + '</tbody></table></div>');
}
function guideView() {
  const s = scope(); const administrative = s.type === 'ADMINISTRATIVO';
  const content = [
    `<li><strong>Empresa:</strong> ${esc(company().name)}, RUC ${RUC}.</li><li><strong>Ámbito:</strong> ${esc(s.type)}. Código ${esc(s.code)}, nombre ${esc(s.unit)}.</li><li><strong>Área:</strong> ${esc(s.area)}. Guarda primero el ámbito y luego habilita su relación con el área del catálogo.</li>`,
    `<li><strong>Solicitante:</strong> ${administrative ? 'Carolina Vega' : 'Jorge Díaz'} solo necesita “Puede crear”.</li><li><strong>N1:</strong> ${administrative ? 'Ana Torres' : 'Elena Vargas'} tiene “Crear” y “Aprobar N1”.</li><li><strong>N2:</strong> ${administrative ? 'Carlos Medina y Sofía Rojas' : 'Luis Herrera y Rosa Cruz'} tienen “Aprobar N2” y, si corresponde, “Crear”.</li>`,
    `<li><strong>Alcance:</strong> empresa + ${esc(s.unit)} + ${esc(s.area)}. Tipo ${administrative ? 'COMPRA' : 'CONSUMO'}, dos niveles.</li><li><strong>N1 y N2:</strong> orden 1 es el titular; orden 2 es un suplente, no una firma adicional.</li><li><strong>Publicación:</strong> guarda borrador, valida asignaciones y publica sin duplicar el mismo alcance y vigencia.</li>`,
    `<li><strong>Normal:</strong> solicitante distinto de N1 y N2 → dos revisiones.</li><li><strong>Solicitante N1:</strong> omisión explícita; N2 independiente obligatorio.</li><li><strong>Solicitante N2:</strong> se usa el suplente autorizado; sin suplente se bloquea.</li>`,
    '<li><strong>Snapshot:</strong> el envío conserva regla, responsables y versión, aunque luego cambie la configuración.</li><li><strong>Reasignación:</strong> solo pasos pendientes, persona autorizada e independiente, actor y motivo obligatorios.</li><li><strong>Nueva versión:</strong> invalida una ruta pendiente, vuelve al simulador y reenvía. Las decisiones anteriores permanecen.</li>',
    '<li><strong>Solo análisis:</strong> los SP no se ejecutan desde esta pantalla.</li><li><strong>Dato crítico:</strong> el fundo del requerimiento debe coincidir con la referencia maestra del ámbito.</li><li><strong>Pendiente:</strong> validar el contrato maestro real y probar los cambios en SQL Server con autorización.</li>'
  ];
  return `<span class="eyebrow">CÓMO LLENARLO</span><h3>${tabs[state.tab]}</h3><ol>${content[state.tab]}</ol><hr><h3>Reglas que no cambian</h3><ul><li>No se aprueba una solicitud propia.</li><li>No se baja de dos niveles a uno por falta de N2.</li><li>No se mezcla personal de otros ámbitos sin asignación.</li></ul><hr><p><strong>En la pantalla real:</strong> Admin Logística → Flujo por Niveles → Configurar administración y fundos (nuevo).</p><p>Empresas y fundos: copia real de API Maestra. Personas, áreas, asignaciones y reglas: ejemplos no cargados en tu sistema.</p>`;
}

function validateDraft(d, publication = false) {
  if (!d.from || (d.until && d.until <= d.from)) throw Error('La vigencia de la regla debe tener inicio y fin posterior (o sin fecha fin).');
  if (!d.rows.length || !d.rows.some(p => p.level === 1)) throw Error('Agrega al menos un responsable N1.');
  const keys = new Set(); const identities = new Set();
  for (const p of d.rows) {
    if (!p.id || !Number.isInteger(p.order) || p.order < 1 || !p.from || (p.until && p.until <= p.from)) throw Error('Revisa persona, orden y vigencia de cada responsable.');
    const key = `${p.level}:${p.order}`; const identity = `${p.level}:${p.id}`;
    if (keys.has(key) || identities.has(identity)) throw Error('No se puede repetir el orden ni la misma persona dentro de un nivel.');
    keys.add(key); identities.add(identity);
  }
  if (!publication) return;
  const overlap = state.rules.some(r => r.ruc === d.ruc && r.status === 'PUBLICADA' && r.ambitType === d.ambitType && r.ambitId === d.ambitId && r.areaId === d.areaId && r.type === d.type && (!r.until || d.from < r.until) && (!d.until || r.from < d.until));
  if (overlap) throw Error('Ya existe una regla publicada con el mismo alcance, tipo y período. Inactívala con motivo antes de publicar el reemplazo.');
  const coverage = state.scopes.filter(s => s.active && s.areaActive && matches(d, s));
  if (!coverage.length) throw Error('La regla no cubre ninguna área activa.');
  const date = d.from > today ? d.from : today;
  for (const s of coverage) {
    validateScopeMaster(s);
    const n1 = candidates(d, s, 1, date); const n2 = candidates(d, s, 2, date);
    if (!n1.length) throw Error(`No hay N1 autorizado y disponible para ${nameScope(s)}.`);
    if (d.levels === 2 && !n1.some(a => n2.some(b => a.id !== b.id))) throw Error(`Falta un N2 independiente y autorizado para ${nameScope(s)}. La regla de dos niveles no se publica.`);
  }
}
function updateDraftScope(d) { d.ambitId = d.scopeType === 'TIPO' ? null : scope().ambitId; d.areaId = d.scopeType === 'AREA' ? scope().areaId : null; }
function simulate() {
  try { state.sim.result = resolve(); } catch (error) { state.sim.result = { valid: false, message: error.message }; }
  render();
}
function send() {
  const result = resolve();
  if (!result.description.trim()) throw Error('Agrega una descripción al requerimiento de ejemplo.');
  const request = state.revisionRequest || `DEMO-REQ-${String(state.routes.filter(r => r.version === 1).length + 1).padStart(3, '0')}`;
  const previous = state.routes.filter(r => r.request === request);
  const route = { id: `RUTA-${state.routes.length + 1}`, request, version: previous.length + 1, status: 'PENDIENTE', snapshot: clone(result), effects: 0,
    steps: [{ level: 1, id: result.n1, status: result.omitted ? 'OMITIDO_SOLICITANTE' : 'PENDIENTE', actor: result.omitted ? 'SISTEMA (DEMO)' : null }, ...(result.n2 ? [{ level: 2, id: result.n2, status: 'PENDIENTE', actor: null }] : [])] };
  state.routes.push(route); state.activeRoute = route.id; state.revisionRequest = null; state.actor = route.steps.find(p => p.status === 'PENDIENTE').id; state.reassign = '';
  record('CREACION_RUTA', null, { request, version: route.version, rule: result.rule.id }, 'Envío simulado: regla y contenido congelados');
  if (result.omitted) record('OMISION_N1', { responsable: result.n1 }, { responsableN2: result.n2, solicitante: result.requester }, 'N1 coincide con solicitante; no es una aprobación humana');
  navigate(4); notify('Solicitud de demostración enviada. No se creó ningún requerimiento real.');
}
function decide(approved) {
  const route = currentRoute(); if (!route || route.status !== 'PENDIENTE') throw Error('Esta ruta no tiene una decisión pendiente. No se repite el cierre ni se reabre una ruta final.');
  const pending = route.steps.find(p => p.status === 'PENDIENTE'); const actor = document.getElementById('route-actor').value;
  const motive = document.getElementById('decision-reason').value.trim();
  if (actor === route.snapshot.requester) throw Error('Autoaprobación bloqueada: el solicitante no puede decidir su propio requerimiento.');
  if (actor !== pending.id) throw Error(`Solo ${person(pending.id).name} puede resolver N${pending.level}. N2 no puede adelantarse a N1.`);
  if (route.steps.some(p => p.actor === actor)) throw Error('No se permite contar dos decisiones de la misma identidad.');
  const liveScope = state.scopes.find(s => s.id === route.snapshot.scope.id);
  if (!qualified(liveScope, actor, pending.level, today)) throw Error('La asignación actual ya no está vigente. Se requiere reasignación auditada.');
  if (!approved && !motive) throw Error('El rechazo requiere un comentario.');
  const before = clone(pending); pending.status = approved ? 'APROBADO' : 'RECHAZADO'; pending.actor = actor;
  record(approved ? 'APROBACION' : 'RECHAZO', before, pending, motive || 'Decisión independiente simulada del responsable asignado');
  state.audit[0].actor = actor;
  if (!approved) route.status = 'RECHAZADO';
  else if (!route.steps.some(p => p.status === 'PENDIENTE')) { route.status = 'APROBADO'; route.effects = 1; record('CIERRE_FINAL_SIMULADO', null, { contador: 1, saldos: 'NO EJECUTADO', spring: 'NO EJECUTADO' }, 'Todos los pasos exigidos terminaron; no se ejecutó ninguna integración'); }
  state.actor = route.steps.find(p => p.status === 'PENDIENTE')?.id || actor;
  render(); notify(approved ? 'Paso aprobado en la demo. Revisa el siguiente nivel o el cierre final simulado.' : 'Requerimiento rechazado en la demo.');
}

function saveStructure(data) {
  const why = reason(); const s = scope(); const area = areaCatalog().find(a => a.name === data.get('area'));
  if (!area) throw Error('Selecciona un área del catálogo de esta empresa.');
  const fund = s.type === 'FUNDO' ? masterFund(data.get('fundKey')) : null;
  if (!fund && data.get('fundKey')) throw Error('Un ámbito administrativo no utiliza fundo.');
  const code = data.get('code').trim(); const unit = data.get('unit').trim();
  if (!code || !unit) throw Error('Código y nombre son obligatorios.');
  if (fund && (code !== fund.codigoFundo || unit !== fund.nombreFundo)) throw Error('Código y nombre deben corresponder exactamente al fundo del maestro; no se aceptan valores manuales.');
  if (!fund && code !== s.code) throw Error('El código de la unidad administrativa creada es inmutable.');
  const base = fund ? companyScopes().find(a => a.fundKey === fund.key) : s;
  const ambitId = base?.ambitId || Math.max(...state.scopes.map(a => a.ambitId)) + 1;
  const target = companyScopes().find(a => a.ambitId === ambitId && a.areaId === area.id);
  const occupied = a => a.members.some(m => m.active) || state.rules.some(r => r.status === 'PUBLICADA' && matches(r, a));
  const active = data.has('active'); const areaActive = data.has('areaActive');
  if ((!active && companyScopes().some(a => a.ambitId === ambitId && occupied(a))) || (!areaActive && target && occupied(target))) throw Error('No se desactiva un ámbito o área con asignaciones activas o reglas publicadas.');
  const before = target ? { code: target.code, unit: target.unit, area: target.area, active: target.active, areaActive: target.areaActive } : null;
  companyScopes().filter(a => a.ambitId === ambitId).forEach(a => { a.unit = unit; a.active = active; });
  if (target) {
    target.areaActive = areaActive; selectScope(target.id);
    record('GUARDAR_ESTRUCTURA', before, { code, unit, area: area.name, active, areaActive }, why);
    notify('Estructura guardada en memoria. Puedes continuar con las asignaciones.');
  } else {
    const next = { id: `ambito-${ambitId}-area-${area.id}`, ruc: RUC, type: s.type, ambitId, areaId: area.id,
      fundKey: fund?.key || null, code, unit, area: area.name, active, areaActive, members: [], linkId: Math.max(...state.scopes.map(a => a.linkId || a.ambitId * 10)) + 1 };
    state.scopes.push(next);
    state.drafts[next.id] = { ...clone(state.drafts[s.id]), id: '', ruc: RUC, status: 'BORRADOR', saved: false, scopeType: 'AREA', ambitId, areaId: area.id };
    selectScope(next.id); record(base ? 'HABILITAR_AREA' : 'HABILITAR_FUNDO', null, { idAreaAmbito: next.linkId, area: next.area, ambito: next.unit, fundoMaestro: fund?.id || null }, why);
    notify('Área habilitada como vínculo independiente. El área anterior se conserva y no se heredan permisos: configura sus asignaciones y su regla.');
  }
}

const actions = {
  tab: el => navigate(Number(el.dataset.tab)), scope: el => selectScope(el.dataset.scope),
  member: el => { state.assignment = el.dataset.person; render(); },
  'copy-rule': el => { const r = state.rules.find(r => r.id === el.dataset.rule); if (!r || r.ruc !== RUC) throw Error('La regla no pertenece a la empresa seleccionada.'); state.drafts[state.selected] = { ...clone(r), id: '', status: 'BORRADOR', saved: false }; render(); notify('Se copió a borrador; la regla publicada permanece intacta.'); },
  'deactivate-rule': el => { const why = reason(); const r = state.rules.find(r => r.id === el.dataset.rule); if (!r || r.ruc !== RUC) throw Error('La regla no pertenece a la empresa seleccionada.'); const before = clone(r); r.status = 'INACTIVA'; record('INACTIVAR_REGLA', before, r, why); clearResult(); render(); notify('Regla inactivada solo en la demo. Las rutas enviadas conservan su snapshot.'); },
  'add-responsible': el => { const d = state.drafts[state.selected]; const level = Number(el.dataset.level); d.rows.push(responsible(level, people[0].id, Math.max(0, ...d.rows.filter(p => p.level === level).map(p => p.order)) + 1)); d.saved = false; render(); },
  'remove-responsible': el => { const d = state.drafts[state.selected]; d.rows.splice(Number(el.dataset.row), 1); d.saved = false; render(); },
  publish: () => { reason(); const d = state.drafts[state.selected]; if (!d.saved) throw Error('Guarda el borrador antes de publicar.'); validateDraft(d, true); const r = { ...clone(d), id: `REGLA-${String(state.sequence++).padStart(3, '0')}`, status: 'PUBLICADA' }; state.rules.push(r); record('PUBLICAR_REGLA', d, r); clearResult(); render(); notify('Regla publicada en la demo. Ninguna ruta ya enviada fue alterada.'); },
  send, approve: () => decide(true), reject: () => decide(false),
  reassign: () => {
    const why = reason(); const r = currentRoute(); if (!r || r.status !== 'PENDIENTE') throw Error('Solo se reasignan pasos pendientes.');
    const p = r.steps.find(p => p.status === 'PENDIENTE'); const id = document.getElementById('reassign-person').value;
    if (p.id === id) throw Error('Elige una persona diferente del responsable anterior.');
    if (id === r.snapshot.requester || r.steps.some(other => other !== p && (other.id === id || other.actor === id))) throw Error('La reasignación produciría autoaprobación o repetición de identidad entre niveles.');
    if (!qualified(state.scopes.find(s => s.id === r.snapshot.scope.id), id, p.level, today)) throw Error('La persona no tiene permiso vigente para este nivel y ámbito.');
    const before = clone(p); p.id = id; state.actor = id; state.reassign = ''; record('REASIGNACION', before, p, why); render(); notify('Paso reasignado en la demo. El snapshot inicial y las decisiones anteriores se conservan.');
  },
  invalidate: () => { const why = reason(); const r = currentRoute(); if (!r || r.status !== 'PENDIENTE') throw Error('Una ruta final no se reabre ni se invalida implícitamente.'); const before = { status: r.status, version: r.version }; r.status = 'INVALIDADA'; state.revisionRequest = r.request; record('INVALIDACION', before, { status: r.status, version: r.version }, why); selectScope(r.snapshot.scope.id); state.sim.requester = r.snapshot.requester; state.sim.description = r.snapshot.description; state.tab = 3; render(); notify(`Versión ${r.version} conservada como invalidada. El siguiente envío generará una nueva versión de ${r.request}.`); }
};
document.addEventListener('click', event => {
  const el = event.target.closest('button[data-action]'); if (!el) return;
  try { actions[el.dataset.action]?.(el); } catch (error) { notify(error.message, true); }
});
document.addEventListener('change', event => {
  const el = event.target;
  try {
    if (el.id === 'company-select') { changeCompany(el.value); return; }
    if (el.id === 'master-status') { state.masterStatus[RUC] = el.value; clearResult(); render(); notify('Estado de consulta cambiado solo en la demo. No se borraron configuraciones ni rutas.'); return; }
    if (el.id === 'master-fund') {
      const f = masterFund(el.value); const form = el.closest('form'); form.elements.code.value = f.codigoFundo; form.elements.unit.value = f.nombreFundo;
    }
    if (el.id === 'assignment-person') { state.assignment = el.value; render(); }
    if (el.dataset.draftField) { const d = state.drafts[state.selected]; d[el.dataset.draftField] = el.dataset.draftField === 'levels' ? Number(el.value) : el.value; d.saved = false; updateDraftScope(d); document.querySelector('[data-form="draft"] .inline-title .badge').textContent = 'BORRADOR MODIFICADO'; }
    if (el.dataset.row !== undefined && el.dataset.field) { const d = state.drafts[state.selected]; const field = el.dataset.field; d.rows[Number(el.dataset.row)][field] = el.type === 'checkbox' ? el.checked : ['level', 'order'].includes(field) ? Number(el.value) : el.value; d.saved = false; }
    if (el.dataset.sim) {
      state.sim[el.dataset.sim] = el.value; clearResult();
      if (el.dataset.sim === 'preset' && ['selfN1', 'selfN2', 'single'].includes(el.value)) {
        const level = el.value === 'selfN2' ? 2 : 1; const first = candidates(findRule(scope(), state.sim), scope(), level, state.sim.date)[0];
        if (first) state.sim.requester = first.id;
        document.querySelector('[data-sim="requester"]').value = state.sim.requester;
      }
      document.getElementById('simulation-result').innerHTML = '<div class="callout">Cambiaste los datos de prueba. Pulsa Simular ruta para actualizar el resultado.</div>';
    }
    if (el.id === 'history-route') { state.activeRoute = el.value; state.actor = ''; state.reassign = ''; render(); }
    if (el.id === 'route-actor') state.actor = el.value;
    if (el.id === 'reassign-person') state.reassign = el.value;
  } catch (error) { notify(error.message, true); }
});
document.addEventListener('submit', event => {
  const form = event.target; if (!form.dataset.form) return; event.preventDefault();
  try {
    const data = new FormData(form); const s = scope();
    if (form.dataset.form === 'structure') saveStructure(data);
    if (form.dataset.form === 'assignment') {
      validateScopeMaster(s);
      reason(); const before = clone(s.members.find(p => p.id === state.assignment) || null);
      const next = { id: state.assignment, request: data.has('request'), n1: data.has('n1'), n2: data.has('n2'), active: data.has('active'), from: data.get('from'), until: data.get('until') };
      if (!next.from || (next.until && next.until <= next.from) || (!next.request && !next.n1 && !next.n2)) throw Error('Revisa la vigencia y activa al menos un permiso.');
      const referenced = state.rules.filter(r => r.status === 'PUBLICADA' && matches(r, s)).flatMap(r => r.rows.filter(p => p.id === next.id));
      if (referenced.some(p => !next.active || (p.level === 1 && !next.n1) || (p.level === 2 && !next.n2) || next.from > p.from || (next.until && (!p.until || next.until < p.until)))) throw Error('El cambio deja sin autorización a un responsable publicado. Revisa o inactiva su regla antes de cambiar esta asignación.');
      const index = s.members.findIndex(p => p.id === next.id); if (index === -1) s.members.push(next); else s.members[index] = next;
      record('GUARDAR_ASIGNACION', before, next); clearResult(); render(); notify('Asignación guardada solo para esta área y ámbito.');
    }
    if (form.dataset.form === 'draft') { reason(); const d = state.drafts[state.selected]; updateDraftScope(d); validateDraft(d); const before = { status: d.status, saved: d.saved }; d.saved = true; record('GUARDAR_BORRADOR', before, d); render(); notify('Borrador guardado. Publicarlo es un paso separado.'); }
    if (form.dataset.form === 'simulate') simulate();
  } catch (error) { notify(error.message, true); }
});
document.getElementById('reset').addEventListener('click', () => { if (window.confirm('¿Reiniciar únicamente los datos ficticios de esta demo? Se perderán sus cambios locales.')) { seed(); notify('Demo reiniciada con los ejemplos completos.'); } });
seed();
