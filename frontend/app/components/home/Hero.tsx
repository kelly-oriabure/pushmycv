"use client"

import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Hero = () => {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageRef.current) return;

    // Use GSAP context for proper cleanup
    const ctx = gsap.context(() => {
      // Set initial position
      gsap.set(imageRef.current, {
        y: 3
      });

      // Create smooth floating animation
      gsap.to(imageRef.current, {
        y: -70,
        duration: 0.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/10 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {/* <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">Trusted by 52,268,000+ users</span>
            </div> */}

            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Automated Job Applications &{' '}<br />
                <span className="text-primary">AI Resume Builder</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Create a professional resume in minutes with our AI-powered builder.
                Stand out from the crowd and land your dream job.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth" className="bg-primary hover:bg-primary/90 text-white px-8 p-2 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex justify-center items-center">
                Start Building
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/resume-gallery" className="border-2 border-primary text-primary hover:bg-primary/10 px-8 py-2 text-lg font-semibold rounded-lg">
                View Templates
              </Link>
            </div>

            {/* <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">4.5/5</div>
                <div className="text-sm text-gray-600">Average rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">15M+</div>
                <div className="text-sm text-gray-600">Resumes created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">95%</div>
                <div className="text-sm text-gray-600">Success rate</div>
              </div>
            </div> */}
          </div>

          <div className="relative">
            <img
              ref={imageRef}
              src="/images/hero-cv-4.png"
              alt="AI Resume Builder"
              width={550}
              height={550}
              className="relative z-10 transition-transform duration-300"
            />
            {/* 
            <img
              src="/images/resume-float.gif"
              alt="AI Resume Builder"
              width={500}
              height={500}
              className="relative z-10 transition-transform duration-300"
            /> */}

            <div className="pointer-events-none absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="pointer-events-none absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
