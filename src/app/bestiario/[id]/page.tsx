import { prisma } from "@/lib/db";
import MonsterViewer from "./MonsterViewer";
import { notFound } from "next/navigation";

interface Props {
  // ATUALIZAÇÃO: params agora é uma Promise no Next.js 15+
  params: Promise<{ id: string }>;
}

export default async function MonsterPage(props: Props) {
  // 1. Primeiro, aguardamos os parâmetros carregarem
  const params = await props.params;
  
  // 2. Agora podemos usar o ID com segurança
  const monster = await prisma.monster.findUnique({
    where: { id: params.id },
  });

  if (!monster) {
    return notFound();
  }

  // 3. Converte o JSON string do banco de volta para Objeto
  const monsterData = JSON.parse(monster.data);

  // 4. Renderiza o Visualizador
  return <MonsterViewer initialData={monsterData} />;
}