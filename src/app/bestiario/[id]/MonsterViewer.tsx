"use client";

import { useForm, FormProvider } from "react-hook-form";
import Link from "next/link";
import MonsterSheet from "@/app/dnd5e/components/MonsterSheet";
import { MonsterData } from "@/app/dnd5e/types";
import { ArrowLeft } from "lucide-react";

interface Props {
  initialData: MonsterData;
}

export default function MonsterViewer({ initialData }: Props) {
  // Inicializamos o formulário com os dados do banco
  const methods = useForm<MonsterData>({
    defaultValues: initialData,
  });

  return (
    <div className="h-screen flex bg-stone-950 overflow-hidden">
        
      {/* Lado Esquerdo: Apenas um Menu de Navegação (Já que não editamos) */}
      <div className="w-[300px] border-r border-stone-800 bg-stone-900 p-6 flex flex-col gap-6">
         <div>
            <Link href="/bestiario" className="text-stone-400 hover:text-white flex items-center gap-2 text-sm font-bold transition mb-6">
                <ArrowLeft size={16}/> Voltar ao Bestiário
            </Link>
            
            <h1 className="text-2xl font-bold text-white mb-2">{initialData.name}</h1>
            <p className="text-stone-500 text-sm italic">{initialData.size} {initialData.type}</p>
         </div>

         <div className="p-4 bg-stone-800/50 rounded border border-stone-700/50 text-sm text-stone-400">
            <p><strong>Modo de Leitura</strong></p>
            <p className="mt-2 text-xs opacity-70">
                Esta ficha é apenas para visualização e impressão. 
                Para editar, crie uma nova versão na Forja.
            </p>
         </div>
      </div>

      {/* Lado Direito: A Ficha (Reutilizando o componente, mas ocupando o resto da tela) */}
      <div className="flex-1 relative">
         {/* O MonsterSheet espera estar dentro de um layout 50%, então forçamos w-full aqui */}
         <div className="absolute inset-0 [&>div]:w-full"> 
            <FormProvider {...methods}>
                <MonsterSheet readOnly={true} />
            </FormProvider>
         </div>
      </div>

    </div>
  );
}