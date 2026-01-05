/**
 * COMPONENTE FOTO UPLOAD
 * Upload con drag & drop, preview circular y validación
 */

import React, { useState, useCallback, useRef } from 'react';
import { FotoUploadProps, getInitials } from '@/domain/entities/Conductor.entity';

export const FotoUpload: React.FC<FotoUploadProps> = ({
  currentFoto,
  onChange,
  nombre = '',
  apellidos = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFoto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuración de validación
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

  // Validar archivo
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Solo se permiten archivos JPG, JPEG y PNG';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo no puede exceder 2MB';
    }
    
    return null;
  };

  // Procesar archivo
  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      return;
    }

    try {
      // Crear preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Simular upload (aquí iría la lógica real de upload)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Llamar callback
      onChange(file, url);
      
    } catch (err) {
      setError('Error al procesar la imagen');
      console.error('Error uploading file:', err);
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  // Handlers de drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Handler de selección de archivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Abrir selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Eliminar foto
  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    onChange(null);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Obtener iniciales para fallback
  const initials = getInitials(nombre, apellidos);

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Label */}
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px'
      }}>
        Foto de Perfil
      </label>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px'
      }}>
        {/* Preview circular */}
        <div style={{
          position: 'relative',
          flexShrink: 0
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #E5E7EB',
            backgroundColor: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {isUploading ? (
              // Loading spinner
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #E5E7EB',
                borderTop: '4px solid #3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : previewUrl ? (
              // Imagen cargada
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover' as const
                }}
              />
            ) : (
              // Fallback con iniciales
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#6B7280',
                textTransform: 'uppercase' as const
              }}>
                {initials}
              </div>
            )}
          </div>

          {/* Botón de eliminar (si hay foto) */}
          {previewUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                border: '2px solid white',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              title="Eliminar foto"
            >
              ×
            </button>
          )}
        </div>

        {/* Área de upload */}
        <div style={{ flex: 1 }}>
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileSelector}
            style={{
              border: `2px dashed ${isDragging ? '#3B82F6' : error ? '#EF4444' : '#D1D5DB'}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center' as const,
              cursor: 'pointer',
              backgroundColor: isDragging ? '#EFF6FF' : error ? '#FEF2F2' : '#FAFAFA',
              transition: 'all 0.2s ease',
              marginBottom: '12px'
            }}
          >
            {/* Icono */}
            <div style={{
              fontSize: '48px',
              color: isDragging ? '#3B82F6' : error ? '#EF4444' : '#9CA3AF',
              marginBottom: '12px'
            }}>
              📸
            </div>

            {/* Texto principal */}
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
            </div>

            {/* Texto secundario */}
            <div style={{
              fontSize: '12px',
              color: '#6B7280'
            }}>
              JPG, JPEG o PNG (máx. 2MB)
            </div>

            {/* Input file oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileSelect}
              autoComplete="off"
              style={{ display: 'none' }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={openFileSelector}
              disabled={isUploading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.5 : 1
              }}
            >
              {previewUrl ? 'Cambiar' : 'Seleccionar'}
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.5 : 1
                }}
              >
                Eliminar
              </button>
            )}
          </div>

          {/* Mensaje de error */}
          {error && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: '6px', flexShrink: 0 }}
              >
                <path
                  d="M8 1.33334C4.32 1.33334 1.33334 4.32 1.33334 8C1.33334 11.68 4.32 14.6667 8 14.6667C11.68 14.6667 14.6667 11.68 14.6667 8C14.6667 4.32 11.68 1.33334 8 1.33334ZM8.66668 11.3333H7.33334V10H8.66668V11.3333ZM8.66668 8.66668H7.33334V4.66668H8.66668V8.66668Z"
                  fill="#DC2626"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Información adicional */}
          <div style={{
            marginTop: '12px',
            fontSize: '11px',
            color: '#6B7280',
            textAlign: 'center' as const
          }}>
            Recomendado: imagen cuadrada de al menos 300x300px para mejor calidad
          </div>
        </div>
      </div>

      {/* CSS para animación de spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FotoUpload;