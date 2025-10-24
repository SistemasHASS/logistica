import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Almacen } from '../../model/almacen.model';
import { LogisticaService } from '../../services/logistica.service';
import { UserService } from '@/app/shared/services/user.service';
import { ParametrosService } from '../../services/parametros.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './parametros.component.html',
  styleUrls: ['./parametros.component.scss']
})
export class ParametrosComponent implements OnInit {
  fecha = new Date();
  mensajeFundos: String = '';
  usuario: any;
  fundos: any[] = []; // Se llena al sincronizar
  // areas = ['Mañana', 'Tarde', 'Noche'];
  almacenes: Almacen[] = [];

  fundoSeleccionado = '';
  cultivoSeleccionado = '';
  // areaSeleccionada = '';
  almacenSeleccionado = '';

  // sincronizado = false; // habilita guardar y fundo

  constructor(
    private logisticaService: LogisticaService,
    private userService: UserService,
    private parametrosService: ParametrosService,
    private alertService: AlertService // ✅ inyectar el servicio
  ) { }

  ngOnInit(): void {
    // Obtener usuario logueado desde el UserService
    this.usuario = this.userService.getUsuario();
    console.log('Usuario logueado desde parametros:', this.usuario);
    // if (this.usuario && this.usuario.ruc) {
    // 🔹 Aquí pruebas con data real o simulada
    // this.logisticaService.listarAlmacenes(this.usuario.ruc).subscribe({
    //   next: (data) => {
    //     this.almacenes = data;
    //     console.log('Almacenes cargados:', data);
    //   },
    //   error: (err) => console.error('Error al cargar almacenes', err)
    // });
    // } else {
    //   console.warn('No hay usuario logueado o el RUC no está definido.');
    // }
    // console.log('Usuario cargado es:', this.usuario);
    // Esperamos a que el usuario tenga ruc e idEmpresa
    // this.userService.usuario$
    //   .pipe(
    //     filter(u => !!u?.ruc && !!u?.idEmpresa),
    //     take(1)
    //   )
    //   .subscribe(user => {
    //     this.usuario = user;
    //     this.cargarAlmacenes(); // almacenes siempre disponibles
    //   });
    // this.userService.usuario$.subscribe((usuario) => {
    //   this.usuario = usuario;
    // });
    // this.cargarAlmacenes();
  }

  // cargarAlmacenes(): void {
  //   if (!this.usuario?.ruc) return;

  //   this.logisticaService.listarAlmacenes(this.usuario.ruc)
  //     .subscribe({
  //       next: data => this.almacenes = data,
  //       error: err => console.error('Error al listar almacenes', err)
  //     });
  // }

  // Botón Sincronizar: llena solo el combo de fundos
  // async sincronizar() {
  //   // this.fundos = ['Fundo Norte', 'Fundo Sur', 'Fundo Central']; // o desde API si quieres
  //   if (!this.usuario?.idempresa || !this.usuario?.sociedad) {
  //     alert('No se pudo obtener la empresa del usuario');
  //     return;
  //   }

  //   try {
  //     const data = await this.parametrosService.sincronizarFundos(this.usuario.idempresa, this.usuario.sociedad);
  //     console.log('✅ Fundos recibidos:', data);
  //     // Filtramos solo los fundos que pertenecen a la empresa del usuario
  //     this.fundos = data;
  //     this.fundoSeleccionado = ''; // reset selección

  //     // 🔹 Cargar almacenes por RUC del usuario
  //     this.logisticaService.listarAlmacenes(this.usuario.ruc).subscribe({
  //       next: (data) => {
  //         console.log('✅ Almacenes recibidos:', data);
  //         this.almacenes = data;
  //         this.almacenSeleccionado = '';
  //       },
  //       error: (err) => console.error('❌ Error al cargar almacenes:', err)
  //     });
  //   } catch (err) {
  //     console.error('❌ Error al sincronizar fundos y almacenes:', err);
  //     alert('Ocurrió un error al sincronizar fundos y almacenes.');
  //   }
  // }

  async sincronizar() {
    if (!this.usuario?.idempresa || !this.usuario?.sociedad || !this.usuario?.ruc) {
      this.alertService.showAlert('Error', 'No se pudo obtener la empresa, sociedad o RUC del usuario', 'error');
      return;
    }

    try {
      // 🔹 Mostrar mensaje de carga
      this.alertService.mostrarModalCarga();

      // 🔹 Llamar en paralelo a ambos servicios
      const [fundos, almacenes] = await Promise.all([
        this.parametrosService.sincronizarFundos(this.usuario.idempresa, this.usuario.sociedad),
        this.parametrosService.sincronizarAlmacenes(this.usuario.ruc)
        // this.logisticaService.listarAlmacenes(this.usuario.ruc).toPromise()
      ]);

      // 🔹 Cerrar el modal de carga
      this.alertService.cerrarModalCarga();

      // 🔹 Actualizar listas
      this.fundos = fundos || [];
      this.fundoSeleccionado = '';

      this.almacenes = almacenes || [];
      this.almacenSeleccionado = '';

      console.log('✅ Fundos sincronizados:', fundos);
      console.log('✅ Almacenes sincronizados:', almacenes);

      // 🔹 Mostrar mensaje final de éxito
      this.alertService.showAlert('Sincronización completa', 'Los fundos y almacenes se actualizaron correctamente.', 'success');

    } catch (err) {
      console.error('❌ Error al sincronizar fundos y almacenes:', err);
      // Cerrar el modal en caso de error también
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al sincronizar los datos.', 'error');
    }
  }


  // guardar(): void {
  //   if (!this.fundoSeleccionado) {
  //     alert('Debes seleccionar un Fundo antes de guardar.');
  //     return;
  //   }
  //   if (!this.almacenSeleccionado) {
  //     alert('Debes seleccionar Área y Almacén antes de guardar.');
  //     return;
  //   }
  //   // if (!this.areaSeleccionada || !this.almacenSeleccionado) {
  //   //   alert('Debes seleccionar Área y Almacén antes de guardar.');
  //   //   return;
  //   // }

  //   // Aquí iría tu lógica de guardado
  //   console.log('Guardando parámetros:', {
  //     fundo: this.fundoSeleccionado,
  //     // area: this.areaSeleccionada,
  //     almacen: this.almacenSeleccionado
  //   });

  //   alert('Parámetros guardados correctamente.');
  // }

  async guardar() {
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert('Atención', 'Debes seleccionar un Fundo antes de guardar.', 'warning');
      return;
    }

    if (!this.almacenSeleccionado) {
      this.alertService.showAlert('Atención', 'Debes seleccionar un Almacén antes de guardar.', 'warning');
      return;
    }

    try {
      // 🔹 Mostrar modal de carga
      this.alertService.mostrarModalCarga();

      // 🔹 Simulación del guardado (aquí reemplaza por tu lógica real)
      await new Promise(resolve => setTimeout(resolve, 1500)); // simulación de espera

      // 🔹 Cerrar modal de carga
      this.alertService.cerrarModalCarga();

      console.log('Guardando parámetros:', {
        fundo: this.fundoSeleccionado,
        almacen: this.almacenSeleccionado,
        usuario: this.usuario?.nombre || 'Desconocido'
      });

      // 🔹 Mostrar éxito
      this.alertService.showAlert('Éxito', 'Los parámetros se guardaron correctamente.', 'success');
    } catch (err) {
      console.error('❌ Error al guardar parámetros:', err);

      // Cerrar modal y mostrar error
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al guardar los parámetros.', 'error');
    }
  }

}