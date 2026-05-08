import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrdenCompra, Proveedor } from '@/app/shared/interfaces/Tables';

@Injectable({
  providedIn: 'root'
})
export class OrdenCompraPdfService {
  
  generarPdfOrdenCompra(orden: OrdenCompra, proveedor: Proveedor): jsPDF {
    const doc = new jsPDF();
    
    // Configuración de fuentes
    doc.setFont('helvetica');
    
    // Encabezado
    this.addEncabezado(doc, orden);
    
    // Datos del proveedor
    this.addDatosProveedor(doc, proveedor);
    
    // Detalles de la orden
    this.addDetallesOrden(doc, orden);
    
    // Tabla de items
    this.addTablaItems(doc, orden);
    
    // Totales
    this.addTotales(doc, orden);
    
    // Pie de página
    this.addPiePagina(doc);
    
    return doc;
  }
  
  private addEncabezado(doc: jsPDF, orden: OrdenCompra): void {
    // Logo (placeholder)
    doc.setFontSize(24);
    doc.setTextColor(0, 102, 204);
    doc.text('ORDEN DE COMPRA', 105, 20, { align: 'center' });
    
    // Número de orden
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`N°: ${orden.numeroOrden || 'PENDIENTE'}`, 105, 30, { align: 'center' });
    
    // Fecha
    doc.text(`Fecha: ${new Date(orden.fecha || Date.now()).toLocaleDateString('es-PE')}`, 105, 37, { align: 'center' });
    
    // Estado
    doc.setFontSize(10);
    const estadoColor = this.getEstadoColor(orden.estado || 'GENERADA');
    doc.setTextColor(...estadoColor);
    doc.text(`Estado: ${orden.estado}`, 105, 44, { align: 'center' });
  }
  
  private addDatosProveedor(doc: jsPDF, proveedor: Proveedor): void {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('DATOS DEL PROVEEDOR:', 20, 60);
    
    doc.setFontSize(10);
    let y = 68;
    
    doc.text(`RUC: ${proveedor.ruc || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Tipo Persona: ${proveedor.TipoPersona || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Estado: ${proveedor.Estado || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Tipo Pago: ${proveedor.TipoPago || 'CONTADO'}`, 20, y);
    y += 6;
    doc.text(`Moneda Pago: ${proveedor.MonedaPago || 'PEN'}`, 20, y);
    
    // Condiciones de pago
    doc.text(`Tipo Servicio: ${proveedor.TipoServicio || 'N/A'}`, 120, 68);
  }
  
  private addDetallesOrden(doc: jsPDF, orden: OrdenCompra): void {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('DETALLES DE LA ORDEN:', 20, 100);
    
    doc.setFontSize(10);
    let y = 108;
    
    doc.text(`Proveedor: ${orden.nombreProveedor || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Dirección Entrega: ${orden.direccionEntrega || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Forma de Pago: ${orden.formaPago || 'CONTADO'}`, 20, y);
    y += 6;
    doc.text(`Plazo de Entrega: ${orden.plazoEntrega || 'N/A'} días`, 20, y);
    y += 6;
    doc.text(`Observaciones: ${orden.observaciones || 'N/A'}`, 20, y);
  }
  
  private addTablaItems(doc: jsPDF, orden: OrdenCompra): void {
    const startY = 140;
    
    // Encabezados de tabla
    const headers = ['Código', 'Descripción', 'Cantidad', 'Unidad', 'Precio Unit.', 'Total'];
    
    // Datos de la tabla
    const body = (orden.detalle || []).map(item => [
      item.codigo || 'N/A',
      item.descripcion || 'N/A',
      item.cantidad?.toString() || '0',
      item.unidadMedida || 'UND',
      `S/. ${item.precioUnitario?.toFixed(2) || '0.00'}`,
      `S/. ${((item.cantidad || 0) * (item.precioUnitario || 0)).toFixed(2)}`
    ]);
    
    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      }
    });
  }
  
  private addTotales(doc: jsPDF, orden: OrdenCompra): void {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Calcular totales
    const subtotal = orden.montoTotal || 0;
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    
    // Cuadro de totales
    doc.setDrawColor(0);
    doc.rect(130, finalY, 60, 50);
    
    doc.text('Subtotal:', 135, finalY + 10);
    doc.text(`S/. ${subtotal.toFixed(2)}`, 175, finalY + 10, { align: 'right' });
    
    doc.text('IGV (18%):', 135, finalY + 20);
    doc.text(`S/. ${igv.toFixed(2)}`, 175, finalY + 20, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 102, 204);
    doc.text('TOTAL:', 135, finalY + 35);
    doc.text(`S/. ${total.toFixed(2)}`, 175, finalY + 35, { align: 'right' });
  }
  
  private addPiePagina(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height;
    
    // Línea separadora
    doc.setDrawColor(200);
    doc.line(20, pageHeight - 30, 190, pageHeight - 30);
    
    // Texto de pie
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Este documento es una orden de compra válida', 105, pageHeight - 20, { align: 'center' });
    doc.text('Generado el: ' + new Date().toLocaleString('es-PE'), 105, pageHeight - 15, { align: 'center' });
    
    // Número de página
    doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, 190, pageHeight - 10, { align: 'right' });
  }
  
  private getEstadoColor(estado: string): [number, number, number] {
    switch (estado) {
      case 'GENERADA': return [0, 123, 255];   // Azul
      case 'ENVIADA': return [255, 193, 7];    // Amarillo
      case 'CONFIRMADA': return [40, 167, 69]; // Verde
      case 'EN_PROCESO': return [108, 117, 125]; // Gris
      case 'RECIBIDA_PARCIAL': return [255, 193, 7]; // Amarillo
      case 'RECIBIDA_TOTAL': return [40, 167, 69]; // Verde
      case 'CANCELADA': return [220, 53, 69];   // Rojo
      default: return [108, 117, 125]; // Gris
    }
  }
  
  descargarPdf(orden: OrdenCompra, proveedor: Proveedor): void {
    const doc = this.generarPdfOrdenCompra(orden, proveedor);
    const fileName = `OC-${orden.numeroOrden || 'TEMP'}-${orden.id || 'TEMP'}.pdf`;
    doc.save(fileName);
  }
}
