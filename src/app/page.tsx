import Link from "next/link";
import { Sword, Fingerprint, ArrowRight, Skull, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
           style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
      </div>

      <div className="z-10 text-center mb-12 space-y-6">
        <div>
            <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-r from-stone-200 to-stone-500 bg-clip-text text-transparent">
            MONSTER FORGE
            </h1>
            <p className="text-stone-400 max-w-lg mx-auto mt-2">
            Forje criaturas, vilões e horrores indescritíveis assistidos por Inteligência Artificial.
            </p>
        </div>

        {/* BOTÃO DO BESTIÁRIO */}
        <div>
            <Link 
                href="/bestiario" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-full font-bold transition-all border border-stone-700 hover:border-yellow-600/50 hover:shadow-[0_0_20px_rgba(202,138,4,0.1)]"
            >
                <BookOpen size={18} className="text-yellow-600"/> 
                Acessar Bestiário
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full z-10">
        
        {/* CARD D&D 5E */}
        <Link href="/dnd5e" className="group relative bg-[#121212] border border-stone-800 hover:border-red-600/50 rounded-2xl p-10 transition-all hover:shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sword size={120} />
           </div>
           
           <div className="relative z-10">
             <div className="w-16 h-16 bg-red-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600/20 transition-colors">
                <Sword size={32} className="text-red-500" />
             </div>
             
             <h2 className="text-3xl font-bold mb-3 text-stone-100 group-hover:text-red-400 transition-colors">Dungeons & Dragons</h2>
             <p className="text-stone-500 text-sm leading-relaxed mb-8">
               Crie monstros de fantasia épica. Fichas estilo pergaminho, exportação para Foundry VTT e Tokens.
             </p>

             <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 group-hover:translate-x-2 transition-transform">
               Acessar Forja <ArrowRight size={14} />
             </span>
           </div>
        </Link>

        {/* CARD CALL OF CTHULHU */}
        <Link href="/coc" className="group relative bg-[#121212] border border-stone-800 hover:border-emerald-600/50 rounded-2xl p-10 transition-all hover:shadow-[0_0_50px_rgba(5,150,105,0.2)] overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Fingerprint size={120} />
           </div>
           
           <div className="relative z-10">
             <div className="w-16 h-16 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600/20 transition-colors">
                <Skull size={32} className="text-emerald-500" />
             </div>
             
             <h2 className="text-3xl font-bold mb-3 text-stone-100 group-hover:text-emerald-400 transition-colors">Call of Cthulhu</h2>
             <p className="text-stone-500 text-sm leading-relaxed mb-8">
               Arquivos confidenciais de horror cósmico. Fichas estilo dossiê investigativo com sanidade e loucura.
             </p>

             <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500 group-hover:translate-x-2 transition-transform">
               Abrir Arquivo <ArrowRight size={14} />
             </span>
           </div>
        </Link>

      </div>
      
      <div className="mt-16 text-stone-600 text-xs font-mono">
        v2.5 • Powered by Next.js & Llama 3
      </div>
    </main>
  );
}