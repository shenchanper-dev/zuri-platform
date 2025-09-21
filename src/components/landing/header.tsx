"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navLinks = [
    { href: '#plataforma', label: 'Plataforma' },
    { href: '#conductores', label: 'Conductores' },
    { href: '#registro', label: 'Contacto' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="flex flex-col">
          <h1 className="text-3xl font-bold font-headline tracking-wider text-primary">ZURI</h1>
          <p className="text-xs text-muted-foreground -mt-1 tracking-widest">Servicios logísticos - NEMT</p>
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-foreground/80 hover:text-foreground transition-colors duration-300">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <a href="#registro">Solicitar una Demo</a>
          </Button>
          <Button asChild>
            <Link href="/gateway">Iniciar Sesión</Link>
          </Button>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-card">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center border-b pb-4">
                 <Link href="/" className="flex flex-col" onClick={() => setIsSheetOpen(false)}>
                    <h1 className="text-2xl font-bold font-headline tracking-wider text-primary">ZURI</h1>
                  </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex flex-col space-y-6 mt-8">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-lg text-foreground/80 hover:text-foreground transition-colors duration-300" onClick={() => setIsSheetOpen(false)}>
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto space-y-4">
                 <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <a href="#registro" onClick={() => setIsSheetOpen(false)}>Solicitar una Demo</a>
                  </Button>
                 <Button asChild className="w-full">
                    <Link href="/gateway" onClick={() => setIsSheetOpen(false)}>Iniciar Sesión</Link>
                  </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
