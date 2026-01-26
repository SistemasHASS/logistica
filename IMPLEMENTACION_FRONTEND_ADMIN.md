# Implementación Frontend - Componentes de Administración

## 1. admin-usuarios.component.ts

Reemplazar el contenido completo del archivo con:

```typescript
import { Component, OnInit } from '@angular/core';
import { AdminUsuariosService } from '../../services/admin-usuarios.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss']
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: any[] = [];
  loading = false;
  showModal = false;
  isEdit = false;
  
  form: any = {
    documento_identidad: '',
    area_id: null,
    perfil_id: null,
    es_aprobador: false,
    nivel_aprobacion: null,
    monto_maximo_aprobacion: null,
    puede_crear_requerimientos: true,
    puede_aprobar_requerimientos: false,
    notificaciones_email: true,
    estado: 'ACTIVO'
  };

  areas: any[] = [];
  perfiles: any[] = [];

  constructor(
    private adminUsuariosService: AdminUsuariosService,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    this.loading = true;
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminUsuariosService.listarUsuarios(body).subscribe({
      next: (response) => {
        this.usuarios = response?.data || response || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.alertService.showAlertError('Error', 'Error al cargar usuarios');
        this.loading = false;
      }
    });
  }

  openCreate() {
    this.isEdit = false;
    this.form = {
      documento_identidad: '',
      area_id: null,
      perfil_id: null,
      es_aprobador: false,
      nivel_aprobacion: null,
      monto_maximo_aprobacion: null,
      puede_crear_requerimientos: true,
      puede_aprobar_requerimientos: false,
      notificaciones_email: true,
      estado: 'ACTIVO'
    };
    this.showModal = true;
  }

  openEdit(usuario: any) {
    this.isEdit = true;
    this.form = {
      documento_identidad: usuario.documento_identidad,
      area_id: usuario.area_id,
      perfil_id: usuario.perfil_id,
      es_aprobador: usuario.es_aprobador,
      nivel_aprobacion: usuario.nivel_aprobacion,
      monto_maximo_aprobacion: usuario.monto_maximo_aprobacion,
      puede_crear_requerimientos: usuario.puede_crear_requerimientos,
      puede_aprobar_requerimientos: usuario.puede_aprobar_requerimientos,
      notificaciones_email: usuario.notificaciones_email,
      estado: usuario.estado_logistica || 'ACTIVO'
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async save() {
    if (!this.form.documento_identidad?.trim()) {
      this.alertService.showAlertError('Error', 'El documento de identidad es requerido');
      return;
    }

    try {
      const usuario = this.userService.getUsuario();
      const body = {
        ...this.form,
        usuario: usuario?.documentoidentidad || '',
        ruc: usuario?.ruc || ''
      };

      await this.adminUsuariosService.configurarUsuario(body);
      this.alertService.showAlertAcept('Éxito', 'Usuario configurado exitosamente', 'success');
      this.closeModal();
      this.cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      this.alertService.showAlertError('Error', 'Error al configurar usuario');
    }
  }
}
```

---

## 2. admin-roles.component.ts

Reemplazar el contenido completo del archivo con:

