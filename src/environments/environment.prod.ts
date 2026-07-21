export const environment = {
  production: true,
  // appVersion: '3.3.13', // se reemplaza automáticamente
  appVersion: '3.3.13',

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  versionControlApi: 'MAESTRA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  // baseUrl: 'https://localhost:7140',
  // baseUrl: 'http://localhost:5213',
  baseUrl: 'https://apilogistica.agroapps.net:7018',
  apiMaestra: 'https://apimaestra.agroapps.net:7003'
};
