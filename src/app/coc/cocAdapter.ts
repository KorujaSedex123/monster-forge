import { CocMonsterData } from "./types";

// --- EXPORTAR (Seu App -> Foundry JSON) ---
export function convertCocToFoundry(data: CocMonsterData) {
  const items: any[] = [];

  // 1. Converter ATAQUES em Itens (type: "weapon")
  if (data.attacks) {
    data.attacks.forEach((atk) => {
      items.push({
        name: atk.name,
        type: "weapon",
        img: "icons/svg/sword.svg", // Ícone genérico
        system: {
          skill: {
            main: { name: "Fighting (Brawl)", id: "" } // Padrão genérico
          },
          range: {
            normal: { value: 0, units: "m", damage: atk.damage }
          },
          description: {
            value: `<p>${atk.desc || ""}</p>`
          },
          // Hack para forçar o valor da perícia na arma se possível, 
          // mas no CoC Foundry geralmente se linka a uma skill.
          // Vamos adicionar a % no nome para facilitar: "Soco (50%)"
        }
      });
    });
  }

  // 2. Converter PERÍCIAS em Itens (type: "skill")
  if (data.skills) {
    data.skills.forEach((skill) => {
      items.push({
        name: skill.name,
        type: "skill",
        img: "icons/svg/book.svg",
        system: {
          value: skill.value // O valor da perícia (ex: 70)
        }
      });
    });
  }

  // 3. Converter PODERES/MAGIAS em Itens (type: "spell" ou "talent")
  if (data.special_powers) {
    data.special_powers.forEach((power) => {
      items.push({
        name: power.name,
        type: "talent", // Talentos ou Traços
        img: "icons/svg/aura.svg",
        system: {
          description: { value: `<p>${power.desc}</p>` }
        }
      });
    });
  }

  // Estrutura Base do Ator CoC 7e
  return {
    name: data.name,
    type: "npc", // Ou "creature"
    img: data.imageUrl || "icons/svg/mystery-man.svg",
    system: {
      // --- CARACTERÍSTICAS (0-100) ---
      characteristics: {
        str: { value: data.str },
        con: { value: data.con },
        siz: { value: data.siz },
        dex: { value: data.dex },
        app: { value: data.app },
        int: { value: data.int },
        pow: { value: data.pow },
        edu: { value: data.edu }
      },
      // --- ATRIBUTOS DERIVADOS ---
      attribs: {
        hp: { value: data.hp, max: data.hp },
        mp: { value: data.mp, max: data.mp },
        mov: { value: data.move }, // Movimento
        build: { value: data.build }, // Corpo
        db: { value: data.db }, // Bônus de Dano (Damage Bonus)
        san: { value: 0, max: 0 } // Monstros geralmente não têm sanidade jogável
      },
      // --- BIOGRAFIA / DETALHES ---
      biography: {
        personalDescription: { 
           value: `<p>${data.description || ""}</p>
                   <p><strong>Perda de Sanidade:</strong> ${data.san_loss || "0/0"}</p>
                   <p><strong>Armadura:</strong> ${data.armor || "Nenhuma"}</p>
                   <p><strong>Magias:</strong> ${data.spells || "Nenhuma"}</p>`
        }
      }
    },
    items: items,
    token: { name: data.name }
  };
}

// --- IMPORTAR (Foundry JSON -> Seu App) ---
export function convertCocFromFoundry(json: any): Partial<CocMonsterData> {
  const s = json.system || {};
  const char = s.characteristics || {};
  const attr = s.attribs || {};
  
  // Extrair Listas
  const attacks: any[] = [];
  const skills: any[] = [];
  const special_powers: any[] = [];

  if (json.items) {
    json.items.forEach((item: any) => {
      // Arma -> Ataque
      if (item.type === "weapon") {
        attacks.push({
          name: item.name,
          skill_level: 50, // Difícil extrair sem link, definindo padrão
          damage: item.system?.range?.normal?.damage || "1d4",
          desc: item.system?.description?.value?.replace(/<[^>]*>/g, "") || ""
        });
      }
      // Perícia -> Skill
      if (item.type === "skill") {
        skills.push({
          name: item.name,
          value: item.system?.value || 0
        });
      }
      // Talento/Spell -> Poderes
      if (item.type === "talent" || item.type === "spell") {
        special_powers.push({
          name: item.name,
          desc: item.system?.description?.value?.replace(/<[^>]*>/g, "") || ""
        });
      }
    });
  }

  // Tenta extrair San Loss da bio (regex simples)
  const bio = s.biography?.personalDescription?.value || "";
  const sanMatch = bio.match(/Sanidade:?\s*(\d+\/\d+d\d+)/i);

  return {
    name: json.name,
    description: bio.replace(/<[^>]*>/g, "").substring(0, 200) + "...",
    
    // Stats
    str: char.str?.value || 50,
    con: char.con?.value || 50,
    siz: char.siz?.value || 50,
    dex: char.dex?.value || 50,
    app: char.app?.value || 50,
    int: char.int?.value || 50,
    pow: char.pow?.value || 50,
    edu: char.edu?.value || 50,

    // Derivados
    hp: attr.hp?.value || 10,
    mp: attr.mp?.value || 10,
    move: attr.mov?.value || 8,
    build: attr.build?.value || 0,
    db: attr.db?.value || "0",
    
    san_loss: sanMatch ? sanMatch[1] : "0/1d4",
    
    attacks,
    skills,
    special_powers
  };
}