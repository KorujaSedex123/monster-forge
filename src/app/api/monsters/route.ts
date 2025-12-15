import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newMonster = await prisma.monster.create({
      data: {
        name: body.name,
        // Garante que salve "D&D 5e" se não vier especificado
        system: "D&D 5e", 
        type: body.type,
        cr: Number(body.cr),
        size: body.size,
        alignment: body.alignment,
        imageUrl: body.imageUrl,
        data: JSON.stringify(body), 
      },
    });

    return NextResponse.json(newMonster);
  } catch (error) {
    console.error("Erro ao salvar monstro:", error);
    return NextResponse.json({ error: "Falha ao criar monstro" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const monsters = await prisma.monster.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(monsters);
  } catch (error) {
    return NextResponse.json({ error: "Falha ao buscar monstros" }, { status: 500 });
  }
}