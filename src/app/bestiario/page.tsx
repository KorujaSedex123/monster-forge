import Link from "next/link";
import { prisma } from "@/lib/db";
import { Sword, Scroll, Ghost, Skull, ArrowLeft } from "lucide-react";
import MonsterCard from "./components/MonsterCard";

export const dynamic = 'force-dynamic'; // Garante que a página sempre atualize

export default async function BestiarioPage() {
  // Busca todos os monstros
  const monsters = await prisma.monster.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans p-8">
      
      {/* Cabeçalho */}
      <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-400 flex items-center gap-3">
            <Scroll className="text-yellow-600" size={40} />
            Bestiário Infinito
          </h1>
          <p className="text-stone-500 mt-2">
            Todas as lendas forjadas, de todos os mundos.
          </p>
        </div>
        
        <Link 
          href="/" 
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded text-sm font-bold transition flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Voltar para a Home
        </Link>
      </div>

      {/* Grid de Monstros */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {monsters.length === 0 ? (
          <div className="col-span-full text-center py-20 text-stone-600">
            <Ghost size={64} className="mx-auto mb-4 opacity-20"/>
            <p>O grimório está vazio... Vá criar alguns monstros!</p>
            <Link href="/dnd5e" className="text-yellow-600 hover:underline mt-2 block">
                Criar primeiro monstro
            </Link>
          </div>
        ) : (
          monsters.map((monster) => (
           <MonsterCard key={monster.id} monster={monster} />
          ))
        )}

      </div>
    </div>
  );
}