import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteRequerimientos } from './reporte-requerimientos';

describe('ReporteRequerimientos', () => {
  let component: ReporteRequerimientos;
  let fixture: ComponentFixture<ReporteRequerimientos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteRequerimientos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteRequerimientos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
