// import { Component, OnInit } from '@angular/core';
// import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
// import { FormsModule } from "@angular/forms";
// import { CommonModule } from "@angular/common";
// import { Requerimiento, DetalleRequerimiento } from 'src/app/shared/interfaces/Tables';

// @Component({
//   selector: 'app-despacho',
//   templateUrl: './despacho.component.html',
//     imports: [FormsModule, CommonModule]
// })
// export class DespachoComponent implements OnInit {

//   cabecera: any = {};
//   filtro = '';

//   items: any[] = [];
//   detalle: any[] = [];

//   // requerimientos: any[] = [];
//   // selected: any | null = null;
//   // loading = false;

//   requerimientos: Requerimiento[] = [];
//   selected?: Requerimiento;
//   detalles: DetalleRequerimiento[] = [];
//   detalleForms: { [id: number]: { despachado: number } } = {};

//   // requerimientos: RequerimientoResumen[] = [];
//   // selected: RequerimientoResumen | null = null;
//   // items: ItemRequerimiento[] = [];
//   // detalle: AtencionDetalle[] = [];
//   loading = false;


//   constructor(private requerimientosService: RequerimientosService) {}

//   ngOnInit() {
//     this.cargarRequerimiento();
//   }

//   cargarRequerimiento() {
//     this.requerimientosService.getRequerimientosConsumo(this.cabecera).subscribe(resp => {
//       this.cabecera = resp.cabecera;
//       this.items = resp.items;
//     });
//   }

//   buscar() {
//     this.requerimientosService.getBuscarRequerimietnos(this.filtro).subscribe(r => {
//       this.items = r;
//     });
//   }

//   agregarDespacho() {
//     this.items.forEach(i => {
//       if (i.despacho > 0) {
//         this.detalle.push({
//           idItem: i.id,
//           descripcion: i.descripcion,
//           cantidad: i.despacho,
//         });

//         i.pendiente -= i.despacho;
//         i.atendida += i.despacho;
//         i.despacho = 0;
//       }
//     });
//   }

//   eliminar(index: number) {
//     this.detalle.splice(index, 1);
//   }

//   guardar() {
//     const payload = {
//       cabecera: this.cabecera,
//       detalle: this.detalle
//     };

//     this.requerimientosService.registrarDespacho(payload).subscribe(() => {
//       alert('Despacho registrado correctamente');
//       this.detalle = [];
//       this.cargarRequerimiento();
//     });
//   }
// }

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { Usuario } from '@/app/shared/interfaces/Tables';

declare var bootstrap: any;

interface Stock {
  codigo: string;
  descripcion: string;
  almacen: string;
  cantidad: number;
}

interface OrdenCompra {
  id: number;
  fecha: string;
  items: any[];
  estado: 'GENERADA' | 'ENVIADA' | 'RECIBIDA';
  proveedor?: string;
}

@Component({
  selector: 'app-despachos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './despacho.component.html',
  styleUrls: ['despacho.component.scss']
})
export class DespachoComponent implements OnInit {
  
  // Listas principales
  requerimientosAprobados: any[] = [];
  stockDisponible: Stock[] = [];
  ordenesCompraGeneradas: OrdenCompra[] = [];
  
  // Modal detalle despacho
  requerimientoSeleccionado: any = null;
  detalleDespacho: any[] = [];
  
