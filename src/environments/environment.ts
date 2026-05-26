export const environment = {
  production: false,   
  appVersion: '1.0.91', // se reemplaza automáticamente

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  //versionControlApi: 'LOGISTICA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  versionControlApi: 'MAESTRA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  // baseUrl: 'http://localhost:5213',
  baseUrl: 'https://apilogistica.agroapps.net:7018',
  apiMaestra: 'https://apimaestra.agroapps.net:7003'
};
