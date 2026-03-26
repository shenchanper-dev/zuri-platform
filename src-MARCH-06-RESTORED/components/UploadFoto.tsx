// ============================================================================
// COMPONENTE: UploadFoto para Conductores NEMT
// DESCRIPCIÓN: Upload de foto con drag & drop, preview y compresión
// USO: Integración en ConductorModalNEMT
// ============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';

interface UploadFotoProps {
  onFileSelect: (file: File | null) => void;
  currentPhoto?: string | null;
  disabled?: boolean;
  maxSizeKB?: number;
  acceptedFormats?: string[];
  className?: string;
}

interface PhotoPreview {
  file: File;
  url: string;
  size: number;
}

export default function UploadFoto({
  onFileSelect,
  currentPhoto = null,
  disabled = false,
  maxSizeKB = 2048, // 2MB por defecto
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  className = ''
}: UploadFotoProps) {
  const [preview, setPreview] = useState<PhotoPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar URLs cuando cambie currentPhoto
  useEffect(() => {
    if (!currentPhoto && preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
  }, [currentPhoto]);

  // Validar archivo
  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!acceptedFormats.includes(file.type)) {
      return `Formato no soportado. Usa: JPG, PNG, WEBP`;
    }

    // Validar tamaño
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > maxSizeKB) {
      return `Archivo muy grande. Máximo: ${maxSizeKB}KB (actual: ${Math.round(fileSizeKB)}KB)`;
    }

    return null;
  };

  // Comprimir imagen si es necesario
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calcular dimensiones manteniendo aspecto
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.8 // 80% de calidad
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // Procesar archivo seleccionado
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadError(null);

    try {
      // Validar archivo
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      // Comprimir si es necesario
      const processedFile = await compressImage(file);

      // Crear preview
      const url = URL.createObjectURL(processedFile);
      const newPreview: PhotoPreview = {
        file: processedFile,
        url,
        size: processedFile.size
      };

      // Limpiar preview anterior
      if (preview) {
        URL.revokeObjectURL(preview.url);
      }

      setPreview(newPreview);
      onFileSelect(processedFile);

      console.log('✅ Foto procesada:', {
        name: processedFile.name,
        size: `${Math.round(processedFile.size / 1024)}KB`,
        type: processedFile.type
      });

    } catch (error) {
      console.error('Error procesando imagen:', error);
      setUploadError('Error al procesar la imagen');
    } finally {
      setIsProcessing(false);
    }
  }, [preview, onFileSelect, maxSizeKB, acceptedFormats]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFile(files[0]);
    }
    // Reset input para permitir seleccionar el mismo archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  // Click para abrir selector
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Eliminar foto
  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
    setUploadError(null);
    onFileSelect(null);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, []);

  const displayPhoto = preview?.url || currentPhoto;

  return (
    <div className={`upload-foto-container w-full ${className}`}>
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Área de upload */}
      <div className="space-y-3">
        {displayPhoto ? (
          // Preview de foto
          <div className="relative group">
            <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
              <img
                src={displayPhoto}
                alt="Foto del conductor"
                className="w-full h-48 object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                  <button
                    type="button"
                    onClick={handleClick}
                    disabled={disabled}
                    className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                    title="Cambiar foto"
                  >
                    <Camera size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={disabled}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                    title="Eliminar foto"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Info del archivo */}
            {preview && (
              <div className="text-sm text-gray-500 mt-2 text-center">
                <p className="font-medium truncate">{preview.file.name}</p>
                <p>{Math.round(preview.size / 1024)}KB</p>
              </div>
            )}
          </div>
        ) : (
          // Zona de drop
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
              ${isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              min-h-[200px] flex flex-col items-center justify-center
            `}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-sm text-gray-600">Procesando imagen...</p>
                </>
              ) : (
                <>
                  <div className="p-3 bg-gray-100 rounded-full">
                    {isDragging ? (
                      <Upload className="h-6 w-6 text-blue-500" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isDragging ? 'Suelta la imagen aquí' : 'Subir foto del conductor'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click o arrastra una imagen aquí
                    </p>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    <p>PNG, JPG, WEBP hasta {maxSizeKB}KB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 text-center">{uploadError}</p>
          </div>
        )}
      </div>
    </div>
  );
}