```typescript
import { Component, OnInit } from '@angular/core';
import { AdminRolesService } from '../../services/admin-roles.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-admin-roles',
  templateUrl: './admin-roles.component.html',
  styleUrls: ['./admin-roles.component.scss']
})
export class AdminRolesComponent implements OnInit {
  roles: any[] = [];
  loading = false;
  showModal = false;
  isEdit = false;
  
  form: any = {
    codigo_rol_maestro: '',
    modulo_logistica: 'REQUERIMIENTOS',
    permiso_crear: false,
    permiso_editar: false,
    permiso_eliminar: false,
    permiso_aprobar: false,
    permiso_ver_reportes: false,
    permiso_administrar: false,
    estado: 'ACTIVO'
  };

  modulosLogistica = [
    { value: 'REQUERIMIENTOS', label: 'Requerimientos' },
    { value: 'APROBACIONES', label: 'Aprobaciones' },
    { value: 'REPORTES', label: 'Reportes' },
    { value: 'ADMINISTRACION', label: 'Administración' }
  ];

  constructor(
    private adminRolesService: AdminRolesService,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  async cargarRoles() {
    this.loading = true;
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminRolesService.listarRoles(body).subscribe({
      next: (response) => {
        this.roles = response?.data || response || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.alertService.showAlertError('Error', 'Error al cargar roles');
        this.loading = false;
      }
    });
  }

  openEdit(rol: any) {
    this.isEdit = true;
    this.form = {
      codigo_rol_maestro: rol.codigo_rol_maestro,
      modulo_logistica: rol.modulo_logistica || 'REQUERIMIENTOS',
      permiso_crear: rol.permiso_crear || false,
      permiso_editar: rol.permiso_editar || false,
      permiso_eliminar: rol.permiso_eliminar || false,
      permiso_aprobar: rol.permiso_aprobar || false,
      permiso_ver_reportes: rol.permiso_ver_reportes || false,
      permiso_administrar: rol.permiso_administrar || false,
      estado: rol.estado_logistica || 'ACTIVO'
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async save() {
    if (!this.form.codigo_rol_maestro?.trim()) {
      this.alertService.showAlertError('Error', 'El código de rol es requerido');
      return;
    }

    try {
      const usuario = this.userService.getUsuario();
      const body = {
        ...this.form,
        usuario: usuario?.documentoidentidad || '',
        ruc: usuario?.ruc || ''
      };

      await this.adminRolesService.configurarRol(body);
      this.alertService.showAlertAcept('Éxito', 'Rol configurado exitosamente', 'success');
      this.closeModal();
      this.cargarRoles();
    } catch (error) {
      console.error('Error al guardar rol:', error);
      this.alertService.showAlertError('Error', 'Error al configurar rol');
    }
  }
}
```

---

## 3. admin-perfiles.component.ts

Reemplazar el contenido completo del archivo con:

```typescript
import { Component, OnInit } from '@angular/core';
import { AdminPerfilesService } from '../../services/admin-perfiles.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-admin-perfiles',
  templateUrl: './admin-perfiles.component.html',
  styleUrls: ['./admin-perfiles.component.scss']
})
export class AdminPerfilesComponent implements OnInit {
  perfiles: any[] = [];
  loading = false;
  showModal = false;
  isEdit = false;
  
  form: any = {
    id: null,
    nombre: '',
    descripcion: '',
    codigo: '',
    estado: 'ACTIVO'
  };

  constructor(
    private adminPerfilesService: AdminPerfilesService,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarPerfiles();
  }

  async cargarPerfiles() {
    this.loading = true;
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminPerfilesService.listarPerfiles(body).subscribe({
      next: (response) => {
        this.perfiles = response?.data || response || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfiles:', error);
        this.alertService.showAlertError('Error', 'Error al cargar perfiles');
        this.loading = false;
      }
    });
  }

  openCreate() {
    this.isEdit = false;
    this.form = {
      id: null,
      nombre: '',
      descripcion: '',
      codigo: '',
      estado: 'ACTIVO'
    };
    this.showModal = true;
  }

  openEdit(perfil: any) {
    this.isEdit = true;
    this.form = {
      id: perfil.id,
      nombre: perfil.nombre,
      descripcion: perfil.descripcion,
      codigo: perfil.codigo,
      estado: perfil.estado
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async save() {
    if (!this.form.nombre?.trim()) {
      this.alertService.showAlertError('Error', 'El nombre es requerido');
      return;
    }

    try {
      const usuario = this.userService.getUsuario();
      const body = {
        ...this.form,
        usuario: usuario?.documentoidentidad || '',
        ruc: usuario?.ruc || ''
      };

      await this.adminPerfilesService.crearPerfil(body);
      this.alertService.showAlertAcept('Éxito', 'Perfil guardado exitosamente', 'success');
      this.closeModal();
      this.cargarPerfiles();
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      this.alertService.showAlertError('Error', 'Error al guardar perfil');
    }
  }
}
```

---

