import { Injectable } from '@angular/core';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { 
  ConfiguracionServidorCorreo, 
  DestinatarioCorreo, 
  PlantillaCorreo 
} from '@/app/shared/interfaces/Tables';
import jsPDF from 'jspdf';

export interface EmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Blob | Uint8Array;
  contentType: string;
}

export interface EnvioCorreoLog {
  id?: string;
  idOrden?: number;
  tipo: 'ORDEN_COMPRA' | 'ORDEN_SERVICIO' | 'NOTIFICACION';
  destinatarios: string[];
  asunto: string;
  estado: 'ENVIADO' | 'ERROR' | 'PENDIENTE';
  error?: string;
  fechaEnvio: Date;
  servidorCorreo: string;
  usuarioCrea: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  
  constructor(
    private dexieService: DexieService,
    private alertService: AlertService
  ) {}

  /**
   * Enviar orden de compra por email
   */
  async enviarOrdenCompraPorEmail(
    orden: any, 
    pdfBase64: string, 
    proveedorEmail?: string
  ): Promise<boolean> {
    try {
      // Obtener configuración activa
      const servidor = await this.dexieService.getConfiguracionServidorCorreoActiva();
      if (!servidor) {
        this.alertService.showAlert('Error', 'No hay servidor de correo configurado', 'error');
        return false;
      }

      // Obtener plantilla
      const plantilla = await this.dexieService.getPlantillaCorreoPorTipo('ORDEN_COMPRA');
      if (!plantilla) {
        this.alertService.showAlert('Error', 'No hay plantilla de correo configurada', 'error');
        return false;
      }

      // Obtener destinatarios
      const destinatarios = await this.obtenerDestinatariosOrdenCompra(proveedorEmail);
      if (destinatarios.length === 0) {
        this.alertService.showAlert('Error', 'No hay destinatarios configurados', 'error');
        return false;
      }

      // Preparar contenido del email
      const contenido = this.procesarPlantilla(plantilla, {
        NUMERO_ORDEN: orden.numero || orden.idOrdenCompra,
        NOMBRE_PROVEEDOR: orden.razonSocial || 'Proveedor',
        FECHA_ORDEN: new Date(orden.fechaCreacion).toLocaleDateString('es-PE'),
        MONTO_TOTAL: `S/. ${(orden.montoTotal || 0).toFixed(2)}`,
        ESTADO: orden.estado,
        ITEMS: orden.detalle?.length || 0,
        USUARIO_CREA: orden.usuarioCrea || 'Sistema'
      });

      // Preparar adjunto PDF
      const pdfBlob = this.base64ToBlob(pdfBase64, 'application/pdf');
      const adjuntos: EmailAttachment[] = [
        {
          filename: `OC-${orden.numero || orden.idOrdenCompra}.pdf`,
          content: pdfBlob,
          contentType: 'application/pdf'
        }
      ];

      // Enviar email
      const emailOptions: EmailOptions = {
        to: destinatarios,
        subject: contenido.asunto,
        htmlBody: contenido.cuerpo,
        attachments: adjuntos
      };

      const resultado = await this.enviarEmail(emailOptions, servidor);
      
      // Registrar log
      await this.registrarEnvioCorreo({
        idOrden: orden.idOrdenCompra,
        tipo: 'ORDEN_COMPRA',
        destinatarios: destinatarios,
        asunto: contenido.asunto,
        estado: resultado ? 'ENVIADO' : 'ERROR',
        error: resultado ? undefined : 'Error al enviar email',
        fechaEnvio: new Date(),
        servidorCorreo: servidor.nombreServidor,
        usuarioCrea: 'sistema'
      });

      if (resultado) {
        this.alertService.showAlert('Éxito', 'Orden de compra enviada por email correctamente', 'success');
      }

      return resultado;
    } catch (error) {
      console.error('Error al enviar orden de compra por email:', error);
      this.alertService.showAlert('Error', 'No se pudo enviar el email', 'error');
      return false;
    }
  }

