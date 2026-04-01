'use client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, FileText, Clock, Users, BadgeDollarSign, BookOpen } from 'lucide-react';
import React, { useState } from 'react';

const FeatureListItem = ({ icon, text }: { icon: React.ElementType, text: string }) => (
  <li className="flex items-start gap-3">
    <div className="w-5 h-5 flex-shrink-0 mt-1 text-brand-gray-600">
      {React.createElement(icon, { className: "w-full h-full" })}
    </div>
    <span className="text-sm text-brand-gray-600">{text}</span>
  </li>
);

const PricingCard = ({
  planName,
  price,
  period,
  isPopular,
  isSelected,
  onSelect,
}: {
  planName: string,
  price: string,
  period?: string,
  isPopular?: boolean,
  isSelected: boolean,
  onSelect: () => void,
}) => {
  return (
    <div
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${isSelected ? 'border-brand-blue bg-white' : 'border-brand-gray-200 bg-white hover:border-brand-blue'
        } ${isPopular ? 'scale-105' : 'scale-100'}`}
      onClick={onSelect}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-blue text-white text-xs font-semibold px-4 py-1 rounded-full uppercase">
          Most Popular
        </div>
      )}
      <div className="flex items-center gap-4">
        <RadioGroup value={isSelected ? planName : ''}>
          <RadioGroupItem value={planName} id={planName} />
        </RadioGroup>
        <div>
          <h3 className="text-lg font-semibold text-brand-gray-900">{planName}</h3>
          <p className="text-brand-gray-900">
            <span className="text-3xl font-bold">{price}</span>
            {period && <span className="text-base text-brand-gray-600">/{period}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

const PricingOptions = () => {
  const [selectedPlan, setSelectedPlan] = useState('7-days');

  const plans = [
    {
      name: '7-days',
      price: 'N3,500',
      isPopular: true,
    },
    {
      name: 'Quarterly',
      price: 'N10,000',
      period: 'mo',
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <PricingCard
          key={plan.name}
          planName={plan.name}
          price={plan.price}
          period={plan.period}
          isPopular={plan.isPopular}
          isSelected={selectedPlan === plan.name}
          onSelect={() => setSelectedPlan(plan.name)}
        />
      ))}
    </div>
  );
};

export default PricingOptions; 