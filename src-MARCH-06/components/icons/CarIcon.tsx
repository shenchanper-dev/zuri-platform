/**
 * CarIcon - Ícono de auto estilo Uber/Cabify para mapas
 * Muestra dirección del vehículo y rota según heading GPS
 */

import React from 'react';

interface CarIconProps {
    heading?: number;      // 0-360 grados (0=Norte, 90=Este, 180=Sur, 270=Oeste)
    color?: string;        // Color del auto
    size?: number;         // Tamaño en px
    showShadow?: boolean;  // Mostrar sombra
}

export const CarIcon: React.FC<CarIconProps> = ({
    heading = 0,
    color = '#1f2937',
    size = 40,
    showShadow = true,
}) => {
    return (
        <div
            style={{
                width: `${size}px`,
                height: `${size}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${heading}deg)`,
                transition: 'transform 0.3s ease-out',
            }}
        >
            <svg
                width={size * 0.8}
                height={size * 0.8}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: showShadow ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
                }}
            >
                {/* Carrocería principal */}
                <path
                    d="M16 2 L22 8 L22 24 L20 26 L12 26 L10 24 L10 8 Z"
                    fill={color}
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />

                {/* Parabrisas delantero */}
                <path
                    d="M14 6 L18 6 L20 9 L12 9 Z"
                    fill="#60a5fa"
                    opacity="0.6"
                    stroke="white"
                    strokeWidth="0.5"
                />

                {/* Parabrisas trasero */}
                <path
                    d="M12 21 L20 21 L18 24 L14 24 Z"
                    fill="#60a5fa"
                    opacity="0.4"
                    stroke="white"
                    strokeWidth="0.5"
                />

                {/* Faros delanteros (indicadores frontales) */}
                <circle cx="13" cy="4" r="1.5" fill="#fef08a" stroke="white" strokeWidth="0.5" />
                <circle cx="19" cy="4" r="1.5" fill="#fef08a" stroke="white" strokeWidth="0.5" />

                {/* Luces traseras */}
                <rect x="11" y="26" width="2" height="1.5" fill="#ef4444" rx="0.5" />
                <rect x="19" y="26" width="2" height="1.5" fill="#ef4444" rx="0.5" />

                {/* Espejos laterales */}
                <rect x="8" y="12" width="2" height="3" fill={color} stroke="white" strokeWidth="0.5" rx="0.5" />
                <rect x="22" y="12" width="2" height="3" fill={color} stroke="white" strokeWidth="0.5" rx="0.5" />

                {/* Indicador de dirección (flecha superior para frente) */}
                <path
                    d="M16 0 L18 2 L14 2 Z"
                    fill="white"
                    stroke={color}
                    strokeWidth="0.5"
                />
            </svg>
        </div>
    );
};

/**
 * Genera string HTML de CarIcon para usar en Leaflet markers
 * (Leaflet requiere HTML string, no React components)
 */
export const getCarIconHTML = (
    heading: number = 0,
    color: string = '#1f2937',
    size: number = 40
): string => {
    return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(${heading}deg);
      transition: transform 0.3s ease-out;
    ">
      <svg
        width="${size * 0.8}"
        height="${size * 0.8}"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"
      >
        <path
          d="M16 2 L22 8 L22 24 L20 26 L12 26 L10 24 L10 8 Z"
          fill="${color}"
          stroke="white"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <path
          d="M14 6 L18 6 L20 9 L12 9 Z"
          fill="#60a5fa"
          opacity="0.6"
          stroke="white"
          stroke-width="0.5"
        />
        <path
          d="M12 21 L20 21 L18 24 L14 24 Z"
          fill="#60a5fa"
          opacity="0.4"
          stroke="white"
          stroke-width="0.5"
        />
        <circle cx="13" cy="4" r="1.5" fill="#fef08a" stroke="white" stroke-width="0.5" />
        <circle cx="19" cy="4" r="1.5" fill="#fef08a" stroke="white" stroke-width="0.5" />
        <rect x="11" y="26" width="2" height="1.5" fill="#ef4444" rx="0.5" />
        <rect x="19" y="26" width="2" height="1.5" fill="#ef4444" rx="0.5" />
        <rect x="8" y="12" width="2" height="3" fill="${color}" stroke="white" stroke-width="0.5" rx="0.5" />
        <rect x="22" y="12" width="2" height="3" fill="${color}" stroke="white" stroke-width="0.5" rx="0.5" />
        <path
          d="M16 0 L18 2 L14 2 Z"
          fill="white"
          stroke="${color}"
          stroke-width="0.5"
        />
      </svg>
    </div>
  `;
};

export default CarIcon;
