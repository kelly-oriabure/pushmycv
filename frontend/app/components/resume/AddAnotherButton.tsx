'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UseFieldArrayAppend, FieldArrayWithId } from 'react-hook-form';

interface AddAnotherButtonProps<TFormValues extends { [key: string]: any }> {
  append: UseFieldArrayAppend<TFormValues, any>;
  setExpanded: (value: string) => void;
  fields: FieldArrayWithId<TFormValues, any, 'id'>[];
  defaultValues: any;
  buttonText: string;
  entityName: string;
}

export const AddAnotherButton = <TFormValues extends { [key: string]: any }>({ 
  append, 
  setExpanded, 
  fields, 
  defaultValues, 
  buttonText, 
  entityName 
}: AddAnotherButtonProps<TFormValues>) => {
  
  const handleClick = () => {
    const newIndex = fields.length;
    
    // Let React Hook Form handle ID generation automatically
    append(defaultValues);
    setExpanded(`${entityName}-${newIndex}`);
  };

  return (
    <Button
      variant="link"
      onClick={handleClick}
      className="mt-4"
    >
      <Plus className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  );
};
