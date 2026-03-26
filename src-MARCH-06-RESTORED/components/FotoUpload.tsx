import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getInitials } from '@/domain/entities/Conductor.entity';

interface FotoUploadProps {
  currentFoto: any;
  // El onChange puede recibir File (para componentes que no hacen conversión)
  // o ser una función async pero se llama siempre con File o null desde aquí
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

  // 🔄 Efecto para manejar la vista previa sin importar si es URL, Base64 o File
  useEffect(() => {
    if (!currentFoto) {
      setPreviewUrl(null);
    } else if (typeof currentFoto === 'string') {
      // Es una URL de DB o un string Base64 — ambos son válidos como src de img
      setPreviewUrl(currentFoto);
    } else if (currentFoto instanceof File) {
      const objectUrl = URL.createObjectURL(currentFoto);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [currentFoto]);

  const processFile = useCallback((file: File) => {
    // Validaciones
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede exceder 5MB (se comprimirá automáticamente)');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }

    // Vista previa inmediata mientras el padre procesa
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    onChange(file); // Enviamos el archivo al componente padre para que lo comprima
  }, [onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
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
          w-40 h-40 min-w-[160px] min-h-[160px]
          flex-shrink-0
          aspect-square
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
            <p className="text-[9px] text-slate-400 mt-1 font-medium">Click para subir</p>
          </div>
        )}

        {/* Overlay al pasar el mouse */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-[10px] font-bold uppercase">Cambiar Foto</span>
        </div>

        {/* Botón eliminar */}
        {previewUrl && (
          <button
            type="button"
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
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
    </div>
  );
};