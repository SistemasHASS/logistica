import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequerimientoConsumoComponent } from './requerimiento_consumo.component';

describe('RequerimientoConsumoComponent', () => {
  let component: RequerimientoConsumoComponent;
  let fixture: ComponentFixture<RequerimientoConsumoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequerimientoConsumoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RequerimientoConsumoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
