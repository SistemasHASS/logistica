const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n📦 Seleccione el ambiente para el build:\n');
console.log('1. Development (API Local: http://localhost:5213)');
console.log('2. Producción (API Local: http://localhost:5213)');
console.log('3. Producción con API Público (https://apilogistica.agroapps.net:7018)');

rl.question('\nIngrese el número de la opción (1-3): ', (answer) => {
  rl.close();

  let buildCommand;
  let envName;

  switch (answer.trim()) {
    case '1':
      buildCommand = 'npm run build:dev';
      envName = 'Development';
      break;
    case '2':
      buildCommand = 'npm run build:prod';
      envName = 'Producción (API Local)';
      break;
    case '3':
      buildCommand = 'npm run build:prod-api';
      envName = 'Producción (API Público)';
      break;
    default:
      console.log('\n❌ Opción no válida. Use los números 1, 2 o 3.');
      process.exit(1);
  }

  console.log(`\n🚀 Iniciando build para ${envName}...\n`);

  const child = exec(buildCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`\n❌ Error en el build: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`\n⚠️  Advertencias:\n${stderr}`);
    }
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`\n✅ Build completado exitosamente para ${envName}!`);
      console.log('📁 Los archivos están en la carpeta dist/logistica');
    } else {
      console.log(`\n❌ El build falló con código de salida: ${code}`);
    }
  });
});
