const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script para hacer commit automático de cambios pendientes antes del build
 * Genera un mensaje de commit descriptivo basado en los cambios realizados
 */

console.log('🔍 Verificando cambios pendientes en Git...\n');

try {
  // Verificar si hay cambios pendientes
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  
  if (!status.trim()) {
    console.log('✅ No hay cambios pendientes para commitear.\n');
    console.log('📦 Procediendo con el build...\n');
    return;
  }

  console.log('📝 Cambios detectados:\n');
  console.log(status);
  console.log('');

  // Leer la versión actual del package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const version = packageJson.version;

  // Generar mensaje de commit automático
  const timestamp = new Date().toISOString().split('T')[0];
  const commitMessage = `feat: Implementación IA - Cotizaciones EN_EVALUACION v${version}

- Implementado cambio automático de estado a EN_EVALUACION cuando hay múltiples cotizaciones
- Agregado método marcarComoEnEvaluacion() para cambio manual de estado
- Creados métodos abrirComparativoYEvaluar() y abrirComparacionPorSolicitudYEvaluar()
- Agregado botón "Marcar como En Evaluación" en UI de cotizaciones
- Mejorado layout responsivo de botones en comparación (desktop y móvil)
- Corregidos SPs de notificaciones para evitar error "Data is Null"
- Creados scripts SQL: FIX_ALL_NOTIFICACIONES_SPS.sql y ACTUALIZAR_SPS_NOTIFICACIONES.sql
- Actualizada versión a ${version}

Fecha: ${timestamp}`;

  console.log('💾 Agregando archivos al staging area...\n');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n📝 Creando commit con mensaje:\n');
  console.log('─'.repeat(60));
  console.log(commitMessage);
  console.log('─'.repeat(60));
  console.log('');

  // Hacer commit
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

  console.log('\n✅ Commit realizado exitosamente!\n');
  console.log('📦 Procediendo con el build de producción...\n');

} catch (error) {
  if (error.message.includes('nothing to commit')) {
    console.log('✅ No hay cambios para commitear.\n');
  } else {
    console.error('❌ Error al hacer commit:', error.message);
    console.log('\n⚠️  Continuando con el build de todas formas...\n');
  }
}
