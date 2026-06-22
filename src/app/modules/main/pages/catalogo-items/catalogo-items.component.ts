import { Component, OnInit, signal, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { ItemService } from '@/app/modules/main/services/items.service';
import { MaestroItem } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-catalogo-items',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './catalogo-items.component.html',
  styleUrls: ['./catalogo-items.component.scss'],
})
export class CatalogoItemsComponent implements OnInit {
  private readonly dexieService = inject(DexieService);
  private readonly itemService = inject(ItemService);
  private readonly cdr = inject(ChangeDetectorRef);

  items: MaestroItem[] = [];
  itemsFiltrados: MaestroItem[] = [];
  filtro = '';
  totalRegistros = 0;
  isLoading = signal(false);
  loadingMsg = signal('Cargando catálogo...');

  async ngOnInit() {
    await this.cargarItems();
  }

  async cargarItems() {
    this.isLoading.set(true);
    this.loadingMsg.set('Verificando caché local...');
    this.cdr.markForCheck();
    try {
      const count = await this.dexieService.countMaestroItems();
      if (count > 0) {
        this.loadingMsg.set('Leyendo datos locales...');
        this.cdr.markForCheck();
        const cached = await this.dexieService.showMaestroItem();
        this.items = cached.filter((i: MaestroItem) => i.estado === 'Activo' || i.estado === 'A');
        if (this.items.length === 0) {
          await this.dexieService.clearMaestroItem();
        }
      }

      if (this.items.length === 0) {
        this.loadingMsg.set('Descargando catálogo del servidor...');
        this.cdr.markForCheck();
        const resp = await firstValueFrom(this.itemService.getItemSlim([]));
        if (Array.isArray(resp)) {
          this.items = resp.filter((i: MaestroItem) => i.estado === 'Activo' || i.estado === 'A');
          this.itemsFiltrados = [...this.items];
          this.totalRegistros = this.itemsFiltrados.length;
          this.isLoading.set(false);
          this.cdr.markForCheck();
          if (resp.length) {
            await this.dexieService.clearMaestroItem();
            await this.dexieService.saveMaestroItems(resp);
          }
          return;
        } else {
          console.error('Respuesta de listar-item-slim no es un array:', resp);
        }
      }

      this.itemsFiltrados = [...this.items];
      this.totalRegistros = this.itemsFiltrados.length;
    } catch (error) {
      console.error('Error cargando catálogo de items:', error);
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  async actualizarDesdeApi() {
    this.isLoading.set(true);
    this.loadingMsg.set('Actualizando desde servidor...');
    this.cdr.markForCheck();
    try {
      const resp = await firstValueFrom(this.itemService.getItemSlim([]));
      if (Array.isArray(resp) && resp.length) {
        this.items = resp.filter((i: MaestroItem) => i.estado === 'Activo' || i.estado === 'A');
        this.itemsFiltrados = [...this.items];
        this.totalRegistros = this.itemsFiltrados.length;
        this.isLoading.set(false);
        this.cdr.markForCheck();
        await this.dexieService.clearMaestroItem();
        await this.dexieService.saveMaestroItems(resp);
        return;
      }
    } catch (error) {
      console.error('Error actualizando catálogo:', error);
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  buscar() {
    const q = this.filtro.trim().toLowerCase();
    if (!q) {
      this.itemsFiltrados = [...this.items];
    } else {
      this.itemsFiltrados = this.items.filter(i =>
        (i.item || '').toLowerCase().includes(q) ||
        (i.descripcionLocal || '').toLowerCase().includes(q) ||
        (i.descripcionCompleta || '').toLowerCase().includes(q) ||
        (i.familia || '').toLowerCase().includes(q) ||
        (i.subFamilia || '').toLowerCase().includes(q)
      );
    }
    this.totalRegistros = this.itemsFiltrados.length;
  }
}
