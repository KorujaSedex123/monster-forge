import { MonsterData } from "./types";

// --- MAPEAMENTOS (Foundry <-> PT-BR) ---

const SIZE_MAP: Record<string, string> = {
  "Miúdo": "tiny", "Pequeno": "sm", "Médio": "med",
  "Grande": "lg", "Enorme": "huge", "Imenso": "grg"
};

const REVERSE_SIZE_MAP: Record<string, string> = {
  "tiny": "Miúdo", "sm": "Pequeno", "med": "Médio",
  "lg": "Grande", "huge": "Enorme", "grg": "Imenso"
};

const ALIGNMENT_MAP: Record<string, string> = {
  "ce": "Caótico e Mau", "cn": "Caótico e Neutro", "cg": "Caótico e Bom",
  "ne": "Neutro e Mau", "tn": "Neutro", "ng": "Neutro e Bom",
  "le": "Leal e Mau", "ln": "Leal e Neutro", "lg": "Leal e Bom",
  "unaligned": "Unaligned", "any non-good alignment": "Qualquer Mau"
};

const DAMAGE_TYPES: Record<string, string> = { 
  acid: "Ácido", bludgeoning: "Concussão", cold: "Frio", fire: "Fogo", 
  force: "Força", lightning: "Elétrico", necrotic: "Necrótico", piercing: "Perfurante", 
  poison: "Veneno", psychic: "Psíquico", radiant: "Radiante", slashing: "Cortante", 
  thunder: "Trovejante" 
};

const CONDITION_TYPES: Record<string, string> = { 
  blinded: "Cego", charmed: "Enfeitiçado", deafened: "Surdo", frightened: "Amedrontado", 
  grappled: "Agarrado", incapacitated: "Incapacitado", invisible: "Invisível", 
  paralyzed: "Paralisado", petrified: "Petrificado", poisoned: "Envenenado", 
  prone: "Caído", restrained: "Impedido", stunned: "Atordoado", unconscious: "Inconsciente", 
  exhaustion: "Exaustão" 
};

const LANGUAGES: Record<string, string> = {
  common: "Comum", dwarvish: "Anão", elvish: "Élfico", giant: "Gigante",
  gnomish: "Gnomo", goblin: "Goblin", halfling: "Halfling", orc: "Orc",
  abyssal: "Abissal", celestial: "Celestial", draconic: "Dracônico",
  deep: "Subcomum", infernal: "Infernal", primordial: "Primordial",
  sylvan: "Silvestre", undercommon: "Subcomum", druidic: "Druídico"
};

const BYPASSES: Record<string, string> = { 
  mgc: "armas mágicas", 
  adam: "adamantina", 
  silver: "prata" 
};

// --- HELPERS PARA IMPORTAÇÃO ---

function formatFoundryTraits(traitData: any, map: Record<string, string>): string {
  if (!traitData) return "";
  
  // 1. Traduz os valores padrão (ex: ['fire', 'poison'])
  const values = (traitData.value || []).map((v: string) => map[v] || v);
  
  // 2. Traduz as exceções (bypasses)
  // Ex: "exceto armas mágicas"
  const bypassText = (traitData.bypasses || []).map((b: string) => BYPASSES[b]).join(" ou ");
  
  let result = values.join(", ");
  
  // Se houver exceções, adiciona ao texto (lógica comum do D&D)
  if (bypassText && result) {
      result += ` (exceto ${bypassText})`;
  }
  
  // 3. Adiciona valores customizados
  const custom = traitData.custom ? [traitData.custom] : [];
  return [...(result ? [result] : []), ...custom].filter(Boolean).join("; ");
}

function formatSenses(senses: any): string {
  if (!senses) return "";
  const list = [];
  if (senses.darkvision) list.push(`Visão no Escuro ${senses.darkvision} ft`);
  if (senses.blindsight) list.push(`Percepção às Cegas ${senses.blindsight} ft`);
  if (senses.tremorsense) list.push(`Sentido Sísmico ${senses.tremorsense} ft`);
  if (senses.truesight) list.push(`Visão Verdadeira ${senses.truesight} ft`);
  if (senses.special) list.push(senses.special);
  return list.join(", ");
}

