import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteLogisticoComponent } from './reportes_logistico.component';

describe('ReporteLogisticoComponent', () => {
  let component: ReporteLogisticoComponent;
  let fixture: ComponentFixture<ReporteLogisticoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteLogisticoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteLogisticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
