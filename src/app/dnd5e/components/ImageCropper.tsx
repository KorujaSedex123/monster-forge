"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../canvasUtils";
import { Check, X, ZoomIn } from "lucide-react";

type Props = {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
};

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-stone-900 w-full max-w-2xl rounded-xl overflow-hidden border border-stone-700 flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-700 flex justify-between items-center">
            <h3 className="text-white font-bold">Ajustar Imagem</h3>
            <button onClick={onCancel} className="text-stone-400 hover:text-white"><X size={20}/></button>
        </div>

        {/* Área de Recorte */}
        <div className="relative flex-1 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // Força quadrado (ou remova para livre)
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={onZoomChange}
            style={{
                containerStyle: { background: "#1c1917" },
                cropAreaStyle: { border: "2px solid #ef4444" }
            }}
          />
        </div>

        {/* Controles */}
        <div className="p-4 bg-stone-800 border-t border-stone-700 flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <ZoomIn size={16} className="text-stone-400"/>
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                />
            </div>
            
            <div className="flex justify-end gap-2">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 rounded bg-stone-700 text-white hover:bg-stone-600 font-bold text-sm"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 font-bold text-sm flex items-center gap-2"
                >
                    <Check size={16}/> Confirmar Recorte
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}