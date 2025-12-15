import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- FUNÇÃO AJUDANTE ---
function createMonsterJson(
  name: string,
  type: string,
  size: string,
  alignment: string,
  cr: number,
  ac: number,
  hp: string,
  stats: [number, number, number, number, number, number], // [STR, DEX, CON, INT, WIS, CHA]
  lore: string = ""
) {
  const baseData = {
    name,
    size,
    type,
    alignment,
    cr,
    ac,
    hp_avg: Number(hp.split(' ')[0] || 10),
    hp_formula: hp,
    speed: "30 ft.",
    str: stats[0], dex: stats[1], con: stats[2], int: stats[3], wis: stats[4], cha: stats[5],
    dpr: 0, attack_bonus: 0,
    
    // --- A CORREÇÃO ESTÁ AQUI: 'as any[]' ---
    // Isso diz ao TS: "Essas listas aceitam qualquer objeto que eu colocar nelas"
    traits: [] as any[], 
    actions: [] as any[], 
    legendary_actions: [] as any[],
    
    is_legendary: false, is_spellcaster: false, spell_ability: "int", caster_level: 1, spell_list_text: "",
    show_lore: lore.length > 0,
    lore_on_new_page: lore.length > 500,
    lore: lore,
    imageUrl: null,
  };

  // Agora o push funciona sem erros
  if (type === "Dragão") {
    baseData.actions.push({ name: "Mordida", desc: "Ataque Corpo a Corpo com Arma: +X para acertar, alcance 10 ft., um alvo. Dano: (2d10 + X) perfurante mais (1d6) fogo." });
    baseData.is_legendary = true;
  } else if (type === "Humanóide") {
     baseData.actions.push({ name: "Cimitarra", desc: "Ataque Corpo a Corpo com Arma: +X para acertar, alcance 5 ft., um alvo. Dano: (1d6 + X) cortante." });
  }

  return JSON.stringify(baseData);
}

// --- A LISTA DE MONSTROS ---
const monstersToCreate = [
  {
    name: "Goblin Espião",
    type: "Humanóide (Goblinóide)",
    size: "Pequeno",
    alignment: "Neutro e Mal",
    cr: 0.25,
    system: "D&D 5e",
    imageUrl: "https://i.pinimg.com/564x/0f/8d/2a/0f8d2a60770040086000480808080808.jpg",
    data: createMonsterJson("Goblin Espião", "Humanóide (Goblinóide)", "Pequeno", "Neutro e Mal", 0.25, 15, "7 (2d6)", [8, 14, 10, 10, 8, 8], "Pequenos e maliciosos, estes goblins se especializam em furtividade e emboscadas rápidas."),
  },
  {
    name: "Ogro Brutamontes",
    type: "Gigante",
    size: "Grande",
    alignment: "Caótico e Mal",
    cr: 2,
    system: "D&D 5e",
    data: createMonsterJson("Ogro Brutamontes", "Gigante", "Grande", "Caótico e Mal", 2, 11, "59 (7d10 + 21)", [19, 8, 16, 5, 7, 7], "Montanhas de músculo e fúria, ogros são conhecidos por sua força tremenda e pouca inteligência."),
  },
  {
    name: "Lorde Vampiro",
    type: "Morto-vivo",
    size: "Médio",
    alignment: "Leal e Mal",
    cr: 13,
    system: "D&D 5e",
    imageUrl: "https://i.pinimg.com/564x/a9/2b/3c/a92b3c4d5e6f7g8h9i0j1k2l3m4n5o6p.jpg",
    data: createMonsterJson("Lorde Vampiro", "Morto-vivo", "Médio", "Leal e Mal", 13, 16, "144 (17d8 + 68)", [18, 18, 18, 17, 15, 18], "Antigos e aristocráticos, lordes vampiros dominam a noite com magia negra e sede de sangue."),
  },
  {
    name: "Jovem Dragão Vermelho",
    type: "Dragão",
    size: "Grande",
    alignment: "Caótico e Mal",
    cr: 10,
    system: "D&D 5e",
    imageUrl: "https://i.pinimg.com/564x/b1/c2/d3/b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q.jpg",
    data: createMonsterJson("Jovem Dragão Vermelho", "Dragão", "Grande", "Caótico e Mal", 10, 18, "178 (17d10 + 85)", [23, 10, 21, 14, 11, 19], "Arrogantes e gananciosos, jovens dragões vermelhos já são forças terríveis da natureza, cuspindo fogo sobre quem ousa desafiá-los."),
  },
  {
    name: "Cubo Gelatinoso",
    type: "Limo",
    size: "Grande",
    alignment: "Neutro",
    cr: 2,
    system: "D&D 5e",
    data: createMonsterJson("Cubo Gelatinoso", "Limo", "Grande", "Neutro", 2, 6, "84 (8d10 + 40)", [14, 3, 20, 1, 6, 1], "Uma massa transparente e cúbica que varre masmorras, absorvendo e digerindo tudo em seu caminho."),
  },
  {
    name: "Esqueleto Arqueiro",
    type: "Morto-vivo",
    size: "Médio",
    alignment: "Leal e Mal",
    cr: 0.25,
    system: "D&D 5e",
    data: createMonsterJson("Esqueleto Arqueiro", "Morto-vivo", "Médio", "Leal e Mal", 0.25, 13, "13 (2d8 + 4)", [10, 14, 15, 6, 8, 5]),
  },
  {
    name: "Lich",
    type: "Morto-vivo (Mago)",
    size: "Médio",
    alignment: "Qualquer Mal",
    cr: 21,
    system: "D&D 5e",
    imageUrl: "https://i.pinimg.com/564x/d4/e5/f6/d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s.jpg",
    data: createMonsterJson("Lich", "Morto-vivo (Mago)", "Médio", "Qualquer Mal", 21, 17, "135 (18d8 + 54)", [11, 16, 16, 20, 14, 16], "Magos que buscaram a imortalidade através de rituais profanos, tornando-se mestres supremos da necromancia."),
  },
  {
    name: "Tarrasque",
    type: "Monstruosidade",
    size: "Imenso",
    alignment: "Neutro",
    cr: 30,
    system: "D&D 5e",
    imageUrl: "https://i.pinimg.com/564x/e5/f6/g7/e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t.jpg",
    data: createMonsterJson("Tarrasque", "Monstruosidade", "Imenso", "Neutro", 30, 25, "676 (33d20 + 330)", [30, 11, 30, 3, 11, 11], "O fim de tudo. Uma máquina de destruição imparável que dorme nas profundezas da terra até despertar para devorar o mundo."),
  }
];

// --- FUNÇÃO PRINCIPAL DE EXECUÇÃO ---
async function main() {
  console.log(`Iniciando povoamento do bestiário...`);
  
  // Limpar o banco antes (opcional, remove duplicatas ao rodar várias vezes)
  // await prisma.monster.deleteMany({});

  for (const monster of monstersToCreate) {
    const result = await prisma.monster.create({
      data: monster,
    });
    console.log(`Criado monstro com ID: ${result.id} - ${result.name}`);
  }
  console.log(`Povoamento concluído! ${monstersToCreate.length} monstros adicionados.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });