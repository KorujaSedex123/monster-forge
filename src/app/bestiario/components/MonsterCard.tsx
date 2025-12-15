"use client";
import Link from "next/link";
import { Skull, Trash2, Eye, Pencil } from "lucide-react"; // Importe Pencil
import { useRouter } from "next/navigation";

interface MonsterCardProps {
  monster: any;
}

export default function MonsterCard({ monster }: MonsterCardProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja banir "${monster.name}"?`)) return;
    try {
      await fetch(`/api/monsters/${monster.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) {
      alert("Erro ao deletar.");
    }
  };

  return (
    <div className="group bg-stone-900 border border-stone-800 rounded-xl overflow-hidden hover:border-yellow-600/50 transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col">
      {/* ... Imagem e Badge ... */}
      <div className="h-48 w-full bg-stone-950 relative overflow-hidden">
        {monster.imageUrl ? (
          <img 
            src={monster.imageUrl} 
            alt={monster.name} 
            className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-900 text-stone-700">
            <Skull size={48} />
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur text-[10px] font-bold uppercase rounded text-stone-300 border border-stone-700">
          {monster.system || "RPG"}
        </div>
      </div>

      {/* Corpo */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-stone-100 group-hover:text-yellow-500 transition line-clamp-1">
            {monster.name}
          </h2>
          <span className="text-xs font-bold bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900/50">
            CR {monster.cr}
          </span>
        </div>
        
        <p className="text-xs text-stone-500 italic mb-4">
          {monster.size} {monster.type}, {monster.alignment}
        </p>

        {/* --- BOTÕES DE AÇÃO --- */}
        <div className="mt-auto pt-4 border-t border-stone-800 flex gap-2">
          
          {/* 1. VER (Leitura) */}
          <Link 
            href={`/bestiario/${monster.id}`} 
            className="flex-1 text-xs bg-stone-800 hover:bg-stone-700 py-2 rounded font-bold transition text-center text-stone-300 hover:text-white flex items-center justify-center gap-2"
            title="Ver Ficha"
          >
            <Eye size={14}/>
          </Link>

          {/* 2. EDITAR (Novo) */}
          {/* Note o link: /dnd5e/ID_DO_MONSTRO */}
          <Link
            href={`/dnd5e/${monster.id}`}
            className="px-3 py-2 bg-stone-800 hover:bg-blue-900/50 text-stone-500 hover:text-blue-400 rounded transition flex items-center justify-center"
            title="Editar Monstro"
          >
            <Pencil size={14} />
          </Link>
          
          {/* 3. EXCLUIR */}
          <button 
            onClick={handleDelete}
            className="px-3 py-2 bg-stone-800 hover:bg-red-900/50 text-stone-500 hover:text-red-400 rounded transition flex items-center justify-center"
            title="Excluir Monstro"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}