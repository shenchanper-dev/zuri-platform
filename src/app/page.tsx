import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { PlatformPreview } from '@/components/landing/platform-preview';
import { Features } from '@/components/landing/features';
import { DriverApp } from '@/components/landing/driver-app';
import { ContactForm } from '@/components/landing/contact-form';
import { Footer } from '@/components/landing/footer';


export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PlatformPreview />
        <Features />
        <DriverApp />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
