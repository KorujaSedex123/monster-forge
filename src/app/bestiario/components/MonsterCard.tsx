"use client";
import Link from "next/link";
import { Sword, Skull, Trash2, Edit } from "lucide-react";

interface MonsterCardProps {
  monster: any;
  onDelete: (id: string) => void;
}

export default function MonsterCard({ monster, onDelete }: MonsterCardProps) {
  // Detecta o sistema baseado nos campos (CoC tem san_loss, D&D tem cr)
  const isCoc = monster.system === 'coc' || !!monster.san_loss;
  const isDnd = !isCoc;

  // --- CONFIGURAÇÃO VISUAL D&D ---
  if (isDnd) {
    return (
      <div className="group relative bg-[#1c1917] border border-stone-800 hover:border-red-900 rounded-lg overflow-hidden transition-all hover:shadow-lg hover:shadow-red-900/20">
        <div className="h-32 bg-stone-900 relative overflow-hidden">
          {monster.imageUrl ? (
            <img src={monster.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-800">
                <Sword className="text-stone-700" size={48} />
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-red-500 border border-red-900/50">
            CR {monster.cr}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-xl font-bold text-stone-200 truncate">{monster.name}</h3>
          <p className="text-xs text-stone-500 italic mb-3">{monster.size} {monster.type}, {monster.alignment}</p>
          
          <div className="flex justify-between items-center text-sm text-stone-400 border-t border-stone-800 pt-2">
            <span>AC: <b className="text-white">{monster.ac}</b></span>
            <span>HP: <b className="text-white">{monster.hp_avg}</b></span>
          </div>
        </div>

        {/* Ações */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Link href={`/dnd5e?id=${monster.id || monster._id}`} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500"><Edit size={14}/></Link>
            <button onClick={() => onDelete(monster.id || monster._id)} className="p-2 bg-red-600 text-white rounded hover:bg-red-500"><Trash2 size={14}/></button>
        </div>
      </div>
    );
  }

  // --- CONFIGURAÇÃO VISUAL CALL OF CTHULHU ---
  return (
    <div className="group relative bg-[#0c1311] border border-emerald-900/30 hover:border-emerald-500/50 rounded-sm overflow-hidden transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] font-mono">
        {/* Carimbo Topo */}
        <div className="absolute -top-3 -right-8 bg-emerald-900/20 w-32 h-10 rotate-45 transform pointer-events-none"></div>

        <div className="h-32 bg-[#050a08] relative overflow-hidden border-b border-emerald-900/30">
          {monster.imageUrl ? (
            <img src={monster.imageUrl} className="w-full h-full object-cover grayscale contrast-125 opacity-50 group-hover:opacity-80 transition-opacity" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#070e0b]">
                <Skull className="text-emerald-900" size={48} />
            </div>
          )}
          <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-sm px-3 py-1 border-t border-emerald-900/30 flex justify-between items-center">
             <span className="text-[10px] text-emerald-500 uppercase tracking-widest">Arquivo #7E</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold text-emerald-100 truncate uppercase tracking-tighter">{monster.name}</h3>
          <p className="text-xs text-emerald-700/80 mb-4 line-clamp-1">{monster.description || "Sem descrição."}</p>
          
          <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-emerald-900/30 pt-3">
            <div className="bg-emerald-900/10 rounded p-1">
                <span className="block text-emerald-700 text-[9px]">STR</span>
                <span className="font-bold text-emerald-200">{monster.str}</span>
            </div>
            <div className="bg-emerald-900/10 rounded p-1">
                <span className="block text-emerald-700 text-[9px]">SAN</span>
                <span className="font-bold text-red-400">{monster.san_loss || "N/A"}</span>
            </div>
            <div className="bg-emerald-900/10 rounded p-1">
                <span className="block text-emerald-700 text-[9px]">HP</span>
                <span className="font-bold text-emerald-200">{monster.hp}</span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            {/* Nota: Adicione a lógica de edição para CoC na rota /coc se desejar depois */}
            <Link href={`/coc?id=${monster.id || monster._id}`} className="p-2 bg-emerald-700 text-white rounded-sm hover:bg-emerald-600"><Edit size={14}/></Link>
            <button onClick={() => onDelete(monster.id || monster._id)} className="p-2 bg-red-900/80 text-white rounded-sm hover:bg-red-800"><Trash2 size={14}/></button>
        </div>
    </div>
  );
}