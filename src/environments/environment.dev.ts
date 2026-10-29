export const environment = {
  production: false,
  // Ambiente de despliegue que este build representa en AppDeployments.
  deployEnvironment: 'development', // 'development' | 'qas' | 'production'
  appVersion: '1.0.0',

  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  // baseUrl: 'https://localhost:7140',
  baseUrl: 'http://localhost:5213',
  // baserUrl: 'https://apilogistica.agroapps.net:7018',
  // baserUrl: 'https://logisticaqas.agroapps.net:7642',
  apiMaestra: 'https://apimaestra.agroapps.net:7003',
  // Portal de documentación (botón Ayuda). En dev apunta al subsitio publicado en QAS.
  docsUrl: 'https://logisticaqas.agroapps.net:7642/documentacion'
}