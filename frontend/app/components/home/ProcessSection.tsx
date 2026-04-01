
const ProcessSection = () => {
  const steps = [
    {
      icon: "📄",
      title: "Upload your resume",
      description: "Click \"Upload My Resume\" and select a PDF file. Our AI will process and analyze the content."
    },
    {
      icon: "✏️", 
      title: "Edit sections and refine your content",
      description: "Explore the structure or add details about your experience, education, and skills. Need more sections? We've got plenty."
    },
    {
      icon: "⬇️",
      title: "Download your edited resume", 
      description: "We've saved hours on resume improvement – now use that extra time for cover letter and online profiles."
    }
  ];

  return (
    <section className="w-full py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 flex justify-center items-center">
            <img 
              src="/images/cv-2.png" 
              alt="Resume improvement process showing before and after comparison"
              className="w-[420px] h-[600px] rounded-lg shadow-lg"
            />
          </div>
          
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Improve your <span className="text-secondary">CV in 3 simple steps</span>
              </h2>
            </div>
            
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-xl">
                    {step.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4">
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Upload My Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;