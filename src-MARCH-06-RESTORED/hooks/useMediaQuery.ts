'use client';

import { useEffect, useState } from 'react';

/**
 * Hook useMediaQuery
 * Detecta cambios en media queries de forma reactiva
 * 
 * Ejemplo:
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Crear media query
    const media = window.matchMedia(query);
    
    // Set inicial
    setMatches(media.matches);

    // Listener para cambios
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Agregar listener (compatible con navegadores antiguos)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback para navegadores antiguos
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  // Evitar hydration mismatch en SSR
  if (!mounted) {
    return false;
  }

  return matches;
}

/**
 * Hook useBreakpoint
 * Retorna el breakpoint actual
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('desktop');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 375) {
        setBreakpoint('mobile-small');
      } else if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else if (width < 1280) {
        setBreakpoint('tablet-large');
      } else if (width < 1920) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('desktop-large');
      }
    };

    updateBreakpoint();

    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  if (!mounted) {
    return 'desktop'; // Default para SSR
  }

  return breakpoint;
}

/**
 * Hooks específicos para cada breakpoint
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

export function useIsTouch(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}
