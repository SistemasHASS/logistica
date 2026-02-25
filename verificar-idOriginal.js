// Script para verificar idOriginal en Dexie
// Abre la consola del navegador y pega este código

(async () => {
  const dexie = new Dexie('Logistica');
  dexie.version(30).stores({
    detalles: `++id,idOriginal,idrequerimiento,codigo,descripcion,producto,cantidad,proyecto,ceco,turno,labor,esActivoFijo,activoFijo,estado,atendida`
  });
  
  const detalles = await dexie.table('detalles').limit(5).toArray();
  console.log('Primeros 5 detalles:');
  detalles.forEach(d => {
    console.log({
      id: d.id,
      idOriginal: d.idOriginal,
      codigo: d.codigo,
      descripcion: d.descripcion
    });
  });
  
  // Verificar si algún detalle tiene idOriginal
  const conIdOriginal = detalles.filter(d => d.idOriginal);
  console.log(`\nDetalles con idOriginal: ${conIdOriginal.length}/${detalles.length}`);
})();
