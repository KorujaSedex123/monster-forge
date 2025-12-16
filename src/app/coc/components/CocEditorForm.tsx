"use client";
import { useState, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { calculateDbAndBuild, calculateHP, calculateMP } from "../utils";
import { CocMonsterData } from "../types";
import { Skull, Plus, Trash2, Calculator, Sparkles, Dices } from "lucide-react";
import { COC_RANDOM_CONCEPTS } from "../concepts";
import EditorShell from "@/components/EditorShell"; // Importe a Shell

export default function CocEditorForm() {
  const { register, watch, setValue, control, reset } = useFormContext<CocMonsterData>();
  const attacksField = useFieldArray({ control, name: "attacks" });
  const skillsField = useFieldArray({ control, name: "skills" });
  const powersField = useFieldArray({ control, name: "special_powers" });

  const data = watch();
  
  // Estados para IA (apenas o necessário para a lógica interna)
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiParams, setAiParams] = useState({ name: "", concept: "", powerLevel: "human" });

  // --- CÁLCULOS ESPECÍFICOS DE COC ---
  useEffect(() => {
    const hp = calculateHP(Number(data.con || 0), Number(data.siz || 0));
    if (hp !== data.hp) setValue("hp", hp);
    const mp = calculateMP(Number(data.pow || 0));
    if (mp !== data.mp) setValue("mp", mp);
    const { db, build } = calculateDbAndBuild(Number(data.str || 0), Number(data.siz || 0));
    if (db !== data.db) setValue("db", db);
    if (build !== data.build) setValue("build", build);
  }, [data.str, data.con, data.siz, data.pow, setValue]);

  // --- LÓGICA DE IA ESPECÍFICA ---
  const handleAiSubmit = async (onClose: () => void) => {
    if (!aiParams.concept) return alert("Descreva o conceito.");
    setIsGenerating(true);
    try {
        const res = await fetch("/api/ai/generate-coc", {
            method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aiParams)
        });
        const json = await res.json();
        Object.keys(json).forEach((k) => setValue(k as any, json[k]));
        onClose();
        alert("Entidade materializada.");
    } catch (e) { alert("Erro na invocação."); } 
    finally { setIsGenerating(false); }
  };

  // --- LÓGICA DE ARQUIVO ESPECÍFICA ---
  const handleImport = (json: any) => {
      // Validação específica de CoC
      if (typeof json.san_loss === 'undefined') throw new Error("Não é uma ficha de CoC");
      reset(json);
      alert("Arquivo carregado.");
  };

  const handleReset = () => {
      if (confirm("Limpar?")) reset({ 
          name: "", str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50,
          hp: 10, mp: 10, move: 8, build: 0, db: "0", attacks: [], skills: [], special_powers: [], san_loss: "0/1d4" 
      });
  };

  // --- RENDERIZAÇÃO DO CONTEÚDO DO MODAL DE IA ---
  const AiModalContent = ({ onClose }: { onClose: () => void }) => (
    <div className="space-y-4">
        <div>
            <label className="text-xs font-bold text-emerald-600 uppercase">Nome</label>
            <input value={aiParams.name} onChange={e => setAiParams({...aiParams, name: e.target.value})} className="w-full bg-[#050a08] border border-emerald-900/50 rounded p-2 text-white outline-none" placeholder="Opcional..." />
        </div>
        <div>
            <div className="flex justify-between mb-1"><label className="text-xs font-bold text-emerald-600 uppercase">Conceito</label><button onClick={() => setAiParams({...aiParams, concept: COC_RANDOM_CONCEPTS[Math.floor(Math.random() * COC_RANDOM_CONCEPTS.length)]})} className="text-[10px] text-purple-400 flex items-center gap-1"><Dices size={12}/> Inspirar</button></div>
            <textarea value={aiParams.concept} onChange={e => setAiParams({...aiParams, concept: e.target.value})} className="w-full bg-[#050a08] border border-emerald-900/50 rounded p-2 text-white h-24 resize-none outline-none" placeholder="Descrição do horror..." />
        </div>
        <div className="grid grid-cols-3 gap-2">
            {["human", "monster", "god"].map(lvl => (
                <button key={lvl} onClick={() => setAiParams({...aiParams, powerLevel: lvl})} className={`p-2 text-xs border rounded capitalize ${aiParams.powerLevel === lvl ? "bg-emerald-900 border-emerald-500" : "border-emerald-900/30 text-emerald-700"}`}>{lvl}</button>
            ))}
        </div>
        <button onClick={() => handleAiSubmit(onClose)} disabled={isGenerating} className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded flex justify-center gap-2 border border-emerald-600">
            {isGenerating ? <Sparkles className="animate-spin"/> : <Sparkles/>} Invocar
        </button>
    </div>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <EditorShell
        title="Dossiê Call of Cthulhu"
        themeColor="emerald"
        icon={<Skull size={20}/>}
        onReset={handleReset}
        onImport={handleImport}
        aiModalContent={AiModalContent}
    >
        {/* CAMPOS ESPECÍFICOS DE COC */}
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="label-text">Nome</label>
                <input {...register("name")} className="input-field" placeholder="Nome da Entidade" />
                <label className="label-text">Descrição</label>
                <textarea {...register("description")} className="input-field h-20" placeholder="Atmosfera..." />
            </div>

            <div>
                <h3 className="text-stone-500 text-xs font-bold uppercase mb-2 border-b border-stone-800 pb-1">Atributos (0-100)</h3>
                <div className="grid grid-cols-4 gap-2">
                    {["str", "con", "siz", "dex", "app", "int", "pow", "edu"].map(attr => (
                        <div key={attr}><label className="text-[10px] uppercase font-bold text-stone-500 block text-center">{attr}</label><input type="number" {...register(attr as any, { valueAsNumber: true })} className="w-full bg-stone-800 text-center font-mono font-bold text-white p-1 rounded" /></div>
                    ))}
                </div>
            </div>

            {/* Painel de Cálculos (Read-only) */}
            <div className="bg-stone-900 p-3 rounded border border-stone-800 grid grid-cols-4 gap-4 text-center text-sm">
                <div><span className="text-[10px] text-stone-500">HP</span><span className="font-bold text-white">{data.hp}</span></div>
                <div><span className="text-[10px] text-stone-500">MP</span><span className="font-bold text-white">{data.mp}</span></div>
                <div><span className="text-[10px] text-stone-500">DB</span><span className="font-bold text-white">{data.db}</span></div>
                <div><span className="text-[10px] text-stone-500">Build</span><span className="font-bold text-white">{data.build}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Movimento</label><input type="number" {...register("move", { valueAsNumber: true })} className="input-field" /></div>
                <div><label className="label-text text-red-500">Sanity Loss</label><input {...register("san_loss")} className="input-field border-red-900/50 text-red-400" /></div>
            </div>

            <div><label className="label-text">Armadura</label><input {...register("armor")} className="input-field" /></div>

            {/* Listas */}
            <div>
                <div className="flex justify-between items-center mb-2"><h3 className="label-text">Ataques</h3><button type="button" onClick={() => attacksField.append({ name: "Ataque", skill_level: 50, damage: "1d4" })} className="btn-icon"><Plus size={12}/></button></div>
                <div className="space-y-2">
                    {attacksField.fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 bg-stone-900 p-2 rounded">
                            <div className="col-span-4"><input {...register(`attacks.${index}.name`)} className="input-transparent" placeholder="Nome" /></div>
                            <div className="col-span-2"><input type="number" {...register(`attacks.${index}.skill_level`, {valueAsNumber:true})} className="input-transparent text-center" placeholder="%" /></div>
                            <div className="col-span-3"><input {...register(`attacks.${index}.damage`)} className="input-transparent" placeholder="Dano" /></div>
                            <div className="col-span-2"><input {...register(`attacks.${index}.desc`)} className="input-transparent text-stone-500" placeholder="Extra" /></div>
                            <div className="col-span-1 flex justify-end"><button type="button" onClick={() => attacksField.remove(index)} className="text-stone-500 hover:text-red-500"><Trash2 size={12}/></button></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Perícias */}
            <div>
                <div className="flex justify-between items-center mb-2"><h3 className="label-text">Perícias</h3><button type="button" onClick={() => skillsField.append({ name: "Perícia", value: 50 })} className="btn-icon"><Plus size={12}/></button></div>
                <div className="grid grid-cols-2 gap-2">
                    {skillsField.fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 bg-stone-900 p-2 rounded items-center">
                            <input {...register(`skills.${index}.name`)} className="flex-1 input-transparent" />
                            <input type="number" {...register(`skills.${index}.value`, {valueAsNumber:true})} className="w-10 input-transparent text-center" />
                            <button type="button" onClick={() => skillsField.remove(index)} className="text-stone-500 hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Magias e Poderes */}
            <div><label className="label-text text-purple-500">Magias</label><textarea {...register("spells")} className="input-field h-16" /></div>
            
            <div>
                <div className="flex justify-between items-center mb-2"><h3 className="label-text">Poderes Especiais</h3><button type="button" onClick={() => powersField.append({ name: "Poder", desc: "" })} className="btn-icon"><Plus size={12}/></button></div>
                <div className="space-y-2">
                    {powersField.fields.map((field, index) => (
                        <div key={field.id} className="bg-stone-900 p-2 rounded border border-stone-800">
                            <div className="flex justify-between"><input {...register(`special_powers.${index}.name`)} className="bg-transparent font-bold text-white text-xs outline-none" placeholder="Nome" /><button type="button" onClick={() => powersField.remove(index)} className="text-stone-500 hover:text-red-500"><Trash2 size={12}/></button></div>
                            <textarea {...register(`special_powers.${index}.desc`)} className="w-full bg-transparent text-stone-400 text-xs mt-1 outline-none resize-none" placeholder="Descrição..." />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </EditorShell>
  );
}