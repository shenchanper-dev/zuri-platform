export function Footer() {
  return (
    <footer className="bg-primary border-t border-white/10">
      <div className="container mx-auto px-6 py-8 text-center text-primary-foreground/70">
        <div className="flex flex-col mb-4 items-center">
          <h1 className="text-2xl font-bold font-headline tracking-wider text-primary-foreground">ZURI</h1>
          <p className="text-xs text-primary-foreground/70 -mt-1 tracking-widest">Servicios logísticos - NEMT</p>
        </div>
        <p>&copy; {new Date().getFullYear()} Zuri.pe. Todos los derechos reservados.</p>
        <div className="flex justify-center space-x-6 mt-4">
          <a href="#" className="hover:text-white">Facebook</a>
          <a href="#" className="hover:text-white">LinkedIn</a>
          <a href="#" className="hover:text-white">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
