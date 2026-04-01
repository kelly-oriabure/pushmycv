import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";

const LoadingPage = () => (
    <div className="min-h-screen bg-gradient-hero">
    <Navbar />
   <LoadingScreen />
   <Footer />
    </div>
);

export default LoadingPage;
