/**
 * Script: update-version.js
 * Función: Genera una nueva versión automática para Angular + Dexie + SW
 */

const fs = require('fs');
const path = require('path');

// 📂 Ruta raíz del proyecto (ajustada a tu estructura)
const ROOT = 'D:/proyectos/logistica/logistica';
const versionFile = path.join(ROOT, 'src/assets/version.json');
const envFiles = [
  path.join(ROOT, 'src/environments/environment.ts'),
  path.join(ROOT, 'src/environments/environment.prod.ts'),
];

// 🕐 Generar versión basada en fecha/hora (YYYY.MM.DD.HHMM)
const now = new Date();
const version = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.${now.getHours()}${now.getMinutes()}`;

// 🧾 Crear o actualizar version.json
const jsonContent = JSON.stringify({ version }, null, 2);
fs.writeFileSync(versionFile, jsonContent);
console.log(`✅ Archivo version.json actualizado → ${versionFile}`);

// 🧠 Actualizar appVersion en environment.ts y environment.prod.ts
for (const envFile of envFiles) {
  if (!fs.existsSync(envFile)) {
    console.warn(`⚠️ No se encontró: ${envFile}`);
    continue;
  }

  let content = fs.readFileSync(envFile, 'utf8');
  if (content.includes('appVersion')) {
    content = content.replace(/appVersion:\s*['"].*['"]/, `appVersion: '${version}'`);
  } else {
    content += `\nexport const appVersion = '${version}';\n`;
  }
  fs.writeFileSync(envFile, content);
  console.log(`🔁 appVersion actualizado en ${path.basename(envFile)} → ${version}`);
}

console.log(`🎉 Nueva versión generada: ${version}`);
