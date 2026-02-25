// Ejecutar en consola del navegador
// Reemplaza 'TU_DNI' con tu DNI real

fetch('http://localhost:5213/api/logistica/listar-mis-saldos', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        dni: 'TU_DNI'  // <-- Reemplaza con tu DNI
    })
})
.then(response => response.json())
.then(data => {
    console.log('Datos reales del API:', data);
    console.log('IDs de saldos:', data.map(s => s.idSolicitud));
})
.catch(error => console.error('Error:', error));
