export type Action = {
    name: string;
    desc: string;
};
export type Ability = {
    name: string;
    desc: string;
};
export type MonsterData = {
    name: string;
    size: string;
    type: string;
    alignment: string;
    imageUrl: string | null;
    ac: number;
    lore: string;
    hp_avg: number;
    hp_formula: string;
    speed: string;
    dpr: number;
    attack_bonus: number;
    str: number; dex: number; con: number; int: number; wis: number; cha: number;
    cr: number;

    imageScale: number; // Zoom
    imageX: number;     // Posição Horizontal
    imageY: number;     // Posição Vertical

    show_lore: boolean;        // Exibir história?
    lore_on_new_page: boolean; // Jogar história para página 2?

    traits: Ability[];            // Habilidades Passivas (ex: Anfíbio, Táticas de Matilha)
    is_legendary: boolean;        // É lendário?
    legendary_actions: Ability[];
    has_resistance: boolean;  // Possui Resistência/Imunidade?

    // Ações e Magias
    actions: Action[];
    is_spellcaster: boolean;
    spell_ability: "int" | "wis" | "cha";
    caster_level: number;
    spell_list_text: string;
};