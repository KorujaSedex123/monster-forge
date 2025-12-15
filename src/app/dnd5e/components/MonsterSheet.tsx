"use client";
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { ScrollText, Download, Save, Shield } from "lucide-react";
import { MonsterData } from "../types";
import { getModFormatted, formatCR, getProficiency, getMod } from "../utils";

interface MonsterSheetProps {
  readOnly?: boolean;
  monsterId?: string; // <--- ONDE ESTAVA O PROBLEMA: Definido na interface
}

// O erro foi corrigido aqui, garantindo que 'monsterId' seja desestruturado
export default function MonsterSheet({ readOnly = false, monsterId }: MonsterSheetProps) {
  const { watch } = useFormContext<MonsterData>();
  const data = watch();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- FUNÇÃO DE DOWNLOAD EM PDF ---
  const handleDownloadPDF = async () => {
    if (containerRef.current === null) return;
    setIsDownloading(true);
    
    try {
      const canvasWidth = containerRef.current.offsetWidth;
      const canvasHeight = containerRef.current.scrollHeight;

      const dataUrl = await toPng(containerRef.current, { 
        pixelRatio: 2,
        cacheBust: true,
        width: canvasWidth,
        height: canvasHeight,
        style: { 
            height: 'auto', 
            maxHeight: 'none',
            overflow: 'visible' 
        }
      });

      const pdf = new jsPDF({
        orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasWidth, canvasHeight]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, canvasWidth, canvasHeight);
      pdf.save(`${data.name || "monstro"}.pdf`);

    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao criar o PDF. Tente uma imagem menos pesada.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- FUNÇÃO DE SALVAR INTELIGENTE (PUT/POST) ---
  const handleSaveToDb = async () => {
    setIsSaving(true);
    try {
      // DECISÃO: Se tem ID, é PUT (Atualizar). Se não, é POST (Criar).
      const method = monsterId ? 'PUT' : 'POST';
      const url = monsterId ? `/api/monsters/${monsterId}` : '/api/monsters';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert(monsterId 
          ? `"${data.name}" foi atualizado com sucesso!` 
          : `"${data.name}" foi salvo no Bestiário!`
        );
      } else {
        throw new Error("Falha na resposta");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const spellSaveDC = 8 + getProficiency(data.cr) + getMod(data[data.spell_ability]);
  const spellAtkBonus = getProficiency(data.cr) + getMod(data[data.spell_ability]);

  const fullPageBgUrl = "/paper-texture.jpg";

  // Estilos
  const pageStyle = {
    backgroundImage: `url('${fullPageBgUrl}')`,
    backgroundRepeat: 'repeat-y', 
    backgroundSize: '100% auto', 
    backgroundColor: '#d4c5a9', 
    boxShadow: 'inset 0 0 150px rgba(0,0,0,0.5)',
  };

  const imageContainerStyle = {
    maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
    backgroundImage: `radial-gradient(circle at center, rgba(30, 20, 10, 0.7) 0%, transparent 80%)`,
    mixBlendMode: "multiply" as const,
  };

  const imageStyle = {
    objectFit: "contain" as const,
    objectPosition: "bottom center",
    mixBlendMode: "multiply" as const,
    filter: "brightness(1.1) contrast(1.1)",
  };

  const loreText = data.lore && data.lore.trim() !== "" ? data.lore : "Escreva a história no editor...";

  return (
    <div className="w-1/2 bg-stone-950 flex flex-col font-sans h-full">
      
      {/* TOOLBAR */}
      <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center gap-2 justify-between shrink-0">
        <span className="font-bold text-lg text-stone-200 flex items-center gap-2">
          <ScrollText size={20} className="text-yellow-600" /> 
          {readOnly ? "Visualização" : "Ficha Final"}
        </span>
        
        <div className="flex gap-2">
            {!readOnly && (
                <button 
                    onClick={handleSaveToDb} 
                    disabled={isSaving}
                    className="flex items-center gap-2 text-xs bg-blue-800 hover:bg-blue-700 disabled:bg-stone-700 text-white px-3 py-1 rounded transition font-bold"
                >
                    {isSaving ? "Salvando..." : <><Save size={14} /> Salvar</>}
                </button>
            )}

            <button 
                onClick={handleDownloadPDF} 
                disabled={isDownloading}
                className="flex items-center gap-2 text-xs bg-red-800 hover:bg-red-700 disabled:bg-stone-700 text-white px-3 py-1 rounded transition font-bold"
            >
                {isDownloading ? "Gerando..." : <><Download size={14} /> PDF</>}
            </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-stone-900/50 flex justify-center custom-scrollbar">
        
        {/* CONTAINER DA FOLHA */}
        <div ref={containerRef} className="bg-transparent w-min h-fit relative">

            {/* A FOLHA */}
            <div 
                className="w-[800px] h-auto min-h-[1123px] relative shadow-2xl flex flex-col items-center pb-24 overflow-hidden rounded-sm"
                style={pageStyle}
            >
                {/* 1. ARTE */}
                <div 
                    className={`w-full relative z-0 shrink-0 ${data.imageUrl ? 'h-[500px]' : 'h-24'}`}
                    style={data.imageUrl ? imageContainerStyle : undefined}
                >
                    {data.imageUrl && (
                        <img 
                            src={data.imageUrl} 
                            className="w-full h-full opacity-100"
                            style={imageStyle}
                        />
                    )}
                </div>

                {/* 2. STAT BLOCK */}
                <div className="w-[85%] bg-[#FDF1DC] border-t-4 border-b-4 border-[#58180D] shadow-2xl p-8 font-sans text-[#58180D] relative z-10 -mt-16 mb-4 rounded-sm">
                     {/* Header */}
                    <h1 className="text-4xl font-bold font-serif uppercase tracking-wide leading-none">{data.name}</h1>
                    <p className="italic text-black text-base mb-4 mt-1">{data.size} {data.type}, {data.alignment}</p>
                    
                    <svg height="5" width="100%" className="my-2 fill-[#922610]"><rect width="100%" height="2" /></svg>
                    
                    <div className="text-[#922610] space-y-1 text-sm md:text-base">
                        <p><strong>Classe de Armadura</strong> {data.ac}</p>
                        <p><strong>Pontos de Vida</strong> {data.hp_avg} ({data.hp_formula})</p>
                        <p><strong>Deslocamento</strong> {data.speed}</p>
                    </div>
                    
                    <svg height="5" width="100%" className="my-2 fill-[#922610]"><rect width="100%" height="2" /></svg>
                    
                    <div className="flex justify-between text-[#922610] text-center px-4 py-2">
                        {(["str", "dex", "con", "int", "wis", "cha"] as const).map((stat) => (
                        <div key={stat} className="flex flex-col">
                            <span className="font-bold uppercase text-xs tracking-widest">{stat}</span>
                            <span className="text-base font-bold">{data[stat]} ({getModFormatted(Number(data[stat]))})</span>
                        </div>
                        ))}
                    </div>
                    
                    <svg height="5" width="100%" className="my-2 fill-[#922610]"><rect width="100%" height="2" /></svg>
                    
                    <div className="text-[#922610] space-y-1 mt-2 text-sm md:text-base mb-4">
                        <p><strong>Desafio</strong> {formatCR(data.cr)} <span className="text-black ml-1">({data.cr >= 0 ? `+${getProficiency(data.cr)}` : ""} proficiência)</span></p>
                    </div>

                    {/* Conteúdo Dinâmico */}
                    <div className="text-sm md:text-base text-black space-y-3 font-serif">
                         {data.traits && data.traits.map((trait, idx) => (
                            <div key={idx}>
                                <span className="font-bold italic text-[#58180D]">{trait.name}.</span> <span dangerouslySetInnerHTML={{ __html: trait.desc.replace(/\n/g, "<br/>") }}></span>
                            </div>
                         ))}

                        {data.is_spellcaster && (
                        <div>
                            <p className="mb-1"><strong>Conjuração.</strong> Nível {data.caster_level} ({data.spell_ability.toUpperCase()}). CD {spellSaveDC}, +{spellAtkBonus}.</p>
                            <div className="italic text-sm pl-2 border-l-2 border-[#58180D]/30">{data.spell_list_text}</div>
                        </div>
                        )}

                        {data.actions && data.actions.length > 0 && (
                        <div className="pt-2 border-t border-[#58180D]">
                            <h3 className="text-xl font-serif text-[#58180D] uppercase mb-2">Ações</h3>
                            <div className="space-y-2">
                                {data.actions.map((action, idx) => (
                                    <div key={idx}>
                                    <span className="font-bold italic text-[#58180D]">{action.name}.</span> <span dangerouslySetInnerHTML={{ __html: action.desc.replace(/\n/g, "<br/>") }}></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}

                        {data.is_legendary && data.legendary_actions && (
                        <div className="pt-2 border-t border-[#58180D]">
                            <h3 className="text-xl font-serif text-[#58180D] uppercase mb-2">Ações Lendárias</h3>
                            <div className="space-y-2">
                                {data.legendary_actions.map((action, idx) => (
                                    <div key={idx}>
                                    <span className="font-bold italic text-[#58180D]">{action.name}.</span> <span dangerouslySetInnerHTML={{ __html: action.desc.replace(/\n/g, "<br/>") }}></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* 3. RESUMO */}
                {data.show_lore && (
                    <div className="w-[85%] text-black font-serif text-lg leading-relaxed text-justify relative z-10 px-4 shrink-0 mt-6 bg-[#FDF1DC]/80 p-6 rounded-sm shadow-inner border border-[#58180D]/30 mb-8">
                        <h2 className="text-3xl font-bold text-[#58180D] uppercase mb-4 font-serif inline-block border-b-2 border-[#58180D] pb-2">
                            Sobre a Criatura
                        </h2>
                        
                        <div className="whitespace-pre-wrap">
                            <span className="first-letter:text-6xl first-letter:font-bold first-letter:text-[#58180D] first-letter:float-left first-letter:mr-2 first-letter:mt-[-5px]">
                                {loreText.charAt(0)}
                            </span>
                            {loreText.slice(1)}
                        </div>
                    </div>
                )}

                {/* MARCA D'ÁGUA NO RODAPÉ */}
                <div className="mt-auto text-center opacity-60 pb-8 flex flex-col items-center gap-2">
                    <svg height="10" width="100%" className="fill-[#58180D]"><circle cx="50%" cy="5" r="3" /></svg>
                    <div className="flex items-center gap-2 text-[#58180D] font-serif text-xs font-bold uppercase tracking-widest opacity-50 mix-blend-multiply">
                        <Shield size={12} />
                        Forjado em Forja de Lendas
                        <Shield size={12} />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}