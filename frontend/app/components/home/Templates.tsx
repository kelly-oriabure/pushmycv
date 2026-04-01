'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import templatesData from "@/data/templates";
import { useAuth } from "@/contexts/AuthContext";
import { useResumeStore } from "@/app/store/resumeStore";
import LoadingScreen from "@/app/components/LoadingScreen";
import { toast } from "sonner";
import { RESUME_IDS } from "@/constants/resume";

const Templates = () => {
  const templates = templatesData.slice(0, 6);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const setCurrentResumeId = useResumeStore((state) => state.setCurrentResumeId);
  const resetResumeData = useResumeStore((state) => state.resetResumeData);
  const [isLoading, setIsLoading] = useState(false);

  type Template = (typeof templatesData)[number];

  const handleUseTemplate = async (template: Template) => {
    if (authLoading) {
      toast.info("Checking authentication status...");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create a resume.");
      return;
    }

    setIsLoading(true);
    try {
      setCurrentResumeId(RESUME_IDS.TEMP);
      resetResumeData();
      setTimeout(() => {
        router.push(
          `/resume-options?templateId=${template.uuid}&templateName=${encodeURIComponent(template.name)}&color=${encodeURIComponent(
            "#000000"
          )}`
        );
      }, 350);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-gray-50">
      {isLoading && <LoadingScreen title="Preparing your resume..." />}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose from 50+ professional templates
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            All templates are designed by professionals and optimized for ATS systems
            to help you stand out from the competition.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {templates.map((template) => (
            <Link key={template.id} href="/resume-gallery" className="group cursor-pointer">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="h-64 relative bg-gray-100">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {template.name}
                    </h3>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                      {template.categories?.[0] ?? "Template"}
                    </span>
                  </div>

                  <button
                    className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200 group-hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUseTemplate(template);
                    }}
                    disabled={authLoading || isLoading}
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/resume-gallery"
            className="inline-flex border-2 border-primary text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary hover:text-white transition-all duration-200"
          >
            View All Templates
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Templates;
