import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { OrdenesServicioComponent } from './ordenes-servicio.component';
import { OrdenServicioService } from '@/app/services/orden-servicio.service';
import { SolicitudServicioService } from '@/app/services/solicitud-servicio.service';
import { SeguimientoOSService } from '@/app/services/seguimiento-os.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { CommodityService } from '@/app/modules/main/services/commoditys.service';
import { OrdenServicioConSeguimiento } from '@/app/shared/interfaces/Tables';

describe('OrdenesServicio envio a aprobacion', () => {
  let service: jasmine.SpyObj<OrdenServicioService>;
  let alerts: jasmine.SpyObj<AlertService>;
  const orden = (): OrdenServicioConSeguimiento => ({ id: 12, numeroOrden: 'OS-LOCAL', numeroOrdenSpring: '8-00000123',
    estado: 'PENDIENTE_APROBACION', tipoServicio: 'Servicio', descripcion: 'Prueba', proveedor: '123',
    nombreProveedor: 'Proveedor', rucEmpresa: '20481121966', montoTotal: 100, moneda: 'PEN', usuarioGenera: 'QA' });

  beforeEach(() => {
    service = jasmine.createSpyObj('OrdenServicioService', ['enviarAprobacionOS', 'sincronizarOrdenServicio']);
    service.enviarAprobacionOS.and.returnValue(of({ success: true, idAprobacion: 55, numeroOrdenSpring: '8-00000123' }));
    service.sincronizarOrdenServicio.and.returnValue(of({ errorgeneral: 0, numeroOrden: '8-00000123' }));
    alerts = jasmine.createSpyObj('AlertService', ['showConfirm', 'showAlert', 'mostrarModalCarga', 'cerrarModalCarga']);
    alerts.showConfirm.and.resolveTo(true);
    TestBed.configureTestingModule({ imports: [OrdenesServicioComponent], providers: [
      provideNoopAnimations(), { provide: OrdenServicioService, useValue: service },
      { provide: AlertService, useValue: alerts }, { provide: SolicitudServicioService, useValue: {} },
      { provide: SeguimientoOSService, useValue: { obtenerColorEstado: () => 'badge-warning' } }, { provide: UserService, useValue: {} },
      { provide: DexieService, useValue: {} }, { provide: MaestrasService, useValue: {} },
      { provide: CommodityService, useValue: {} }
    ] });
  });

  function crear() {
    const fixture = TestBed.createComponent(OrdenesServicioComponent);
    const c = fixture.componentInstance;
    c.usuario = { ...c.usuario, ruc: '20481121966', documentoidentidad: 'QA' };
    spyOn(c, 'cargarOrdenes').and.resolveTo();
    return { fixture, c };
  }

  it('envia usando el compromiso existente sin volver a sincronizar', async () => {
    const { fixture, c } = crear();
    await c.enviarAprobacion(orden());
    expect(service.sincronizarOrdenServicio).not.toHaveBeenCalled();
    expect(service.enviarAprobacionOS).toHaveBeenCalledOnceWith(12, '20481121966', 'QA');
    expect(c.enviandoAprobacion()).toBeNull();
    expect(c.cargarOrdenes).toHaveBeenCalled();
    fixture.destroy();
  });

  it('sincroniza primero una OS nueva y luego crea su aprobacion', async () => {
    const { fixture, c } = crear();
    const os = { ...orden(), estado: 'GENERADA' as const, numeroOrdenSpring: '' };
    await c.enviarAprobacion(os);
    expect(service.sincronizarOrdenServicio).toHaveBeenCalledOnceWith({ idordenservicio: 12, serie: 'APSO', ruc: '20481121966', usuariogenera: 'QA' });
    expect(service.enviarAprobacionOS).toHaveBeenCalled();
    expect(os.numeroOrdenSpring).toBe('8-00000123');
    expect(os.estado as string).toBe('PENDIENTE_APROBACION');
    fixture.destroy();
  });

  it('no reenvia una OS historica sin numero SPRING', async () => {
    const { fixture, c } = crear();
    await c.enviarAprobacion({ ...orden(), numeroOrdenSpring: '' });
    expect(service.sincronizarOrdenServicio).not.toHaveBeenCalled();
    expect(service.enviarAprobacionOS).not.toHaveBeenCalled();
    expect(alerts.showAlert).toHaveBeenCalled();
    fixture.destroy();
  });

  it('no crea aprobacion cuando falla el envio a SPRING', async () => {
    const { fixture, c } = crear();
    service.sincronizarOrdenServicio.and.returnValue(of({ errorgeneral: 1, mensaje: 'No disponible' }));
    await c.enviarAprobacion({ ...orden(), estado: 'GENERADA', numeroOrdenSpring: '' });
    expect(service.enviarAprobacionOS).not.toHaveBeenCalled();
    expect(c.enviandoAprobacion()).toBeNull();
    fixture.destroy();
  });

  it('conserva el numero SPRING si falla la aprobacion y no sincroniza en el reintento', async () => {
    const { fixture, c } = crear();
    const os = { ...orden(), estado: 'GENERADA' as OrdenServicioConSeguimiento['estado'], numeroOrdenSpring: '' };
    service.enviarAprobacionOS.and.returnValue(of({ success: false, mensaje: 'Revisar' }));
    await c.enviarAprobacion(os);
    service.enviarAprobacionOS.and.returnValue(of({ success: true }));
    await c.enviarAprobacion(os);
    expect(service.sincronizarOrdenServicio).toHaveBeenCalledTimes(1);
    expect(service.enviarAprobacionOS).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('bloquea doble clic mientras procesa la solicitud', async () => {
    const { fixture, c } = crear();
    const response = new Subject<{ success: boolean }>();
    service.enviarAprobacionOS.and.returnValue(response);
    const first = c.enviarAprobacion(orden());
    await Promise.resolve();
    await c.enviarAprobacion(orden());
    expect(alerts.showConfirm).toHaveBeenCalledTimes(1);
    response.next({ success: true }); response.complete();
    await first;
    expect(service.enviarAprobacionOS).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });

  it('no envia al cancelar y recupera el estado tras un error de red', async () => {
    const { fixture, c } = crear();
    alerts.showConfirm.and.resolveTo(false);
    await c.enviarAprobacion(orden());
    expect(service.enviarAprobacionOS).not.toHaveBeenCalled();
    expect(c.enviandoAprobacion()).toBeNull();
    alerts.showConfirm.and.resolveTo(true);
    service.enviarAprobacionOS.and.returnValue(throwError(() => new Error('Red')));
    await c.enviarAprobacion(orden());
    expect(c.enviandoAprobacion()).toBeNull();
    expect(c.cargarOrdenes).toHaveBeenCalled();
    fixture.destroy();
  });

  it('renderiza el boton solo en estados elegibles de la empresa', async () => {
    const { fixture, c } = crear();
    spyOn(c, 'cargarUsuario').and.resolveTo();
    spyOn(c, 'cargarRequerimientosServicio').and.resolveTo();
    spyOn(c, 'cargarCatalogosDistribucion').and.resolveTo();
    spyOn(c, 'cargarFormasPago').and.resolveTo();
    spyOn(c, 'cargarTiposPago').and.resolveTo();
    c.ordenesFiltradas = [orden(), { ...orden(), id: 13, estado: 'FINALIZADA' }, { ...orden(), id: 14, rucEmpresa: 'OTRA' }];
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('button[title="Enviar OS a aprobación"]').length).toBe(1);
    fixture.destroy();
  });
});
