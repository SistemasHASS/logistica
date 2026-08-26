export const environment = {
  production: false,
  appVersion: '3.4.0', // se reemplaza automáticamente

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  //versionControlApi: 'LOGISTICA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  versionControlApi: 'MAESTRA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  // baseUrl: 'https://apilogistica.agroapps.net:7018',
  baseUrl: 'http://localhost:5213',
  apiMaestra: 'https://apimaestra.agroapps.net:7003'
};
