import { FileText, Zap, Shield, Download, Users, Trophy } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: "Professional Templates",
    description: "Choose from 50+ ATS-friendly templates designed by career experts"
  },
  {
    icon: Zap,
    title: "AI-Powered Builder",
    description: "Get intelligent suggestions and content recommendations as you build"
  },
  {
    icon: Shield,
    title: "ATS Optimized",
    description: "Ensure your resume passes through applicant tracking systems"
  },
  {
    icon: Download,
    title: "Multiple Formats",
    description: "Export your resume in PDF, Word, and other popular formats"
  },
  {
    icon: Users,
    title: "Expert Reviews",
    description: "Get your resume reviewed by industry professionals"
  },
  {
    icon: Trophy,
    title: "Success Guarantee",
    description: "Land more interviews or get your money back"
  }
];

const Features = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to land your dream job
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive suite of tools and features helps you create a standout resume
            that gets noticed by employers and passes ATS systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
