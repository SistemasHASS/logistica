import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConformidadServiciosComponent } from './conformidad-servicios.component';
import { ConformidadServiciosService, OrdenServicioConformidad } from './conformidad-servicios.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { ConformidadServicioPdfService } from '@/app/modules/admin-logistica/tabs/conformidad-servicio/conformidad-servicio-pdf.service';
import { ConformidadServicioPlantillaService } from '@/app/modules/admin-logistica/tabs/conformidad-servicio/conformidad-servicio-plantilla.service';
import { OrdenPdfService } from '../consolidacion-compras/orden-pdf.service';
import { ChangeDetectorRef } from '@angular/core';

describe('ConformidadServiciosComponent', () => {
  let component: ConformidadServiciosComponent;
  let alert: jasmine.Spy;
  let registrar: jasmine.Spy;
  const os = { idOS: 1, numeroOrden: 'OS-1', tieneConformidad: 0 } as OrdenServicioConformidad;

  beforeEach(() => {
    alert = jasmine.createSpy('showAlert');
    registrar = jasmine.createSpy('registrarConformidad').and.returnValue(of({ status: 'success' }));
    TestBed.configureTestingModule({ providers: [
      { provide: ConformidadServiciosService, useValue: { registrarConformidad: registrar, listarParaConformidad: () => of([os]) } },
      { provide: DexieService, useValue: { getUsuarioLogueado: async () => ({ documentoidentidad: '12345678', nombre: 'Usuario' }) } },
      { provide: AlertService, useValue: { showAlert: alert } },
      { provide: ConformidadServicioPdfService, useValue: { buildHtml: () => '' } },
      { provide: ConformidadServicioPlantillaService, useValue: {} },
      { provide: OrdenPdfService, useValue: {} },
      { provide: ChangeDetectorRef, useValue: { markForCheck: () => {} } }
    ] });
    component = TestBed.runInInjectionContext(() => new ConformidadServiciosComponent());
    component.usuario.set({ documentoidentidad: '12345678', nombre: 'Usuario' });
  });

  it('renderiza el formulario con la orden al pulsar Dar Conformidad desde detalle', async () => {
    const fixture = TestBed.createComponent(ConformidadServiciosComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.abrirDetalle(os);
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('.cs-modal__footer .btn-success') as HTMLButtonElement;
    expect(boton).not.toBeNull();
    boton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cs-conf-info').textContent).toContain('OS-1');
    expect(fixture.nativeElement.querySelector('canvas')).not.toBeNull();
    fixture.destroy();
  });

  it('conserva la orden al pasar del detalle a conformidad', () => {
    component.abrirDetalle(os);
    const abrir = spyOn(component, 'abrirModalConformidad');
    component.darConformidadDesdeDetalle();
    expect(component.modalDetalleAbierto()).toBeFalse();
    expect(abrir).toHaveBeenCalledWith(os);
  });

  it('requiere observaciones para conforme con observaciones', async () => {
    component.osSeleccionada.set(os);
    component.setConformidad('CONFORME_CON_OBSERVACIONES');
    component.firmaVacia.set(false);
    await component.guardarConformidad();
    expect(alert).toHaveBeenCalled();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('no cierra ni vuelve a guardar durante el registro', async () => {
    component.osSeleccionada.set(os);
    component.modalConformidadAbierto.set(true);
    component.guardando.set(true);
    component.cerrarModalConformidad();
    await component.guardarConformidad();
    expect(component.modalConformidadAbierto()).toBeTrue();
    expect(registrar).not.toHaveBeenCalled();
  });
});
