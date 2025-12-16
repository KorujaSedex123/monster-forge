"use client";

// Este componente transforma markdown simples (negrito/itálico) em HTML
export default function RichText({ text, className = "" }: { text?: string, className?: string }) {
  if (!text) return null;

  // Função para processar o texto
  const processText = (input: string) => {
    // 1. Substitui **texto** por <b>texto</b>
    let processed = input.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 2. Substitui *texto* ou _texto_ por <i>texto</i>
    processed = processed.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

    // 3. Substitui quebras de linha por <br/>
    processed = processed.replace(/\n/g, '<br/>');

    return processed;
  };

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: processText(text) }} 
    />
  );
}