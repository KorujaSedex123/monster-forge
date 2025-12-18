"use client";
import { useState, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { calculateDbAndBuild, calculateHP, calculateMP } from "../utils";
import { CocMonsterData } from "../types";
import { Skull, Plus, Trash2, Calculator, Sparkles, Dices, Image as ImageIcon } from "lucide-react";
import { COC_RANDOM_CONCEPTS } from "../concepts";
import EditorShell from "@/components/EditorShell"; 
import { convertCocFromFoundry } from "../cocAdapter";
import { toast } from "sonner";
import { generateMonsterImage } from "@/lib/imageGenerator"; // Assumindo que você criou este utilitário

export default function CocEditorForm() {
  const { register, watch, setValue, control, reset } = useFormContext<CocMonsterData>();
  
  // Listas Dinâmicas
  const attacksField = useFieldArray({ control, name: "attacks" });
  const skillsField = useFieldArray({ control, name: "skills" });
  const powersField = useFieldArray({ control, name: "special_powers" });

  const data = watch();
  
  // Estados Locais para o Modal de IA
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImgGenerating, setIsImgGenerating] = useState(false);
  const [aiParams, setAiParams] = useState({ name: "", concept: "", powerLevel: "human" });

  // --- CÁLCULOS AUTOMÁTICOS (Regras 7ª Edição) ---
  useEffect(() => {
    const hp = calculateHP(Number(data.con || 0), Number(data.siz || 0));
    if (hp !== data.hp) setValue("hp", hp);

    const mp = calculateMP(Number(data.pow || 0));
    if (mp !== data.mp) setValue("mp", mp);

    const { db, build } = calculateDbAndBuild(Number(data.str || 0), Number(data.siz || 0));
    if (db !== data.db) setValue("db", db);
    if (build !== data.build) setValue("build", build);
  }, [data.str, data.con, data.siz, data.pow, setValue]);

  // --- LÓGICA DE IMPORTAÇÃO ---
  const handleImport = (json: any) => {
      try {
        let importedData = json;
        // Detecta se é Foundry VTT (estrutura CoC 7e)
        if (json.system && (json.system.characteristics || json.system.attribs)) {
            console.log("Ficha Foundry CoC 7e detectada");
            importedData = convertCocFromFoundry(json);
        }
        else if (typeof json.str === 'undefined' && !json.name) {
             throw new Error("Formato inválido.");
        }
        reset(importedData);
      } catch (error) {
        throw error; // Deixa o Shell tratar o toast de erro
      }
  };

  // --- LÓGICA DE RESET ---
  const handleReset = () => {
      if (confirm("Tem certeza que deseja limpar a ficha?")) {
          reset({ 
              name: "", description: "",
              str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50,
              hp: 10, mp: 10, move: 8, build: 0, db: "0", 
              attacks: [], skills: [], special_powers: [], 
              san_loss: "0/1d4", armor: ""
          });
          toast.info("Ficha reiniciada.");
      }
  };

  // --- LÓGICA DE IA (DADOS) ---
  const handleAiSubmit = async (onClose: () => void) => {
    if (!aiParams.concept) return toast.warning("Descreva o conceito.");
    
    setIsGenerating(true);
    try {
        const res = await fetch("/api/ai/generate-coc", {
            method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aiParams)
        });
        if (!res.ok) throw new Error("Erro na IA");
        const json = await res.json();
        Object.keys(json).forEach((k) => setValue(k as any, json[k]));
        onClose();
        toast.success("Entidade invocada!");
    } catch (e) { 
        toast.error("O ritual falhou."); 
    } finally { 
        setIsGenerating(false); 
    }
  };

  // --- LÓGICA DE IA (IMAGEM) ---
  const handleGenerateImage = async (onImageReady: (b: string) => void) => {
      if (!aiParams.concept) return toast.warning("Defina um conceito para a imagem.");
      setIsImgGenerating(true);
      try {
          // Usa o gerador com estilo 'horror' para fotos antigas/sombrias
          const base64 = await generateMonsterImage(aiParams.concept, 'horror');
          onImageReady(base64);
          toast.success("Imagem revelada!");
      } catch (e) {
          toast.error("Erro ao gerar imagem.");
      } finally {
          setIsImgGenerating(false);
      }
  };

  // --- CONTEÚDO DO MODAL ---
  const AiModalContent = ({ onClose, onImageReady }: { onClose: () => void, onImageReady: (b: string) => void }) => (
    <div className="space-y-4">
        <div>
            <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Nome</label>
            <input value={aiParams.name} onChange={e => setAiParams({...aiParams, name: e.target.value})} className="w-full bg-[#050a08] border border-emerald-900/50 rounded p-2 text-white outline-none" placeholder="Opcional..." />
        </div>
        <div>
            <div className="flex justify-between mb-1">
                <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Conceito</label>
                <button type="button" onClick={() => setAiParams({...aiParams, concept: COC_RANDOM_CONCEPTS[Math.floor(Math.random() * COC_RANDOM_CONCEPTS.length)]})} className="text-[10px] text-purple-400 flex items-center gap-1 hover:text-purple-300"><Dices size={12}/> Inspirar</button>
            </div>
            <textarea value={aiParams.concept} onChange={e => setAiParams({...aiParams, concept: e.target.value})} className="w-full bg-[#050a08] border border-emerald-900/50 rounded p-2 text-white h-24 resize-none outline-none" placeholder="Descreva o horror..." />
        </div>
        <div>
            <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Escala de Poder</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
                {[{id:"human",l:"Humano"}, {id:"monster",l:"Monstro"}, {id:"god",l:"Deus"}].map(opt => (
                    <button key={opt.id} type="button" onClick={() => setAiParams({...aiParams, powerLevel: opt.id})} className={`p-2 text-xs border rounded capitalize ${aiParams.powerLevel === opt.id ? "bg-emerald-900/50 border-emerald-500 text-white" : "border-emerald-900/30 text-emerald-700"}`}>{opt.l}</button>
                ))}
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={() => handleGenerateImage(onImageReady)} disabled={isImgGenerating || isGenerating} className="py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded flex justify-center gap-2 border border-stone-600 transition disabled:opacity-50">
                {isImgGenerating ? <Sparkles className="animate-spin" size={18}/> : <ImageIcon size={18}/>} Gerar Foto
            </button>
            <button type="button" onClick={() => handleAiSubmit(onClose)} disabled={isGenerating || isImgGenerating} className="py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded flex justify-center gap-2 border border-emerald-700 transition disabled:opacity-50">
                {isGenerating ? <Sparkles className="animate-spin" size={18}/> : <Sparkles size={18}/>} Gerar Ficha
            </button>
        </div>
    </div>
  );

  return (
    <EditorShell
        title="Editor Call of Cthulhu"
        themeColor="emerald"
        icon={<Skull size={20}/>}
        onReset={handleReset}
        onImport={handleImport}
        aiModalContent={AiModalContent}
    >
        {/* CAMPOS ESPECÍFICOS */}
        <div className="space-y-6 font-mono text-sm">
            <div className="space-y-3">
                <div><label className="label-text">Nome</label><input {...register("name")} className="input-field" /></div>
                <div><label className="label-text">Descrição</label><textarea {...register("description")} className="input-field h-24" /></div>
            </div>

            <div>
                <h3 className="text-stone-500 text-xs font-bold uppercase mb-3 border-b border-stone-800 pb-1">Características</h3>
                <div className="grid grid-cols-4 gap-3">
                    {["str", "con", "siz", "dex", "app", "int", "pow", "edu"].map(attr => (
                        <div key={attr}><label className="text-[10px] uppercase font-bold text-stone-500 block text-center mb-1">{attr}</label><input type="number" {...register(attr as any, { valueAsNumber: true })} className="w-full bg-stone-900 border border-stone-800 text-center font-mono font-bold text-emerald-400 p-2 rounded focus:border-emerald-600 outline-none" /></div>
                    ))}
                </div>
            </div>

            <div className="bg-stone-900/50 p-4 rounded border border-stone-800">
                <h3 className="text-emerald-600 text-xs font-bold uppercase mb-3 flex items-center gap-2"><Calculator size={14}/> Estatísticas Derivadas</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div><span className="block text-[10px] text-stone-500">HP</span><span className="text-lg font-bold text-white">{data.hp}</span></div>
                    <div><span className="block text-[10px] text-stone-500">MP</span><span className="text-lg font-bold text-white">{data.mp}</span></div>
                    <div><span className="block text-[10px] text-stone-500">DB</span><span className="text-lg font-bold text-white">{data.db}</span></div>
                    <div><span className="block text-[10px] text-stone-500">Build</span><span className="text-lg font-bold text-white">{data.build}</span></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Movimento</label><input type="number" {...register("move", { valueAsNumber: true })} className="input-field" /></div>
                <div><label className="label-text text-red-500">Sanity Loss</label><input {...register("san_loss")} className="input-field border-red-900/50 text-red-400" /></div>
            </div>
            <div><label className="label-text">Armadura</label><input {...register("armor")} className="input-field" /></div>

            {/* Listas */}
            <div>
                <div className="flex justify-between items-center mb-2"><h3 className="label-text">Ataques</h3><button type="button" onClick={() => attacksField.append({ name: "Ataque", skill_level: 50, damage: "1d4" })} className="btn-icon"><Plus size={12}/></button></div>
                <div className="space-y-2">{attacksField.fields.map((field, index) => (<div key={field.id} className="grid grid-cols-12 gap-2 bg-stone-900 p-2 rounded border border-stone-800"><div className="col-span-4"><input {...register(`attacks.${index}.name`)} className="input-transparent" placeholder="Nome" /></div><div className="col-span-2"><input type="number" {...register(`attacks.${index}.skill_level`, {valueAsNumber:true})} className="input-transparent text-center text-emerald-400" placeholder="%" /></div><div className="col-span-3"><input {...register(`attacks.${index}.damage`)} className="input-transparent" placeholder="Dano" /></div><div className="col-span-2"><input {...register(`attacks.${index}.desc`)} className="input-transparent text-stone-500" placeholder="Extra" /></div><div className="col-span-1 flex justify-end"><button type="button" onClick={() => attacksField.remove(index)} className="text-stone-500 hover:text-red-500"><Trash2 size={12}/></button></div></div>))}</div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2"><h3 className="label-text">Perícias</h3><button type="button" onClick={() => skillsField.append({ name: "Perícia", value: 50 })} className="btn-icon"><Plus size={12}/></button></div>
                <div className="grid grid-cols-2 gap-2">{skillsField.fields.map((field, index) => (<div key={field.id} className="flex gap-2 bg-stone-900 p-2 rounded items-center border border-stone-800"><input {...register(`skills.${index}.name`)} className="flex-1 input-transparent" /><input type="number" {...register(`skills.${index}.value`, {valueAsNumber:true})} className="w-10 input-transparent text-center text-emerald-400" /><button type="button" onClick={() => skillsField.remove(index)} className="text-stone-500 hover:text-red-500"><Trash2 size={12}/></button></div>))}</div>
            </div>
            
            <div><label className="label-text text-purple-500">Magias</label><textarea {...register("spells")} className="input-field h-16" /></div>
            
            <div>
                <div className="flex justify-between items-center mb-2"><h3 className="label-text">Poderes Especiais</h3><button type="button" onClick={() => powersField.append({ name: "Poder", desc: "" })} className="btn-icon"><Plus size={12}/></button></div>
                <div className="space-y-2">{powersField.fields.map((field, index) => (<div key={field.id} className="bg-stone-900 p-2 rounded border border-stone-800"><div className="flex justify-between"><input {...register(`special_powers.${index}.name`)} className="bg-transparent font-bold text-white text-xs outline-none" placeholder="Nome" /><button type="button" onClick={() => powersField.remove(index)} className="text-stone-500 hover:text-red-500"><Trash2 size={12}/></button></div><textarea {...register(`special_powers.${index}.desc`)} className="w-full bg-transparent text-stone-400 text-xs mt-1 outline-none resize-none" placeholder="Descrição..." /></div>))}</div>
            </div>
        </div>
    </EditorShell>
  );
}