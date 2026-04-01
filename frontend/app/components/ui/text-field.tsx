'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

const textFieldVariants = cva(
  'text-field',
  {
    variants: {
      showSuccessIcon: {
        true: 'pr-10',
      },
    },
    defaultVariants: {
      showSuccessIcon: false,
    },
  }
);

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof textFieldVariants> {}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, type, showSuccessIcon, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(textFieldVariants({ showSuccessIcon }), className)}
          ref={ref}
          placeholder={placeholder}
          {...props}
        />
        {showSuccessIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export { TextField, textFieldVariants };
