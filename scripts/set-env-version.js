const fs = require('fs');
const pkg = require('../package.json');

const envPath = './src/environments/environment.prod.ts';

let env = fs.readFileSync(envPath, 'utf8');

env = env.replace(
  /appVersion:\s*'.*?'/,
  `appVersion: '${pkg.version}'`
);

fs.writeFileSync(envPath, env);
console.log('✔ environment actualizado:', pkg.version);
