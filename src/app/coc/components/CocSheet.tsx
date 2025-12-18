"use client";
import { useRef, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { 
  Download, Fingerprint, Printer, Disc, Save, FileJson, Box, Shield 
} from "lucide-react";
import { CocMonsterData } from "../types";
import { convertCocToFoundry } from "../cocAdapter";
import { toast } from "sonner";

export default function CocSheet() {
  const { watch } = useFormContext<CocMonsterData>();
  const data = watch();
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados de controle
  const [isPrinterFriendly, setIsPrinterFriendly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [caseId, setCaseId] = useState("000");

  // Evita erro de hidratação no ID aleatório
  useEffect(() => setCaseId(Math.floor(Math.random() * 1000).toString().padStart(3, '0')), []);

  if (!data) return <div className="text-white p-4">Carregando Dossiê...</div>;

  // --- EXPORTAÇÃO PDF ---
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
        toast.error("Erro ao gerar PDF");
    } finally {
        setIsDownloading(false);
    }
  };

  // --- TOKEN ---
  const handleDownloadToken = () => {
    if (!data.imageUrl) return toast.warning("Adicione uma foto para gerar o token.");
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
        ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        const scale = Math.max(size / img.width, size / img.height);
        ctx.drawImage(img, (size/2)-(img.width/2)*scale, (size/2)-(img.height/2)*scale, img.width*scale, img.height*scale);
        ctx.beginPath(); ctx.arc(size / 2, size / 2, (size/2)-10, 0, Math.PI * 2); ctx.lineWidth = 20; ctx.strokeStyle = "#4a5568"; ctx.stroke();
        const link = document.createElement("a");
        link.download = `Token-${data.name || "Unknown"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };
  };

  // --- EXPORTAÇÃO JSON / FOUNDRY ---
  const handleExportJSON = (isVTT = false) => {
    let dataToExport = data;
    let fileName = `${data.name || "Coc_Entity"}.json`;

    if (isVTT) {
        dataToExport = convertCocToFoundry(data) as any;
        fileName = `fvtt-Actor-${data.name?.replace(/\s+/g, "_") || "Entity"}.json`;
    }

    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = fileName;
    link.click();
  };

  // --- SALVAR BANCO ---
  const handleSaveToDb = async () => {
      setIsSaving(true);
      try {
        const payload = { ...data, system: 'coc' };
        const res = await fetch('/api/monsters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) toast.success("Dossiê arquivado.");
        else throw new Error("Falha");
      } catch (error) { toast.error("Erro ao salvar."); } 
      finally { setIsSaving(false); }
  };

  // --- ESTILOS VISUAIS ---
  const paperColor = isPrinterFriendly ? "white" : "#f0f0e0";
  const stampColor = isPrinterFriendly ? "black" : "#991b1b"; 
  const stampBorder = isPrinterFriendly ? "2px solid black" : "4px solid #991b1b";

  return (
    <div className="w-1/2 bg-stone-950 flex flex-col h-full border-l border-stone-800">
      <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
        <span className="text-stone-400 font-mono text-sm uppercase tracking-widest flex gap-2 items-center"><Fingerprint size={16} className="text-emerald-600"/> Arquivo #7E</span>
        <div className="flex gap-2">
            <button onClick={() => setIsPrinterFriendly(!isPrinterFriendly)} className={`btn-tool ${isPrinterFriendly ? "bg-white text-black" : "bg-stone-700 text-stone-300"}`} title="Modo Impressão"><Printer size={14} /></button>
            <div className="w-px h-6 bg-stone-700 mx-1"></div>
            <button onClick={handleDownloadToken} className="btn-tool bg-emerald-800 hover:bg-emerald-700 text-white"><Disc size={14} /></button>
            <button onClick={handleSaveToDb} disabled={isSaving} className="btn-tool bg-blue-900 hover:bg-blue-800 text-white"><Save size={14} /></button>
            <button onClick={() => handleExportJSON(false)} className="btn-tool bg-purple-900 hover:bg-purple-800 text-white"><FileJson size={14} /></button>
            <button onClick={() => handleExportJSON(true)} className="btn-tool bg-orange-800 hover:bg-orange-700 text-white"><Box size={14} /></button>
            <button onClick={handleDownloadPDF} disabled={isDownloading} className="btn-tool bg-red-900 hover:bg-red-800 text-white"><Download size={14} /></button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-stone-900/50 flex justify-center custom-scrollbar">
        <div ref={containerRef} className="w-min h-fit relative">
            <div className="font-mono w-[800px] min-h-[1000px] p-10 shadow-2xl relative transition-colors duration-300" style={{ backgroundColor: paperColor, color: "black" }}>
                
                {/* Header com Foto Flex */}
                <div className="flex justify-between items-end border-b-2 border-black pb-6 mb-8 relative">
                    <div className="flex-1 pr-6 pt-10">
                        <h1 className="text-4xl font-bold uppercase tracking-tighter leading-none mb-2">{data.name || "DESCONHECIDO"}</h1>
                        <p className="italic text-sm text-stone-600 leading-relaxed text-justify">{data.description || "Nenhuma descrição disponível."}</p>
                    </div>
                    <div className="w-40 flex flex-col items-end shrink-0 relative">
                        {data.imageUrl ? (
                            <div className={`w-36 p-2 shadow-lg border transform transition-transform origin-bottom-right ${isPrinterFriendly ? 'rotate-0 border-black bg-white shadow-none' : 'rotate-2 border-stone-300 bg-white'}`}>
                                {!isPrinterFriendly && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-yellow-100/50 rotate-1 shadow-sm z-10 backdrop-blur-[1px]"></div>}
                                <div className="w-full h-32 bg-stone-900 overflow-hidden mb-2 relative border border-stone-200">
                                    <img src={data.imageUrl} className={`w-full h-full object-cover ${isPrinterFriendly ? 'grayscale contrast-125' : 'sepia-[.2]'}`} />
                                    <div className="absolute top-2 left-2 p-1 font-bold text-sm uppercase rotate-[-15deg] opacity-80 mask-grunge border-2 z-20 pointer-events-none" style={{ color: stampColor, borderColor: stampColor, border: isPrinterFriendly ? "2px solid black" : "2px solid #991b1b" }}>CONFIDENCIAL</div>
                                </div>
                                <div className="text-center font-typewriter text-[10px] text-stone-600 uppercase tracking-widest border-t border-stone-200 pt-1">Fig. 1: Evidência</div>
                            </div>
                        ) : (
                            <div className="p-2 font-bold text-xl uppercase rotate-[-15deg] opacity-70 mask-grunge border-4 mt-8" style={{ color: stampColor, borderColor: stampColor, border: stampBorder }}>CONFIDENCIAL</div>
                        )}
                    </div>
                </div>

                {/* Grid Atributos */}
                <div className="grid grid-cols-8 gap-2 mb-6 text-center text-sm">
                    {[{l:"STR",v:data.str},{l:"CON",v:data.con},{l:"SIZ",v:data.siz},{l:"DEX",v:data.dex},{l:"APP",v:data.app},{l:"INT",v:data.int},{l:"POW",v:data.pow},{l:"EDU",v:data.edu}].map((a)=>(
                        <div key={a.l} className="border border-black p-1 bg-white/50 flex flex-col justify-between h-16"><div className="text-[10px] font-bold">{a.l}</div><div className="font-bold text-xl">{a.v}</div><div className="flex justify-center gap-1 text-[8px] text-stone-500 border-t border-black/20 pt-1"><span>{Math.floor(a.v/2)}</span>/<span>{Math.floor(a.v/5)}</span></div></div>
                    ))}
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-8 mb-6 bg-black/5 p-4 border border-black/20">
                    <div className="space-y-1 text-sm border-r border-black/10 pr-4">
                        <div className="flex justify-between border-b border-black/20 border-dotted"><span>HP:</span> <b>{data.hp}</b></div>
                        <div className="flex justify-between border-b border-black/20 border-dotted"><span>MP:</span> <b>{data.mp}</b></div>
                        <div className="flex justify-between border-b border-black/20 border-dotted"><span>MOV:</span> <b>{data.move}</b></div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between border-b border-black/20 border-dotted"><span>BUILD:</span> <b>{data.build}</b></div>
                        <div className="flex justify-between border-b border-black/20 border-dotted"><span>DB:</span> <b>{data.db}</b></div>
                        <div className="flex justify-between border-b border-black/20 border-dotted font-bold" style={{ color: isPrinterFriendly ? 'black' : '#991b1b' }}><span>SAN LOSS:</span> <b>{data.san_loss}</b></div>
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

                {/* Rodapé */}
                <div className="absolute bottom-4 right-4 text-[10px] text-stone-500 font-sans">MONSTER FORGE - CASE FILE: {new Date().getFullYear()}-{caseId}</div>
            </div>
        </div>
      </div>
      <style jsx>{`
        .btn-tool { @apply flex items-center gap-2 text-xs px-3 py-1 rounded transition font-bold; }
      `}</style>
    </div>
  );
}