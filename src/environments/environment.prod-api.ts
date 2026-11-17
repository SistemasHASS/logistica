export const environment = {
  production: true,
  // Ambiente de despliegue que este build representa en AppDeployments.
  deployEnvironment: 'production', // 'development' | 'qas' | 'production'  appVersion: '7.0.1', // se reemplaza automáticamente

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  versionControlApi: 'MAESTRA', // 'LOGISTICA' | 'MAESTRA' (default; override runtime en localStorage)
  baseUrl: 'https://apilogistica.agroapps.net:7018',
  // baseUrl: 'https://apiqaslogistica.agroapps.net:7641',
  apiMaestra: 'https://apimaestra.agroapps.net:7003',
  // Portal de documentación publicado como subsitio del mismo sitio IIS.
  docsUrl: 'https://logistica.agroapps.net:7019/documentacion'
};
