import Link from "next/link";
import { Sword, Skull, Scroll, Shield, Hammer, Book } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans selection:bg-red-900 selection:text-white flex flex-col">
      
      {/* Hero Section / Cabeçalho */}
      <div className="py-24 text-center space-y-6 px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-800 via-stone-950 to-stone-950">
        <div className="inline-block p-4 rounded-full bg-stone-900 border border-stone-800 mb-4 shadow-2xl animate-in fade-in zoom-in duration-700">
          <Skull className="w-16 h-16 text-red-600 mx-auto" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-stone-100 to-stone-600">
          Forja de Lendas
        </h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed">
          O grimório digital definitivo para Mestres de RPG. <br/>
          Crie monstros, NPCs e vilões com visual de livro oficial em segundos.
        </p>

        {/* --- NOVO: BOTÃO DO BESTIÁRIO --- */}
        <div className="pt-4 flex justify-center animate-in fade-in slide-in-from-bottom-4 delay-200">
            <Link 
                href="/bestiario" 
                className="group flex items-center gap-3 px-8 py-3 bg-stone-900 border border-stone-700 rounded-full hover:bg-stone-800 hover:border-yellow-600 transition-all text-stone-300 font-bold shadow-lg hover:shadow-yellow-900/20"
            >
                <Book size={20} className="text-yellow-600 group-hover:text-yellow-400 transition-colors"/>
                <span>Abrir Bestiário</span>
                <span className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">→</span>
            </Link>
        </div>
      </div>

      {/* Grid de Sistemas */}
      <div className="flex-1 max-w-6xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* CARD 1: D&D 5E (ATIVO) */}
          <Link href="/dnd5e" className="group relative block h-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl opacity-20 group-hover:opacity-100 transition duration-500 blur"></div>
            <div className="relative h-full bg-stone-900 border border-stone-800 rounded-xl p-8 flex flex-col items-start gap-4 hover:bg-stone-800/80 transition shadow-xl">
              <div className="p-3 bg-red-900/20 rounded-lg text-red-500 mb-2">
                <Sword size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-red-400 transition">D&D 5ª Edição</h2>
                <p className="text-stone-400 mt-3 text-sm leading-relaxed">
                  A forja clássica. Calcule ND (CR) automaticamente, ajuste atributos e exporte fichas no estilo oficial do Monster Manual.
                </p>
              </div>
              <div className="mt-auto pt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500 group-hover:text-white transition">
                Entrar na Forja <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* CARD 2: TORMENTA 20 (EM BREVE) */}
          <div className="group relative opacity-50 cursor-not-allowed h-full">
            <div className="relative h-full bg-stone-900 border border-stone-800 rounded-xl p-8 flex flex-col items-start gap-4">
              <div className="p-3 bg-purple-900/20 rounded-lg text-purple-500 mb-2">
                <Shield size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-300">Tormenta 20</h2>
                <p className="text-stone-500 mt-3 text-sm leading-relaxed">
                  O maior RPG do Brasil. Fichas adaptadas para o sistema de perícias e ameaças de Arton.
                </p>
              </div>
              <div className="mt-auto pt-6 inline-block">
                <span className="px-2 py-1 rounded bg-stone-800 text-[10px] uppercase font-bold text-stone-500 border border-stone-700">Em Desenvolvimento</span>
              </div>
            </div>
          </div>

          {/* CARD 3: PATHFINDER (EM BREVE) */}
          <div className="group relative opacity-50 cursor-not-allowed h-full">
            <div className="relative h-full bg-stone-900 border border-stone-800 rounded-xl p-8 flex flex-col items-start gap-4">
              <div className="p-3 bg-blue-900/20 rounded-lg text-blue-500 mb-2">
                <Scroll size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-300">Pathfinder 2e</h2>
                <p className="text-stone-500 mt-3 text-sm leading-relaxed">
                  Sistema robusto com cálculo de níveis e proficiências complexas automatizadas.
                </p>
              </div>
              <div className="mt-auto pt-6 inline-block">
                <span className="px-2 py-1 rounded bg-stone-800 text-[10px] uppercase font-bold text-stone-500 border border-stone-700">Em Breve</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer simples */}
      <div className="text-center text-stone-600 text-sm pb-8 border-t border-stone-900 pt-8 flex flex-col items-center gap-2">
        <Hammer size={16} className="text-stone-700"/>
        <p>Forjado por Mestre Gem & Você</p>
      </div>
    </div>
  );
}