export type ZuriIntent =
  | { type: 'help' }
  | { type: 'find_driver'; query: string }
  | { type: 'filter_drivers'; equipamiento?: string; servicio?: string; soloDisponibles?: boolean }
  | { type: 'nearest_drivers'; radiusKm?: number }
  | { type: 'assign_driver'; query: string }
  | { type: 'unknown' };

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function parseZuriIntent(raw: string): ZuriIntent {
  const text = normalize(raw);
  if (!text) return { type: 'unknown' };

  if (/(ayuda|comandos|que puedes hacer)/.test(text)) return { type: 'help' };

  const matchWhere = text.match(/(donde esta|ubicacion de|localiza a)\s+(.*)$/);
  if (matchWhere?.[2]) return { type: 'find_driver', query: matchWhere[2].trim() };

  const matchAssign = text.match(/(asigna|asignar)\s+(a\s+)?(.*)$/);
  if (matchAssign?.[3]) return { type: 'assign_driver', query: matchAssign[3].trim() };

  if (/(mas cercanos|cercanos|cerca del origen|nearby)/.test(text)) {
    const r = text.match(/(\d+)\s*(km|kms|kilometros)/);
    return { type: 'nearest_drivers', radiusKm: r ? parseInt(r[1], 10) : undefined };
  }

  const equip =
    text.includes('oxigeno') ? 'OXIGENO' :
    text.includes('rampa') ? 'RAMPA' :
    text.includes('silla') ? 'SILLA_RUEDAS' :
    text.includes('camilla') ? 'CAMILLA' :
    text.includes('botiquin') ? 'BOTIQUIN' :
    text.includes('extintor') ? 'EXTINTOR' :
    undefined;

  const servicio =
    text.includes('medicina general') ? 'MEDICINA_GENERAL' :
    text.includes('pediatria') ? 'PEDIATRIA' :
    text.includes('laboratorio') ? 'LABORATORIO' :
    text.includes('pacientes cronicos') ? 'PACIENTES_CRONICOS' :
    text.includes('atencion medica especializada') ? 'ATENCION_MEDICA_ESPECIALIZADA' :
    text.includes('programa hospitalizacion domiciliaria') ? 'PROGRAMA_HOSPITALIZACION_DOMICILIARIA' :
    undefined;

  if (/(filtra|filtro|mostrar)\s+conductores/.test(text) || equip || servicio) {
    return {
      type: 'filter_drivers',
      equipamiento: equip,
      servicio,
      soloDisponibles: /(disponibles|solo disponibles)/.test(text) ? true : undefined,
    };
  }

  return { type: 'unknown' };
}
