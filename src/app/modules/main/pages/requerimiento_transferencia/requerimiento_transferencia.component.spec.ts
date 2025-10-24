import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequerimientoTransferenciaComponent } from './requerimiento_transferencia.component';

describe('RequerimientoTransferenciaComponent', () => {
  let component: RequerimientoTransferenciaComponent;
  let fixture: ComponentFixture<RequerimientoTransferenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequerimientoTransferenciaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RequerimientoTransferenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
