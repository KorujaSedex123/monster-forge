export async function generateMonsterImage(prompt: string, style: 'fantasy' | 'horror'): Promise<string> {
  // Melhora o prompt baseado no estilo
  const stylePrompt = style === 'fantasy' 
    ? "fantasy art, dnd style, detailed digital painting, dramatic lighting, highly detailed, 8k"
    : "lovecraftian horror, call of cthulhu style, vintage photograph, grainy, eerie, dark, scary, black and white photography, 1920s style";

  // Codifica o prompt para URL
  const finalPrompt = encodeURIComponent(`${prompt}, ${stylePrompt}`);
  const url = `https://image.pollinations.ai/prompt/${finalPrompt}?width=1024&height=1024&nologo=true&seed=${Math.random()}`;

  try {
    // Busca a imagem como Blob
    const response = await fetch(url);
    const blob = await response.blob();

    // Converte para Base64 (Data URL) para o Cropper aceitar
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    throw new Error("Falha ao gerar a imagem da IA.");
  }
}