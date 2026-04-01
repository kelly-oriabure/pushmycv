'use client';
import { Briefcase, Send, Sparkles, Search, BookOpen, Headset, ShieldCheck, Newspaper } from 'lucide-react';
import React from 'react';

const BenefitItem = ({ icon, title }: { icon: React.ElementType, title: string }) => (
    <div className="flex items-start gap-4">
        <div className="w-6 h-6 flex-shrink-0 text-brand-blue">
            {React.createElement(icon, { className: "w-full h-full" })}
        </div>
        <div>
            <h4 className="font-semibold text-brand-gray-900">{title}</h4>
        </div>
    </div>
);


const BenefitsGrid = () => {
    const benefits = [
        { icon: Briefcase, title: 'Quickly tailor your resume for every job posting' },
        { icon: BookOpen, title: 'Access 500+ professional resume templates' },
        { icon: Send, title: 'Match and send your resume to 50 recruiters per week' },
        { icon: Search, title: 'Create unlimited resumes and matching cover letters' },
        { icon: Sparkles, title: 'AI interview training with real questions' },
        { icon: Newspaper, title: 'See every online job board in one simple place' },
    ];

    // const highlightedBenefits = [
    //     { icon: ShieldCheck, title: 'Money-back guarantee during first 7 days' },
    //     { icon: Headset, title: '24/7 customer support' },
    // ]

    return (
        <div className="bg-white p-8 rounded-xl">
            <h3 className="text-xl font-semibold text-brand-gray-900 mb-6 text-center">All Subscription Benefits</h3>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                {benefits.map((benefit, index) => (
                    <BenefitItem key={index} icon={benefit.icon} title={benefit.title} />
                ))}

            </div>
        </div>
    );
};

export default BenefitsGrid; 