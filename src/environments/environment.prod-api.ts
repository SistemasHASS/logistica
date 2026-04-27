export const environment = {
  production: true,
  appVersion: '1.0.68', // se reemplaza automáticamente

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  versionControlApi: 'LOGISTICA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  baseUrl: 'https://apilogistica.agroapps.net:7018',
  apiMaestra: 'https://apimaestra.agroapps.net:7003'
};
