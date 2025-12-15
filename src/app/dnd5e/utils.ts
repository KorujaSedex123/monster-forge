// --- Constantes de Jogo ---

export const MONSTER_TYPES = [
  "Aberração", "Besta", "Celestial", "Constructo", "Dragão", "Elemental",
  "Fada", "Gigante", "Humanóide", "Limo", "Monstruosidade", "Morto-vivo",
  "Planta", "Verme"
];

export const ALIGNMENTS = [
  "Qualquer", "Caótico e Bom", "Caótico e Neutro", "Caótico e Mal",
  "Neutro e Bom", "Neutro", "Neutro e Mal",
  "Leal e Bom", "Leal e Neutro", "Leal e Mal"
];

// --- Utilitários de Formato e Conversão ---

/**
 * Converte o valor de atributo para o modificador formatado (ex: 18 -> "+4").
 */
export function getMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Retorna o modificador formatado como string.
 */
export function getModFormatted(score: number): string {
  const mod = getMod(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Retorna o bônus de proficiência baseado no CR (Challenge Rating).
 */
export function getProficiency(cr: number): number {
  if (cr < 1) return 2;
  if (cr < 5) return 2;
  if (cr < 9) return 3;
  if (cr < 13) return 4;
  if (cr < 17) return 5;
  if (cr < 21) return 6;
  if (cr < 25) return 7;
  if (cr < 29) return 8;
  return 9; // CR 29+
}

/**
 * Formata o CR, convertendo decimais para frações (ex: 0.25 -> "1/4").
 */
export function formatCR(cr: number): string {
  if (cr >= 1) return Math.round(cr).toString();
  if (cr === 0.5) return "1/2";
  if (cr === 0.25) return "1/4";
  if (cr === 0.125) return "1/8";
  return cr === 0 ? "0" : cr.toString();
}

// --- Funções da Calculadora de ND (CR) ---

// Tabela de HP para CR Defensivo
const HP_TO_DEFENSE_CR = [
  { hp: 1, cr: 0 }, { hp: 36, cr: 0.125 }, { hp: 50, cr: 0.25 }, { hp: 70, cr: 0.5 },
  { hp: 85, cr: 1 }, { hp: 100, cr: 2 }, { hp: 115, cr: 3 }, { hp: 130, cr: 4 },
  { hp: 145, cr: 5 }, { hp: 160, cr: 6 }, { hp: 175, cr: 7 }, { hp: 190, cr: 8 },
  { hp: 205, cr: 9 }, { hp: 220, cr: 10 }, { hp: 235, cr: 11 }, { hp: 250, cr: 12 },
  { hp: 265, cr: 13 }, { hp: 280, cr: 14 }, { hp: 295, cr: 15 }, { hp: 310, cr: 16 },
  { hp: 325, cr: 17 }, { hp: 340, cr: 18 }, { hp: 355, cr: 19 }, { hp: 370, cr: 20 },
  { hp: 385, cr: 21 }, { hp: 400, cr: 22 }, { hp: 415, cr: 23 }, { hp: 430, cr: 24 },
  { hp: 445, cr: 25 }, { hp: 460, cr: 26 }, { hp: 475, cr: 27 }, { hp: 490, cr: 28 },
  { hp: 505, cr: 29 }, { hp: 520, cr: 30 }
];

// Tabela de DPR (Dano por Rodada) para CR Ofensivo
const DPR_TO_OFFENSE_CR = [
  { dpr: 1, cr: 0 }, { dpr: 3, cr: 0.125 }, { dpr: 5, cr: 0.25 }, { dpr: 8, cr: 0.5 },
  { dpr: 14, cr: 1 }, { dpr: 20, cr: 2 }, { dpr: 26, cr: 3 }, { dpr: 32, cr: 4 },
  { dpr: 38, cr: 5 }, { dpr: 44, cr: 6 }, { dpr: 50, cr: 7 }, { dpr: 57, cr: 8 },
  { dpr: 64, cr: 9 }, { dpr: 71, cr: 10 }, { dpr: 78, cr: 11 }, { dpr: 85, cr: 12 },
  { dpr: 92, cr: 13 }, { dpr: 99, cr: 14 }, { dpr: 106, cr: 15 }, { dpr: 113, cr: 16 },
  { dpr: 120, cr: 17 }, { dpr: 128, cr: 18 }, { dpr: 136, cr: 19 }, { dpr: 144, cr: 20 },
  { dpr: 152, cr: 21 }, { dpr: 160, cr: 22 }, { dpr: 168, cr: 23 }, { dpr: 176, cr: 24 },
  { dpr: 184, cr: 25 }, { dpr: 192, cr: 26 }, { dpr: 200, cr: 27 }, { dpr: 208, cr: 28 },
  { dpr: 216, cr: 29 }, { dpr: 224, cr: 30 }
];

// Tabela de CR para Bônus Esperado (Ataque e CD)
const CR_TO_MODIFIERS = [
  // CR, Bônus de Ataque Esperado, CD de Magia Esperada
  [0, 3, 13], [0.125, 3, 13], [0.25, 3, 13], [0.5, 3, 13],
  [1, 3, 13], [2, 3, 13], [3, 4, 13], [4, 5, 14],
  [5, 6, 15], [6, 6, 15], [7, 6, 15], [8, 7, 15],
  [9, 7, 16], [10, 7, 16], [11, 8, 16], [12, 8, 16],
  [13, 8, 17], [14, 8, 17], [15, 9, 18], [16, 9, 18],
  [17, 10, 18], [18, 10, 19], [19, 10, 19], [20, 11, 19],
  [21, 11, 20], [22, 12, 20], [23, 12, 21], [24, 12, 21],
  [25, 13, 21], [26, 13, 22], [27, 13, 22], [28, 14, 23],
  [29, 14, 23], [30, 14, 23]
];

/**
 * Encontra o CR na tabela baseado em um valor (HP ou DPR).
 */
function findCR(table: { [key: string]: number }[], value: number, key: 'hp' | 'dpr'): number {
  if (value <= 0) return 0;

  for (let i = table.length - 1; i >= 0; i--) {
    if (value >= table[i][key]) {
      return table[i].cr;
    }
  }
  return 0;
}

/**
 * Retorna o bônus de ataque/CD de magia esperado para um CR específico.
 */
function getExpectedModifier(cr: number, index: 1 | 2): number {
    // Tenta achar o CR exato
    const entry = CR_TO_MODIFIERS.find(row => row[0] === cr);
    if (entry) return entry[index];
    
    // Tenta achar o próximo mais próximo (para CRs fracionados)
    const exactCR = CR_TO_MODIFIERS.find(row => formatCR(row[0]) === formatCR(cr));
    if (exactCR) return exactCR[index];
    
    // Para CRs > 30 ou não encontrados, retorna o último valor
    if (cr > 30) return CR_TO_MODIFIERS[CR_TO_MODIFIERS.length - 1][index];
    
    // Para 0
    return CR_TO_MODIFIERS[0][index];
}

/**
 * Calcula o CR Defensivo (HP, CA e Resistências)
 */
function calculateDefenseCR(hp: number, ac: number, hasResistance: boolean): number {
  // 1. CR Defensivo Baseado no HP
  let defenseCR = findCR(HP_TO_DEFENSE_CR, hp, 'hp');
  
  // 2. Ajuste de CA
  // Pega a CD esperada para o CR Baseado no HP (coluna 2 da tabela)
  const expectedACForCR = getExpectedModifier(defenseCR, 2); 
  const acDifference = ac - expectedACForCR;

  // Ajusta o CR Defensivo baseado na diferença de CA (cada 2 pontos de diferença é +1/-1 CR)
  if (acDifference !== 0) {
    defenseCR = Math.max(0, defenseCR + Math.round(acDifference / 2));
  }
  
  // 3. Ajuste de Resistências (Simples)
  // Se o monstro possui Resistência/Imunidade, o CR Defensivo sobe +1
  if (hasResistance && defenseCR < 30) {
      defenseCR = defenseCR + 1;
  }

  return defenseCR;
}

/**
 * Calcula o CR Ofensivo (DPR e Bônus de Ataque)
 */
function calculateOffenseCR(dpr: number, attackBonus: number): number {
  // 1. CR Ofensivo Baseado no DPR
  let offenseCR = findCR(DPR_TO_OFFENSE_CR, dpr, 'dpr');

  // 2. Ajuste de Bônus de Ataque
  // Pega o Bônus de Ataque esperado para o CR Baseado no DPR (coluna 1 da tabela)
  const expectedAttackBonusForCR = getExpectedModifier(offenseCR, 1);
  const attackDifference = attackBonus - expectedAttackBonusForCR;

  // Ajusta o CR Ofensivo baseado na diferença de Bônus (cada 2 pontos de diferença é +1/-1 CR)
  if (attackDifference !== 0) {
    offenseCR = Math.max(0, offenseCR + Math.round(attackDifference / 2));
  }
  
  return offenseCR;
}

/**
 * FUNÇÃO PRINCIPAL: Calcula o CR Final.
 */
export function calculateFinalCR(hp: number, ac: number, dpr: number, attackBonus: number, hasResistance: boolean): number {
    // Se não tiver dados suficientes, retorna 0
    if (hp <= 0 || ac <= 0 || dpr <= 0) return 0;
    
    const defenseCR = calculateDefenseCR(hp, ac, hasResistance);
    const offenseCR = calculateOffenseCR(dpr, attackBonus);

    // CR Final é a média do CR Defensivo e Ofensivo
    const finalCR = (defenseCR + offenseCR) / 2;

    // Arredonda para o CR real mais próximo (1/8, 1/4, 1/2, 1, 2, 3...)
    const possibleCRs = CR_TO_MODIFIERS.map(row => row[0]);
    
    // Encontra o CR real mais próximo do valor médio
    let closestCR = possibleCRs[0];
    let minDiff = Infinity;

    for (const crOption of possibleCRs) {
      const diff = Math.abs(finalCR - crOption);
      if (diff < minDiff) {
        minDiff = diff;
        closestCR = crOption;
      }
    }
    
    // Retorna o valor de CR arredondado para um dos valores da tabela oficial
    return closestCR;
}