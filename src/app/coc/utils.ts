// Calcula DB e Build baseado em STR + SIZ (Regras da 7ª Edição)
export function calculateDbAndBuild(str: number, siz: number): { db: string, build: number } {
  const total = str + siz;

  if (total <= 64) return { db: "-2", build: -2 };
  if (total <= 84) return { db: "-1", build: -1 };
  if (total <= 124) return { db: "0", build: 0 };
  if (total <= 164) return { db: "+1d4", build: 1 };
  if (total <= 204) return { db: "+1d6", build: 2 };
  if (total <= 284) return { db: "+2d6", build: 3 };
  if (total <= 364) return { db: "+3d6", build: 4 };
  if (total <= 444) return { db: "+4d6", build: 5 };
  if (total <= 524) return { db: "+5d6", build: 6 };
  
  // Para valores extremos, a cada +80 pontos adiciona +1d6 e +1 Build
  const extraSteps = Math.ceil((total - 524) / 80);
  return { db: `+${5 + extraSteps}d6`, build: 6 + extraSteps };
}

// Calcula HP base (CON + SIZ) / 10 (arredondado para baixo)
export function calculateHP(con: number, siz: number): number {
  return Math.floor((con + siz) / 10);
}

// Calcula MP base (POW / 5)
export function calculateMP(pow: number): number {
  return Math.floor(pow / 5);
}

// Formata % (ex: 50 vira "50%")
export function fmt(val: number) {
  return `${val}%`;
}