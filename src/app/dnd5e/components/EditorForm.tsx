"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useFormContext, useFieldArray } from "react-hook-form";
import { 
  Sword, Upload, Calculator, Plus, Trash2, Wand2, ShieldAlert, 
  Crown, BookOpen, FileText, CheckCircle2, ArrowLeft, Shield, 
  Sparkles, Lock, Unlock, X, BrainCircuit, Dices, FileUp, RotateCcw 
} from "lucide-react";
import { MonsterData } from "../types";
import { 
  getModFormatted, formatCR, getProficiency, MONSTER_TYPES, ALIGNMENTS, calculateFinalCR 
} from "../utils";
import ImageCropper from "./ImageCropper";
import { RANDOM_CONCEPTS } from "../concepts";
import SpellEditor from "./SpellEditor";
import { convertFromFoundry } from "../foundryAdapter";

const SIZES = ["Miúdo", "Pequeno", "Médio", "Grande", "Enorme", "Imenso"];
const CRS = [
  "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", 
  "24", "25", "26", "27", "28", "29", "30"
];

export default function EditorForm() {
  const { register, watch, setValue, control, reset } = useFormContext<MonsterData>();
  
  // Listas Dinâmicas
  const traitsField = useFieldArray({ control, name: "traits" });
  const actionsField = useFieldArray({ control, name: "actions" });
  const legendaryField = useFieldArray({ control, name: "legendary_actions" });

  const data = watch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CONTROLE DA CALCULADORA ---
  const [autoCalculate, setAutoCalculate] = useState(true); 

  // --- CONTROLE DO MODAL DE IA ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [aiParams, setAiParams] = useState({
    name: "",
    concept: "",
    size: "Médio",
    type: "Qualquer",
    cr: "1",
    forceSpellcaster: false,
    forceLegendary: false
  });

  const handleInspireMe = () => {
    const randomIndex = Math.floor(Math.random() * RANDOM_CONCEPTS.length);
    setAiParams(prev => ({ ...prev, concept: RANDOM_CONCEPTS[randomIndex] }));
  };

  // --- IMPORTAÇÃO ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        let importedData;

        if (json.system && json.items) {
            console.log("Detectado formato Foundry VTT");
            importedData = convertFromFoundry(json);
        } else if (json.full_data || (json.name && typeof json.ac !== 'undefined')) {
            importedData = json.full_data || json;
        } else {
            throw new Error("Formato desconhecido.");
        }

        reset({
            ...data, // Mantém defaults se faltar algo
            ...importedData, 
            traits: importedData.traits?.map((t: any) => ({...t, id: null})) || [],
            actions: importedData.actions?.map((a: any) => ({...a, id: null})) || [],
            legendary_actions: importedData.legendary_actions?.map((l: any) => ({...l, id: null})) || []
        });
        
        setAutoCalculate(false);
        window.alert(`Monstro "${importedData.name}" importado com sucesso!`);

      } catch (error) {
        console.error(error);
        window.alert("Erro ao importar: Arquivo inválido ou formato não suportado.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; 
  };

  // --- RESETAR ---
  const handleReset = () => {
    if (window.confirm("Tem certeza que deseja limpar tudo e começar do zero?")) {
        reset({
            name: "", size: "Médio", type: "Humanoide", alignment: "Neutro",
            ac: 10, hp_avg: 10, hp_formula: "2d8 + 2", speed: "30 pés",
            str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
            dpr: 0, attack_bonus: 0, cr: 1,
            traits: [], actions: [], legendary_actions: [],
            is_spellcaster: false, spell_ability: "int", caster_level: 1, spell_list_text: "",
            is_legendary: false, show_lore: false, lore: "", tactics: ""
        });
        setAutoCalculate(true);
    }
  };

  // --- GERAÇÃO IA ---
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiParams.concept) {
        window.alert("Por favor, descreva um conceito.");
        return;
    }

    setIsGenerating(true);
    setAutoCalculate(false);

    let crNumber = 1;
    if (aiParams.cr.includes("/")) {
        const [num, den] = aiParams.cr.split("/");
        crNumber = parseInt(num) / parseInt(den);
    } else {
        crNumber = parseFloat(aiParams.cr);
    }

    try {
        const response = await fetch('/api/ai/generate-monster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: aiParams.name, 
                concept: aiParams.concept, 
                size: aiParams.size,
                type: aiParams.type === "Qualquer" ? "" : aiParams.type,
                cr: crNumber,
                force_spellcaster: aiParams.forceSpellcaster,
                force_legendary: aiParams.forceLegendary
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro desconhecido.');
        }

        const newMonsterData = await response.json() as Partial<MonsterData>;
        
        (Object.keys(newMonsterData) as Array<keyof MonsterData>).forEach((key) => {
            if (newMonsterData[key] !== undefined) {
                setValue(key, newMonsterData[key]);
            }
        });

        setShowAiModal(false); 
        window.alert(`Monstro invocado com sucesso! A Calculadora Automática foi PAUSADA.`);

    } catch (error) {
        console.error('Erro:', error);
        window.alert(`Falha na geração: ${(error as Error).message}`);
        setAutoCalculate(true); 
    } finally {
        setIsGenerating(false);
    }
  };

  // --- LÓGICA DA CALCULADORA DE CR ---
  useEffect(() => {
    if (!autoCalculate) return; 

    const { hp_avg, ac, dpr, attack_bonus, has_resistance } = data;
    const safeHp = Number(hp_avg) || 0;
    const safeAc = Number(ac) || 0;
    const safeDpr = Number(dpr) || 0;
    const safeAttackBonus = Number(attack_bonus) || 0;

    if (safeHp <= 0 || safeAc <= 0 || safeDpr <= 0) {
      if (data.cr !== 0) setValue('cr', 0, { shouldValidate: true });
      return;
    }

    const newCR = calculateFinalCR(safeHp, safeAc, safeDpr, safeAttackBonus, has_resistance || false);

    if (newCR !== data.cr) {
      setValue('cr', newCR, { shouldValidate: true });
    }

  }, [data.hp_avg, data.ac, data.dpr, data.attack_bonus, data.has_resistance, data.cr, setValue, autoCalculate]);

  // --- LÓGICA DE IMAGEM (CROPPER) ---
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ""; 
  };
  const handleCropComplete = (croppedImage: string) => {
    setValue("imageUrl", croppedImage);
    setShowCropper(false);
    setTempImage(null);
  };
  const removeImage = () => setValue("imageUrl", null);

  // --- CÁLCULOS DE EXIBIÇÃO (COM PROTEÇÃO NaN) ---
  const safeSpellAttr = Number(data[data.spell_ability]) || 10;
  const spellMod = Math.floor((safeSpellAttr - 10) / 2);
  const safeProficiency = getProficiency(data.cr) || 2;
  const spellSaveDC = 8 + safeProficiency + spellMod;
  const spellAtkBonus = safeProficiency + spellMod;

  return (
    <>
    {/* MODAL DE RECORTE DE IMAGEM */}
    {showCropper && tempImage && (
        <ImageCropper imageSrc={tempImage} onCropComplete={handleCropComplete} onCancel={() => setShowCropper(false)} />
    )}

    {/* INPUT DE ARQUIVO OCULTO */}
    <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
    />

    {/* MODAL DE GERAÇÃO COM IA */}
    {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-stone-900 border border-stone-700 w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
                <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X size={20}/></button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-600 rounded-lg"><BrainCircuit className="text-white" size={24} /></div>
                    <h3 className="text-xl font-bold text-white">Criar com IA</h3>
                </div>

                <form onSubmit={handleAiSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-stone-400 uppercase">Nome (Opcional)</label>
                        <input 
                            value={aiParams.name}
                            onChange={e => setAiParams({...aiParams, name: e.target.value})}
                            className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white focus:border-indigo-500 outline-none" 
                            placeholder="Deixe vazio para gerar aleatório"
                        />
                    </div>
                    
                    {/* CAMPO DE CONCEITO COM BOTÃO INSPIRAR */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-xs font-bold text-stone-400 uppercase">Conceito do Monstro</label>
                            
                            <button 
                                type="button" 
                                onClick={handleInspireMe}
                                className="text-[10px] flex items-center gap-1 text-purple-400 hover:text-purple-300 transition font-bold bg-purple-900/30 px-2 py-1 rounded border border-purple-700/50"
                            >
                                <Dices size={12}/> Inspirar-me
                            </button>
                        </div>
                        <textarea 
                            value={aiParams.concept}
                            onChange={e => setAiParams({...aiParams, concept: e.target.value})}
                            className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white h-24 resize-none focus:border-indigo-500 outline-none" 
                            placeholder="Ex: Um gato preto gigante feito de sombras..."
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-stone-400 uppercase">Tamanho</label>
                            <select 
                                value={aiParams.size}
                                onChange={e => setAiParams({...aiParams, size: e.target.value})}
                                className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white outline-none cursor-pointer"
                            >
                                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-400 uppercase">Tipo</label>
                            <select 
                                value={aiParams.type}
                                onChange={e => setAiParams({...aiParams, type: e.target.value})}
                                className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white outline-none cursor-pointer"
                            >
                                <option value="Qualquer">Qualquer</option>
                                {MONSTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-stone-800 pt-4">
                        <label className="text-xs font-bold text-stone-400 uppercase">Nível de Desafio (CR)</label>
                        <select 
                            value={aiParams.cr}
                            onChange={e => setAiParams({...aiParams, cr: e.target.value})}
                            className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-white outline-none cursor-pointer"
                        >
                            {CRS.map(c => <option key={c} value={c}>ND {c}</option>)}
                        </select>
                        
                        {/* OPÇÕES EXTRAS */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {/* Checkbox Magia */}
                            <div className={`flex items-center gap-2 p-2 rounded border transition-colors ${aiParams.forceSpellcaster ? "bg-purple-900/40 border-purple-600" : "bg-stone-950 border-stone-800"}`}>
                                <input 
                                    type="checkbox" 
                                    id="ai-spellcaster"
                                    checked={aiParams.forceSpellcaster}
                                    onChange={e => setAiParams({...aiParams, forceSpellcaster: e.target.checked})}
                                    className="w-4 h-4 accent-purple-600 cursor-pointer rounded"
                                />
                                <label htmlFor="ai-spellcaster" className="text-xs font-bold text-white cursor-pointer select-none flex items-center gap-1">
                                    <Wand2 size={14} className="text-purple-400"/> Conjurador?
                                </label>
                            </div>

                            {/* Checkbox Lendário */}
                            <div className={`flex items-center gap-2 p-2 rounded border transition-colors ${aiParams.forceLegendary ? "bg-yellow-900/40 border-yellow-600" : "bg-stone-950 border-stone-800"}`}>
                                <input 
                                    type="checkbox" 
                                    id="ai-legendary"
                                    checked={aiParams.forceLegendary}
                                    onChange={e => setAiParams({...aiParams, forceLegendary: e.target.checked})}
                                    className="w-4 h-4 accent-yellow-600 cursor-pointer rounded"
                                />
                                <label htmlFor="ai-legendary" className="text-xs font-bold text-white cursor-pointer select-none flex items-center gap-1">
                                    <Crown size={14} className="text-yellow-500"/> Lendário?
                                </label>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isGenerating}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <><Sparkles className="animate-spin" size={18}/> Invocando...</> : <><Sparkles size={18}/> Gerar Ficha</>}
                    </button>
                </form>
            </div>
        </div>
    )}

    <div className="w-1/2 flex flex-col border-r border-stone-700">
      
      {/* CABEÇALHO DO EDITOR */}
      <div className="p-4 bg-stone-800 border-b border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
                <Sword className="text-red-500" size={20} />
                <h2 className="font-bold text-lg text-stone-200">Editor</h2>
            </div>
            
            {/* BOTÕES DE AÇÃO */}
            <button type="button" onClick={handleReset} className="p-2 bg-stone-700 hover:bg-red-900/80 text-stone-300 hover:text-white rounded transition" title="Limpar / Novo">
                <RotateCcw size={14} />
            </button>
            <button type="button" onClick={handleImportClick} className="p-2 bg-stone-700 hover:bg-blue-900/80 text-stone-300 hover:text-white rounded transition" title="Importar JSON">
                <FileUp size={14} />
            </button>
            
            <div className="w-px h-6 bg-stone-600 mx-1"></div>
            
            <button 
                type="button" 
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow transition-all"
            >
                <Sparkles size={14} />
                IA
            </button>
        </div>
        
        <Link href="/" className="text-xs font-bold text-stone-500 hover:text-stone-300 flex items-center gap-1 transition">
            <ArrowLeft size={14}/> Sair
        </Link>
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-8 pb-20 text-stone-200">
        
        {/* 1. IDENTIDADE E IMAGEM */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label-text">Nome</label>
            <input {...register("name")} className="input-field" placeholder="Ex: Dragão Vermelho" />
          </div>
          
          <div className="col-span-2">
             {!data.imageUrl ? (
                <div className="relative group bg-stone-800 border-2 border-dashed border-stone-600 rounded-lg hover:border-red-500 hover:bg-stone-700/50 transition cursor-pointer p-4 flex items-center justify-center gap-3">
                    <Upload size={20} className="text-stone-400 group-hover:text-red-400" />
                    <div>
                        <span className="text-sm font-bold text-stone-300 block">Adicionar Arte</span>
                        <span className="text-[10px] text-stone-500">Clique para selecionar e recortar</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
             ) : (
                <div className="bg-stone-800 border border-green-900/50 p-3 rounded-lg flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <img src={data.imageUrl} className="w-10 h-10 rounded object-cover border border-stone-600" />
                        <div>
                            <span className="text-sm font-bold text-green-400 flex items-center gap-1"><CheckCircle2 size={12}/> Imagem Pronta</span>
                            <span className="text-[10px] text-stone-500">Visível na ficha</span>
                        </div>
                    </div>
                    <button type="button" onClick={removeImage} className="text-stone-500 hover:text-red-400 transition p-2"><Trash2 size={16}/></button>
                </div>
             )}
          </div>

          <div>
            <label className="label-text">Tamanho</label>
            <select {...register("size")} className="input-field">
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Tipo</label>
            <select {...register("type")} className="input-field">
              {MONSTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label-text">Tendência</label>
            <select {...register("alignment")} className="input-field">
               {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* 2. LORE & TÁTICAS */}
        <div className="border-t border-stone-700 pt-6">
           <h3 className="text-blue-400 font-bold text-sm uppercase flex items-center gap-2 mb-4"><BookOpen size={14} /> Resumo & Táticas</h3>
           
           <div className="flex flex-col gap-3 mb-4 bg-stone-800 p-3 rounded border border-stone-600">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="show-lore" {...register("show_lore")} className="w-5 h-5 accent-blue-500 rounded cursor-pointer" />
                <label htmlFor="show-lore" className="text-sm font-bold text-stone-200 cursor-pointer flex items-center gap-2 select-none"><FileText size={16}/> Adicionar Texto de História</label>
              </div>
           </div>

           {data.show_lore && (
               <textarea 
                 {...register("lore")} 
                 className="w-full bg-stone-800 border border-stone-600 rounded p-3 text-white min-h-[150px] outline-none placeholder-stone-500 animate-in fade-in mb-4"
                 placeholder="Escreva a história da criatura..."
               />
           )}

           <div className="bg-stone-800 p-4 rounded border border-stone-700">
             <label className="label-text mb-2 block flex items-center gap-2 text-red-400"><ShieldAlert size={14} /> Inteligência & Táticas</label>
             <textarea 
                 {...register("tactics")} 
                 className="w-full bg-stone-900/50 border border-stone-600 rounded p-3 text-white min-h-[100px] outline-none placeholder-stone-500 text-sm"
                 placeholder="Ex: O monstro foca em conjuradores e foge se ferido..."
             />
           </div>
        </div>

        {/* 3. ATRIBUTOS */}
        <div className="grid grid-cols-6 gap-2 text-center bg-stone-800 p-2 rounded">
          {(["str", "dex", "con", "int", "wis", "cha"] as const).map((stat) => (
            <div key={stat}>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">{stat}</label>
              <input type="number" {...register(stat, { valueAsNumber: true })} className="w-full bg-stone-700 border border-stone-600 rounded p-1 text-white text-center font-bold" />
              <div className="text-[10px] text-stone-400 mt-1">{getModFormatted(Number(data[stat]))}</div>
            </div>
          ))}
        </div>

        {/* 4. ESTATÍSTICAS DE COMBATE (COM TRAVA DE CÁLCULO) */}
        <div className="space-y-4 border-t border-stone-700 pt-4">
          <div className="flex justify-between items-center">
             <h3 className="text-yellow-500 font-bold text-sm uppercase flex items-center gap-2"><Calculator size={14} /> Estatísticas de Combate</h3>
             
             {/* BOTÃO DE TRAVA DE CÁLCULO */}
             <button 
               type="button"
               onClick={() => setAutoCalculate(!autoCalculate)}
               className={`text-xs px-2 py-1 rounded flex items-center gap-1 font-bold transition-all ${
                  autoCalculate 
                  ? "bg-green-900/50 text-green-400 border border-green-700 hover:bg-green-900" 
                  : "bg-red-900/50 text-red-400 border border-red-700 hover:bg-red-900"
               }`}
             >
               {autoCalculate ? <><Unlock size={12}/> Calc. Automático: ON</> : <><Lock size={12}/> Calc. Automático: OFF</>}
             </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div><label className="label-text">AC</label><input type="number" {...register("ac", { valueAsNumber: true })} className="input-field text-center" /></div>
            <div><label className="label-text">HP Médio</label><input type="number" {...register("hp_avg", { valueAsNumber: true })} className="input-field text-center" /></div>
            <div className="col-span-2"><label className="label-text">Fórmula HP</label><input {...register("hp_formula")} className="input-field text-center" /></div>
            <div className="col-span-4"><label className="label-text">Deslocamento</label><input {...register("speed")} className="input-field" /></div>
          </div>
          
          <div className="bg-stone-950 p-4 rounded border border-stone-800 grid grid-cols-2 gap-4">
            <div><label className="label-text text-red-400">Dano/Rodada (DPR)</label><input type="number" {...register("dpr", { valueAsNumber: true })} className="input-field text-center" /></div>
            <div><label className="label-text text-red-400">Bônus Ataque Principal</label><input type="number" {...register("attack_bonus", { valueAsNumber: true })} className="input-field text-center" /></div>

            <div className="col-span-2 flex items-center gap-3 bg-stone-900 p-2 rounded">
                <input type="checkbox" id="has-resistance" {...register("has_resistance")} className="w-4 h-4 accent-yellow-500 rounded cursor-pointer" />
                <label htmlFor="has-resistance" className="text-xs font-bold text-stone-300 select-none flex items-center gap-1"><Shield size={14} className="text-yellow-500"/> Resistência/Imunidade?</label>
            </div>
            
            <div className="col-span-2 flex justify-between items-center pt-2 border-t border-stone-800">
               <span className="text-xs font-bold text-stone-500 uppercase">CR (Manual ou Auto):</span>
               <div className="flex items-center gap-2">
                   {/* Permite editar CR manualmente se AutoCalc estiver OFF */}
                   <input 
                      type="number" 
                      step="0.125"
                      {...register("cr", { valueAsNumber: true })} 
                      className={`w-20 bg-transparent text-2xl font-bold text-right outline-none ${autoCalculate ? "text-yellow-500 cursor-not-allowed" : "text-white border-b border-stone-600"}`}
                      readOnly={autoCalculate}
                   />
                   <span className="text-sm text-stone-500 font-bold">({formatCR(data.cr)})</span>
               </div>
            </div>
          </div>
        </div>

        {/* 5. PASSIVAS (TRAITS) */}
        <div className="border-t border-stone-700 pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-stone-400 font-bold text-sm uppercase flex items-center gap-2"><ShieldAlert size={14} /> Traits</h3>
            <button type="button" onClick={() => traitsField.append({ name: "Nova Habilidade", desc: "" })} className="text-xs bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded flex items-center gap-1 transition"><Plus size={12} /> Adicionar</button>
          </div>
          <div className="space-y-4">
            {traitsField.fields.map((field, index) => (
              <div key={field.id} className="bg-stone-800 p-3 rounded border border-stone-700 group relative">
                <div className="flex justify-between mb-2">
                  <input {...register(`traits.${index}.name`)} className="bg-transparent font-bold text-white text-sm outline-none placeholder-stone-500 w-full" placeholder="Nome" />
                  <button type="button" onClick={() => traitsField.remove(index)} className="text-stone-500 hover:text-red-500 transition"><Trash2 size={14} /></button>
                </div>
                <textarea {...register(`traits.${index}.desc`)} className="w-full bg-stone-900/50 text-stone-300 text-xs p-2 rounded outline-none resize-none h-20" placeholder="Descrição..." />
              </div>
            ))}
          </div>
        </div>

        {/* 6. CONJURAÇÃO (USANDO O NOVO SPELL EDITOR) */}
        <div className="border-t border-stone-700 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" {...register("is_spellcaster")} className="w-5 h-5 accent-red-600 rounded cursor-pointer" id="spell-toggle" />
            <label htmlFor="spell-toggle" className="font-bold text-purple-400 flex items-center gap-2 cursor-pointer select-none"><Wand2 size={16} /> Habilitar Conjuração</label>
          </div>
          {data.is_spellcaster && (
            <div className="bg-stone-800/50 p-4 rounded border border-purple-900/30 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Atributo</label>
                  <select {...register("spell_ability")} className="input-field"><option value="int">Inteligência</option><option value="wis">Sabedoria</option><option value="cha">Carisma</option></select>
                </div>
                <div><label className="label-text">Nível Conjurador</label><input type="number" {...register("caster_level", { valueAsNumber: true })} className="input-field" /></div>
              </div>
              <div className="flex gap-4 text-xs text-stone-400 bg-stone-900 p-2 rounded"><span>CD: <b className="text-white">{spellSaveDC}</b></span><span>Atk: <b className="text-white">+{spellAtkBonus}</b></span></div>
              
              {/* COMPONENTE VISUAL DE MAGIAS */}
              <div>
                <label className="label-text mb-2 block">Grimório (Lista de Magias)</label>
                <SpellEditor 
                    initialValue={watch("spell_list_text") || ""}
                    onChange={(val) => setValue("spell_list_text", val)}
                />
              </div>
            </div>
          )}
        </div>

        {/* 7. AÇÕES */}
        <div className="border-t border-stone-700 pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-red-500 font-bold text-sm uppercase flex items-center gap-2"><Sword size={14} /> Ações</h3>
            <button type="button" onClick={() => actionsField.append({ name: "Novo Ataque", desc: "" })} className="text-xs bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded flex items-center gap-1 transition"><Plus size={12} /> Adicionar</button>
          </div>
          <div className="space-y-4">
            {actionsField.fields.map((field, index) => (
              <div key={field.id} className="bg-stone-800 p-3 rounded border border-stone-700 group relative">
                <div className="flex justify-between mb-2">
                  <input {...register(`actions.${index}.name`)} className="bg-transparent font-bold text-white text-sm outline-none placeholder-stone-500 w-full" placeholder="Nome" />
                  <button type="button" onClick={() => actionsField.remove(index)} className="text-stone-500 hover:text-red-500 transition"><Trash2 size={14} /></button>
                </div>
                <textarea {...register(`actions.${index}.desc`)} className="w-full bg-stone-900/50 text-stone-300 text-xs p-2 rounded outline-none resize-none h-20" placeholder="Descrição..." />
              </div>
            ))}
          </div>
        </div>

        {/* 8. LENDÁRIAS */}
        <div className="border-t border-stone-700 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" {...register("is_legendary")} className="w-5 h-5 accent-yellow-500 rounded cursor-pointer" id="legendary-toggle" />
            <label htmlFor="legendary-toggle" className="font-bold text-yellow-500 flex items-center gap-2 cursor-pointer select-none"><Crown size={16} /> Criatura Lendária</label>
          </div>

          {data.is_legendary && (
             <div className="bg-yellow-900/10 p-4 rounded border border-yellow-900/30 space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <h4 className="text-yellow-500 font-bold text-xs uppercase">Opções Lendárias</h4>
                    <button type="button" onClick={() => legendaryField.append({ name: "Ação Lendária", desc: "" })} className="text-xs bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded flex items-center gap-1 transition"><Plus size={12} /> Adicionar</button>
                </div>
                <div className="space-y-4">
                    {legendaryField.fields.map((field, index) => (
                    <div key={field.id} className="bg-stone-800 p-3 rounded border border-stone-700 group relative">
                        <div className="flex justify-between mb-2">
                        <input {...register(`legendary_actions.${index}.name`)} className="bg-transparent font-bold text-white text-sm outline-none placeholder-stone-500 w-full" placeholder="Nome" />
                        <button type="button" onClick={() => legendaryField.remove(index)} className="text-stone-500 hover:text-red-500 transition"><Trash2 size={14} /></button>
                        </div>
                        <textarea {...register(`legendary_actions.${index}.desc`)} className="w-full bg-stone-900/50 text-stone-300 text-xs p-2 rounded outline-none resize-none h-20" placeholder="Descrição..." />
                    </div>
                    ))}
                </div>
             </div>
          )}
        </div>

      </div>
    </div>
    </>
  );
}