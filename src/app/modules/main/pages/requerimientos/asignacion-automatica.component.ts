// =============================================
// ASIGNACIÓN AUTOMÁTICA DE APROBADOR POR ÁREA
// =============================================

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-asignacion-automatica',
  template: ''
})
export class AsignacionAutomaticaComponent implements OnInit {

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Ejemplo de cómo funciona la asignación automática
  }

  // =============================================
  // MÉTODO 1: Obtener jefe de área de un usuario
  // =============================================
  async obtenerJefeDeArea(idarea: number, ruc: string): Promise<any> {
    try {
      const response = await this.http.post(
        `${environment.baseUrl}/api/logistica/obtener-jefe-area`,
        { ruc, idarea }
      ).toPromise();

      return response;
    } catch (error) {
      console.error('Error obteniendo jefe de área:', error);
      return null;
    }
  }

  // =============================================
  // MÉTODO 2: Al guardar requerimiento - Asignar aprobador
  // =============================================
  async guardarRequerimientoConAprobador() {
    try {
      // 1. Datos del requerimiento (viene del formulario)
      const datosRequerimiento = {
        idrequerimiento: 'REQ-2026-001',
        ruc: '20481121966',
        idarea: '1', // Área del usuario que crea
        dniregistra: '87654321', // Usuario que crea
        tipo: 'CONSUMO',
        glosa: 'Requerimiento de prueba'
      };

      // 2. Primero guardar el requerimiento
      const resultado = await this.guardarRequerimiento(datosRequerimiento);

      // 3. Luego asignar el aprobador automáticamente
      if (resultado.id) {
        const jefeArea = await this.obtenerJefeDeArea(
          parseInt(datosRequerimiento.idarea),
          datosRequerimiento.ruc
        );

        if (jefeArea && jefeArea.documentoidentidad) {
          // 4. Crear registro de aprobación
          await this.asignarAprobador({
            idRequerimiento: resultado.id,
            numeroRequerimiento: datosRequerimiento.idrequerimiento,
            ruc: datosRequerimiento.ruc,
            idarea: parseInt(datosRequerimiento.idarea),
            aprobadorAsignado: jefeArea.documentoidentidad,
            rolAprobador: 'JEFE_AREA',
            secuencia: 1,
            usuarioSolicita: datosRequerimiento.dniregistra
          });
        }
      }

      console.log('Requerimiento guardado y aprobador asignado');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // =============================================
  // MÉTODOS AUXILIARES
  // =============================================
  private async guardarRequerimiento(datos: any) {
    // Llama a tu servicio existente para guardar
    return { id: 123, idrequerimiento: datos.idrequerimiento };
  }

  private async asignarAprobador(datos: any) {
    // Llama al endpoint para asignar aprobadores
    return this.http.post(
      `${environment.baseUrl}/api/logistica/asignar-aprobadores-requerimiento`,
      datos
    ).toPromise();
  }
}

// =============================================
// EJEMPLO PRÁCTICO - FLUJO COMPLETO
// =============================================

/*
ESCENARIO:
- Usuario Pedro (DNI: 87654321) del área Logística (idarea=1) crea un requerimiento
- Su jefe es Juan (DNI: 11111111)

PASOS:
1. Pedro crea requerimiento con idarea=1
2. Sistema busca en LOGISTICA_UsuariosPorArea:
   WHERE idarea=1 AND rol='JEFE_AREA' AND esJefeArea=1
3. Encuentra a Juan (DNI: 11111111)
4. Asigna a Juan como aprobador en LOGISTICA_LogAprobaciones
5. Juan ve el requerimiento en su panel de aprobaciones
*/

// =============================================
// CONSULTA SQL PARA OBTENER JEFE DE ÁREA
// =============================================
/*
SELECT 
    documentoidentidad,
    nombreCompleto,
    email
FROM LOGISTICA_UsuariosPorArea
WHERE ruc = @ruc
  AND idarea = @idarea
  AND rol = 'JEFE_AREA'
  AND esJefeArea = 1
  AND activo = 1
*/
