'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

const CollapsibleSection = CollapsiblePrimitive.Root;

const CollapsibleSectionTrigger = React.forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <CollapsiblePrimitive.Trigger
        ref={ref}
        className={cn(
            'flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline focus:outline-none',
            className
        )}
        {...props}
    >
        {children}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </CollapsiblePrimitive.Trigger>
));

CollapsibleSectionTrigger.displayName = CollapsiblePrimitive.Trigger.displayName;

const CollapsibleSectionContent = React.forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <CollapsiblePrimitive.Content
        ref={ref}
        className={cn(
            'overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
            className
        )}
        {...props}
    >
        <div className="pt-4">{children}</div>
    </CollapsiblePrimitive.Content>
));

CollapsibleSectionContent.displayName = CollapsiblePrimitive.Content.displayName;

export { CollapsibleSection, CollapsibleSectionTrigger, CollapsibleSectionContent };
