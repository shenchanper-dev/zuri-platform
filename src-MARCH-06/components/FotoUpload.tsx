import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getInitials } from '@/domain/entities/Conductor.entity';

interface FotoUploadProps {
  currentFoto: any;
  onChange: (file: File | null) => void;
  nombre?: string;
  apellidos?: string;
}

export const FotoUpload: React.FC<FotoUploadProps> = ({
  currentFoto,
  onChange,
  nombre = '',
  apellidos = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔄 Efecto para manejar la vista previa (si es URL existente o un archivo nuevo)
  useEffect(() => {
    if (!currentFoto) {
      setPreviewUrl(null);
    } else if (typeof currentFoto === 'string') {
      setPreviewUrl(currentFoto); // Es una URL de la DB
    } else if (currentFoto instanceof File) {
      const objectUrl = URL.createObjectURL(currentFoto);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [currentFoto]);

  const processFile = useCallback((file: File) => {
    if (file.size > 2 * 1024 * 1024) return alert('El archivo no puede exceder 2MB');
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) return alert('Solo JPG o PNG');
    
    onChange(file); // Enviamos el archivo al componente padre
  }, [onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const initials = getInitials(nombre, apellidos);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
  relative group cursor-pointer transition-all duration-300
  w-40 h-40 min-w-[160px] min-h-[160px] /* 👈 Forzamos tamaño mínimo */
  flex-shrink-0 /* 👈 EVITA QUE SE APLASTE */
  aspect-square /* 👈 FUERZA CÍRCULO PERFECTO 1:1 */
  rounded-full border-4 shadow-xl flex items-center justify-center overflow-hidden
  ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-white bg-slate-100'}
  ${!previewUrl ? 'border-dashed border-slate-300' : ''}
`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <span className="text-3xl font-black text-slate-300 uppercase">{initials || '??'}</span>
          </div>
        )}

        {/* Overlay al pasar el mouse */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-[10px] font-bold uppercase">Cambiar Foto</span>
        </div>

        {/* Botón eliminar */}
        {previewUrl && (
          <button
            onClick={handleRemove}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
          >
            ×
          </button>
        )}
      </div>

      <input 
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
    </div>
  );
};