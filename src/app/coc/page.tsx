"use client";
import { FormProvider, useForm } from "react-hook-form";
import CocEditorForm from "./components/CocEditorForm";
import CocSheet from "./components/CocSheet";
import { CocMonsterData } from "./types";

export default function CocCreatePage() {
  const methods = useForm<CocMonsterData>({
    defaultValues: {
      name: "",
      str: 50, con: 50, siz: 50, dex: 50,
      app: 50, int: 50, pow: 50, edu: 50,
      hp: 10, mp: 10, move: 8, build: 0, db: "0",
      attacks: [],
      skills: [],
      special_powers: [],
      san_loss: "0/1d4"
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="flex h-screen w-full bg-black overflow-hidden">
        <CocEditorForm />
        <CocSheet />
      </div>
    </FormProvider>
  );
}