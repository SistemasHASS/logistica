const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para generar documentación automática del proyecto
 * Analiza el código y genera documentación en formato Markdown
 */

const projectRoot = path.join(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');
const srcDir = path.join(projectRoot, 'src');

// Crear directorio de documentación si no existe
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

console.log('📚 Generando documentación del proyecto...\n');

// Función para obtener información del package.json
function getProjectInfo() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description || 'Sistema de Logística',
  };
}

// Función para listar archivos recursivamente
function listFiles(dir, fileList = [], extensions = ['.ts', '.html', '.css', '.scss']) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorar directorios node_modules, dist, .angular, etc.
      if (!['node_modules', 'dist', '.angular', '.git'].includes(file)) {
        listFiles(filePath, fileList, extensions);
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Función para analizar componentes Angular
function analyzeComponents() {
  const componentsDir = path.join(srcDir, 'app', 'modules', 'main', 'pages');
  const components = [];
  
  if (!fs.existsSync(componentsDir)) {
    return components;
  }
  
  const dirs = fs.readdirSync(componentsDir);
  
  dirs.forEach(dir => {
    const componentPath = path.join(componentsDir, dir);
    const stat = fs.statSync(componentPath);
    
    if (stat.isDirectory()) {
      const tsFile = path.join(componentPath, `${dir}.component.ts`);
      const htmlFile = path.join(componentPath, `${dir}.component.html`);
      
      if (fs.existsSync(tsFile)) {
        const content = fs.readFileSync(tsFile, 'utf-8');
        
        // Extraer información del componente
        const selectorMatch = content.match(/selector:\s*['"]([^'"]+)['"]/);
        const templateMatch = content.match(/templateUrl:\s*['"]([^'"]+)['"]/);
        
        // Contar métodos públicos
        const publicMethods = (content.match(/^\s*(async\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*{/gm) || []).length;
        
        // Contar propiedades
        const properties = (content.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*[:=]/gm) || []).length;
        
        components.push({
          name: dir,
          selector: selectorMatch ? selectorMatch[1] : 'N/A',
          hasTemplate: fs.existsSync(htmlFile),
          methods: publicMethods,
          properties: properties,
          path: componentPath.replace(projectRoot, ''),
        });
      }
    }
  });
  
  return components;
}

// Función para analizar servicios
function analyzeServices() {
  const servicesDir = path.join(srcDir, 'app', 'modules', 'main', 'services');
  const services = [];
  
  if (!fs.existsSync(servicesDir)) {
    return services;
  }
  
  const files = fs.readdirSync(servicesDir);
  
  files.forEach(file => {
    if (file.endsWith('.service.ts')) {
      const filePath = path.join(servicesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Contar métodos
      const methods = (content.match(/^\s*(async\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*{/gm) || []).length;
      
      services.push({
        name: file.replace('.service.ts', ''),
        methods: methods,
        path: filePath.replace(projectRoot, ''),
      });
    }
  });
  
  return services;
}

// Función para generar documentación principal
function generateMainDocs() {
  const projectInfo = getProjectInfo();
  const components = analyzeComponents();
  const services = analyzeServices();
  
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# ${projectInfo.name.toUpperCase()} - Documentación Frontend

**Versión:** ${projectInfo.version}  
**Fecha:** ${date}  
**Descripción:** ${projectInfo.description}

---

## 📋 Tabla de Contenidos

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Componentes](#componentes)
3. [Servicios](#servicios)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Tecnologías Utilizadas](#tecnologías-utilizadas)

---

## 🎯 Resumen del Proyecto

Sistema de gestión logística desarrollado con Angular 20, PrimeNG 20 y Bootstrap 5.

### Estadísticas del Proyecto

- **Total de Componentes:** ${components.length}
- **Total de Servicios:** ${services.length}
- **Versión de Angular:** 20.3.6
- **Versión de PrimeNG:** 20.3.0

---

## 🧩 Componentes

### Lista de Componentes (${components.length})

| Componente | Selector | Métodos | Propiedades | Ruta |
|------------|----------|---------|-------------|------|
`;

  components.forEach(comp => {
    markdown += `| **${comp.name}** | \`${comp.selector}\` | ${comp.methods} | ${comp.properties} | \`${comp.path}\` |\n`;
  });

  markdown += `\n---

## 🔧 Servicios

### Lista de Servicios (${services.length})

| Servicio | Métodos | Ruta |
|----------|---------|------|
`;

  services.forEach(service => {
    markdown += `| **${service.name}** | ${service.methods} | \`${service.path}\` |\n`;
  });

  markdown += `\n---

## 📁 Estructura del Proyecto

\`\`\`
logistica/
├── src/
│   ├── app/
│   │   ├── modules/
│   │   │   └── main/
│   │   │       ├── pages/          # Componentes de páginas
│   │   │       ├── services/       # Servicios de negocio
│   │   │       └── components/     # Componentes compartidos
│   │   ├── shared/
│   │   │   ├── interfaces/         # Interfaces TypeScript
│   │   │   ├── services/           # Servicios compartidos
│   │   │   └── utils/              # Utilidades
│   │   └── services/               # Servicios globales
│   ├── environments/               # Configuraciones de entorno
│   └── styles/                     # Estilos globales
├── scripts/                        # Scripts de automatización
└── docs/                           # Documentación
\`\`\`

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular:** 20.3.6
- **PrimeNG:** 20.3.0
- **Bootstrap:** 5.3.3
- **TypeScript:** Latest
- **RxJS:** 7.8.0

### Librerías Adicionales
- **Dexie:** 4.0.11 (IndexedDB)
- **SweetAlert2:** 11.15.10 (Alertas)
- **ExcelJS:** 4.4.0 (Exportación Excel)
- **jsPDF:** 3.0.4 (Generación PDF)
- **Moment.js:** 2.30.1 (Manejo de fechas)

### Herramientas de Desarrollo
- **Angular CLI:** 20.3.6
- **Service Worker:** PWA Support
- **Git:** Control de versiones

---

## 📝 Notas de Desarrollo

### Características Principales

1. **Gestión de Requerimientos**
   - Creación y seguimiento de requerimientos
   - Aprobación por jefatura
   - Consolidación de items

2. **Sistema de Cotizaciones**
   - Registro de cotizaciones
   - Comparación de proveedores
   - Estados: RECIBIDA → EN_EVALUACION → SELECCIONADA/RECHAZADA

3. **Notificaciones en Tiempo Real**
   - Notificaciones de stock
   - Notificaciones de aprobaciones
   - Sistema de alertas

4. **Almacenamiento Local**
   - IndexedDB con Dexie
   - Sincronización con backend
   - Modo offline

---

## 🔄 Flujos de Trabajo

### Flujo de Cotizaciones

1. Se genera solicitud de cotización desde consolidación
2. Proveedores envían cotizaciones (estado: RECIBIDA)
3. Al recibir 2+ cotizaciones → cambian a EN_EVALUACION automáticamente
4. Usuario compara cotizaciones
5. Selecciona ganadora → estado: SELECCIONADA
6. Otras cotizaciones → estado: RECHAZADA

---

## 📞 Contacto y Soporte

Para más información sobre el proyecto, contactar al equipo de desarrollo.

**Última actualización:** ${date}
`;

  return markdown;
}

// Generar documentación
try {
  console.log('📝 Analizando componentes...');
  const components = analyzeComponents();
  console.log(`   ✓ ${components.length} componentes encontrados\n`);
  
  console.log('📝 Analizando servicios...');
  const services = analyzeServices();
  console.log(`   ✓ ${services.length} servicios encontrados\n`);
  
  console.log('📝 Generando documentación principal...');
  const mainDocs = generateMainDocs();
  const mainDocsPath = path.join(docsDir, 'FRONTEND.md');
  fs.writeFileSync(mainDocsPath, mainDocs, 'utf-8');
  console.log(`   ✓ Documentación guardada en: ${mainDocsPath}\n`);
  
  console.log('✅ Documentación generada exitosamente!\n');
  console.log('📂 Archivos generados:');
  console.log(`   - docs/FRONTEND.md`);
  console.log('');
  
} catch (error) {
  console.error('❌ Error al generar documentación:', error.message);
  process.exit(1);
}
