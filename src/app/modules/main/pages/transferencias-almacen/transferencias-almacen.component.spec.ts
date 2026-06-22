import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransferenciasAlmacenComponent } from './transferencias-almacen.component';

describe('TransferenciasAlmacenComponent', () => {
  let component: TransferenciasAlmacenComponent;
  let fixture: ComponentFixture<TransferenciasAlmacenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferenciasAlmacenComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TransferenciasAlmacenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
