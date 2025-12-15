import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// DELETE (Já existia)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Correção para Next 15+
) {
  try {
    const { id } = await params;
    await prisma.monster.delete({ where: { id } });
    return NextResponse.json({ message: "Deletado" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}

// PUT (ATUALIZAR - NOVO)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedMonster = await prisma.monster.update({
      where: { id },
      data: {
        name: body.name,
        system: body.system || "D&D 5e",
        type: body.type,
        cr: Number(body.cr),
        size: body.size,
        alignment: body.alignment,
        imageUrl: body.imageUrl,
        data: JSON.stringify(body), // Atualiza o JSON completo
      },
    });

    return NextResponse.json(updatedMonster);
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
  }
}