import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import AITools from "@/components/AITools";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <AITools />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}