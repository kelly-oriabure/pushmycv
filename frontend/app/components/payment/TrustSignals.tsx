import { CheckCircle, ShieldCheck, Star } from 'lucide-react';
import React from 'react';

const TrustSignals = () => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-brand-gray-900 mb-4">Get your dream job</h2>
                <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-blue" />
                        <span>Payment through a trusted payment service</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-blue" />
                        <span>SSL Secure / 256-bit SSL secure checkout</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-blue" />
                        <span>7-day money back guarantee</span>
                    </li>
                </ul>
            </div>
            <div>
                <h3 className="font-bold text-brand-gray-900 mb-2">How Can I Cancel?</h3>
                <p className="text-sm text-brand-gray-600">
                    You can quickly and easily cancel your subscription simply by contacting our support team via email or telephone or do it yourself on the "My account" page.
                </p>
            </div>
            <div>
                <h3 className="font-bold text-brand-gray-900 mb-2">Money-Back Guarantee!</h3>
                <p className="text-sm text-brand-gray-600">
                    If you are not fully satisfied and still within the 7 day trial period, simply let us know and we will happily process a full refund.
                </p>
            </div>
            <div>
                <h3 className="font-bold text-brand-gray-900 mb-2">Your payment is protected by</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <div>
                            <span className='font-bold'>Secure</span>
                            <p className='text-brand-gray-600'>SSL Encryption</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            <Star className="w-5 h-5 text-brand-green" fill="#00b67a" />
                            <span className="font-bold text-xl text-brand-gray-800 ml-1">Trustpilot</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-brand-green p-1">
                                <Star className="w-4 h-4 text-white" fill="white" />
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-brand-gray-600">
                        Trustscore 4.4 | <a href="#" className="underline">54,243 reviews</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TrustSignals; 