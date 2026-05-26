export const environment = {
  production: true,
  // appVersion: '1.0.91', // se reemplaza automáticamente
  appVersion: '1.0.91',

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  versionControlApi: 'MAESTRA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  // baseUrl: 'https://localhost:7140',
  // baseUrl: 'http://localhost:5213',
  baseUrl: 'https://apilogistica.agroapps.net:7018',
  apiMaestra: 'https://apimaestra.agroapps.net:7003'
};
