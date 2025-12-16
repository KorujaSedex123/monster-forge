"use client";
import { useState, useRef, ReactNode } from "react";
import Link from "next/link";
import { useFormContext } from "react-hook-form";
import { 
  Upload, ArrowLeft, Sparkles, X, BrainCircuit, FileUp, RotateCcw, Image as ImageIcon, 
  Trash2
} from "lucide-react";
import ImageCropper from "@/app/dnd5e/components/ImageCropper"; // Ajuste o caminho se mover o cropper

interface EditorShellProps {
  title: string;
  themeColor: string; // ex: "emerald", "red", "stone"
  icon: ReactNode;
  
  // Conteúdo Específico
  children: ReactNode; // Os campos do formulário (STR, DEX, etc)
  aiModalContent: (props: { onClose: () => void }) => ReactNode; // O formulário de IA específico
  
  // Ações Específicas
  onReset: () => void;
  onImport: (json: any) => void;
}

export default function EditorShell({ 
  title, themeColor, icon, children, aiModalContent, onReset, onImport 
}: EditorShellProps) {
  const { setValue, watch } = useFormContext();
  const data = watch();
  
  // --- ESTADOS GERAIS ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LÓGICA DE IMAGEM ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setTempImage(reader.result as string); setShowCropper(true); };
      reader.readAsDataURL(file);
    }
    e.target.value = ""; 
  };

  const handleCropComplete = (croppedImage: string) => {
    setValue("imageUrl", croppedImage);
    setShowCropper(false);
    setTempImage(null);
  };

  // --- LÓGICA DE IMPORTAÇÃO ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        onImport(json); // Chama a função específica do módulo para tratar os dados
      } catch (error) {
        alert("Erro ao ler arquivo JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Classes dinâmicas de cor
  const borderColor = `border-${themeColor}-800`;
  const txtColor = `text-${themeColor}-600`;
  const btnColor = `bg-${themeColor}-900/30 border-${themeColor}-700 hover:bg-${themeColor}-800 text-${themeColor}-200`;

  return (
    <>
      {/* CROPPER GLOBAL */}
      {showCropper && tempImage && (
        <ImageCropper imageSrc={tempImage} onCropComplete={handleCropComplete} onCancel={() => setShowCropper(false)} />
      )}

      {/* INPUT OCULTO GLOBAL */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      {/* MODAL DE IA GLOBAL (O conteúdo dentro muda) */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`bg-[#0c0c0c] border ${borderColor} w-full max-w-lg rounded-xl shadow-2xl p-6 relative`}>
                <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X size={20}/></button>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg border ${borderColor} bg-stone-900`}><BrainCircuit className={txtColor} size={24} /></div>
                    <h3 className="text-xl font-bold text-white font-mono">Assistente de Criação</h3>
                </div>
                {/* RENDERIZA O FORMULÁRIO DE IA ESPECÍFICO */}
                {aiModalContent({ onClose: () => setShowAiModal(false) })}
            </div>
        </div>
      )}

      <div className="w-1/2 flex flex-col border-r border-stone-800 bg-stone-950 h-full">
        
        {/* HEADER PADRÃO */}
        <div className="p-4 bg-stone-900/50 border-b border-stone-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <div className={txtColor}>{icon}</div>
                <h2 className="font-bold text-lg text-stone-200 hidden md:block">{title}</h2>
                
                {/* TOOLBAR */}
                <div className="h-6 w-px bg-stone-700 mx-2"></div>
                <button onClick={onReset} className="p-2 bg-stone-800 hover:bg-red-900/50 text-stone-400 hover:text-white rounded transition" title="Limpar"><RotateCcw size={14}/></button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-stone-800 hover:bg-blue-900/50 text-stone-400 hover:text-white rounded transition" title="Importar"><FileUp size={14}/></button>
                <button onClick={() => setShowAiModal(true)} className={`flex items-center gap-2 px-3 py-1 rounded font-bold text-xs transition border ${btnColor}`}><Sparkles size={14}/> IA</button>
            </div>
            <Link href="/" className="text-xs font-bold text-stone-500 hover:text-stone-300 flex items-center gap-1 transition"><ArrowLeft size={14}/> Sair</Link>
        </div>

        {/* ÁREA DE SCROLL (ONDE VÃO OS CAMPOS) */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 text-stone-300">
            
            {/* UPLOAD DE IMAGEM PADRONIZADO */}
            <div className="w-full">
                {!data.imageUrl ? (
                    <div className="relative group bg-stone-900 border-2 border-dashed border-stone-700 rounded-lg hover:border-stone-500 transition cursor-pointer p-4 flex items-center justify-center gap-3">
                        <Upload size={20} className="text-stone-500 group-hover:text-white" />
                        <div><span className="text-sm font-bold text-stone-400 block">Arte do Monstro</span><span className="text-[10px] text-stone-600">Clique para upload</span></div>
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                ) : (
                    <div className="bg-stone-900 border border-stone-700 p-2 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3"><img src={data.imageUrl} className="w-12 h-12 rounded object-cover border border-stone-600" /><span className="text-xs font-bold text-green-500 flex items-center gap-1"><ImageIcon size={12}/> Imagem Definida</span></div>
                        <button type="button" onClick={() => setValue("imageUrl", null)} className="text-stone-500 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                    </div>
                )}
            </div>

            {/* AQUI ENTRAM OS CAMPOS ESPECÍFICOS DO SISTEMA */}
            {children}
        
        </div>
      </div>
    </>
  );
}