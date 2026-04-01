import ProgressIndicator from '@/components/pricing/ProgressIndicator';
import PricingOptions from '@/components/pricing/PricingOptions';
import BenefitsGrid from '@/components/pricing/BenefitsGrid';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import React from 'react';
import CompanyLogos from '@/components/pricing/CompanyLogos';
import Link from 'next/link';

const TrustpilotSocialProof = () => (
    <div className="flex items-center justify-center gap-4 mt-8">
        <span className="font-semibold text-brand-gray-900">Excellent</span>
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-brand-green p-1">
                    <Star className="w-4 h-4 text-white" fill="white" />
                </div>
            ))}
        </div>
        <span className="text-sm text-brand-gray-600">
            <strong>54,243</strong> reviews on
        </span>
        <div className="flex items-center">
            <Star className="w-5 h-5 text-brand-green" fill="#00b67a" />
            <span className="font-bold text-xl text-brand-gray-800">Trustpilot</span>
        </div>
    </div>
)

const PricingPage = () => {
    return (
        <div className="bg-brand-gray-50 min-h-screen font-sans">
            <header className="bg-white border-b border-brand-gray-200 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ProgressIndicator currentStep={2} />
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-brand-gray-900">
                        You're about to get hired faster
                    </h1>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div className="space-y-8">
                        <PricingOptions />
                        <TrustpilotSocialProof />
                    </div>
                    <div className="space-y-6">
                        <BenefitsGrid />
                        <Link href="/payment" className='w-full'>
                            <Button className="w-full bg-brand-green-button hover:bg-brand-green text-lg py-6">
                                Continue
                            </Button>
                        </Link>
                        <p className="text-center text-xs text-brand-gray-400">
                            Cancel any time online or by email <a href="mailto:support@resume.io" className="text-brand-blue underline">support@resume.io</a>
                        </p>
                    </div>
                </div>
                <CompanyLogos />
            </main>
        </div>
    );
};

export default PricingPage; 