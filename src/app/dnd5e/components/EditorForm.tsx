"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useFormContext, useFieldArray } from "react-hook-form";
import { 
  Sword, Upload, Calculator, Plus, Trash2, Wand2, ShieldAlert, 
  Crown, BookOpen, FileText, CheckCircle2, ArrowLeft, Shield 
} from "lucide-react";
import { MonsterData } from "../types";
import { 
  getModFormatted, formatCR, getProficiency, MONSTER_TYPES, ALIGNMENTS, calculateFinalCR 
} from "../utils";
import ImageCropper from "./ImageCropper";

export default function EditorForm() {
  const { register, watch, setValue, control } = useFormContext<MonsterData>();
  
  // Listas Dinâmicas
  const traitsField = useFieldArray({ control, name: "traits" });
  const actionsField = useFieldArray({ control, name: "actions" });
  const legendaryField = useFieldArray({ control, name: "legendary_actions" });

  const data = watch();

  // --- LÓGICA DA CALCULADORA DE CR (NOVO) ---
  useEffect(() => {
    // Campos que disparam o recálculo
    const { hp_avg, ac, dpr, attack_bonus, has_resistance } = data;

    // Converte os valores para Number, garantindo que não sejam NaN ou undefined
    const safeHp = Number(hp_avg) || 0;
    const safeAc = Number(ac) || 0;
    const safeDpr = Number(dpr) || 0;
    const safeAttackBonus = Number(attack_bonus) || 0;

    // Verifica se os dados essenciais estão presentes para o cálculo
    if (safeHp <= 0 || safeAc <= 0 || safeDpr <= 0) {
      // Se não há dados suficientes, define o CR como 0
      if (data.cr !== 0) {
         setValue('cr', 0, { shouldValidate: true });
      }
      return;
    }

    const newCR = calculateFinalCR(
      safeHp, 
      safeAc, 
      safeDpr, 
      safeAttackBonus,
      has_resistance || false 
    );

    // Atualiza o valor do CR no formulário (Apenas se houver mudança)
    if (newCR !== data.cr) {
      setValue('cr', newCR, { shouldValidate: true });
    }

  }, [data.hp_avg, data.ac, data.dpr, data.attack_bonus, data.has_resistance, data.cr, setValue]);

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

  const removeImage = () => {
    setValue("imageUrl", null);
  };

  const spellSaveDC = 8 + getProficiency(data.cr) + Math.floor((data[data.spell_ability] - 10) / 2);
  const spellAtkBonus = getProficiency(data.cr) + Math.floor((data[data.spell_ability] - 10) / 2);

  return (
    <>
    {/* MODAL DE RECORTE */}
    {showCropper && tempImage && (
        <ImageCropper 
            imageSrc={tempImage} 
            onCropComplete={handleCropComplete} 
            onCancel={() => setShowCropper(false)} 
        />
    )}

    <div className="w-1/2 flex flex-col border-r border-stone-700">
      
      {/* CABEÇALHO DO EDITOR */}
      <div className="p-4 bg-stone-800 border-b border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Sword className="text-red-500" size={20} />
            <h2 className="font-bold text-lg text-stone-200">Editor D&D 5e</h2>
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
          
          {/* Upload Inteligente */}
          <div className="col-span-2">
             {!data.imageUrl ? (
                <div className="relative group bg-stone-800 border-2 border-dashed border-stone-600 rounded-lg hover:border-red-500 hover:bg-stone-700/50 transition cursor-pointer p-4 flex items-center justify-center gap-3">
                    <Upload size={20} className="text-stone-400 group-hover:text-red-400" />
                    <div>
                        <span className="text-sm font-bold text-stone-300 block">Adicionar Arte</span>
                        <span className="text-[10px] text-stone-500">Clique para selecionar e recortar</span>
                    </div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageSelect} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                </div>
             ) : (
                <div className="bg-stone-800 border border-green-900/50 p-3 rounded-lg flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <img src={data.imageUrl} className="w-10 h-10 rounded object-cover border border-stone-600" alt="Pré-visualização da arte" />
                        <div>
                            <span className="text-sm font-bold text-green-400 flex items-center gap-1"><CheckCircle2 size={12}/> Imagem Pronta</span>
                            <span className="text-[10px] text-stone-500">Visível na ficha</span>
                        </div>
                    </div>
                    <button type="button" onClick={removeImage} className="text-stone-500 hover:text-red-400 transition p-2">
                        <Trash2 size={16}/>
                    </button>
                </div>
             )}
          </div>

          <div>
            <label className="label-text">Tamanho</label>
            <select {...register("size")} className="input-field">
              <option>Miúdo</option><option>Pequeno</option><option>Médio</option><option>Grande</option><option>Enorme</option><option>Imenso</option>
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

        {/* 2. CONFIGURAÇÃO DE RESUMO (LORE) */}
        <div className="border-t border-stone-700 pt-6">
           <h3 className="text-blue-400 font-bold text-sm uppercase flex items-center gap-2 mb-4"><BookOpen size={14} /> Resumo & Layout</h3>
           
           <div className="flex flex-col gap-3 mb-4 bg-stone-800 p-3 rounded border border-stone-600">
              <div className="flex items-center gap-3">
                <input 
                    type="checkbox" 
                    id="show-lore"
                    {...register("show_lore")} 
                    className="w-5 h-5 accent-blue-500 rounded cursor-pointer" 
                />
                <label htmlFor="show-lore" className="text-sm font-bold text-stone-200 cursor-pointer flex items-center gap-2 select-none">
                   <FileText size={16}/> Adicionar Texto de História
                </label>
              </div>
           </div>

           {data.show_lore && (
               <textarea 
                 {...register("lore")} 
                 className="w-full bg-stone-800 border border-stone-600 rounded p-3 text-white min-h-[150px] outline-none placeholder-stone-500 animate-in fade-in"
                 placeholder="Escreva a história da criatura..."
               />
           )}
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

        {/* 4. ESTATÍSTICAS DE COMBATE (COM NOVOS CAMPOS E OUTPUT) */}
        <div className="space-y-4 border-t border-stone-700 pt-4">
          <h3 className="text-yellow-500 font-bold text-sm uppercase flex items-center gap-2"><Calculator size={14} /> Estatísticas de Combate</h3>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="label-text">AC</label><input type="number" {...register("ac", { valueAsNumber: true })} className="input-field text-center" /></div>
            <div><label className="label-text">HP Médio</label><input type="number" {...register("hp_avg", { valueAsNumber: true })} className="input-field text-center" /></div>
            <div className="col-span-2"><label className="label-text">Fórmula HP</label><input {...register("hp_formula")} className="input-field text-center" /></div>
            <div className="col-span-4"><label className="label-text">Deslocamento</label><input {...register("speed")} className="input-field" /></div>
          </div>
          
          <div className="bg-stone-950 p-4 rounded border border-stone-800 grid grid-cols-2 gap-4">
            
            {/* Campo de DPR (Dano por Rodada) */}
            <div><label className="label-text text-red-400">Dano/Rodada (DPR)</label><input type="number" {...register("dpr", { valueAsNumber: true })} className="input-field text-center" /></div>
            
            {/* Campo de Bônus de Ataque */}
            <div><label className="label-text text-red-400">Bônus Ataque Principal</label><input type="number" {...register("attack_bonus", { valueAsNumber: true })} className="input-field text-center" /></div>

            {/* CAMPO DE RESISTÊNCIA */}
            <div className="col-span-2 flex items-center gap-3 bg-stone-900 p-2 rounded">
                <input 
                    type="checkbox" 
                    id="has-resistance"
                    {...register("has_resistance")} 
                    className="w-4 h-4 accent-yellow-500 rounded cursor-pointer" 
                />
                <label htmlFor="has-resistance" className="text-xs font-bold text-stone-300 select-none flex items-center gap-1">
                   <Shield size={14} className="text-yellow-500"/> Possui Resistência/Imunidade a Dano? (Afeta CR Defensivo)
                </label>
            </div>
            
            {/* OUTPUT DO CR CALCULADO */}
            <div className="col-span-2 flex justify-between items-center pt-2 border-t border-stone-800">
               <span className="text-xs font-bold text-stone-500 uppercase">CR Calculado:</span>
               <span className="text-2xl font-bold text-yellow-500 transition-colors duration-300">{formatCR(data.cr)}</span>
            </div>
          </div>
        </div>

         {/* 5. PASSIVAS (TRAITS) */}
         <div className="border-t border-stone-700 pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-stone-400 font-bold text-sm uppercase flex items-center gap-2"><ShieldAlert size={14} /> Habilidades Passivas (Traits)</h3>
            <button type="button" onClick={() => traitsField.append({ name: "Nova Habilidade", desc: "" })} className="text-xs bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded flex items-center gap-1 transition">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          <div className="space-y-4">
            {traitsField.fields.map((field, index) => (
              <div key={field.id} className="bg-stone-800 p-3 rounded border border-stone-700 group relative">
                <div className="flex justify-between mb-2">
                  <input {...register(`traits.${index}.name`)} className="bg-transparent font-bold text-white text-sm outline-none placeholder-stone-500 w-full" placeholder="Nome (ex: Anfíbio)" />
                  <button type="button" onClick={() => traitsField.remove(index)} className="text-stone-500 hover:text-red-500 transition"><Trash2 size={14} /></button>
                </div>
                <textarea {...register(`traits.${index}.desc`)} className="w-full bg-stone-900/50 text-stone-300 text-xs p-2 rounded outline-none resize-none h-20" placeholder="Descrição..." />
              </div>
            ))}
          </div>
        </div>

        {/* 6. CONJURAÇÃO */}
        <div className="border-t border-stone-700 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" {...register("is_spellcaster")} className="w-5 h-5 accent-red-600 rounded cursor-pointer" id="spell-toggle" />
            <label htmlFor="spell-toggle" className="font-bold text-purple-400 flex items-center gap-2 cursor-pointer select-none">
              <Wand2 size={16} /> Habilitar Conjuração
            </label>
          </div>
          {data.is_spellcaster && (
            <div className="bg-stone-800/50 p-4 rounded border border-purple-900/30 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Atributo</label>
                  <select {...register("spell_ability")} className="input-field">
                    <option value="int">Inteligência</option><option value="wis">Sabedoria</option><option value="cha">Carisma</option>
                  </select>
                </div>
                <div><label className="label-text">Nível Conjurador</label><input type="number" {...register("caster_level", { valueAsNumber: true })} className="input-field" /></div>
              </div>
              <div className="flex gap-4 text-xs text-stone-400 bg-stone-900 p-2 rounded">
                  <span>CD: <b className="text-white">{spellSaveDC}</b></span><span>Atk: <b className="text-white">+{spellAtkBonus}</b></span>
              </div>
              <div>
                <label className="label-text">Lista de Magias</label>
                <textarea {...register("spell_list_text")} className="input-field min-h-[120px] font-mono text-sm" placeholder="Truques: ..." />
              </div>
            </div>
          )}
        </div>

        {/* 7. AÇÕES */}
        <div className="border-t border-stone-700 pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-red-500 font-bold text-sm uppercase flex items-center gap-2"><Sword size={14} /> Ações</h3>
            <button type="button" onClick={() => actionsField.append({ name: "Novo Ataque", desc: "" })} className="text-xs bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded flex items-center gap-1 transition">
              <Plus size={12} /> Adicionar
            </button>
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
            <label htmlFor="legendary-toggle" className="font-bold text-yellow-500 flex items-center gap-2 cursor-pointer select-none">
              <Crown size={16} /> Criatura Lendária
            </label>
          </div>

          {data.is_legendary && (
             <div className="bg-yellow-900/10 p-4 rounded border border-yellow-900/30 space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <h4 className="text-yellow-500 font-bold text-xs uppercase">Opções Lendárias</h4>
                    <button type="button" onClick={() => legendaryField.append({ name: "Ação Lendária", desc: "" })} className="text-xs bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded flex items-center gap-1 transition">
                    <Plus size={12} /> Adicionar
                    </button>
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