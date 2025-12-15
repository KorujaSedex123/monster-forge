import { prisma } from "@/lib/db";
import DndEditorLayout from "../components/DndEditorLayout";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DndEditPage(props: Props) {
  const params = await props.params;

  // Busca o monstro
  const monster = await prisma.monster.findUnique({
    where: { id: params.id },
  });

  if (!monster) return notFound();

  // Converte o JSON do banco para o objeto da ficha
  const monsterData = JSON.parse(monster.data);

  // Renderiza o Editor, mas passando os dados iniciais e o ID
  return <DndEditorLayout initialData={monsterData} monsterId={monster.id} />;
}