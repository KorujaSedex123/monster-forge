import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
            { error: "GROQ_API_KEY não configurada no servidor." },
            { status: 500 }
        );
    }

    try {
        // Recebendo o novo parâmetro 'force_legendary'
        const { name, concept, cr, size, type, force_spellcaster, force_legendary } = await req.json();

        if (!concept) {
            return NextResponse.json({ error: "Conceito é obrigatório." }, { status: 400 });
        }
        
        const systemPrompt = `
        Você é um autor experiente de bestiários para Dungeons & Dragons 5e (SRD).
        Sua missão é criar monstros mecânica e narrativamente interessantes.
        Idioma: Português do Brasil.
        
        DIRETRIZES TÉCNICAS (CRÍTICO):
        1. Responda APENAS o JSON.
        2. FORMATO JSON: NUNCA use o sinal '+' para números positivos (Ex: use 5, NÃO use +5).
        
        DIRETRIZES DE CONTEÚDO:
        1. 'name': Se não fornecido, crie um NOME PRÓPRIO ou TÍTULO (Evite "Zumbi de Fogo", prefira "Brasa-Morta").
        2. 'lore': Escreva um texto imersivo (2 a 3 parágrafos).
        3. 'tactics': Descreva a inteligência de combate.
        4. Se 'is_legendary' for true, GERE 3 Ações Lendárias.
       5. Se 'is_spellcaster' for true, use APENAS magias oficiais. Formate a lista usando Markdown: "**Nível X:** Magias..." separado por quebras de linha.

        ESTRUTURA JSON OBRIGATÓRIA:
        {
            "name": "string",
            "size": "string",
            "type": "string",
            "alignment": "string",
            "ac": number,
            "hp_formula": "string (ex: 10d8 + 30)",
            "speed": "string",
            "str": number, "dex": number, "con": number, "int": number, "wis": number, "cha": number,
            "dpr": number,
            "attack_bonus": number,
            "cr": number,
            "lore": "string",
            "tactics": "string",
            "is_spellcaster": boolean,
            "spell_ability": "string (int, wis ou cha)",
            "caster_level": number,
            "spell_list_text": "string (Use quebras de linha. Ex: '**Truques:** Luz\\n**Nível 1:** Escudo')",
            "traits": [{"name": "string", "desc": "string"}],
            "actions": [{"name": "string", "desc": "string"}],
            "is_legendary": boolean,
            "legendary_actions": [{"name": "string", "desc": "string"}]
        }
        `;

        let userPrompt = `Crie um monstro D&D 5e.
        Conceito Principal: "${concept}".
        Nível de Desafio (CR): ${cr}.
        Tamanho: ${size}.
        Tipo: ${type || "Apropriado ao conceito"}.
        `;
        
        // --- LÓGICA DE NOME ---
        if (name && name.trim() !== "") {
            userPrompt += ` Nome da Criatura (Obrigatório): "${name}".`;
        } else {
            userPrompt += ` Crie um nome criativo (Título ou Nome Próprio). Evite nomes genéricos descritivos.`;
        }

        // --- LÓGICA DE MAGIA ---
        if (force_spellcaster) {
            userPrompt += ` IMPORTANTE: Esta criatura É UM CONJURADOR. Defina 'is_spellcaster': true e preencha a lista de magias.`;
        } else {
            userPrompt += ` IMPORTANTE: Esta criatura NÃO usa magias. Defina 'is_spellcaster': false.`;
        }

        // --- LÓGICA DE LENDÁRIO (NOVA) ---
        if (force_legendary) {
            userPrompt += ` IMPORTANTE: Esta criatura É LENDÁRIA (Chefe). Defina 'is_legendary': true e crie 3 Ações Lendárias poderosas.`;
        } else {
            userPrompt += ` IMPORTANTE: Esta criatura NÃO É LENDÁRIA. Defina 'is_legendary': false e deixe 'legendary_actions' vazio, mesmo que o CR seja alto.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.85,
            max_tokens: 3500,
            response_format: { type: "json_object" },
        });

        const jsonContent = completion.choices[0]?.message?.content;

        if (!jsonContent) {
            throw new Error("A IA não retornou conteúdo.");
        }

        const generatedData = JSON.parse(jsonContent);

        // --- PÓS-PROCESSAMENTO ---
        const fullMonsterData = {
            ...generatedData,
            ac: generatedData.ac || (10 + Math.floor((generatedData.dex - 10) / 2)),
            hp_avg: 0,
            imageUrl: null,
            imageScale: 1,
            imageX: 0,
            imageY: 0,
            show_lore: true,
            lore_on_new_page: false,
            // Previne falhas se a IA não mandar os arrays
            legendary_actions: generatedData.legendary_actions || [],
            actions: generatedData.actions || [],
            traits: generatedData.traits || [],
            has_resistance: false,
            // Força o valor dos checkboxes
            is_spellcaster: force_spellcaster ? true : false,
            is_legendary: force_legendary ? true : false, 
        };

        if (!fullMonsterData.spell_ability) fullMonsterData.spell_ability = "int";

        const hpMatch = fullMonsterData.hp_formula ? fullMonsterData.hp_formula.match(/(\d+)d(\d+)\s*\+?\s*(\d+)?/) : null;
        if (hpMatch) {
             const [_, numDice, dieSize, bonusStr] = hpMatch;
             const bonus = parseInt(bonusStr || '0', 10);
             fullMonsterData.hp_avg = Math.floor((parseInt(numDice) * (parseInt(dieSize) + 1) / 2) + bonus);
        } else {
            const conMod = Math.floor((fullMonsterData.con - 10) / 2);
            fullMonsterData.hp_avg = (fullMonsterData.cr || 1) * 10 + 10; 
            fullMonsterData.hp_formula = `${Math.max(1, Math.floor(fullMonsterData.cr))}d8 + ${Math.max(0, conMod * Math.floor(fullMonsterData.cr))}`;
        }

        return NextResponse.json(fullMonsterData);

    } catch (error: any) {
        console.error("Erro na API Groq:", error);
        return NextResponse.json(
            { error: `Erro na IA: ${error.message}` },
            { status: 500 }
        );
    }
}