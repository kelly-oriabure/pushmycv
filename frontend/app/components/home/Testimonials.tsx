import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Software Engineer",
    company: "Google",
    image: "SJ",
    rating: 5,
    text: "This resume builder helped me land my dream job at Google. The templates are professional and the AI suggestions were incredibly helpful."
  },
  {
    name: "Michael Chen",
    role: "Marketing Director",
    company: "Microsoft",
    image: "MC",
    rating: 5,
    text: "I've tried many resume builders, but this one stands out. The ATS optimization feature ensured my resume got through the screening process."
  },
  {
    name: "Emily Rodriguez",
    role: "Product Manager",
    company: "Apple",
    image: "ER",
    rating: 5,
    text: "The expert review feature provided invaluable feedback. I received 3x more interview calls after updating my resume with their suggestions."
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What our users are saying
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what professionals are saying
            about their experience with our resume builder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <div className="relative">
                <Quote className="w-6 h-6 text-primary/30 mb-3" />
                <p className="text-gray-700 leading-relaxed">
                  {testimonial.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors duration-200 shadow-lg hover:shadow-xl">
            Start Your Success Story
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
