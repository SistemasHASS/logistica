// src/app/modules/main/pages/maestros/comodities/maestros-comodity.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaestrasService } from '../../../services/maestras.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Comodity } from '@/app/shared/interfaces/Tables';
import { SubClasificacion } from '@/app/shared/interfaces/Tables';

@Component({
  selector: 'app-maestros-comodities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maestros-comodities.component.html',
  styleUrls: ['./maestros-comodities.component.scss']
})
export class MaestrosComoditiesComponent implements OnInit {

  listaComodity: Comodity[] = [];
  modelo: any = this.createEmptyModelo();

  // combos / datos auxiliares
  listaClasificaciones: any[] = [];      // cargar desde Dexie o API
  elementosGasto: any[] = [];           // cargar desde Dexie o API

  usuarioActual = 'MISESF';
  fechaHoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  constructor(private maestrasService: MaestrasService, private dexieService: DexieService) {}

  ngOnInit(): void {
    this.cargarLista();
    this.cargarCombos();
  }

  createEmptyModelo() {
    return {
      id: 0,
      codigo: '',
      clasificacion: '',
      descripcionLocal: '',
      descripcionIngles: '',
      estado: 'A',
      ultimaModificacionUsuario: this.usuarioActual,
      ultimaModificacionFecha: this.fechaHoy,
      subClasificaciones: [] as SubClasificacion[]
    };
  }

  async cargarLista() {
    this.listaComodity = await this.dexieService.showComodities();
  }

  async cargarCombos() {
    // ejemplo de carga, ajusta a tus datos reales (puedes sacar de dexie o API)
    this.listaClasificaciones = [
      { id: 1, descripcion: 'Activos Menores' },
      { id: 2, descripcion: 'Activos Fijos' }
    ];
    this.elementosGasto = [
      { id: 1, descripcion: 'Gasto Operativo' },
      { id: 2, descripcion: 'Gasto Capital' }
    ];
  }

  // abrir modal para nuevo
  nuevo() {
    this.modelo = this.createEmptyModelo();
    // abrir bootstrap modal por id
    const el = document.getElementById('modalMaestrosComodity') as any;
    if (el) {
      el.classList.add('show');
      el.style.display = 'block';
      el.setAttribute('aria-modal', 'true');
    }
  }

  // abrir modal y cargar datos existentes (editar)
  async editar(c: Comodity) {
    const full = await this.dexieService.showComodities(); // carga general
    // load comodity from dexie
    const comod = await (await this.dexieService).showComodities(); // not ideal but safe fallback
    // mejor: pedir dexie direct: assuming maestrasService has method showComodityById if needed
    this.modelo = {
      ...c,
      subClasificaciones: await this.dexieService.showSubClasificacionById(c.id) // Convert to string to match expected type
    };

    const el = document.getElementById('modalMaestrosComodity') as any;
    if (el) {
      el.classList.add('show');
      el.style.display = 'block';
      el.setAttribute('aria-modal', 'true');
    }
  }

  // subclasificaciones
  agregarSubClasificacion() {
    const newSub: SubClasificacion = {
      id: 0,
      comodityId: this.modelo.id || 0,
      subClase: '',
      descripcion: '',
      unidad: 'UNI',
      cuentaGasto: '',
      elementoGasto: '',
      clasificacionActivo: '',
      legacyNumber: ''
    };
    this.modelo.subClasificaciones.push(newSub);
  }

  eliminarSubClasificacion(index: number) {
    const sub = this.modelo.subClasificaciones[index];
    if (sub && sub.id && sub.id > 0) {
      // si ya existía en DB, marcar para eliminar o borrarlo
      this.maestrasService.maestrasDexieDeleteSub?.(sub.id).catch(()=>{}); // opcional (no obligatorio)
    }
    this.modelo.subClasificaciones.splice(index, 1);
  }

  // Guardar comodity + subclas
  async guardar() {
    // valida mínimo
    if (!this.modelo.codigo || !this.modelo.descripcionLocal) {
      alert('Código y Descripción obligatorios');
      return;
    }

    // normalizar ids temporales
    if (!this.modelo.id || this.modelo.id === 0) {
      this.modelo.id = Date.now(); // id temporal; Dexie lo guardará
    }
    // asignar comodityId en subclas
    this.modelo.subClasificaciones = this.modelo.subClasificaciones.map((s: SubClasificacion) => ({ ...s, comodityId: this.modelo.id }));

    // llamar al servicio que guarda en Dexie y en API
    await this.maestrasService.saveComodityWithSubclas(this.modelo as Comodity, this.modelo.subClasificaciones as SubClasificacion[]);

    // recargar lista y cerrar modal
    await this.cargarLista();
    this.cerrarModal();
  }

  cerrarModal() {
    const el = document.getElementById('modalMaestrosComodity') as any;
    if (el) {
      el.classList.remove('show');
      el.style.display = 'none';
      el.removeAttribute('aria-modal');
    }
  }
}
