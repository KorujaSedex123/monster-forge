"use client";
import { useForm, FormProvider } from "react-hook-form";
import EditorForm from "./EditorForm";
import MonsterSheet from "./MonsterSheet";
import { MonsterData } from "../types";

interface Props {
  initialData?: MonsterData; // Dados para preencher (Edição)
  monsterId?: string;        // ID do banco (Edição)
}

export default function DndEditorLayout({ initialData, monsterId }: Props) {
  // Configuração padrão se for criação nova
  const defaultValues: MonsterData = initialData || {
    name: "",
    size: "Médio",
    type: "Humanóide",
    alignment: "Neutro",
    imageUrl: null,
    lore: "",
    show_lore: true,
    lore_on_new_page: false,
    imageScale: 100, imageX: 0, imageY: 0,
    ac: 10, hp_avg: 10, hp_formula: "2d8 + 2", speed: "30 ft.",
    dpr: 0, attack_bonus: 0,
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    cr: 1,
    traits: [], actions: [], legendary_actions: [],
    is_legendary: false, is_spellcaster: false, spell_ability: "int", caster_level: 1, spell_list_text: "",
  };

  const methods = useForm<MonsterData>({
    defaultValues: defaultValues,
  });

  return (
    <FormProvider {...methods}>
      <div className="flex h-screen overflow-hidden bg-stone-950">
        {/* Esquerda: Formulário */}
        <EditorForm />
        
        {/* Direita: Ficha (Recebe o ID para saber se deve atualizar) */}
        <MonsterSheet monsterId={monsterId} />
      </div>
    </FormProvider>
  );
}