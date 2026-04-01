
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ArrowLeft, Menu } from 'lucide-react';

interface SectionConfig {
  name: string;
  component: React.ComponentType<any>;
  displayName: string;
}

interface MobileHeaderProps {
  sections: SectionConfig[];
  currentIndex: number;
  currentDisplayName: string;
  isSheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  onSectionChange: (index: number) => void;
  resumeId?: string;
  templateId?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  sections,
  currentIndex,
  currentDisplayName,
  isSheetOpen,
  onSheetOpenChange,
  onSectionChange,
  resumeId,
  templateId
}) => {
  return (
    <header className="bg-white p-4 border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
      <Sheet open={isSheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold">Resume Sections</SheetTitle>
          </SheetHeader>
          <nav className="mt-8">
            <ul className="space-y-2">
              {sections.map((section, idx) => (
                <li key={section.name}>
                  <SheetClose asChild>
                    <Button
                      variant={currentIndex === idx ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-left"
                      onClick={() => onSectionChange(idx)}
                    >
                      {section.name}
                    </Button>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="text-lg font-bold">
        {currentDisplayName || 'Resume Builder'}
      </div>
      <Link href={resumeId && templateId ? `/resume/builder/${resumeId}?templateId=${templateId}` : "/resume-gallery"}>
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
    </header>
  );
};
