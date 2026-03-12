import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteAprobacionesArea } from './reporte-aprobaciones-area';

describe('ReporteAprobacionesArea', () => {
  let component: ReporteAprobacionesArea;
  let fixture: ComponentFixture<ReporteAprobacionesArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteAprobacionesArea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteAprobacionesArea);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
