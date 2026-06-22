# Sistema de Versionado Semántico - Documentación Completa

## Índice
1. [Estructura de Versión](#estructura-de-versión)
2. [Filosofía del Sistema](#filosofía-del-sistema)
3. [Archivos Involucrados](#archivos-involucrados)
4. [Comandos Disponibles](#comandos-disponibles)
5. [Flujos de Trabajo por Tipo de Cambio](#flujos-de-trabajo-por-tipo-de-cambio)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Integración con CI/CD](#integración-con-cicd)
8. [Troubleshooting](#troubleshooting)

---

## Estructura de Versión

```json
{
  "version": "1.1.0",
  "build": 187,
  "buildTime": "2026-06-17T20:00:00.000Z"
}
```

### Componentes

| Campo | Descripción | Control |
|-------|-------------|---------|
| `version` | Semántica MAJOR.MINOR.PATCH | **Manual** (desarrollador) |
| `build` | Número incremental automático | **Automático** (cada build) |
| `buildTime` | Timestamp ISO 8601 | **Automático** |

### Versionado Semántico (MAJOR.MINOR.PATCH)

```
1.4.2
│ │ │
│ │ └── PATCH: Correcciones de bugs
│ └──── MINOR: Nuevas funcionalidades
└────── MAJOR: Cambios grandes/breaking
```

| Tipo | Cuándo Incrementar | Ejemplos |
|------|-------------------|----------|
| **MAJOR** | Cambios incompatibles, arquitectura nueva, módulos completos nuevos | Nuevo módulo "Transporte", migración de framework, cambio de API breaking |
| **MINOR** | Funcionalidades nuevas, backwards compatible | Nuevo reporte, nueva vista, integración API externa, nuevos campos en formularios |
| **PATCH** | Correcciones, bugfixes, hotfixes | Fix de validación, corrección de typo, fix de seguridad, ajuste de estilos |

---

## Filosofía del Sistema

### Principio Fundamental
> **Solo el desarrollador sabe qué tipo de cambio está haciendo.**

Por eso:
- ✅ **Automático**: Solo el número de `build` (cantidad de compilaciones)
- ✅ **Manual**: La decisión de MAJOR vs MINOR vs PATCH

### Flujo de Decisión

```
¿Estás corrigiendo un bug existente?
    ├── SÍ → npm run version:patch (PATCH +1)
    └── NO → ¿Estás agregando funcionalidad nueva?
                ├── SÍ → npm run version:minor (MINOR +1, PATCH 0)
                └── NO → ¿Es un cambio grande/arquitectura/módulo nuevo?
                            ├── SÍ → npm run version:major (MAJOR +1, MINOR 0, PATCH 0)
                            └── NO → Solo compila (build incrementa automático)
```

---

## Archivos Involucrados

### 1. `src/assets/version.json` (Fuente de Verdad)
```json
{
  "version": "1.1.0",
  "build": 187,
  "buildTime": "2026-06-17T20:00:00.000Z"
}
```

### 2. `package.json` (Sincronización)
- El campo `version` se sincroniza con `version.json`
- Usado por npm para metadata

### 3. `src/environments/environment*.ts` (Runtime)
```typescript
export const environment = {
  production: true,
  appVersion: '1.1.0', // Visible en la aplicación
  // ... resto de config
};
```

### 4. Scripts

| Script | Función |
|--------|---------|
| `scripts/update-version.js` | Incrementa `build` automáticamente |
| `scripts/version-patch.js` | Incrementa PATCH manualmente |
| `scripts/version-minor.js` | Incrementa MINOR manualmente |
| `scripts/version-major.js` | Incrementa MAJOR manualmente |
| `scripts/register-deployment.js` | Registra deployment en API |

---

## Comandos Disponibles

### Verificar Versión Actual
```bash
npm run version:check
```
**Output:**
```json
{
  "version": "1.1.0",
  "build": 187,
  "buildTime": "2026-06-17T20:00:00.000Z"
}
```

### Cambios Manuales (Decisión del Desarrollador)

#### Bugfix → PATCH
```bash
npm run version:patch
```
- `1.1.0` → `1.1.1`
- Build se resetea a `0`

#### Funcionalidad → MINOR
```bash
npm run version:minor
```
- `1.1.1` → `1.2.0`
- Build se resetea a `0`

#### Cambio Grande → MAJOR
```bash
npm run version:major
```
- `1.2.0` → `2.0.0`
- Build se resetea a `0`

### Builds (Automático)

```bash
# Desarrollo local
npm run start          # build +1, ng serve

# Build producción
npm run build          # build +1, ng build --prod
npm run build:prod     # build +1, ng build --prod
npm run build:dev      # build +1, ng build --dev
npm run build:prod-api # build +1, ng build --prod-api
```

---

## Flujos de Trabajo por Tipo de Cambio

### Escenario 1: Bugfix (PATCH)

**Contexto:** Un usuario reporta que el botón "Guardar" en el formulario de OC no funciona en Safari.

```bash
# 1. Identificar el bug
# 2. Corregir el código en el componente

# 3. Antes de commit, incrementar PATCH
npm run version:patch

# Output: ✅ PATCH incrementado: 1.1.0 -> 1.1.1

# 4. Verificar
npm run version:check
# Output: {"version": "1.1.1", "build": 0}

# 5. Commit y push
git add .
git commit -m "fix: corrección botón guardar OC en Safari"
git push

# 6. Build y deploy
npm run build:prod
# Output: 
#   Versión: 1.1.1 (build 1)
#   Build time: 2026-06-17T12:30:00Z
```

**Resultado final:**
```json
{
  "version": "1.1.1",
  "build": 1,
  "buildTime": "2026-06-17T12:30:00.000Z"
}
```

---

### Escenario 2: Nueva Funcionalidad (MINOR)

**Contexto:** Se requiere agregar un nuevo reporte de "Consolidación de Compras por Proveedor".

```bash
# 1. Crear rama feature
git checkout -b feature/reporte-consolidacion

# 2. Desarrollar la funcionalidad (varios días, múltiples builds)
npm run start    # build 1
# ... código ...
npm run build    # build 2
# ... más código ...
npm run build    # build 3

# 3. Funcionalidad terminada, merge a main
git checkout main
git merge feature/reporte-consolidacion

# 4. Incrementar MINOR
npm run version:minor

# Output: ✅ MINOR incrementado: 1.1.0 -> 1.2.0

# 5. Commit de versión
git add .
git commit -m "feat: nuevo reporte consolidación de compras por proveedor"
git push

# 6. Build producción
npm run build:prod
# Output: Versión 1.2.0 (build 1)
```

**Resultado final:**
```json
{
  "version": "1.2.0",
  "build": 1,
  "buildTime": "2026-06-17T15:45:00.000Z"
}
```

---

### Escenario 3: Módulo Nuevo (MAJOR)

**Contexto:** Se inicia el desarrollo del módulo completo "Gestión de Transporte y Distribución".

```bash
# 1. Planificación del módulo
# 2. Crear rama epic
git checkout -b epic/modulo-transporte

# 3. Desarrollo del módulo (varias semanas)
npm run start    # build 1
# ... semana 1 ...
npm run build    # build 15
# ... semana 2 ...
npm run build    # build 32
# ... semana 3 ...
npm run build    # build 48

# 4. Módulo completado, merge a main
git checkout main
git merge epic/modulo-transporte

# 5. Incrementar MAJOR
npm run version:major

# Output: ✅ MAJOR incrementado: 1.2.0 -> 2.0.0

# 6. Commit
git add .
git commit -m "feat!: nuevo módulo de gestión de transporte y distribución

BREAKING CHANGE: Nuevo menú principal, cambio en permisos de roles"
git push

# 7. Deploy
npm run deploy:full
```

**Resultado final:**
```json
{
  "version": "2.0.0",
  "build": 1,
  "buildTime": "2026-06-17T18:00:00.000Z"
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Día típico de desarrollo

```bash
# Mañana: Empezar a trabajar
npm run start
# Output: build 1

# Mediodía: Testear cambios
npm run build:dev
# Output: build 2

# Tarde: Más cambios
npm run start
# Output: build 3

# Encontraste un bug pequeño, lo corriges
npm run version:patch
# 1.1.0 -> 1.1.1, build 0

npm run build:prod
# Output: 1.1.1 (build 1)
```

### Ejemplo 2: Sprint de 2 semanas

```bash
# === Semana 1 ===
# Día 1
npm run version:check  # 1.0.0, build 0
npm run start          # 1.0.0, build 1

# Día 2-3: Desarrollo
npm run build          # 1.0.0, build 2
npm run build          # 1.0.0, build 3

# Día 4: Bugfix urgente
npm run version:patch  # 1.0.0 -> 1.0.1, build 0
npm run build:prod     # 1.0.1, build 1

# Día 5: Más desarrollo
npm run start          # 1.0.1, build 2

# === Semana 2 ===
# Día 6-8: Nuevas funcionalidades
npm run build          # 1.0.1, build 3
npm run build          # 1.0.1, build 4

# Día 9: Termina funcionalidad
npm run version:minor  # 1.0.1 -> 1.1.0, build 0
npm run build:prod     # 1.1.0, build 1

# Día 10: Deploy
npm run deploy:full
```

### Ejemplo 3: Hotfix en producción

```bash
# Producción está en 1.2.5 (build 3)
# Usuario reporta bug crítico

# 1. Crear rama hotfix
git checkout -b hotfix/correccion-critica

# 2. Corregir bug
# ... código ...

# 3. Incrementar PATCH
npm run version:patch  # 1.2.5 -> 1.2.6

# 4. Build y test
npm run build:prod     # 1.2.6 (build 1)

# 5. Deploy urgente
npm run deploy

# 6. Merge a main
git checkout main
git merge hotfix/correccion-critica
git push
```

---

## Integración con CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Update version (build auto)
        run: node scripts/update-version.js
      
      - name: Build
        run: npm run build:prod
      
      - name: Register deployment
        run: node scripts/register-deployment.js
        env:
          DEPLOY_VERSION_API: LOGISTICA
```

### Azure DevOps

```yaml
# azure-pipelines.yml
trigger:
  - main

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: 'Install Node.js'

  - script: npm ci
    displayName: 'Install dependencies'

  - script: node scripts/update-version.js
    displayName: 'Update build number'

  - script: npm run build:prod
    displayName: 'Build production'

  - script: node scripts/register-deployment.js
    displayName: 'Register deployment'
    env:
      DEPLOY_VERSION_API: LOGISTICA
```

---

## Troubleshooting

### Problema: `version.json` no existe

**Síntoma:**
```
Error: ENOENT: no such file or directory, open 'src/assets/version.json'
```

**Solución:**
```bash
# Crear archivo inicial manualmente
echo '{"version": "1.0.0", "build": 0, "buildTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}' > src/assets/version.json
```

---

### Problema: Versiones desincronizadas

**Síntoma:** `package.json` dice `1.1.0` pero `version.json` dice `1.0.5`

**Solución:**
```bash
# Forzar sincronización desde version.json
node scripts/update-version.js
```

---

### Problema: Quiero resetear el build number

**Solución:**
```bash
# Editar manualmente version.json y poner build: 0
# O incrementar PATCH (resetea build automáticamente)
npm run version:patch
```

---

### Problema: Error en register-deployment

**Síntoma:** El build funciona pero falla el registro en API

**Solución:**
```bash
# Skip temporalmente
npm run build:no-register

# O setear variable de entorno
set DEPLOY_SKIP_REGISTER=1
npm run build
```

---

### Problema: Script no encontrado en Windows PowerShell

**Síntoma:**
```
npm run version:check
> cat src/assets/version.json
cat : El término 'cat' no se reconoce
```

**Solución:**
```bash
# Usar PowerShell nativo
Get-Content src/assets/version.json

# O modificar el script en package.json
"version:check": "type src/assets/version.json"
```

---

## Convenciones de Commit

Usar [Conventional Commits](https://www.conventionalcommits.org/) para claridad:

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `fix:` | Bugfixes (PATCH) | `fix: corrección validación formulario OC` |
| `feat:` | Funcionalidad (MINOR) | `feat: nuevo reporte consolidación` |
| `feat!:` | Breaking change (MAJOR) | `feat!: nuevo módulo transporte` |
| `docs:` | Documentación | `docs: actualizar README` |
| `refactor:` | Refactorización | `refactor: simplificar servicio OC` |

---

## Checklist de Liberación

Antes de hacer deploy:

- [ ] ¿Corriste `npm run version:patch/minor/major` según corresponda?
- [ ] ¿Verificaste `npm run version:check`?
- [ ] ¿Actualizaste el CHANGELOG.md?
- [ ] ¿Hiciste commit con mensaje descriptivo?
- [ ] ¿Corriste tests? `npm run test`
- [ ] ¿Hiciste build? `npm run build:prod`
- [ ] ¿Verificaste que no hay errores en consola?
- [ ] ¿Deployaste? `npm run deploy`

---

## Resumen de Comandos Rápido

| Acción | Comando |
|--------|---------|
| Ver versión | `npm run version:check` |
| Bugfix | `npm run version:patch` |
| Funcionalidad | `npm run version:minor` |
| Módulo nuevo | `npm run version:major` |
| Build dev | `npm run build:dev` |
| Build prod | `npm run build:prod` |
| Deploy completo | `npm run deploy:full` |

---

**Documento versión:** 1.0.0  
**Última actualización:** 2026-06-17
