'use client';
import React from 'react';

const CompanyLogos = () => {
  const companies = [
    'Booking.com',
    'Apple',
    'DHL',
    'Amazon',
    'American Express',
    'Accenture',
    'KPMG',
  ];

  return (
    <div className="py-12">
      <h2 className="text-center text-lg font-semibold text-brand-gray-600 mb-8">
        Our customers have been hired by:
      </h2>
      <div className="max-w-5xl mx-auto grid grid-cols-3 md:grid-cols-7 gap-8 items-center justify-items-center">
        {companies.map((company) => (
          <div key={company} className="text-brand-gray-400 font-semibold text-lg filter grayscale hover:grayscale-0 transition-all duration-300">
            {company}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyLogos; 