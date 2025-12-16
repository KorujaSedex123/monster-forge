"use client";
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { ScrollText, Download, Save, Shield, FileJson, Box, Printer, CircleUser } from "lucide-react";
import { MonsterData } from "../types";
import { getModFormatted, formatCR, getProficiency, getMod } from "../utils";
import { convertToFoundry } from "../foundryAdapter";
import RichText from "./RichText";

interface MonsterSheetProps {
  readOnly?: boolean;
  monsterId?: string;
  data?: MonsterData; // Permite passar dados diretamente (para visualização sem formulário)
}

export default function MonsterSheet({ readOnly = false, monsterId, data: propData }: MonsterSheetProps) {
  // Tenta pegar do contexto do formulário, mas aceita props diretas
  const formContext = useFormContext<MonsterData>();
  const data = propData || (formContext ? formContext.watch() : null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- ESTADO: MODO DE IMPRESSÃO ---
  const [isPrinterFriendly, setIsPrinterFriendly] = useState(false);

  if (!data) return <div className="text-white p-4">Carregando ficha...</div>;

  // --- GERADOR DE TOKEN ---
  const handleDownloadToken = () => {
    if (!data.imageUrl) {
      alert("Adicione uma imagem primeiro para gerar o token.");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Tamanho do Token (512x512 é um bom padrão para VTT)
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Necessário para evitar tainted canvas
    img.src = data.imageUrl;

    img.onload = () => {
      // 1. Limpa
      ctx.clearRect(0, 0, size, size);

      // 2. Cria a máscara circular
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // 3. Desenha a imagem da criatura (ajustada para cobrir o círculo)
      // Cálculo simples de "object-fit: cover"
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size / 2) - (img.width / 2) * scale;
      const y = (size / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // 4. Desenha uma borda (Aro)
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, (size / 2) - 10, 0, Math.PI * 2);
      ctx.lineWidth = 20;
      ctx.strokeStyle = "#daa520"; // Dourado (Goldenrod)
      ctx.stroke();

      // Borda interna fina para acabamento
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, (size / 2) - 20, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#5e4b18"; // Dourado escuro
      ctx.stroke();

      // 5. Baixa a imagem
      const link = document.createElement("a");
      link.download = `Token-${data.name || "Monstro"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  };

  // --- DOWNLOAD PDF ---
  const handleDownloadPDF = async () => {
    if (containerRef.current === null) return;
    setIsDownloading(true);
    try {
      const canvasWidth = containerRef.current.offsetWidth;
      const canvasHeight = containerRef.current.scrollHeight;

      // Força fundo branco se estiver no modo printer friendly para o PDF ficar limpo
      const style = isPrinterFriendly ? { backgroundColor: 'white' } : {};

      const dataUrl = await toPng(containerRef.current, {
        pixelRatio: 2, cacheBust: true, width: canvasWidth, height: canvasHeight,
        style: { height: 'auto', maxHeight: 'none', overflow: 'visible', ...style }
      });

      const pdf = new jsPDF({ orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait', unit: 'px', format: [canvasWidth, canvasHeight] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, canvasWidth, canvasHeight);
      pdf.save(`${data.name || "monstro"}.pdf`);
    } catch (err) { console.error(err); alert("Erro ao criar PDF."); } finally { setIsDownloading(false); }
  };

  // --- EXPORTAR JSON (BACKUP) ---
  const handleExportJSON = () => {
    const exportData = { ...data, full_data: data };
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${data.name || "monstro"}.json`;
    link.click();
  };

  // --- EXPORTAR PARA FOUNDRY VTT ---
  const handleExportFoundry = () => {
    const foundryData = convertToFoundry(data);
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(foundryData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    // Padrão de nome sugerido para Foundry
    link.download = `fvtt-Actor-${data.name?.replace(/\s+/g, "_") || "Monstro"}.json`;
    link.click();
  };

  // --- SALVAR NO BANCO DE DADOS ---
  const handleSaveToDb = async () => {
    setIsSaving(true);
    try {
      const method = monsterId ? 'PUT' : 'POST';
      const url = monsterId ? `/api/monsters/${monsterId}` : '/api/monsters';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) alert(monsterId ? "Atualizado com sucesso!" : "Salvo no Bestiário!");
      else throw new Error("Falha ao salvar");

    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- CÁLCULOS SEGUROS (Evita NaN na renderização) ---
  const safeSpellAttr = Number(data[data.spell_ability]) || 10;
  const spellMod = Math.floor((safeSpellAttr - 10) / 2);
  const safeProficiency = getProficiency(data.cr) || 2;
  const spellSaveDC = 8 + safeProficiency + spellMod;
  const spellAtkBonus = safeProficiency + spellMod;

  const loreText = data.lore && data.lore.trim() !== "" ? data.lore : "Ainda sem história registrada.";

  // --- ESTILOS DINÂMICOS (TEMAS) ---
  const mainColor = isPrinterFriendly ? "black" : "#58180D";   // Cor do Texto Principal / Bordas
  const accentColor = isPrinterFriendly ? "black" : "#922610"; // Cor dos Atributos
  const bgColor = isPrinterFriendly ? "white" : "#FDF1DC";     // Cor do Fundo do Papel
  const borderColor = isPrinterFriendly ? "black" : "#58180D"; // Cor das Linhas

  return (
    <div className="w-1/2 bg-stone-950 flex flex-col font-sans h-full border-l border-stone-800">

      {/* TOOLBAR */}
      <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center gap-2 justify-between shrink-0">
        <span className="font-bold text-lg text-stone-200 flex items-center gap-2">
          <ScrollText size={20} className="text-yellow-600" />
          {readOnly ? "Visualização" : "Ficha Final"}
        </span>

        <div className="flex gap-2">
          {/* BOTÃO MODO IMPRESSÃO */}
          <button
            onClick={() => setIsPrinterFriendly(!isPrinterFriendly)}
            className={`flex items-center gap-2 text-xs px-3 py-1 rounded transition font-bold ${isPrinterFriendly ? "bg-white text-black hover:bg-gray-200" : "bg-stone-700 hover:bg-stone-600 text-white"}`}
            title="Alternar Modo de Impressão (Economia de Tinta)"
          >
            <Printer size={14} /> {isPrinterFriendly ? "Modo Tinta" : "Modo Cor"}
          </button>

          <div className="w-px h-6 bg-stone-700 mx-1"></div>
          <button onClick={handleDownloadToken} className="flex items-center gap-2 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded transition font-bold" title="Gerar Token Redondo">
            <CircleUser size={14} /> Token
          </button>
          {!readOnly && (
            <>
              <button onClick={handleSaveToDb} disabled={isSaving} className="flex items-center gap-2 text-xs bg-blue-800 hover:bg-blue-700 disabled:bg-stone-700 text-white px-3 py-1 rounded transition font-bold">
                {isSaving ? "..." : <><Save size={14} /> Salvar</>}
              </button>
              <button onClick={handleExportJSON} className="flex items-center gap-2 text-xs bg-purple-800 hover:bg-purple-700 text-white px-3 py-1 rounded transition font-bold" title="Backup JSON">
                <FileJson size={14} /> JSON
              </button>
              <button onClick={handleExportFoundry} className="flex items-center gap-2 text-xs bg-orange-700 hover:bg-orange-600 text-white px-3 py-1 rounded transition font-bold" title="Para Foundry VTT">
                <Box size={14} /> VTT
              </button>
            </>
          )}
          <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-2 text-xs bg-red-800 hover:bg-red-700 disabled:bg-stone-700 text-white px-3 py-1 rounded transition font-bold">
            {isDownloading ? "..." : <><Download size={14} /> PDF</>}
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-stone-900/50 flex justify-center custom-scrollbar">
        {/* ÁREA DE CAPTURA DO PDF */}
        <div ref={containerRef} className="bg-transparent w-min h-fit relative">
          <div
            className="w-[800px] h-auto min-h-[1123px] relative shadow-2xl flex flex-col items-center pb-24 overflow-hidden rounded-sm transition-all duration-300"
            style={{
              // Lógica: Se for Printer Friendly, remove a textura e poe fundo branco
              backgroundImage: isPrinterFriendly ? 'none' : `url('/paper-texture.png')`,
              backgroundRepeat: 'repeat-y',
              backgroundSize: '100% auto',
              backgroundColor: isPrinterFriendly ? 'white' : '#d4c5a9',
              boxShadow: isPrinterFriendly ? 'none' : 'inset 0 0 150px rgba(0,0,0,0.5)'
            }}
          >

            {/* IMAGEM DA CRIATURA */}
            {/* No modo normal, usamos multiply para mesclar com o papel. No modo tinta, usamos normal/grayscale. */}
            <div className={`w-full relative z-0 shrink-0 ${data.imageUrl ? 'h-[500px]' : 'h-24'}`}
              style={data.imageUrl ? {
                maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                backgroundImage: isPrinterFriendly ? 'none' : `radial-gradient(circle at center, rgba(30, 20, 10, 0.7) 0%, transparent 80%)`,
                mixBlendMode: isPrinterFriendly ? "normal" : "multiply"
              } : undefined}>
              {data.imageUrl && (
                <img
                  src={data.imageUrl}
                  className="w-full h-full opacity-100"
                  style={{
                    objectFit: "contain",
                    objectPosition: "bottom center",
                    mixBlendMode: isPrinterFriendly ? "normal" : "multiply",
                    filter: isPrinterFriendly ? "grayscale(100%) contrast(1.2)" : "brightness(1.1) contrast(1.1)"
                  }}
                />
              )}
            </div>

            {/* BLOCO DE ESTATÍSTICAS (STAT BLOCK) */}
            <div
              className="w-[85%] shadow-2xl p-8 font-sans relative z-10 -mt-16 mb-4 rounded-sm transition-colors duration-300"
              style={{
                backgroundColor: bgColor,
                borderTop: `4px solid ${borderColor}`,
                borderBottom: `4px solid ${borderColor}`,
                color: mainColor,
                boxShadow: isPrinterFriendly ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* CABEÇALHO */}
              <h1 className="text-4xl font-bold font-serif uppercase tracking-wide leading-none" style={{ color: mainColor }}>{data.name || "Nome da Criatura"}</h1>
              <p className="italic text-black text-base mb-4 mt-1">{data.size} {data.type}, {data.alignment}</p>

              <svg height="5" width="100%" style={{ fill: accentColor }} className="my-2"><rect width="100%" height="2" /></svg>

              {/* ATRIBUTOS BÁSICOS */}
              <div className="space-y-1 text-sm md:text-base" style={{ color: accentColor }}>
                <p><strong>Classe de Armadura</strong> {data.ac}</p>
                <p><strong>Pontos de Vida</strong> {data.hp_avg} ({data.hp_formula})</p>
                <p><strong>Deslocamento</strong> {data.speed}</p>
              </div>

              <svg height="5" width="100%" style={{ fill: accentColor }} className="my-2"><rect width="100%" height="2" /></svg>

              {/* HABILIDADES (STR, DEX...) */}
              <div className="flex justify-between text-center px-4 py-2" style={{ color: accentColor }}>
                {(["str", "dex", "con", "int", "wis", "cha"] as const).map((stat) => (
                  <div key={stat} className="flex flex-col">
                    <span className="font-bold uppercase text-xs tracking-widest">{stat}</span>
                    <span className="text-base font-bold">{data[stat]} ({getModFormatted(Number(data[stat] || 10))})</span>
                  </div>
                ))}
              </div>

              <svg height="5" width="100%" style={{ fill: accentColor }} className="my-2"><rect width="100%" height="2" /></svg>

              {/* DETALHES AVANÇADOS (IMPORTADOS DO FOUNDRY OU IA) */}
              <div className="mb-2 text-sm space-y-1 text-black">
                {data.damage_immunities && <p><strong>Imunidade a Dano:</strong> {data.damage_immunities}</p>}
                {data.damage_resistances && <p><strong>Resistência a Dano:</strong> {data.damage_resistances}</p>}
                {data.damage_vulnerabilities && <p><strong>Vulnerabilidade a Dano:</strong> {data.damage_vulnerabilities}</p>}
                {data.condition_immunities && <p><strong>Imunidade a Condição:</strong> {data.condition_immunities}</p>}
                {data.senses && <p><strong>Sentidos:</strong> {data.senses}</p>}
                {data.languages && <p><strong>Idiomas:</strong> {data.languages}</p>}

                <p style={{ color: accentColor }} className="mt-2">
                  <strong>Desafio</strong> {formatCR(data.cr)}
                  <span className="text-black ml-1">({data.cr >= 0 ? `+${getProficiency(data.cr)}` : ""} proficiência)</span>
                </p>
              </div>

              <div className="text-sm md:text-base text-black space-y-4 font-serif mt-4">
                {/* TRAITS (Passivas) */}
                {data.traits && data.traits.map((trait, idx) => (
                  <div key={idx} className="leading-snug">
                    <span className="font-bold italic" style={{ color: mainColor }}>{trait.name}.</span>{" "}
                    <RichText text={trait.desc} />
                  </div>
                ))}

                {/* TÁTICAS (Estilo condicional) */}
                {data.tactics && (
                  <div className="my-4 p-3 border-l-4 italic text-sm text-stone-900"
                    style={{
                      backgroundColor: isPrinterFriendly ? '#f3f3f3' : '#58180D0D',
                      borderColor: borderColor
                    }}>
                    <span className="font-bold not-italic uppercase text-xs tracking-wider block mb-1" style={{ color: mainColor }}>Táticas de Combate:</span>
                    <RichText text={data.tactics} />
                  </div>
                )}

                {/* MAGIAS */}
                {data.is_spellcaster && (
                  <div>
                    <p className="mb-1"><strong>Conjuração.</strong> Nível {data.caster_level} ({data.spell_ability.toUpperCase()}). CD {spellSaveDC}, +{spellAtkBonus} para acertar.</p>
                    <div className="italic text-sm pl-2 border-l-2 space-y-1" style={{ borderColor: isPrinterFriendly ? 'black' : '#58180D4D' }}>
                      <RichText text={data.spell_list_text} />
                    </div>
                  </div>
                )}

                {/* AÇÕES */}
                {data.actions && data.actions.length > 0 && (
                  <div className="pt-2 mt-4" style={{ borderTop: `2px solid ${mainColor}` }}>
                    <h3 className="text-xl font-serif uppercase mb-2 border-b pb-1" style={{ color: mainColor, borderColor: isPrinterFriendly ? '#ddd' : '#58180D33' }}>Ações</h3>
                    <div className="space-y-3">
                      {data.actions.map((action, idx) => (
                        <div key={idx} className="leading-snug">
                          <span className="font-bold italic" style={{ color: mainColor }}>{action.name}.</span>{" "}
                          <RichText text={action.desc} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AÇÕES LENDÁRIAS */}
                {data.is_legendary && data.legendary_actions && (
                  <div className="pt-2 mt-4" style={{ borderTop: `2px solid ${mainColor}` }}>
                    <h3 className="text-xl font-serif uppercase mb-2 border-b pb-1" style={{ color: mainColor, borderColor: isPrinterFriendly ? '#ddd' : '#58180D33' }}>Ações Lendárias</h3>
                    <p className="text-sm mb-2 italic">A criatura pode realizar 3 ações lendárias, escolhidas entre as opções abaixo. Apenas uma opção pode ser usada por vez e somente no final do turno de outra criatura.</p>
                    <div className="space-y-3">
                      {data.legendary_actions.map((action, idx) => (
                        <div key={idx} className="leading-snug">
                          <span className="font-bold italic" style={{ color: mainColor }}>{action.name}.</span>{" "}
                          <RichText text={action.desc} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LORE / HISTÓRIA */}
            {data.show_lore && (
              <div
                className="w-[85%] text-black font-serif text-lg leading-relaxed text-justify relative z-10 px-4 shrink-0 mt-2 p-6 rounded-sm shadow-inner border mb-8"
                style={{
                  backgroundColor: isPrinterFriendly ? 'white' : '#FDF1DCCC', // 80% opacity
                  borderColor: isPrinterFriendly ? 'black' : '#58180D4D'
                }}
              >
                <h2 className="text-2xl font-bold uppercase mb-4 font-serif inline-block border-b-2 pb-1" style={{ color: mainColor, borderColor: mainColor }}>Sobre a Criatura</h2>
                <div className="whitespace-pre-wrap">
                  <span className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-[-5px]" style={{ color: mainColor }}>
                    {loreText.charAt(0)}
                  </span>
                  <RichText text={loreText.slice(1)} />
                </div>
              </div>
            )}

            <div className="mt-auto text-center opacity-60 pb-8 flex flex-col items-center gap-2">
              <svg height="10" width="100%" style={{ fill: mainColor }}><circle cx="50%" cy="5" r="3" /></svg>
              <div className="flex items-center gap-2 font-serif text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: mainColor }}>
                <Shield size={12} />Forjado em Monster Forge<Shield size={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}