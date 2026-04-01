const companies = [
  { name: "Google", logo: "G" },
  { name: "Microsoft", logo: "M" },
  { name: "Apple", logo: "A" },
  { name: "Amazon", logo: "A" },
  { name: "Meta", logo: "f" },
  { name: "Netflix", logo: "N" }
];

const SocialProof = () => {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-lg font-semibold text-gray-600 mb-8">
            Trusted by professionals at leading companies worldwide
          </h3>

          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {companies.map((company, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-200"
              >
                <span className="text-2xl font-bold text-gray-700">
                  {company.logo}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Join over 52,268,000 users worldwide
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Create your professional resume in minutes and start landing interviews today.
          </p>
          <button className="bg-secondary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-secondary/90 transition-colors duration-200 shadow-lg hover:shadow-xl">
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
