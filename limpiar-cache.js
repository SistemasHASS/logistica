// Ejecutar en la consola del navegador para limpiar datos cacheados

// 1. Limpiar localStorage
localStorage.clear();

// 2. Limpiar sessionStorage
sessionStorage.clear();

// 3. Limpiar IndexedDB (Dexie)
indexedDB.databases().then(databases => {
    databases.forEach(database => {
        indexedDB.deleteDatabase(database.name);
    });
});

// 4. Recargar la página
location.reload();
