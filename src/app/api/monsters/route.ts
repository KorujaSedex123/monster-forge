import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helpers para converter String JSON de volta para Array
const parseDnD = (m: any) => ({
  ...m,
  traits: m.traits ? JSON.parse(m.traits) : [],
  actions: m.actions ? JSON.parse(m.actions) : [],
  legendary_actions: m.legendary_actions ? JSON.parse(m.legendary_actions) : [],
});

const parseCoC = (m: any) => ({
  ...m,
  attacks: m.attacks ? JSON.parse(m.attacks) : [],
  skills: m.skills ? JSON.parse(m.skills) : [],
  special_powers: m.special_powers ? JSON.parse(m.special_powers) : [],
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Se tiver ID, tenta achar em qualquer uma das tabelas
    if (id) {
      const dnd = await prisma.monsterDnD.findUnique({ where: { id } });
      if (dnd) return NextResponse.json(parseDnD(dnd));

      const coc = await prisma.monsterCoC.findUnique({ where: { id } });
      if (coc) return NextResponse.json(parseCoC(coc));

      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // LISTAGEM GERAL (BESTIÁRIO)
    // Busca os dois tipos e mistura
    const [dndMonsters, cocMonsters] = await Promise.all([
      prisma.monsterDnD.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.monsterCoC.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const allMonsters = [
      ...dndMonsters.map(parseDnD),
      ...cocMonsters.map(parseCoC)
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(allMonsters);

  } catch (error) {
    console.error("Erro GET:", error);
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rawData = await req.json();
    
    // Identifica o sistema
    const system = rawData.system || (rawData.san_loss ? "coc" : "dnd5e");

    // Limpeza de campos de UI que não vão para o banco
    const { imageScale, imageX, imageY, show_lore, lore_on_new_page, has_resistance, ...data } = rawData;

    // --- SALVAR D&D ---
    if (system === 'dnd5e') {
        const payload = {
            system: 'dnd5e',
            name: data.name,
            imageUrl: data.imageUrl,
            str: data.str, dex: data.dex, con: data.con, int: data.int, wis: data.wis, cha: data.cha,
            ac: data.ac, hp_avg: data.hp_avg, hp_formula: data.hp_formula, speed: data.speed,
            cr: data.cr, type: data.type, alignment: data.alignment,
            is_spellcaster: data.is_spellcaster, is_legendary: data.is_legendary,
            spell_ability: data.spell_ability, caster_level: data.caster_level, spell_list_text: data.spell_list_text,
            lore: data.lore, tactics: data.tactics,
            // JSON Strings
            traits: JSON.stringify(data.traits || []),
            actions: JSON.stringify(data.actions || []),
            legendary_actions: JSON.stringify(data.legendary_actions || []),
        };

        if (data.id) {
            const updated = await prisma.monsterDnD.update({ where: { id: data.id }, data: payload });
            return NextResponse.json(parseDnD(updated));
        } else {
            const created = await prisma.monsterDnD.create({ data: payload });
            return NextResponse.json(parseDnD(created), { status: 201 });
        }
    }

    // --- SALVAR CALL OF CTHULHU ---
    if (system === 'coc') {
        const payload = {
            system: 'coc',
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            str: data.str, con: data.con, siz: data.siz, dex: data.dex, 
            app: data.app, int: data.int, pow: data.pow, edu: data.edu,
            hp: data.hp, mp: data.mp, move: data.move, build: data.build, db: data.db,
            san_loss: data.san_loss, armor: data.armor,
            spells: data.spells,
            // JSON Strings
            attacks: JSON.stringify(data.attacks || []),
            skills: JSON.stringify(data.skills || []),
            special_powers: JSON.stringify(data.special_powers || []),
        };

        if (data.id) {
            const updated = await prisma.monsterCoC.update({ where: { id: data.id }, data: payload });
            return NextResponse.json(parseCoC(updated));
        } else {
            const created = await prisma.monsterCoC.create({ data: payload });
            return NextResponse.json(parseCoC(created), { status: 201 });
        }
    }

    return NextResponse.json({ error: "Sistema desconhecido" }, { status: 400 });

  } catch (error: any) {
    console.error("Erro POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    // Tenta deletar no D&D, se não achar, tenta no CoC
    try {
        await prisma.monsterDnD.delete({ where: { id } });
    } catch (e) {
        try {
            await prisma.monsterCoC.delete({ where: { id } });
        } catch (e2) {
            return NextResponse.json({ error: "Monstro não encontrado" }, { status: 404 });
        }
    }

    return NextResponse.json({ message: "Deletado" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}