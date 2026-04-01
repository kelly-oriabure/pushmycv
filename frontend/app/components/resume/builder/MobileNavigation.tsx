
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Eye } from 'lucide-react';

interface MobileNavigationProps {
  mobileView: 'form' | 'preview';
  onViewChange: (view: 'form' | 'preview') => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  mobileView,
  onViewChange
}) => {
  return (
    <div className="border-t bg-white shadow-lg z-20">
      <div className="flex justify-around p-2">
        <Button
          variant={mobileView === 'form' ? 'secondary' : 'ghost'}
          className="flex-1 flex items-center gap-2"
          onClick={() => onViewChange('form')}
        >
          <Pencil className="h-4 w-4" />
          Editor
        </Button>
        <Button
          variant={mobileView === 'preview' ? 'secondary' : 'ghost'}
          className="flex-1 flex items-center gap-2"
          onClick={() => onViewChange('preview')}
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      </div>
    </div>
  );
};