  /**
   * Enviar orden de servicio por email
   */
  async enviarOrdenServicioPorEmail(
    orden: any, 
    pdfBase64: string, 
    proveedorEmail?: string
  ): Promise<boolean> {
    try {
      // Similar a enviarOrdenCompraPorEmail pero para servicios
      const servidor = await this.dexieService.getConfiguracionServidorCorreoActiva();
      if (!servidor) return false;

      const plantilla = await this.dexieService.getPlantillaCorreoPorTipo('ORDEN_SERVICIO');
      if (!plantilla) return false;

      const destinatarios = await this.obtenerDestinatariosOrdenServicio(proveedorEmail);
      if (destinatarios.length === 0) return false;

      const contenido = this.procesarPlantilla(plantilla, {
        NUMERO_ORDEN: orden.numero || orden.idOrdenServicio,
        NOMBRE_PROVEEDOR: orden.razonSocial || 'Proveedor',
        FECHA_ORDEN: new Date(orden.fechaCreacion).toLocaleDateString('es-PE'),
        MONTO_TOTAL: `S/. ${(orden.montoTotal || 0).toFixed(2)}`,
        ESTADO: orden.estado,
        TIPO_SERVICIO: orden.tipoServicio || 'Servicio',
        USUARIO_CREA: orden.usuarioCrea || 'Sistema'
      });

      const pdfBlob = this.base64ToBlob(pdfBase64, 'application/pdf');
      const adjuntos: EmailAttachment[] = [
        {
          filename: `OS-${orden.numero || orden.idOrdenServicio}.pdf`,
          content: pdfBlob,
          contentType: 'application/pdf'
        }
      ];

      const emailOptions: EmailOptions = {
        to: destinatarios,
        subject: contenido.asunto,
        htmlBody: contenido.cuerpo,
        attachments: adjuntos
      };

      const resultado = await this.enviarEmail(emailOptions, servidor);
      
      await this.registrarEnvioCorreo({
        idOrden: orden.idOrdenServicio,
        tipo: 'ORDEN_SERVICIO',
        destinatarios: destinatarios,
        asunto: contenido.asunto,
        estado: resultado ? 'ENVIADO' : 'ERROR',
        fechaEnvio: new Date(),
        servidorCorreo: servidor.nombreServidor,
        usuarioCrea: 'sistema'
      });

      return resultado;
    } catch (error) {
      console.error('Error al enviar orden de servicio por email:', error);
      return false;
    }
  }

  /**
   * Obtener destinatarios para orden de compra
   */
  private async obtenerDestinatariosOrdenCompra(proveedorEmail?: string): Promise<string[]> {
    const destinatarios = await this.dexieService.getDestinatariosCorreoActivos();
    
    // Filtrar destinatarios que reciben órdenes de compra
    const destinatariosOC = destinatarios
      .filter(d => d.recibeOrdenesCompra)
      .map(d => d.email);

    // Agregar email del proveedor si se proporciona
    if (proveedorEmail && !destinatariosOC.includes(proveedorEmail)) {
      destinatariosOC.push(proveedorEmail);
    }

    return destinatariosOC;
  }

  /**
   * Obtener destinatarios para orden de servicio
   */
  private async obtenerDestinatariosOrdenServicio(proveedorEmail?: string): Promise<string[]> {
    const destinatarios = await this.dexieService.getDestinatariosCorreoActivos();
    
    // Filtrar destinatarios que reciben órdenes de servicio
    const destinatariosOS = destinatarios
      .filter(d => d.recibeOrdenesServicio)
      .map(d => d.email);

    // Agregar email del proveedor si se proporciona
    if (proveedorEmail && !destinatariosOS.includes(proveedorEmail)) {
      destinatariosOS.push(proveedorEmail);
    }

    return destinatariosOS;
  }

