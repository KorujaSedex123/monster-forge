"use client";
import { useRef, useState, useEffect } from "react"; // <--- Adicione useEffect
import { useFormContext } from "react-hook-form";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { 
  Download, Fingerprint, Printer, Disc, Save, FileJson, Box, Shield 
} from "lucide-react";
import { CocMonsterData } from "../types";

export default function CocSheet() {
  const { watch } = useFormContext<CocMonsterData>();
  const data = watch();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPrinterFriendly, setIsPrinterFriendly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // --- CORREÇÃO DO ERRO DE HIDRATAÇÃO ---
  // Inicializa com um valor estático (ex: "000") para servidor e cliente serem iguais no início
  const [caseFileId, setCaseFileId] = useState("000");

  useEffect(() => {
    // Gera o número aleatório apenas no cliente
    setCaseFileId(Math.floor(Math.random() * 1000).toString().padStart(3, '0'));
  }, []);
  // ---------------------------------------

  if (!data) return <div className="text-white p-4">Carregando Dossiê...</div>;

  // --- 1. GERAR PDF ---
  const handleDownloadPDF = async () => {
    if (!containerRef.current) return;
    setIsDownloading(true);
    try {
        const style = isPrinterFriendly ? { backgroundColor: 'white' } : {};
        const dataUrl = await toPng(containerRef.current, { 
            pixelRatio: 2, 
            style: { height: 'auto', maxHeight: 'none', overflow: 'visible', ...style } 
        });
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${data.name || "Dossie_Confidencial"}.pdf`);
    } catch (e) {
        console.error(e);
        alert("Erro ao gerar PDF");
    } finally {
        setIsDownloading(false);
    }
  };

  // --- 2. GERAR TOKEN ---
  const handleDownloadToken = () => {
    if (!data.imageUrl) return alert("Adicione uma foto ao arquivo para gerar o token.");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = data.imageUrl;
    img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size / 2) - (img.width / 2) * scale;
        const y = (size / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size / 2) - 10, 0, Math.PI * 2);
        ctx.lineWidth = 20;
        ctx.strokeStyle = "#4a5568"; 
        ctx.stroke();
        const link = document.createElement("a");
        link.download = `Token-${data.name || "Unknown"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };
  };

  // --- 3. EXPORTAR ---
  const handleExportJSON = (isVTT = false) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${data.name || "CallOfCthulhu_Data"}${isVTT ? "_VTT" : ""}.json`;
    link.click();
  };

  const handleSaveToDb = async () => {
      setIsSaving(true);
      try {
        const payload = { ...data, system: 'coc' };
        const response = await fetch('/api/monsters', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (response.ok) alert("Dossiê arquivado no sistema.");
        else throw new Error("Falha ao arquivar.");

      } catch (error) {
          console.error(error);
          alert("Erro de conexão com o arquivo.");
      } finally {
          setIsSaving(false);
      }
  };

  // --- ESTILOS ---
  const paperColor = isPrinterFriendly ? "white" : "#f0f0e0";
  const stampColor = isPrinterFriendly ? "black" : "#991b1b"; 
  const stampBorder = isPrinterFriendly ? "2px solid black" : "4px solid #991b1b";
  const photoStampBorder = isPrinterFriendly ? "2px solid black" : "2px solid #991b1b";
  const fontColor = "black";

  return (
    <div className="w-1/2 bg-stone-950 flex flex-col h-full border-l border-stone-800">
      
      {/* TOOLBAR */}
      <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
        <span className="text-stone-400 font-mono text-sm uppercase tracking-widest flex gap-2 items-center">
            <Fingerprint size={16} className="text-emerald-600"/> Arquivo #7E
        </span>
        <div className="flex gap-2">
            <button onClick={() => setIsPrinterFriendly(!isPrinterFriendly)} className={`flex items-center gap-2 text-xs px-3 py-1 rounded transition font-bold ${isPrinterFriendly ? "bg-white text-black hover:bg-gray-200" : "bg-stone-700 hover:bg-stone-600 text-stone-300"}`} title="Modo Impressão"><Printer size={14} /> {isPrinterFriendly ? "Tinta" : "Cor"}</button>
            <div className="w-px h-6 bg-stone-700 mx-1"></div>
            <button onClick={handleDownloadToken} className="flex items-center gap-2 text-xs bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1 rounded transition font-bold"><Disc size={14} /> Token</button>
            <button onClick={handleSaveToDb} disabled={isSaving} className="flex items-center gap-2 text-xs bg-blue-900 hover:bg-blue-800 disabled:bg-stone-700 text-white px-3 py-1 rounded transition font-bold">{isSaving ? "..." : <><Save size={14} /> Salvar</>}</button>
            <button onClick={() => handleExportJSON(false)} className="flex items-center gap-2 text-xs bg-purple-900 hover:bg-purple-800 text-white px-3 py-1 rounded transition font-bold"><FileJson size={14} /> JSON</button>
            <button onClick={() => handleExportJSON(true)} className="flex items-center gap-2 text-xs bg-orange-800 hover:bg-orange-700 text-white px-3 py-1 rounded transition font-bold" title="Exportar dados"><Box size={14} /> VTT</button>
            <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-2 text-xs bg-red-900 hover:bg-red-800 disabled:bg-stone-700 text-white px-3 py-1 rounded transition font-bold">{isDownloading ? "..." : <><Download size={14} /> PDF</>}</button>
        </div>
      </div>

      {/* ÁREA DO PAPEL */}
      <div className="flex-1 p-8 overflow-y-auto bg-stone-900/50 flex justify-center custom-scrollbar">
        <div ref={containerRef} className="w-min h-fit relative">
            <div 
                className="font-mono w-[800px] min-h-[1000px] p-10 shadow-2xl relative transition-colors duration-300"
                style={{ backgroundColor: paperColor, color: fontColor }}
            >
                
                {/* --- HEADER --- */}
                <div className="flex justify-between items-end border-b-2 border-black pb-6 mb-8 relative">
                    <div className="flex-1 pr-6 pt-10">
                        <h1 className="text-4xl font-bold uppercase tracking-tighter leading-none mb-2">{data.name || "DESCONHECIDO"}</h1>
                        <p className="italic text-sm text-stone-600 leading-relaxed text-justify">{data.description || "Nenhuma descrição disponível nos arquivos."}</p>
                    </div>

                    <div className="w-40 flex flex-col items-end shrink-0 relative">
                        {data.imageUrl ? (
                            <div className={`w-36 p-2 shadow-lg border transform transition-transform origin-bottom-right ${isPrinterFriendly ? 'rotate-0 border-black bg-white shadow-none' : 'rotate-2 border-stone-300 bg-white'}`}>
                                {!isPrinterFriendly && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-yellow-100/50 rotate-1 shadow-sm z-10 backdrop-blur-[1px]"></div>}
                                <div className="w-full h-32 bg-stone-900 overflow-hidden mb-2 relative border border-stone-200">
                                    <img src={data.imageUrl} className={`w-full h-full object-cover ${isPrinterFriendly ? 'grayscale contrast-125' : 'sepia-[.2]'}`} />
                                    <div className="absolute top-2 left-2 p-1 font-bold text-sm uppercase rotate-[-15deg] opacity-80 mask-grunge border-2 z-20 pointer-events-none" style={{ color: stampColor, borderColor: stampColor, border: photoStampBorder }}>
                                        CONFIDENCIAL
                                    </div>
                                </div>
                                <div className="text-center font-typewriter text-[10px] text-stone-600 uppercase tracking-widest border-t border-stone-200 pt-1">
                                    Fig. 1: Evidência
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 font-bold text-xl uppercase rotate-[-15deg] opacity-70 mask-grunge border-4 mt-8" style={{ color: stampColor, borderColor: stampColor, border: stampBorder }}>
                                CONFIDENCIAL
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid de Atributos */}
                <div className="grid grid-cols-8 gap-2 mb-6 text-center text-sm">
                    {[
                        { l: "STR", v: data.str }, { l: "CON", v: data.con }, { l: "SIZ", v: data.siz }, { l: "DEX", v: data.dex },
                        { l: "APP", v: data.app }, { l: "INT", v: data.int }, { l: "POW", v: data.pow }, { l: "EDU", v: data.edu }
                    ].map((attr) => (
                        <div key={attr.l} className="border border-black p-1 bg-white/50 flex flex-col justify-between h-16">
                            <div className="text-[10px] font-bold">{attr.l}</div>
                            <div className="font-bold text-xl">{attr.v}</div>
                            <div className="flex justify-center gap-1 text-[8px] text-stone-500 border-t border-black/20 pt-1">
                                <span>{Math.floor(attr.v / 2)}</span>/<span>{Math.floor(attr.v / 5)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status Derivados */}
                <div className="grid grid-cols-2 gap-8 mb-6 bg-black/5 p-4 border border-black/20">
                    <div className="space-y-1">
                        <div className="flex justify-between border-b border-stone-400 border-dotted"><span>HP (Pontos de Vida):</span> <b>{data.hp}</b></div>
                        <div className="flex justify-between border-b border-stone-400 border-dotted"><span>MP (Pontos de Magia):</span> <b>{data.mp}</b></div>
                        <div className="flex justify-between border-b border-stone-400 border-dotted"><span>MOV (Movimento):</span> <b>{data.move}</b></div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between border-b border-stone-400 border-dotted"><span>BUILD (Corpo):</span> <b>{data.build}</b></div>
                        <div className="flex justify-between border-b border-stone-400 border-dotted"><span>DB (Bônus de Dano):</span> <b>{data.db}</b></div>
                        <div className="flex justify-between border-b border-stone-400 border-dotted font-bold" style={{ color: isPrinterFriendly ? 'black' : '#991b1b' }}><span>Sanity Loss:</span> <b>{data.san_loss}</b></div>
                    </div>
                </div>

                {/* Combate */}
                <div className="mb-6">
                    <h3 className="font-bold border-b border-black mb-2 uppercase flex items-center gap-2"><Shield size={14}/> Combate & Defesa</h3>
                    <p className="text-sm mb-2 pl-2"><strong>Armadura:</strong> {data.armor || "Nenhuma."}</p>
                    <div className="space-y-2 pl-2">
                        {data.attacks?.map((atk, i) => (
                            <div key={i} className="text-sm border-l-2 border-stone-400 pl-2">
                                <span className="font-bold">{atk.name}</span> {atk.skill_level}% ({Math.floor(atk.skill_level/2)}/{Math.floor(atk.skill_level/5)}), dano {atk.damage}
                                {atk.desc && <span className="italic block text-xs text-stone-600">- {atk.desc}</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Perícias e Poderes */}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold border-b border-black mb-2 uppercase">Perícias</h3>
                        <ul className="text-sm list-disc pl-4 space-y-1">
                            {data.skills?.map((s, i) => (
                                <li key={i}>{s.name}: {s.value}%</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold border-b border-black mb-2 uppercase">Poderes Especiais</h3>
                        <div className="space-y-3 text-sm">
                            {data.special_powers?.map((p, i) => (
                                <div key={i} className="bg-black/5 p-2 border-l-2 border-black">
                                    <strong>{p.name}:</strong> <span className="text-stone-800">{p.desc}</span>
                                </div>
                            ))}
                            {data.spells && (
                                <div className="mt-4 pt-2 border-t border-stone-400 border-dotted">
                                    <strong className="block mb-1">Grimório:</strong> 
                                    <p className="italic text-xs leading-relaxed">{data.spells}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Rodapé com ID corrigido para evitar Hydration Error */}
                <div className="absolute bottom-4 right-4 text-[10px] text-stone-500 font-sans">
                    MONSTER FORGE - CASE FILE: {new Date().getFullYear()}-{caseFileId}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}