const stats = [
  {
    number: "52.2M+",
    label: "Users Worldwide",
    description: "Join millions of professionals who trust our platform"
  },
  {
    number: "95%",
    label: "Success Rate",
    description: "Of our users land interviews within 30 days"
  },
  {
    number: "4.8/5",
    label: "User Rating",
    description: "Based on 50,000+ verified reviews"
  },
  {
    number: "15M+",
    label: "Resumes Created",
    description: "Professional resumes built on our platform"
  }
];

const Statistics = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary/90">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Trusted by millions worldwide
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
            Our track record speaks for itself. Join the millions who have
            successfully advanced their careers with our platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-xl font-semibold text-primary-foreground/90 mb-3">
                  {stat.label}
                </div>
                <div className="text-primary-foreground/70 leading-relaxed">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
