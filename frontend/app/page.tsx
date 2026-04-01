import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Templates from '@/components/home/Templates';
import Testimonials from '@/components/home/Testimonials';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import ProcessSection from './components/home/ProcessSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-primary/5">
      <Navbar />
      <Hero />
      <ProcessSection />
      {/* <Features /> */}
      <Templates />
      <Features />
      {/* <Statistics /> */}
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
