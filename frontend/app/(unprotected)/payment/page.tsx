import ProgressIndicator from '@/components/pricing/ProgressIndicator';
import PricingOptions from '@/components/pricing/PricingOptions';
import BenefitsGrid from '@/components/pricing/BenefitsGrid';
import PaymentForm from '@/components/payment/PaymentForm';
import React from 'react';
import { Star } from 'lucide-react';

const PaymentPage = () => {
    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* Progress Indicator */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-8">
                    <ProgressIndicator currentStep={2} />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Left: Pricing Options and Benefits */}
                    <div className="space-y-8">
                        <PricingOptions />
                        <BenefitsGrid />

                    </div>
                    {/* Right: Payment Button */}
                    <div className="flex flex-col justify-end w-full">
                        <div className="bg-white rounded-xl shadow p-6 w-full">
                            <PaymentForm />
                        </div>
                    </div>
                </div>
                {/* <div className="text-center text-sm text-gray-500 mt-8">
                    Cancel any time online or by email <a href="mailto:support@resume.io" className="text-blue-600 underline">support@resume.io</a>
                </div> */}
            </main>

            <footer className="w-full bg-gray-100 py-4 mt-12 text-center text-sm text-gray-500">
                © 2024 PushMyCV. All rights reserved.
            </footer>
        </div>
    );
};

export default PaymentPage; 