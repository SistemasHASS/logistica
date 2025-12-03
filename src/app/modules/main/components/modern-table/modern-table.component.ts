import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-modern-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modern-table.component.html',
  styleUrls: ['./modern-table.component.scss'],
})
export class ModernTableComponent implements OnChanges {
  // Configuración
  @Input() columns: Array<{ header: string; field: string; visible?: boolean }> =
    [];
  @Input() data: any[] = [];
  @Input() pageSize = 10;
  @Input() loading = false;

  // Eventos
  @Output() onEdit = new EventEmitter<number>();
  @Output() onDelete = new EventEmitter<number>();
  @Output() onAdd = new EventEmitter<void>();
  @Output() onRowClick = new EventEmitter<any>();
  

  // Estado interno
  sortedColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  page = 1;
  darkMode = false;

  searchText: string = '';

  // recalcula si cambian inputs
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.page = 1;
    }
  }

  // Get the number of visible columns including action column
  get visibleColumnsCount(): number {
    return (this.columns?.filter(c => c.visible !== false).length || 0) + 1; // +1 for action buttons
  }

  // Get the end index for pagination display
  get endIndex() {
    return Math.min(this.page * this.pageSize, this.filteredData.length);
  }

  // ✅ FILTRADO + ORDEN + PAGINADO
  get filteredData() {
    let filtered = this.data ?? [];

    if (this.searchText && this.searchText.trim().length) {
      const q = this.searchText.toLowerCase();
      filtered = filtered.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(q)
      );
    }

    if (this.sortedColumn) {
      filtered = [...filtered].sort((a, b) => {
        const A = a[this.sortedColumn];
        const B = b[this.sortedColumn];

        // manejamos null/undefined y strings/numbers
        if (A == null && B == null) return 0;
        if (A == null) return this.sortDirection === 'asc' ? -1 : 1;
        if (B == null) return this.sortDirection === 'asc' ? 1 : -1;

        if (typeof A === 'number' && typeof B === 'number') {
          return this.sortDirection === 'asc' ? A - B : B - A;
        }

        const aStr = String(A).toLowerCase();
        const bStr = String(B).toLowerCase();
        if (aStr < bStr) return this.sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
  }

  get paginatedData() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  cambiarPagina(p: number) {
    if (p < 1) p = 1;
    if (p > this.totalPages) p = this.totalPages;
    this.page = p;
  }

  // Ordenamiento
  sort(colField: string) {
    if (this.sortedColumn === colField) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortedColumn = colField;
      this.sortDirection = 'asc';
    }
    this.page = 1;
  }

  // Export Excel
  exportToExcel(filename = 'tabla.xlsx') {
    const visibleCols = this.columns.filter((c) =>
      c.visible === undefined ? true : c.visible
    );
    const exportData = this.filteredData.map((row) =>
      visibleCols.reduce((acc, c) => {
        acc[c.header] = row[c.field];
        return acc;
      }, {} as any)
    );

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(blob, filename);
  }

  // Export PDF
  exportToPDF(filename = 'tabla.pdf') {
    const doc = new jsPDF({ orientation: 'landscape' });
    const visibleCols = this.columns.filter((c) =>
      c.visible === undefined ? true : c.visible
    );

    const head = [visibleCols.map((c) => c.header)];
    const body = this.filteredData.map((row) =>
      visibleCols.map((c) => (row[c.field] !== undefined ? row[c.field] : ''))
    );

    autoTable(doc, {
      head,
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [52, 73, 94] },
    });

    doc.save(filename);
  }

  // Columnas dinámicas: alterna visibilidad
  toggleColumn(col: { visible?: boolean }) {
    col.visible = !col.visible;
  }

  // Botones de fila
  edit(row: any) {
    this.onEdit.emit(row);
  }
  delete(row: any) {
    this.onDelete.emit(row);
  }
  add() {
    this.onAdd.emit();
  }
  rowClick(row: any) {
    this.onRowClick.emit(row);
  }
}
