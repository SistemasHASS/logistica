export const environment = {
  production: true,
  appVersion: '5.0.0', // se reemplaza automáticamente

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  versionControlApi: 'MAESTRA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  // baseUrl: 'https://apilogistica.agroapps.net:7018',
  baseUrl: 'https://apiqaslogistica.agroapps.net:7641',
  apiMaestra: 'https://apimaestra.agroapps.net:7003',
  // Portal de documentación publicado como subsitio del mismo sitio IIS.
  docsUrl: 'https://logisticaqas.agroapps.net:7642/documentacion'
};
