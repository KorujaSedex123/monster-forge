import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "No API Key" }, { status: 500 });

    try {
        const { name, concept, powerLevel } = await req.json();

        // Define a escala de atributos baseada no nível escolhido
        let statScale = "Humanos normais (30-60)";
        if (powerLevel === "monster") statScale = "Monstruosidade (80-140)";
        if (powerLevel === "god") statScale = "Entidade Cósmica/Deus (200-500+)";

        const systemPrompt = `
        Você é um Guardião (Keeper) especialista em Call of Cthulhu 7ª Edição.
        Sua tarefa é criar uma ficha técnica completa em JSON VÁLIDO.
        Idioma: Português do Brasil.

        DIRETRIZES DE ESCALA (${powerLevel}):
        - Atributos (STR, CON, etc) devem seguir a escala: ${statScale}.
        - Se for 'god' ou 'monster', o san_loss deve ser alto (ex: 1d10/1d100).

        ESTRUTURA JSON OBRIGATÓRIA:
        {
            "name": "string",
            "description": "string (Texto atmosférico)",
            "str": number, "con": number, "siz": number, "dex": number, 
            "app": number, "int": number, "pow": number, "edu": number,
            "move": number,
            "armor": "string",
            "san_loss": "string",
            "attacks": [
                { "name": "string", "skill_level": number, "damage": "string", "desc": "string" }
            ],
            "skills": [
                { "name": "string", "value": number }
            ],
            "special_powers": [
                { "name": "string", "desc": "string" }
            ],
            "spells": "string"
        }
        `;

        let userPrompt = `Conceito: "${concept}".`;
        if (name) userPrompt += ` Nome obrigatório: "${name}".`;
        else userPrompt += ` Crie um nome aterrorizante ou misterioso.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const jsonContent = completion.choices[0]?.message?.content;
        if (!jsonContent) throw new Error("Falha na geração");

        return NextResponse.json(JSON.parse(jsonContent));

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}