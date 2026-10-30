export const environment = {
  production: false,
  // Ambiente de despliegue que este build representa en AppDeployments.
  // Debe coincidir con el servidor al que apunta baseUrl (hoy: QAS).
  deployEnvironment: 'qas', // 'development' | 'qas' | 'production'
  appVersion: '5.0.2', // se reemplaza automáticamente

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  //versionControlApi: 'LOGISTICA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  versionControlApi: 'MAESTRA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  // baseUrl: 'https://apilogistica.agroapps.net:7018',
  baseUrl: 'https://apiqaslogistica.agroapps.net:7641',
  // baseUrl: 'http://localhost:5213',
  apiMaestra: 'https://apimaestra.agroapps.net:7003',
  // Portal de documentación (botón Ayuda). En dev apunta al subsitio publicado en QAS.
  docsUrl: 'https://logisticaqas.agroapps.net:7642/documentacion'
};
