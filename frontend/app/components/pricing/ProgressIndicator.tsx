'use client';
import { CheckCircle, XCircle } from 'lucide-react';
import React from 'react';

const ProgressStep = ({ number, text, status }: { number: number, text: string, status: 'completed' | 'active' | 'pending' }) => {
  const statusStyles = {
    completed: 'bg-brand-blue text-white',
    active: 'border-2 border-brand-blue text-brand-blue',
    pending: 'bg-brand-gray-200 text-brand-gray-600',
  };

  const isCompleted = status === 'completed';

  return (
    <div className="flex items-center gap-2 md:gap-4">
      {isCompleted ? (
        <CheckCircle className="w-8 h-8 text-brand-blue" />
      ) : (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${statusStyles[status]}`}>
          {number}
        </div>
      )}
      <span className={`text-sm font-medium ${status === 'pending' ? 'text-brand-gray-400' : 'text-brand-gray-800'}`}>{text}</span>
    </div>
  );
};

const ProgressIndicator = ({ currentStep = 1 }: { currentStep?: number }) => {
  const steps = [
    { number: 1, text: "Create resume" },
    { number: 2, text: "Choose plan" },
    { number: 3, text: "Payment details" },
    { number: 4, text: "Download resume" }
  ];

  const getStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-4 md:space-x-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <ProgressStep
              number={step.number}
              text={step.text}
              status={getStatus(step.number)}
            />
            {index < steps.length - 1 && <div className="hidden md:block h-px w-12 bg-brand-gray-200"></div>}
          </React.Fragment>
        ))}
      </div>
      <div>
        <button className="text-brand-gray-400 hover:text-brand-gray-600">
          <XCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ProgressIndicator; 