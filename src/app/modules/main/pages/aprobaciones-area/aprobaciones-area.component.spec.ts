import { of, Subject, throwError } from 'rxjs';
import { AprobacionesAreaComponent } from './aprobaciones-area.component';
import { AprobacionesAreaService, StockDetalleAprobacion } from '../../services/aprobaciones-area.service';

describe('AprobacionesAreaComponent stock informativo', () => {
  let component: AprobacionesAreaComponent;
  let servicio: jasmine.SpyObj<AprobacionesAreaService>;
  const respuesta = (stockActual = 25): StockDetalleAprobacion => ({
    estado: 'OK', idalmacen: 'H001', items: [{ codigo: '000078', stockActual }]
  });

  beforeEach(() => {
    servicio = jasmine.createSpyObj('AprobacionesAreaService', ['consultarStockDetalle', 'obtenerRequerimientosPendientesAreaDetalle']);
    servicio.consultarStockDetalle.and.returnValue(of(respuesta()));
    component = new AprobacionesAreaComponent(null!, servicio, null!, null!, null!, null!, null!, null!, null!, null!, null!, null!);
    component.usuario = { ruc: '20481121966', documentoidentidad: '12345678' };
    component.displayDetallePendientesModal = true;
    component.requerimientoDetallePendientes = {
      idrequerimiento: 'REQ-1', itemtipo: 'CONSUMO',
      detalles: [{ codigo: '000078', cantidad: 10 }, { codigo: '000078', cantidad: 5 }]
    };
  });

  it('consulta por requerimiento y empresa sin enviar cantidades ni un almacén por defecto', async () => {
    await component.actualizarStockDetalle();
    expect(servicio.consultarStockDetalle).toHaveBeenCalledOnceWith({
      idrequerimiento: 'REQ-1', ruc: '20481121966', documentoidentidad: '12345678', modoGerencia: false
    });
    expect(component.stockActualDetalle('000078')).toBe(25);
    expect(component.stockActualDetalle('000078 ')).toBe(25);
    expect(component.stockActualDetalle('000079')).toBeNull();
    expect(component.stockDetalle().idalmacen).toBe('H001');
    expect(component.stockDetalle().fecha).not.toBeNull();
  });

  it('muestra la columna solo para CONSUMO y COMPRA, incluidos ambos niveles', async () => {
    for (const tipo of ['CONSUMO', 'COMPRA']) {
      component.requerimientoDetallePendientes.itemtipo = tipo;
      expect(component.mostrarStockDetalle).toBeTrue();
    }
    component.modoGerencia = true;
    await component.actualizarStockDetalle();
    expect(servicio.consultarStockDetalle.calls.mostRecent().args[0].modoGerencia).toBeTrue();
    for (const tipo of ['SERVICIO', 'TRANSFERENCIA']) {
      component.requerimientoDetallePendientes.itemtipo = tipo;
      expect(component.mostrarStockDetalle).toBeFalse();
      await component.actualizarStockDetalle();
    }
    expect(servicio.consultarStockDetalle).toHaveBeenCalledTimes(1);
    component.requerimientoDetallePendientes = { itemtipo: 'COMPRA', idclasificacion: 'COM' };
    expect(component.mostrarStockDetalle).toBeFalse();
  });

  it('distingue cero real, stock negativo y un dato inválido o ausente', async () => {
    servicio.consultarStockDetalle.and.returnValue(of({ estado: 'OK', idalmacen: 'H001', items: [
      { codigo: '000078', stockActual: 0 }, { codigo: '000079', stockActual: -2.125 },
      { codigo: '000080', stockActual: null as unknown as number }
    ] }));
    await component.actualizarStockDetalle();
    expect(component.stockActualDetalle('000078')).toBe(0);
    expect(component.stockActualDetalle('000079')).toBe(-2.125);
    expect(component.stockActualDetalle('000080')).toBeNull();
    expect(component.stockActualDetalle('000081')).toBeNull();
  });

  it('no altera detalles, selección, aprobados ni monto al consultar o actualizar', async () => {
    const detalle = component.requerimientoDetallePendientes;
    const original = JSON.stringify(detalle);
    component.items = [{ codigo: '000078', precio: 12 }];
    const monto = component.calcularMontoModalActual();
    component.detallesPendientesSeleccionados = new Set([1]);
    component.detallesPendientesAprobados = new Set([0]);
    await component.actualizarStockDetalle();
    servicio.consultarStockDetalle.and.returnValue(of(respuesta(6)));
    await component.actualizarStockDetalle();
    expect(component.requerimientoDetallePendientes).toBe(detalle);
    expect(JSON.stringify(detalle)).toBe(original);
    expect(component.calcularMontoModalActual()).toBe(monto);
    expect([...component.detallesPendientesSeleccionados]).toEqual([1]);
    expect([...component.detallesPendientesAprobados]).toEqual([0]);
    expect(component.stockActualDetalle('000078')).toBe(6);
  });

  it('no muestra cero ni datos viejos cuando falla una actualización', async () => {
    await component.actualizarStockDetalle();
    servicio.consultarStockDetalle.and.returnValue(throwError(() => new Error('Sin conexión')));
    await component.actualizarStockDetalle();
    expect(component.stockDetalle().estado).toBe('error');
    expect(component.stockDetalle().fecha).toBeNull();
    expect(component.stockActualDetalle('000078')).toBeNull();
    expect(component.displayDetallePendientesModal).toBeTrue();
  });

  it('muestra sin almacén sin inventar H001', async () => {
    servicio.consultarStockDetalle.and.returnValue(of({ estado: 'SIN_ALMACEN', idalmacen: '', items: [] }));
    await component.actualizarStockDetalle();
    expect(component.stockDetalle().estado).toBe('sin-almacen');
    expect(component.stockDetalle().idalmacen).toBe('');
    expect(component.stockActualDetalle('000078')).toBeNull();
  });

  it('rechaza respuestas incompletas en lugar de inventar stock cero', async () => {
    servicio.consultarStockDetalle.and.returnValue(of({ estado: 'OK', idalmacen: '', items: [] }));
    await component.actualizarStockDetalle();
    expect(component.stockDetalle().estado).toBe('error');
  });

  it('evita peticiones duplicadas y descarta respuestas al cerrar', async () => {
    const pendiente = new Subject<StockDetalleAprobacion>();
    servicio.consultarStockDetalle.and.returnValue(pendiente);
    const consulta = component.actualizarStockDetalle();
    expect(component.stockDetalle().estado).toBe('cargando');
    await component.actualizarStockDetalle();
    expect(servicio.consultarStockDetalle).toHaveBeenCalledTimes(1);
    component.cerrarDetallePendientes();
    pendiente.next(respuesta());
    pendiente.complete();
    await consulta;
    expect(component.stockActualDetalle('000078')).toBeNull();
    expect(component.stockDetalle().fecha).toBeNull();
    expect(component.requerimientoDetallePendientes).toBeNull();
  });

  it('una respuesta anterior no contamina otro requerimiento abierto', async () => {
    const anterior = new Subject<StockDetalleAprobacion>();
    servicio.consultarStockDetalle.and.returnValue(anterior);
    const consultaAnterior = component.actualizarStockDetalle();
    component.cerrarDetallePendientes();
    component.displayDetallePendientesModal = true;
    component.requerimientoDetallePendientes = { idrequerimiento: 'REQ-2', itemtipo: 'COMPRA' };
    servicio.consultarStockDetalle.and.returnValue(of(respuesta(8)));
    await component.actualizarStockDetalle();
    anterior.next(respuesta(99));
    anterior.complete();
    await consultaAnterior;
    expect(component.stockActualDetalle('000078')).toBe(8);
  });

  it('no reabre ni sobrescribe el detalle cuando su carga termina después de cerrar', async () => {
    spyOn(component, 'prepararMaestrasSPRING').and.resolveTo();
    const detallePendiente = new Subject<unknown[]>();
    servicio.obtenerRequerimientosPendientesAreaDetalle.and.returnValue(detallePendiente);
    const apertura = component.verDetallePendientes(component.requerimientoDetallePendientes);
    component.cerrarDetallePendientes();
    detallePendiente.next([{ idrequerimiento: 'REQ-1', detalles: [{ codigo: '000078', cantidad: 99 }] }]);
    detallePendiente.complete();
    await apertura;
    expect(component.requerimientoDetallePendientes).toBeNull();
    expect(component.loadingDetallePendientes).toBeFalse();
    expect(servicio.consultarStockDetalle).not.toHaveBeenCalled();
  });

  it('cuenta las columnas para consumo, compra y servicio', () => {
    expect(component.columnasDetallePendientes).toBe(10);
    component.requerimientoDetallePendientes.itemtipo = 'COMPRA';
    expect(component.columnasDetallePendientes).toBe(12);
    component.requerimientoDetallePendientes.itemtipo = 'SERVICIO';
    expect(component.columnasDetallePendientes).toBe(9);
  });
});
