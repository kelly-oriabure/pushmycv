'use client';

import * as React from 'react';
import { format, set, getYear, getMonth } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MonthYearPickerProps {
  value?: string; // Expects "YYYY-MM" format
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const MonthYearPicker = React.forwardRef<
  HTMLInputElement,
  MonthYearPickerProps
>(({ className, value, onChange, placeholder, id, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const initialDate = React.useMemo(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      if (year && month) {
        return new Date(year, month - 1);
      }
    }
    return new Date();
  }, [value]);

  const [displayDate, setDisplayDate] = React.useState(initialDate);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = set(displayDate, { month: monthIndex });
    setDisplayDate(newDate);
    onChange?.(format(newDate, 'yyyy-MM'));
    setIsOpen(false);
  };

  const handleYearChange = (yearDelta: number) => {
    setDisplayDate(prev => set(prev, { year: getYear(prev) + yearDelta }));
  };

  const displayValue = value
    ? format(initialDate, 'MM/yyyy')
    : placeholder || '';

  const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), 'MMM'));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
                <TextField
          ref={ref}
          id={id}
          readOnly
          value={displayValue}
          className={cn('cursor-pointer', className)}
          placeholder={placeholder}
          {...props}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 space-y-2" align="start">
        <div className="flex items-center justify-between px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleYearChange(-1)}
          >
            <CalendarIcon className="h-4 w-4 rotate-180" />
          </Button>
          <span className="font-semibold text-sm">{getYear(displayDate)}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleYearChange(1)}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <Button
              key={month}
              variant={getMonth(displayDate) === index ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMonthSelect(index)}
            >
              {month}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
});

MonthYearPicker.displayName = 'MonthYearPicker';

export { MonthYearPicker };