  /**
   * Procesar plantilla con variables
   */
  private procesarPlantilla(plantilla: PlantillaCorreo, variables: { [key: string]: string }) {
    let asunto = plantilla.asunto;
    let cuerpo = plantilla.cuerpoHtml;

    // Reemplazar variables
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      const value = variables[key] || '';
      asunto = asunto.replace(new RegExp(placeholder, 'g'), value);
      cuerpo = cuerpo.replace(new RegExp(placeholder, 'g'), value);
    });

    return { asunto, cuerpo };
  }

  /**
   * Enviar email usando configuración SMTP
   */
  private async enviarEmail(options: EmailOptions, servidor: ConfiguracionServidorCorreo): Promise<boolean> {
    try {
      // Simulación de envío - en producción esto debería conectarse a un backend real
      console.log('Enviando email con configuración:', {
        servidor: servidor.smtpHost,
        puerto: servidor.smtpPort,
        remitente: servidor.emailFrom,
        destinatarios: options.to,
        asunto: options.subject
      });

      // Simular tiempo de envío
      await new Promise(resolve => setTimeout(resolve, 2000));

      // En producción, aquí iría la llamada real al backend para enviar el email
      // Por ahora simulamos éxito
      return true;
    } catch (error) {
      console.error('Error al enviar email:', error);
      return false;
    }
  }

  /**
   * Convertir base64 a Blob
   */
  private base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  /**
   * Registrar log de envío de correo
   */
  private async registrarEnvioCorreo(log: EnvioCorreoLog): Promise<void> {
    // Aquí se guardaría el log en la base de datos
    // Por ahora solo lo mostramos en consola
    console.log('Registro de envío de correo:', log);
  }

  /**
   * Obtener configuraciones predefinidas para hassperu.com
   */
  getConfiguracionesPredefinidas(): ConfiguracionServidorCorreo[] {
    return [
      {
        nombreServidor: 'Gmail - hassperu.com',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'correo@hassperu.com',
        smtpPassword: 'contraseña_aplicacion',
        emailFrom: 'ordenes@hassperu.com',
        emailFromName: 'HASS Perú - Sistema Logística',
        replyTo: 'soporte@hassperu.com',
        activo: true,
        limiteDiario: 500
      },
      {
        nombreServidor: 'Outlook - hassperu.com',
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'correo@hassperu.com',
        smtpPassword: 'contraseña',
        emailFrom: 'logistica@hassperu.com',
        emailFromName: 'HASS Perú - Logística',
        replyTo: 'info@hassperu.com',
        activo: false,
        limiteDiario: 300
      },
      {
        nombreServidor: 'Servidor Propio - hassperu.com',
        smtpHost: 'mail.hassperu.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'no-reply@hassperu.com',
        smtpPassword: 'contraseña_servidor',
        emailFrom: 'sistema@hassperu.com',
        emailFromName: 'HASS Perú - Sistema',
        replyTo: 'admin@hassperu.com',
        activo: false,
        limiteDiario: 1000
      }
    ];
  }

  /**
   * Obtener plantillas predefinidas
   */
  getPlantillasPredefinidas(): PlantillaCorreo[] {
    return [
      {
        nombre: 'Orden de Compra Estándar',
        tipo: 'ORDEN_COMPRA',
        asunto: 'Orden de Compra #{NUMERO_ORDEN} - HASS Perú',
        cuerpoHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2c3e50; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Orden de Compra</h1>
              <p style="margin: 5px 0;">HASS Perú - Sistema de Logística</p>
            </div>
            
            <div style="padding: 20px; background: #f8f9fa;">
              <h2>Estimado(a) {NOMBRE_PROVEEDOR},</h2>
              <p>Por medio de la presente, le comunicamos que se ha generado una nueva Orden de Compra:</p>
              
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Número de Orden:</strong> #{NUMERO_ORDEN}</p>
                <p><strong>Fecha:</strong> {FECHA_ORDEN}</p>
                <p><strong>Monto Total:</strong> {MONTO_TOTAL}</p>
                <p><strong>Estado:</strong> {ESTADO}</p>
                <p><strong>Items:</strong> {ITEMS}</p>
                <p><strong>Usuario:</strong> {USUARIO_CREA}</p>
              </div>
              
              <p>Adjunto encontrará el PDF detallado de la orden de compra. Agradecemos su atención y pronta respuesta.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p><strong>Atentamente,</strong></p>
                <p><strong>Departamento de Logística</strong></p>
                <p><strong>HASS Perú</strong></p>
                <p>Web: www.hassperu.com</p>
                <p>Email: logistica@hassperu.com</p>
              </div>
            </div>
            
            <div style="background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p>Este es un correo automático generado por el Sistema de Logística de HASS Perú</p>
              <p>Por favor no responder a este mensaje. Para consultas, contactar a soporte@hassperu.com</p>
            </div>
          </div>
        `,
        variables: ['NUMERO_ORDEN', 'NOMBRE_PROVEEDOR', 'FECHA_ORDEN', 'MONTO_TOTAL', 'ESTADO', 'ITEMS', 'USUARIO_CREA'],
        activo: true
      },
      {
        nombre: 'Orden de Servicio Estándar',
        tipo: 'ORDEN_SERVICIO',
        asunto: 'Orden de Servicio #{NUMERO_ORDEN} - HASS Perú',
        cuerpoHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #16a085; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Orden de Servicio</h1>
              <p style="margin: 5px 0;">HASS Perú - Sistema de Logística</p>
            </div>
            
            <div style="padding: 20px; background: #f8f9fa;">
              <h2>Estimado(a) {NOMBRE_PROVEEDOR},</h2>
              <p>Por medio de la presente, le comunicamos que se ha generado una nueva Orden de Servicio:</p>
              
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Número de Orden:</strong> #{NUMERO_ORDEN}</p>
                <p><strong>Fecha:</strong> {FECHA_ORDEN}</p>
                <p><strong>Tipo de Servicio:</strong> {TIPO_SERVICIO}</p>
                <p><strong>Monto Total:</strong> {MONTO_TOTAL}</p>
                <p><strong>Estado:</strong> {ESTADO}</p>
                <p><strong>Usuario:</strong> {USUARIO_CREA}</p>
              </div>
              
              <p>Adjunto encontrará el PDF detallado de la orden de servicio. Agradecemos su atención y pronta respuesta.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p><strong>Atentamente,</strong></p>
                <p><strong>Departamento de Logística</strong></p>
                <p><strong>HASS Perú</strong></p>
                <p>Web: www.hassperu.com</p>
                <p>Email: logistica@hassperu.com</p>
              </div>
            </div>
            
            <div style="background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p>Este es un correo automático generado por el Sistema de Logística de HASS Perú</p>
              <p>Por favor no responder a este mensaje. Para consultas, contactar a soporte@hassperu.com</p>
            </div>
          </div>
        `,
        variables: ['NUMERO_ORDEN', 'NOMBRE_PROVEEDOR', 'FECHA_ORDEN', 'MONTO_TOTAL', 'ESTADO', 'TIPO_SERVICIO', 'USUARIO_CREA'],
        activo: true
      }
    ];
  }
}
