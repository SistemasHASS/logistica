import { Component, OnInit } from '@angular/core';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Requerimiento, DetalleRequerimiento } from 'src/app/shared/interfaces/Tables';

@Component({
  selector: 'app-despacho',
  templateUrl: './despacho.component.html',
    imports: [FormsModule, CommonModule]
})
export class DespachoComponent implements OnInit {

  cabecera: any = {};
  filtro = '';

  items: any[] = [];
  detalle: any[] = [];

  // requerimientos: any[] = [];
  // selected: any | null = null;
  // loading = false;

  requerimientos: Requerimiento[] = [];
  selected?: Requerimiento;
  detalles: DetalleRequerimiento[] = [];
  detalleForms: { [id: number]: { despachado: number } } = {};

  // requerimientos: RequerimientoResumen[] = [];
  // selected: RequerimientoResumen | null = null;
  // items: ItemRequerimiento[] = [];
  // detalle: AtencionDetalle[] = [];
  // loading = false;


  constructor(private requerimientosService: RequerimientosService) {}

  ngOnInit() {
    this.cargarRequerimiento();
  }

  cargarRequerimiento() {
    this.requerimientosService.getRequerimientosConsumo(this.cabecera).subscribe(resp => {
      this.cabecera = resp.cabecera;
      this.items = resp.items;
    });
  }

  buscar() {
    this.requerimientosService.getBuscarRequerimietnos(this.filtro).subscribe(r => {
      this.items = r;
    });
  }

  agregarDespacho() {
    this.items.forEach(i => {
      if (i.despacho > 0) {
        this.detalle.push({
          idItem: i.id,
          descripcion: i.descripcion,
          cantidad: i.despacho,
        });

        i.pendiente -= i.despacho;
        i.atendida += i.despacho;
        i.despacho = 0;
      }
    });
  }

  eliminar(index: number) {
    this.detalle.splice(index, 1);
  }

  guardar() {
    const payload = {
      cabecera: this.cabecera,
      detalle: this.detalle
    };

    this.requerimientosService.registrarDespacho(payload).subscribe(() => {
      alert('Despacho registrado correctamente');
      this.detalle = [];
      this.cargarRequerimiento();
    });
  }
}