// --- EXPORTAR (Seu App -> Foundry JSON) ---
export function convertToFoundry(data: MonsterData) {
  const items: any[] = [];

  // Cria um item compatível com Foundry
  const createItem = (name: string, desc: string, type: "feat" | "weapon", activationType = "action") => {
    // Tenta encontrar dados no texto (ex: "2d6 + 3") para criar botão de rolagem
    const damageMatch = desc.match(/(\d+d\d+\s*\+?\s*\d*)/);
    const damageParts = damageMatch ? [[damageMatch[1], ""]] : []; 

    return {
      name: name,
      type: type,
      img: type === "weapon" ? "icons/skills/melee/blood-slash-foam-red.webp" : "icons/svg/mystery-man.svg",
      system: {
        description: { value: `<p>${desc.replace(/\n/g, "<br>")}</p>` },
        activation: { type: activationType, cost: 1 },
        actionType: type === "weapon" ? "mwak" : null, // Assume Melee Weapon Attack por padrão
        damage: type === "weapon" ? { parts: damageParts } : {}
      }
    };
  };

  // Preenche os itens
  data.traits.forEach(t => items.push(createItem(t.name, t.desc, "feat", ""))); // Sem ativação (passiva)
  data.actions.forEach(a => items.push(createItem(a.name, a.desc, "weapon", "action")));

  if (data.is_legendary && data.legendary_actions) {
    data.legendary_actions.forEach(l => items.push(createItem(l.name, l.desc, "feat", "legendary")));
  }

  if (data.is_spellcaster && data.spell_list_text) {
    items.push(createItem("Conjuração", data.spell_list_text, "feat", ""));
  }

  return {
    name: data.name,
    type: "npc",
    img: data.imageUrl || "icons/svg/mystery-man.svg",
    system: {
      abilities: {
        str: { value: data.str }, dex: { value: data.dex }, con: { value: data.con },
        int: { value: data.int }, wis: { value: data.wis }, cha: { value: data.cha }
      },
      attributes: {
        ac: { flat: data.ac, calc: "flat" },
        hp: { value: data.hp_avg, max: data.hp_avg, formula: data.hp_formula },
        speed: { value: data.speed, units: "ft" },
        senses: { special: data.senses || "" } // Exporta como texto especial
      },
      details: {
        cr: data.cr,
        alignment: data.alignment,
        type: { value: data.type.toLowerCase() },
        biography: { 
            value: `<p>${data.lore?.replace(/\n/g, "<br>") || ""}</p><hr><h3>Táticas</h3><p>${data.tactics?.replace(/\n/g, "<br>") || ""}</p>` 
        },
        source: "Monster Forge"
      },
      traits: {
        size: SIZE_MAP[data.size] || "med",
        // Na exportação, colocamos tudo em 'custom' para garantir que o texto apareça, 
        // já que fazer a engenharia reversa para os IDs do Foundry pode gerar erros.
        di: { custom: data.damage_immunities || "" },
        dr: { custom: data.damage_resistances || "" },
        dv: { custom: data.damage_vulnerabilities || "" },
        ci: { custom: data.condition_immunities || "" },
        languages: { custom: data.languages || "" }
      },
      resources: {
        legact: { max: data.is_legendary ? 3 : 0, value: 3 },
        legres: { max: data.is_legendary ? 3 : 0, value: 3 }
      }
    },
    items: items,
    token: { name: data.name }
  };
}

// --- IMPORTAR (Foundry JSON -> Seu App) ---
export function convertFromFoundry(json: any): Partial<MonsterData> {
  const s = json.system || {};
  const items = json.items || [];

  const traits: {name: string, desc: string}[] = [];
  const actions: {name: string, desc: string}[] = [];
  const legendary_actions: {name: string, desc: string}[] = [];

  // Processamento de Itens (Ataques, Habilidades, etc)
  items.forEach((item: any) => {
    // Limpa HTML básico
    let desc = item.system?.description?.value || "";
    desc = desc.replace(/<[^>]*>?/gm, "").trim();

    // Se o item tem fórmula de dano configurada, adiciona ao texto
    if (item.system?.damage?.parts?.length > 0) {
        const damage = item.system.damage.parts[0][0];
        const type = item.system.damage.parts[0][1] || "";
        if (damage) desc += ` Dano: ${damage} ${type}`;
    }

    // Classificação
    const activation = item.system?.activation?.type;
    const isAttack = item.type === "weapon" || ["mwak", "rwak", "msak", "rsak"].includes(item.system?.actionType);

    if (activation === "legendary") {
        legendary_actions.push({ name: item.name, desc });
    } else if (isAttack || activation === "action") {
        actions.push({ name: item.name, desc });
    } else {
        traits.push({ name: item.name, desc });
    }
  });

  // Limpeza da Biografia
  let biography = s.details?.biography?.value || "";
  if (biography.length < 20) biography = ""; // Ignora se for só tags vazias
  else biography = biography.replace(/<[^>]*>?/gm, "");

  // Alinhamento
  let align = s.details?.alignment || "Neutro";
  if (ALIGNMENT_MAP[align]) align = ALIGNMENT_MAP[align];

  // Verifica se é lendário
  const isLegendary = (s.resources?.legact?.max || 0) > 0 || legendary_actions.length > 0;

  return {
    name: json.name || "Sem Nome",
    size: REVERSE_SIZE_MAP[s.traits?.size] || "Médio",
    type: s.details?.type?.value || "Monstruosidade",
    alignment: align,
    
    // Atributos de Defesa e Vida
    ac: s.attributes?.ac?.flat || s.attributes?.ac?.value || 10,
    hp_avg: s.attributes?.hp?.max || s.attributes?.hp?.value || 10,
    hp_formula: s.attributes?.hp?.formula || "",
    
    // Velocidade (tenta pegar 'walk' ou usa o primeiro disponível)
    speed: s.attributes?.movement?.walk 
        ? `${s.attributes.movement.walk} ft` 
        : Object.entries(s.attributes?.movement || {})
            .filter(([k, v]) => v && k !== "units" && k !== "hover")
            .map(([k, v]) => `${k} ${v}`)
            .join(", ") || "30 ft",

    // Habilidades
    str: s.abilities?.str?.value || 10,
    dex: s.abilities?.dex?.value || 10,
    con: s.abilities?.con?.value || 10,
    int: s.abilities?.int?.value || 10,
    wis: s.abilities?.wis?.value || 10,
    cha: s.abilities?.cha?.value || 10,

    cr: s.details?.cr || 1,
    
    // --- Campos Avançados (Traits do Foundry) ---
    damage_immunities: formatFoundryTraits(s.traits?.di, DAMAGE_TYPES),
    damage_resistances: formatFoundryTraits(s.traits?.dr, DAMAGE_TYPES),
    damage_vulnerabilities: formatFoundryTraits(s.traits?.dv, DAMAGE_TYPES),
    condition_immunities: formatFoundryTraits(s.traits?.ci, CONDITION_TYPES),
    languages: formatFoundryTraits(s.traits?.languages, LANGUAGES),
    senses: formatSenses(s.attributes?.senses),
    // --------------------------------------------

    traits,
    actions,
    legendary_actions,
    
    lore: biography,
    is_legendary: isLegendary
  };
}