## 4. admin-flujos.component.ts

Reemplazar el contenido completo del archivo con:

```typescript
import { Component, OnInit } from '@angular/core';
import { AdminFlujosService } from '../../services/admin-flujos.service';
import { AdminAreasService } from '../../services/admin-areas.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-admin-flujos',
  templateUrl: './admin-flujos.component.html',
  styleUrls: ['./admin-flujos.component.scss']
})
export class AdminFlujosComponent implements OnInit {
  flujos: any[] = [];
  areas: any[] = [];
  loading = false;
  showModal = false;
  isEdit = false;
  
  form: any = {
    id: null,
    nombre: '',
    descripcion: '',
    codigo: '',
    area_id: null,
    tipo_requerimiento: 'COMPRA',
    monto_minimo: 0,
    monto_maximo: 0,
    orden: 1,
    estado: 'ACTIVO'
  };

  tiposRequerimiento = [
    { value: 'COMPRA', label: 'Compra' },
    { value: 'CONSUMO', label: 'Consumo' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' }
  ];

  constructor(
    private adminFlujosService: AdminFlujosService,
    private adminAreasService: AdminAreasService,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarFlujos();
    this.cargarAreas();
  }

  async cargarAreas() {
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminAreasService.listarAreas(body).subscribe({
      next: (response) => {
        this.areas = response?.data || response || [];
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
      }
    });
  }

  async cargarFlujos() {
    this.loading = true;
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminFlujosService.listarFlujos(body).subscribe({
      next: (response) => {
        this.flujos = response?.data || response || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar flujos:', error);
        this.alertService.showAlertError('Error', 'Error al cargar flujos');
        this.loading = false;
      }
    });
  }

  openCreate() {
    this.isEdit = false;
    this.form = {
      id: null,
      nombre: '',
      descripcion: '',
      codigo: '',
      area_id: null,
      tipo_requerimiento: 'COMPRA',
      monto_minimo: 0,
      monto_maximo: 0,
      orden: 1,
      estado: 'ACTIVO'
    };
    this.showModal = true;
  }

  openEdit(flujo: any) {
    this.isEdit = true;
    this.form = {
      id: flujo.id,
      nombre: flujo.nombre,
      descripcion: flujo.descripcion,
      codigo: flujo.codigo,
      area_id: flujo.area_id,
      tipo_requerimiento: flujo.tipo_requerimiento,
      monto_minimo: flujo.monto_minimo,
      monto_maximo: flujo.monto_maximo,
      orden: flujo.orden,
      estado: flujo.estado
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async save() {
    if (!this.form.nombre?.trim()) {
      this.alertService.showAlertError('Error', 'El nombre es requerido');
      return;
    }

    try {
      const usuario = this.userService.getUsuario();
      const body = {
        ...this.form,
        usuario: usuario?.documentoidentidad || '',
        ruc: usuario?.ruc || ''
      };

      await this.adminFlujosService.crearFlujo(body);
      this.alertService.showAlertAcept('Éxito', 'Flujo guardado exitosamente', 'success');
      this.closeModal();
      this.cargarFlujos();
    } catch (error) {
      console.error('Error al guardar flujo:', error);
      this.alertService.showAlertError('Error', 'Error al guardar flujo');
    }
  }
}
```

---

## 5. admin-aprobadores.component.ts

Reemplazar el contenido completo del archivo con:

