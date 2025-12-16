"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";

interface SpellGroup {
  id: string;
  level: string; // Ex: "Truques" ou "Nível 1 (4 espaços)"
  spells: string; // Ex: "Raio de Fogo, Prestidigitação"
}

interface SpellEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
}

export default function SpellEditor({ initialValue, onChange }: SpellEditorProps) {
  const [groups, setGroups] = useState<SpellGroup[]>([]);

  // 1. Ao carregar, tenta "ler" o texto que veio da IA ou do banco
  useEffect(() => {
    if (!initialValue) {
        setGroups([]); 
        return;
    }

    // Se já estivermos editando via grupos, não sobrescreve
    // Esta verificação simples evita loops infinitos se o formato for compatível
    const currentString = groups.map(g => `**${g.level}:** ${g.spells}`).join("\n");
    if (currentString === initialValue) return;

    // Tenta separar por linhas ou marcadores comuns
    // Exemplo esperado: "**Truques:** Magia A, Magia B"
    const lines = initialValue.split(/\n/);
    const parsed: SpellGroup[] = [];

    lines.forEach((line, idx) => {
      // Tenta achar o padrão "Negrito: Texto"
      const match = line.match(/\*\*(.*?):\*\*\s*(.*)/) || line.match(/(.*?):\s*(.*)/);
      if (match) {
        parsed.push({
          id: Date.now().toString() + idx,
          level: match[1].trim(),
          spells: match[2].trim()
        });
      } else if (line.trim() !== "") {
        // Se for uma linha solta, adiciona como nota ou continua o anterior
        if (parsed.length > 0) {
            parsed[parsed.length - 1].spells += " " + line.trim();
        } else {
            parsed.push({ id: Date.now().toString(), level: "Geral", spells: line.trim() });
        }
      }
    });

    if (parsed.length > 0) setGroups(parsed);
  }, [initialValue]); // Roda quando o valor externo muda (ex: IA gerou)

  // 2. Atualiza o texto final sempre que um grupo muda
  const updateParent = (newGroups: SpellGroup[]) => {
    setGroups(newGroups);
    // Formata como Markdown para salvar no banco
    // Ex: "**Truques:** Luz, Chamas\n**Nível 1:** Escudo"
    const textOutput = newGroups
      .map(g => `**${g.level}:** ${g.spells}`)
      .join("\n");
    onChange(textOutput);
  };

  const addGroup = () => {
    updateParent([...groups, { id: Date.now().toString(), level: "", spells: "" }]);
  };

  const removeGroup = (index: number) => {
    const newGroups = [...groups];
    newGroups.splice(index, 1);
    updateParent(newGroups);
  };

  const updateGroup = (index: number, field: 'level' | 'spells', value: string) => {
    const newGroups = [...groups];
    newGroups[index][field] = value;
    updateParent(newGroups);
  };

  return (
    <div className="space-y-3">
      {groups.map((group, index) => (
        <div key={group.id} className="flex gap-2 items-start bg-stone-900/50 p-2 rounded border border-stone-700 animate-in fade-in slide-in-from-left-2">
          <div className="flex-1 space-y-2">
            <input 
                value={group.level}
                onChange={(e) => updateGroup(index, 'level', e.target.value)}
                placeholder="Nível (ex: Truques, Nível 3...)"
                className="w-full bg-stone-950 text-yellow-500 font-bold text-xs p-1 px-2 rounded border border-stone-800 focus:border-yellow-600 outline-none"
            />
            <textarea 
                value={group.spells}
                onChange={(e) => updateGroup(index, 'spells', e.target.value)}
                placeholder="Lista de magias (ex: Bola de Fogo, Voo...)"
                className="w-full bg-transparent text-stone-300 text-sm p-1 px-2 outline-none resize-none h-auto min-h-[40px] border-b border-transparent focus:border-stone-600 transition-all"
                rows={1}
            />
          </div>
          <button 
            type="button" 
            onClick={() => removeGroup(index)}
            className="text-stone-600 hover:text-red-500 p-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button 
        type="button" 
        onClick={addGroup}
        className="w-full py-2 border border-dashed border-stone-700 hover:border-purple-500 hover:bg-purple-900/10 text-stone-500 hover:text-purple-400 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all"
      >
        <Plus size={14} /> Adicionar Nível de Magia
      </button>
    </div>
  );
}