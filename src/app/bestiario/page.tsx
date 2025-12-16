"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Sword, Skull, Search, Ghost } from "lucide-react";
import MonsterCard from "./components/MonsterCard";

export default function BestiaryPage() {
  const [monsters, setMonsters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'dnd' | 'coc'>('all');
  const [search, setSearch] = useState("");

  // --- CARREGAR MONSTROS ---
  const fetchMonsters = async () => {
    try {
      const res = await fetch("/api/monsters");
      if (res.ok) {
        const data = await res.json();
        // Garante que é um array, mesmo se a API retornar objeto
        const list = Array.isArray(data) ? data : [];
        setMonsters(list.reverse()); // Mais recentes primeiro
      }
    } catch (error) {
      console.error("Erro ao buscar bestiário:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonsters();
  }, []);

  // --- DELETAR ---
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar esta criatura?")) return;
    try {
        await fetch(`/api/monsters?id=${id}`, { method: 'DELETE' });
        setMonsters(prev => prev.filter(m => (m.id || m._id) !== id));
    } catch (e) {
        alert("Erro ao deletar");
    }
  };

  // --- FILTRAGEM ---
  const filteredMonsters = monsters.filter(m => {
    const isCoc = m.system === 'coc' || !!m.san_loss;
    const isDnd = !isCoc;
    
    // Filtro de Sistema
    if (filter === 'dnd' && !isDnd) return false;
    if (filter === 'coc' && !isCoc) return false;

    // Filtro de Texto
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      
      {/* HEADER */}
      <div className="bg-stone-900 border-b border-stone-800 p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-stone-800 rounded-full hover:bg-stone-700 transition"><ArrowLeft size={20}/></Link>
                <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="text-yellow-600"/> Bestiário</h1>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar criatura..." 
                    className="w-full bg-stone-950 border border-stone-800 rounded-full py-2 pl-10 pr-4 text-stone-300 focus:border-yellow-600 outline-none transition"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-6xl mx-auto p-6">
        
        {/* ABAS DE FILTRO */}
        <div className="flex gap-4 mb-8 justify-center">
            <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 ${filter === 'all' ? "bg-stone-200 text-black" : "bg-stone-800 text-stone-400 hover:bg-stone-700"}`}
            >
                <Ghost size={16}/> Todos
            </button>
            <button 
                onClick={() => setFilter('dnd')}
                className={`px-4 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 ${filter === 'dnd' ? "bg-red-900 text-white" : "bg-stone-800 text-stone-400 hover:bg-stone-700"}`}
            >
                <Sword size={16}/> D&D 5e
            </button>
            <button 
                onClick={() => setFilter('coc')}
                className={`px-4 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 ${filter === 'coc' ? "bg-emerald-900 text-white" : "bg-stone-800 text-stone-400 hover:bg-stone-700"}`}
            >
                <Skull size={16}/> Cthulhu
            </button>
        </div>

        {/* LISTA VAZIA */}
        {!loading && filteredMonsters.length === 0 && (
            <div className="text-center py-20 opacity-50">
                <Ghost size={64} className="mx-auto mb-4 text-stone-600"/>
                <p className="text-xl font-bold text-stone-500">Nenhuma criatura encontrada.</p>
                <p className="text-sm text-stone-600">Vá para a Forja e crie seus pesadelos.</p>
            </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMonsters.map((monster, idx) => (
                <MonsterCard 
                    key={monster.id || monster._id || idx} 
                    monster={monster} 
                    onDelete={handleDelete} 
                />
            ))}
        </div>
      </div>
    </div>
  );
}