```typescript
import { Component, OnInit } from '@angular/core';
import { AdminAprobadoresService } from '../../services/admin-aprobadores.service';
import { AdminFlujosService } from '../../services/admin-flujos.service';
import { AdminAreasService } from '../../services/admin-areas.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-admin-aprobadores',
  templateUrl: './admin-aprobadores.component.html',
  styleUrls: ['./admin-aprobadores.component.scss']
})
export class AdminAprobadoresComponent implements OnInit {
  aprobadores: any[] = [];
  flujos: any[] = [];
  areas: any[] = [];
  loading = false;
  showModal = false;
  isEdit = false;
  
  form: any = {
    id: null,
    documento_identidad: '',
    flujo_id: null,
    area_id: null,
    nivel_aprobacion: 1,
    monto_maximo: 0,
    puede_delegar: false,
    es_aprobador_final: false,
    estado: 'ACTIVO'
  };

  constructor(
    private adminAprobadoresService: AdminAprobadoresService,
    private adminFlujosService: AdminFlujosService,
    private adminAreasService: AdminAreasService,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarAprobadores();
    this.cargarFlujos();
    this.cargarAreas();
  }

  async cargarAreas() {
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminAreasService.listarAreas(body).subscribe({
      next: (response) => {
        this.areas = response?.data || response || [];
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
      }
    });
  }

  async cargarFlujos() {
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminFlujosService.listarFlujos(body).subscribe({
      next: (response) => {
        this.flujos = response?.data || response || [];
      },
      error: (error) => {
        console.error('Error al cargar flujos:', error);
      }
    });
  }

  async cargarAprobadores() {
    this.loading = true;
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminAprobadoresService.listarAprobadores(body).subscribe({
      next: (response) => {
        this.aprobadores = response?.data || response || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar aprobadores:', error);
        this.alertService.showAlertError('Error', 'Error al cargar aprobadores');
        this.loading = false;
      }
    });
  }

  openCreate() {
    this.isEdit = false;
    this.form = {
      id: null,
      documento_identidad: '',
      flujo_id: null,
      area_id: null,
      nivel_aprobacion: 1,
      monto_maximo: 0,
      puede_delegar: false,
      es_aprobador_final: false,
      estado: 'ACTIVO'
    };
    this.showModal = true;
  }

  openEdit(aprobador: any) {
    this.isEdit = true;
    this.form = {
      id: aprobador.id,
      documento_identidad: aprobador.documento_identidad,
      flujo_id: aprobador.flujo_id,
      area_id: aprobador.area_id,
      nivel_aprobacion: aprobador.nivel_aprobacion,
      monto_maximo: aprobador.monto_maximo,
      puede_delegar: aprobador.puede_delegar,
      es_aprobador_final: aprobador.es_aprobador_final,
      estado: aprobador.estado
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async save() {
    if (!this.form.documento_identidad?.trim()) {
      this.alertService.showAlertError('Error', 'El documento de identidad es requerido');
      return;
    }

    try {
      const usuario = this.userService.getUsuario();
      const body = {
        ...this.form,
        usuario: usuario?.documentoidentidad || '',
        ruc: usuario?.ruc || ''
      };

      await this.adminAprobadoresService.crearAprobador(body);
      this.alertService.showAlertAcept('Éxito', 'Aprobador guardado exitosamente', 'success');
      this.closeModal();
      this.cargarAprobadores();
    } catch (error) {
      console.error('Error al guardar aprobador:', error);
      this.alertService.showAlertError('Error', 'Error al guardar aprobador');
    }
  }
}
```

---

## Resumen de Implementación Frontend

### ✅ Componentes Actualizados:

1. **admin-usuarios.component.ts** - Configuración de usuarios desde tabla maestra
2. **admin-roles.component.ts** - Configuración de permisos de roles
3. **admin-perfiles.component.ts** - Gestión de perfiles
4. **admin-flujos.component.ts** - Gestión de flujos de aprobación
5. **admin-aprobadores.component.ts** - Asignación de aprobadores

### 📋 Características Implementadas:

- ✅ Carga dinámica de datos desde servicios
- ✅ Uso correcto de UserService.getUsuario()
- ✅ Uso correcto de AlertService con firmas correctas
- ✅ Modales para crear/editar
- ✅ Validaciones de formularios
- ✅ Manejo de errores con try-catch
- ✅ Loading states
- ✅ Integración con servicios actualizados (V2)

### 🔧 Pasos para Implementar:

1. Copiar cada código de componente
2. Reemplazar el contenido del archivo correspondiente
3. Verificar imports
4. Compilar el proyecto Angular
5. Probar cada módulo

---

**Fecha**: 26 de Enero, 2026  
**Versión**: Frontend Admin V2 Final
