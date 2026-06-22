import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { TransferenciaService } from '../../services/transferencia.service';
import { Usuario } from '@/app/shared/interfaces/Tables';

interface TransferenciaPendiente {
  id: number;
  idrequerimiento: string;
  RequisicionNumero: string;
  almacenOrigen: string;
  nombreAlmacenOrigen: string;
  almacenDestino: string;
  nombreAlmacenDestino: string;
  estado: string;
  usuarioSolicita: string;
  nombreSolicitante: string;
  usuarioTransfiere: string;
  fechaSolicitud: string;
  fechaTransferencia: string;
  cantidadItems: number;
  descripcionRequerimiento: string;
  observaciones: string;
  observacionesAlmacen: string;
}

interface DetalleTransferencia {
  id: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  stockDisponible: number;
  tieneStock: boolean;
}

@Component({
  selector: 'app-transferencias-almacen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transferencias-almacen.component.html',
  styleUrls: ['./transferencias-almacen.component.scss'],
})
export class TransferenciasAlmacenComponent implements OnInit {
  usuario: Usuario = {} as Usuario;

  activeTab: 'pendientes' | 'historial' = 'pendientes';

  pendientes: TransferenciaPendiente[] = [];
  historial: TransferenciaPendiente[] = [];

  cargandoPendientes = false;
  cargandoHistorial = false;

  transferenciasSeleccionada: TransferenciaPendiente | null = null;
  detalle: DetalleTransferencia[] = [];
  cargandoDetalle = false;

  mostrarModal = false;
  observacionesAlmacen = '';
  ejecutando = false;

  stockInsuficiente = false;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private transferenciaService: TransferenciaService
  ) {}

  async ngOnInit() {
    const usr = await this.dexieService.showUsuario();
    if (usr) this.usuario = usr;
    await this.cargarPendientes();
  }

  switchTab(tab: 'pendientes' | 'historial') {
    this.activeTab = tab;
    if (tab === 'pendientes') {
      this.cargarPendientes();
    } else {
      this.cargarHistorial();
    }
  }

  async cargarPendientes() {
    this.cargandoPendientes = true;
    try {
      const resp = await this.transferenciaService.listarTransferenciasPendientes({
        estado: 'PENDIENTE_TRANSFERENCIA',
        usuario: this.usuario.documentoidentidad,
        ruc: this.usuario.ruc,
      });
      this.pendientes = this.parsearRespuesta(resp);
    } catch (e: any) {
      this.alertService.showAlert('Error', e.message, 'error');
    } finally {
      this.cargandoPendientes = false;
    }
  }

  async cargarHistorial() {
    this.cargandoHistorial = true;
    try {
      const resp = await this.transferenciaService.listarHistorialTransferencias({
        usuario: this.usuario.documentoidentidad,
        ruc: this.usuario.ruc,
      });
      this.historial = this.parsearRespuesta(resp);
    } catch (e: any) {
      this.alertService.showAlert('Error', e.message, 'error');
    } finally {
      this.cargandoHistorial = false;
    }
  }

  async abrirModal(transferencia: TransferenciaPendiente) {
    this.transferenciasSeleccionada = transferencia;
    this.observacionesAlmacen = '';
    this.detalle = [];
    this.stockInsuficiente = false;
    this.mostrarModal = true;

    this.cargandoDetalle = true;
    try {
      const resp = await this.transferenciaService.detalleRequerimientoTransferencia({
        idrequerimiento: transferencia.idrequerimiento,
        almacenOrigen: transferencia.almacenOrigen,
      });
      this.detalle = this.parsearRespuesta(resp);
      this.stockInsuficiente = this.detalle.some((d) => !d.tieneStock);
    } catch (e: any) {
      this.alertService.showAlert('Error', e.message, 'error');
    } finally {
      this.cargandoDetalle = false;
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.transferenciasSeleccionada = null;
    this.detalle = [];
    this.observacionesAlmacen = '';
  }

  async confirmarTransferencia() {
    if (!this.transferenciasSeleccionada) return;

    if (this.stockInsuficiente) {
      this.alertService.showAlert(
        'Stock insuficiente',
        'Uno o más items no tienen stock suficiente en el almacén origen. No se puede ejecutar la transferencia.',
        'warning'
      );
      return;
    }

    this.ejecutando = true;
    try {
      const resp = await this.transferenciaService.ejecutarTransferencia({
        idTransferencia: this.transferenciasSeleccionada.id,
        idrequerimiento: this.transferenciasSeleccionada.idrequerimiento,
        almacenOrigen: this.transferenciasSeleccionada.almacenOrigen,
        almacenDestino: this.transferenciasSeleccionada.almacenDestino,
        usuario: this.usuario.usuario,
        observacionesAlmacen: this.observacionesAlmacen,
      });

      const parsed = this.parsearRespuesta(resp);
      const result = Array.isArray(parsed) ? parsed[0] : parsed;

      if (result?.error) {
        this.alertService.showAlert('Error', result.mensaje || result.error, 'error');
        return;
      }

      const reqSpring = result?.numeroRequisicionSpring  ? ` | Req: ${result.numeroRequisicionSpring}` : '';
      const ntSpring  = result?.numeroNotaTransferenciaSpring ? ` | NT: ${result.numeroNotaTransferenciaSpring}` : '';
      this.alertService.showAlert(
        '¡Transferencia ejecutada!',
        `Stock transferido al almacén ${this.transferenciasSeleccionada.nombreAlmacenDestino || this.transferenciasSeleccionada.almacenDestino}${reqSpring}${ntSpring}`,
        'success'
      );
      this.cerrarModal();
      await this.cargarPendientes();
    } catch (e: any) {
      this.alertService.showAlert('Error', e.message, 'error');
    } finally {
      this.ejecutando = false;
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_TRANSFERENCIA': return 'badge bg-warning text-dark';
      case 'EN_PROCESO':              return 'badge bg-info text-dark';
      case 'TRANSFERIDO':             return 'badge bg-success';
      case 'ANULADO':                 return 'badge bg-danger';
      default:                        return 'badge bg-secondary';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_TRANSFERENCIA': return 'Pendiente';
      case 'EN_PROCESO':              return 'En proceso';
      case 'TRANSFERIDO':             return 'Transferido';
      case 'ANULADO':                 return 'Anulado';
      default:                        return estado;
    }
  }

  private parsearRespuesta(resp: any): any[] {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    try {
      const parsed = typeof resp === 'string' ? JSON.parse(resp) : resp;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
}
