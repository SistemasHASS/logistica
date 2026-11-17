import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AprobacionesOSComponent } from './aprobaciones-os.component';
import { AprobacionOSService } from '@/app/services/aprobacion-os.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

describe('AprobacionesOSComponent pendientes', () => {
  const pendiente = { idAprobacion: 1, ordenServicioId: 2, numeroOrden: 'OS-INTERNA',
    numeroOrdenSpring: '8-00000123', estadoCompromiso: 'PR', estado: 'PENDIENTE_APROBACION',
    nombreProveedor: 'Proveedor', descripcion: 'Servicio', montoTotal: 100, nivel: 1 };
  let servicio: { listarOSPendientes: jasmine.Spy; obtenerContadores: jasmine.Spy; listarHistorialAprobaciones: jasmine.Spy };
  let alerta: { mostrarModalCarga: jasmine.Spy; cerrarModalCarga: jasmine.Spy; showAlert: jasmine.Spy };

  beforeEach(() => {
    servicio = { listarOSPendientes: jasmine.createSpy().and.returnValue(of([pendiente])), obtenerContadores: jasmine.createSpy(),
      listarHistorialAprobaciones: jasmine.createSpy().and.callFake((_rol: string, estado: string) => of([
        { ...pendiente, estado, numeroOrdenSpring: estado === 'APROBADA' ? '8-APROBADA' : '8-ANULADA' }
      ])) };
    alerta = { mostrarModalCarga: jasmine.createSpy(), cerrarModalCarga: jasmine.createSpy(), showAlert: jasmine.createSpy() };
    TestBed.configureTestingModule({ imports: [AprobacionesOSComponent], providers: [
      provideNoopAnimations(),
      { provide: AprobacionOSService, useValue: servicio },
      { provide: AlertService, useValue: alerta },
      { provide: UserService, useValue: {} },
      { provide: DexieService, useValue: { obtenerPrimerUsuario: async () => ({ ruc: '20481121966', idrol: 'FINANZAS', documentoidentidad: '12345678' }) } }
    ] });
  });

  it('muestra tabs Pendientes, Aprobadas y Anuladas con numero SPRING y contadores consistentes', async () => {
    const fixture = TestBed.createComponent(AprobacionesOSComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.stats-cards .stat-card').length).toBe(3);
    expect(Array.from(root.querySelectorAll('.stat-label')).map(e => e.textContent?.trim())).toEqual(['Pendientes', 'Aprobadas', 'Anuladas']);
    const tabs = root.querySelectorAll<HTMLButtonElement>('.custom-tabs button');
    expect(tabs.length).toBe(3);
    tabs[1].click();
    fixture.detectChanges();
    expect(root.querySelector('#tab-pendientes')?.textContent).toContain('8-APROBADA');
    expect(root.querySelector('#tab-pendientes')?.textContent).not.toContain('8-ANULADA');
    tabs[2].click();
    fixture.detectChanges();
    expect(root.querySelector('#tab-pendientes')?.textContent).toContain('8-ANULADA');
    expect(root.querySelector('#tab-pendientes')?.textContent).not.toContain('8-APROBADA');
    tabs[0].click();
    fixture.detectChanges();
    expect(root.querySelector('#tab-pendientes')?.textContent).toContain('8-00000123');
    expect(servicio.obtenerContadores).not.toHaveBeenCalled();
    expect(servicio.listarOSPendientes).toHaveBeenCalledWith('FINANZAS', '20481121966');
    fixture.destroy();
  });

  it('excluye aprobadas, rechazadas, huerfanas y compromisos no pendientes', async () => {
    servicio.listarOSPendientes.and.returnValue(of([pendiente,
      { ...pendiente, estado: 'APROBADA' }, { ...pendiente, estado: 'RECHAZADA' },
      { ...pendiente, ordenServicioId: null }, { ...pendiente, numeroOrdenSpring: null },
      { ...pendiente, estadoCompromiso: 'AP' }, { ...pendiente, estadoCompromiso: 'AN' }
    ]));
    const fixture = TestBed.createComponent(AprobacionesOSComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.osPendientes.length).toBe(1);
    expect(fixture.componentInstance.osPendientes[0].numeroOrden).toBe('8-00000123');
    expect(fixture.componentInstance.contadores.totalPendientes).toBe(1);
    fixture.destroy();
  });

  it('limpia datos anteriores si falla la recarga', async () => {
    const fixture = TestBed.createComponent(AprobacionesOSComponent);
    await fixture.componentInstance.ngOnInit();
    servicio.listarOSPendientes.and.returnValue(throwError(() => new Error('Prueba')));
    await fixture.componentInstance.cargarOSPendientes();
    expect(fixture.componentInstance.osPendientesFiltradas).toEqual([]);
    expect(fixture.componentInstance.contadores.totalPendientes).toBe(0);
    expect(fixture.componentInstance.cargandoPendientes).toBeFalse();
    expect(alerta.showAlert).toHaveBeenCalled();
    fixture.destroy();
  });
});