  // Usuario
  usuario: Usuario = {
    id: "",
    sociedad: 0,
    idempresa: "",
    ruc: "",
    razonSocial: "",
    idProyecto: "",
    proyecto: "",
    documentoidentidad: "",
    usuario: "",
    clave: "",
    nombre: "",
    idrol: "",
    rol: ""
  };

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private requerimientosService: RequerimientosService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarRequerimientosAprobados();
    await this.cargarStockDisponible();
  }

  async cargarUsuario() {
    const usuario = await this.dexieService.showUsuario();
    if (usuario) {
      this.usuario = usuario;
    }
  }

  async cargarRequerimientosAprobados() {
    const requerimientos = await this.dexieService.showRequerimiento();
    this.requerimientosAprobados = requerimientos.filter(
      r => r.estados === 'APROBADO' && !r.despachado
    );
  }

  async cargarStockDisponible() {
    // Aquí deberías cargar desde tu API el stock real
    // Por ahora simulo datos de ejemplo
    this.stockDisponible = [
      { codigo: 'ITEM001', descripcion: 'Producto A', almacen: 'ALM01', cantidad: 100 },
      { codigo: 'ITEM002', descripcion: 'Producto B', almacen: 'ALM01', cantidad: 50 },
      { codigo: 'ITEM003', descripcion: 'Producto C', almacen: 'ALM01', cantidad: 0 },
    ];
  }

  obtenerStock(codigo: string, almacen: string): number {
    const stock = this.stockDisponible.find(
      s => s.codigo === codigo && s.almacen === almacen
    );
    return stock ? stock.cantidad : 0;
  }

  async abrirModalDespacho(req: any) {
    this.requerimientoSeleccionado = req;
    
    // Preparar detalle con stock disponible
    this.detalleDespacho = req.detalle.map((det: any) => {
      const stockDisp = this.obtenerStock(det.codigo, req.idalmacen);
      const faltante = Math.max(0, det.cantidad - stockDisp);
      
      return {
        ...det,
        stockDisponible: stockDisp,
        cantidadDespachar: Math.min(det.cantidad, stockDisp),
        faltante: faltante,
        generaOrdenCompra: faltante > 0
      };
    });

    const modalElement = document.getElementById('modalDespacho');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  async procesarDespacho() {
    if (!this.requerimientoSeleccionado) return;

    try {
      this.alertService.mostrarModalCarga();

      // 1. Procesar los items que SÍ se pueden despachar
      const itemsDespachados = this.detalleDespacho.filter(d => d.cantidadDespachar > 0);
      
      // 2. Generar orden de compra para faltantes
      const itemsFaltantes = this.detalleDespacho.filter(d => d.faltante > 0);
      
      if (itemsFaltantes.length > 0) {
        await this.generarOrdenCompraAutomatica(itemsFaltantes);
      }

      // 3. Actualizar stock
      for (const item of itemsDespachados) {
        await this.actualizarStock(item.codigo, this.requerimientoSeleccionado.idalmacen, -item.cantidadDespachar);
      }

      // 4. Marcar requerimiento como despachado
      this.requerimientoSeleccionado.despachado = true;
      this.requerimientoSeleccionado.fechaDespacho = new Date().toISOString();
      this.requerimientoSeleccionado.usuarioDespacho = this.usuario.documentoidentidad;
      
      await this.dexieService.requerimientos.put(this.requerimientoSeleccionado);

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        `Despacho procesado correctamente. ${itemsFaltantes.length > 0 ? 'Se generó orden de compra para items faltantes.' : ''}`,
        'success'
      );

      // Cerrar modal y recargar
      const modalElement = document.getElementById('modalDespacho');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
      }

      await this.cargarRequerimientosAprobados();
      
    } catch (error) {
      console.error('Error en despacho:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al procesar el despacho', 'error');
    }
  }

  async generarOrdenCompraAutomatica(itemsFaltantes: any[]) {
    const nuevaOrden: OrdenCompra = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      estado: 'GENERADA',
      items: itemsFaltantes.map(item => ({
        codigo: item.codigo,
        descripcion: item.descripcion || item.producto,
        cantidad: item.faltante,
        requerimientoOrigen: this.requerimientoSeleccionado.idrequerimiento
      }))
    };

    this.ordenesCompraGeneradas.push(nuevaOrden);
    
    // Aquí deberías guardar en Dexie o enviar al backend
    console.log('Orden de compra generada:', nuevaOrden);
  }

  async actualizarStock(codigo: string, almacen: string, cantidad: number) {
    const stock = this.stockDisponible.find(
      s => s.codigo === codigo && s.almacen === almacen
    );
    
    if (stock) {
      stock.cantidad += cantidad; // cantidad será negativa para despacho
    }
  }

  async sincronizarDespachos() {
    this.alertService.mostrarModalCarga();
    
    try {
      // Aquí implementarías la sincronización con el backend
      // Ejemplo:
      // const response = await this.despachosService.sincronizarDespachos(payload);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Éxito', 'Despachos sincronizados correctamente', 'success');
      
    } catch (error) {
      console.error('Error sincronización:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'No se pudo sincronizar', 'error');
    }
  }

  verOrdenesCompra() {
    // Abrir modal o navegar a vista de órdenes de compra
    console.log('Órdenes de compra generadas:', this.ordenesCompraGeneradas);
    this.alertService.showAlert(
      'Órdenes de Compra',
      `Hay ${this.ordenesCompraGeneradas.length} órdenes generadas automáticamente`,
      'info'
    );
  }

  calcularTotalFaltantes(): number {
    return this.detalleDespacho
      .filter(d => d.faltante > 0)
      .reduce((sum, d) => sum + d.faltante, 0);
  }

  calcularTotalDespachar(): number {
    return this.detalleDespacho
      .reduce((sum, d) => sum + d.cantidadDespachar, 0);
  }
}