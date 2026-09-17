/** Build evolution stage + line length from `evolves_from` links. */

export function computeEvolutionMeta(
  pokemon: { id: number; evolvesFrom: number | null }[],
): Map<number, { stage: number; lineLength: number }> {
  const ids = new Set(pokemon.map((p) => p.id));
  const children = new Map<number, number[]>();
  const parent = new Map<number, number | null>();

  for (const p of pokemon) {
    const from =
      p.evolvesFrom != null && ids.has(p.evolvesFrom) ? p.evolvesFrom : null;
    parent.set(p.id, from);
    if (from != null) {
      const list = children.get(from) ?? [];
      list.push(p.id);
      children.set(from, list);
    }
  }

  const result = new Map<number, { stage: number; lineLength: number }>();

  function maxDepth(id: number): number {
    const kids = children.get(id) ?? [];
    if (kids.length === 0) return 1;
    return 1 + Math.max(...kids.map(maxDepth));
  }

  function assign(id: number, stage: number, lineLength: number) {
    result.set(id, { stage, lineLength });
    for (const child of children.get(id) ?? []) {
      assign(child, stage + 1, lineLength);
    }
  }

  for (const p of pokemon) {
    if (parent.get(p.id) == null) {
      assign(p.id, 1, maxDepth(p.id));
    }
  }

  return result;
}
