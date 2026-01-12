// /**
//  * Script: update-version.js
//  * Función: Genera una nueva versión automática para Angular + Dexie + SW
//  */

const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve('package.json');
const envPaths = [
  path.resolve('src/environments/environment.ts'),
  path.resolve('src/environments/environment.prod.ts')
];
const versionJsonPath = path.resolve('src/assets/version.json');

// 📦 Leer versión desde package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

// ✏️ Actualizar package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// 🔁 Actualizar environments
for (const envPath of envPaths) {
  if (!fs.existsSync(envPath)) continue;

  let content = fs.readFileSync(envPath, 'utf8');

  // 1️⃣ Actualizar SOLO el comentario
  content = content.replace(
    /(\/\/\s*appVersion:\s*')[^']*('.*se reemplaza automáticamente)/,
    `$1${newVersion}$2`
  );

  // 2️⃣ Actualizar SOLO la línea real (inicio de línea)
  content = content.replace(
    /^\s*appVersion:\s*'[^']*',/m,
    `  appVersion: '${newVersion}',`
  );

  fs.writeFileSync(envPath, content);
}

// 📄 version.json
fs.writeFileSync(
  versionJsonPath,
  JSON.stringify(
    {
      version: newVersion,
      buildTime: new Date().toISOString()
    },
    null,
    2
  )
);

console.log(`✅ Versión actualizada correctamente → ${newVersion}`);

// const fs = require('fs');
// const path = require('path');

// // 📂 Ruta raíz del proyecto (ajustada a tu estructura)
// // const ROOT = 'D:/proyectos/logistica/logistica';
// // 📌 raíz real del proyecto
// const ROOT = process.cwd();

// const versionFile = path.join(ROOT, 'src/assets/version.json');
// const envFiles = [
//   path.join(ROOT, 'src/environments/environment.ts'),
//   path.join(ROOT, 'src/environments/environment.prod.ts'),
// ];

// // 🕐 Generar versión basada en fecha/hora (YYYY.MM.DD.HHMM)
// const now = new Date();
// const version = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.${now.getHours()}${now.getMinutes()}`;

// // 🧾 Crear o actualizar version.json
// // const jsonContent = JSON.stringify({ version }, null, 2);
// // fs.writeFileSync(versionFile, jsonContent);
// // console.log(`✅ Archivo version.json actualizado → ${versionFile}`);

// const versionData = {
//   version,
//   buildTime: new Date().toISOString()
// };

// fs.writeFileSync(
//   versionFile,
//   JSON.stringify(versionData, null, 2)
// );

// console.log(`✅ version.json actualizado → ${version}`);

// // 🧠 Actualizar appVersion en environment.ts y environment.prod.ts
// for (const envFile of envFiles) {
//   if (!fs.existsSync(envFile)) {
//     console.warn(`⚠️ No se encontró: ${envFile}`);
//     continue;
//   }

//   let content = fs.readFileSync(envFile, 'utf8');
//   if (content.includes('appVersion')) {
//     content = content.replace(/appVersion:\s*['"].*['"]/, `appVersion: '${version}'`);
//   } else {
//     content += `\nexport const appVersion = '${version}';\n`;
//   }
//   fs.writeFileSync(envFile, content);
//   console.log(`🔁 appVersion actualizado en ${path.basename(envFile)} → ${version}`);
// }

// console.log(`🎉 Nueva versión generada: ${version}`);
