import { PartidaLocal } from '@/app/shared/interfaces/Tables';
import { ModuloNode } from '@/app/modules/main/components/tree-select/tree-select.component';

export function filtrarPartidas(partidas: PartidaLocal[], proyecto: string | undefined, ruc: string | undefined): PartidaLocal[] {
  const proyectoTrim = String(proyecto ?? '').trim();
  const rucTrim = String(ruc ?? '').trim();
  if (!proyectoTrim) return [];
  return (partidas || []).filter((x: PartidaLocal) =>
    String(x.proyecto).trim() === proyectoTrim && String(x.ruc).trim() === rucTrim
  );
}

export function construirArbolPartidas(filtered: PartidaLocal[]): ModuloNode[] {
  const grupos = new Map<string, PartidaLocal[]>();
  for (const p of filtered || []) {
    const categoria = String(p.categoria ?? '').trim() || 'Sin categoría';
    if (!grupos.has(categoria)) grupos.set(categoria, []);
    grupos.get(categoria)!.push(p);
  }
  const nodes: ModuloNode[] = [];
  grupos.forEach((items, categoria) => {
    const duplicados = new Map<string, number>();
    items.forEach((p) => {
      const clave = `${String(p.partida ?? '').trim()}|${String(p.partida_descripcion ?? '').trim()}`;
      duplicados.set(clave, (duplicados.get(clave) ?? 0) + 1);
    });
    nodes.push({
      key: categoria,
      label: categoria,
      children: items.map((p) => {
        const clave = `${String(p.partida ?? '').trim()}|${String(p.partida_descripcion ?? '').trim()}`;
        const marcaSubpresupuesto = (duplicados.get(clave) ?? 0) > 1 ? ` (SP ${p.subpresupuesto})` : '';
        return { key: p.id, label: `${p.partida} - ${p.partida_descripcion}${marcaSubpresupuesto}` };
      })
    });
  });
  return nodes;
}

export function encontrarPartida(filtered: PartidaLocal[], subpresupuesto?: number, partida?: string): PartidaLocal | undefined {
  if (subpresupuesto == null || partida == null || partida === '') return undefined;
  const partidaTrim = String(partida).trim();
  return (filtered || []).find((x: PartidaLocal) =>
    x.subpresupuesto === subpresupuesto && String(x.partida).trim() === partidaTrim
  );
}
