/**
 * BREAKPOINTS GLOBALES - Sistema Responsive
 * Mobile First Approach (2025)
 */

export const BREAKPOINTS = {
  // Mobile
  mobileSmall: 320,      // iPhone SE
  mobile: 375,           // iPhone 12/13/14
  mobileLarge: 425,      // iPhone Plus
  
  // Tablet
  tablet: 768,           // iPad
  tabletLarge: 1024,     // iPad Pro
  
  // Desktop
  desktop: 1280,         // Laptop estándar
  desktopLarge: 1920,    // Full HD
  desktopXL: 2560        // 2K/4K
} as const;

export const MEDIA_QUERIES = {
  // Mobile
  isMobileSmall: `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
  isMobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  isMobileLarge: `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  
  // Tablet
  isTablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  isTabletOnly: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.tabletLarge - 1}px)`,
  
  // Desktop
  isDesktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  isDesktopLarge: `(min-width: ${BREAKPOINTS.desktopLarge}px)`,
  
  // Utility
  isTouch: '(hover: none) and (pointer: coarse)',
  isNotMobile: `(min-width: ${BREAKPOINTS.tablet}px)`,
} as const;

// Helper para usar en componentes
export const getBreakpoint = (width: number): string => {
  if (width < BREAKPOINTS.mobile) return 'mobile-small';
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  if (width < BREAKPOINTS.desktopLarge) return 'desktop';
  return 'desktop-large';
};
