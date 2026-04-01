'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import React, { useState } from 'react';

const PaymentForm = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = () => {
        setIsLoading(true);
        // Redirect to the Stripe-hosted payment page
        window.location.href = 'https://buy.stripe.com/test_28EdR28ABe5P8WfbWaaR200';
    };

    return (
        <div className='space-y-6'>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-brand-gray-800">Total Due Today:</h2>
                    <span className="text-2xl font-bold text-brand-gray-900">$2.95</span>
                </div>
                
                <Button 
                    onClick={handlePayment} 
                    disabled={isLoading} 
                    className="w-full bg-brand-blue hover:bg-brand-blue-hover text-lg py-6"
                >
                    {isLoading ? 'Processing...' : (
                        <>
                            <Lock className="w-4 h-4 mr-2" />
                            Pay $2.95
                        </>
                    )}
                </Button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold mb-2">Promocode</h3>
                <div className="flex gap-4">
                    <Input placeholder="Enter discount code" />
                    <Button variant="outline">Apply</Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentForm; 