export interface CocMonsterData {
  id?: string;
  name: string;
  description: string; // Descrição visual/atmosférica
  
  // Características Principais (0-100)
  str: number; // Força
  con: number; // Constituição
  siz: number; // Tamanho
  dex: number; // Destreza
  app: number; // Aparência
  int: number; // Inteligência
  pow: number; // Poder
  edu: number; // Educação
  
  // Atributos Derivados (Calculados ou Editados)
  hp: number;      // Hit Points
  mp: number;      // Magic Points (geralmente 1/5 do POW)
  san?: number;    // Sanidade (se aplicável, monstros geralmente drenam SAN)
  move: number;    // Movimento
  build: number;   // Corpo (escala de tamanho para manobras)
  db: string;      // Damage Bonus (ex: "+1d4", "-1d6")
  
  // Defesas
  armor?: string;  // Ex: "2 pontos de pele grossa"
  
  // Combate & Perícias
  attacks: {
    name: string;
    skill_level: number; // % de acerto (Ex: 45)
    damage: string;      // Ex: "1d6 + db"
    desc?: string;       // Efeitos extras (agarrar, veneno)
  }[];

  skills: {
    name: string;        // Ex: "Furtividade", "Esgueirar"
    value: number;       // %
  }[];

  // Magias & Poderes
  spells?: string;       // Texto descritivo ou lista
  special_powers?: {
    name: string;
    desc: string;
  }[];

  // Horror
  san_loss: string;      // Perda de Sanidade ao ver (Ex: "1/1d6")

  // Visual
  imageUrl?: string | null;
  imageScale?: number;
  imageX?: number;
  imageY?: number;
}