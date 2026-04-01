'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, FileText, LayoutTemplate, AppWindow, Check, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useResumeStore } from '@/store/resumeStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { dummyResumeData } from '@/data/dummyData';
import { SelectionPreview } from '@/components/resume/builder/SelectionPreview';
import { useTemplates } from '@/hooks/useTemplates';
import { useCachedImage } from '@/lib/utils/imageCache';
import type { Template } from '@/lib/types/resumeBuilder';
import { RESUME_IDS } from '@/constants/resume';



const colors = ['#64748b', '#0f766e', '#D8B589', '#A93400', '#040273', '#25A385', '#800080'];

const TemplateThumbnail: React.FC<{ template: Template }> = ({ template }) => {
  const { dataUrl, loading, error } = useCachedImage(template.image);

  if (loading) {
    return (
      <div className="w-full h-40 bg-muted animate-pulse rounded-md flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-40 bg-muted rounded-md flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={dataUrl || template.image}
        alt={template.name}
        className="w-full h-auto rounded-md aspect-[1/1.414]"
        loading="lazy"
      />
      <div className="absolute bottom-2 right-2 flex gap-1.5">
        <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">PDF</Badge>
        <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">DOCX</Badge>
      </div>
    </div>
  );
};

const TemplateSelectionContent = () => {
  // Use React Query for template data with caching
  const { data: templates, isLoading: loading, error } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user } = useAuth();
  const { setCurrentResumeId, resetResumeData } = useResumeStore();
  const { toast } = useToast();
  const params = useParams();
  const searchParams = useSearchParams();
  const routeTemplateId = params?.templateId as string | undefined;
  const queryTemplateId = searchParams?.get('templateId');
  const preselectTemplateId = routeTemplateId || queryTemplateId;

  // Pre-select template if templateId is present in route or query
  useEffect(() => {
    if (preselectTemplateId && templates) {
      const found = templates.find((t) => t.uuid === preselectTemplateId || t.id === preselectTemplateId);
      if (found) setSelectedTemplate(found);
      else if (templates.length > 0) setSelectedTemplate(templates[0]);
    } else if (templates && templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectTemplateId, templates]);

  useEffect(() => {
    if (selectedTemplate) {
      // Update the route to include the selected template's uuid
      router.replace(`/template-selection/${selectedTemplate.uuid}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  const handleUseTemplate = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a resume.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedTemplate) return;
    try {
      setCurrentResumeId(RESUME_IDS.TEMP);
      resetResumeData();
      router.push(
        `/resume/builder/${RESUME_IDS.TEMP}?templateId=${selectedTemplate.uuid}&templateName=${encodeURIComponent(
          selectedTemplate.name
        )}&color=${encodeURIComponent(selectedColor)}`
      );
    } catch (error) {
      console.error('Error creating resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to create resume. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between">
        <Link href="/resume/builder" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to editor
        </Link>
        <Button
          variant="link"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={handleUseTemplate}
        >
          Skip template selection
        </Button>
      </div>

      <Tabs defaultValue="templates" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates"><AppWindow className="w-4 h-4 mr-2" />Templates</TabsTrigger>
          <TabsTrigger value="text"><FileText className="w-4 h-4 mr-2" />Text</TabsTrigger>
          <TabsTrigger value="layout"><LayoutTemplate className="w-4 h-4 mr-2" />Layout</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="flex-1 overflow-y-auto mt-4">
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Color Palette</h3>
            <div className="flex items-center gap-3">
              {colors.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color ? 'border-primary ring-2 ring-primary/50' : 'border-muted'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Check className="w-5 h-5 text-black" />}
                </button>
              ))}
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-transparent">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {loading ? (
              <div>Loading templates...</div>
            ) : error ? (
              <div className="text-red-500">Error loading templates: {error.message}</div>
            ) : (
              templates?.map(template => (
                <div
                  key={template.uuid}
                  className="cursor-pointer group space-y-2"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <Card className={`overflow-hidden transition-all ${selectedTemplate?.uuid === template.uuid ? 'border-2 border-primary' : 'border'}`}>
                    <CardContent className="p-1.5">
                      <TemplateThumbnail template={template} />
                    </CardContent>
                  </Card>
                  <p className="text-sm text-center font-medium text-muted-foreground group-hover:text-foreground transition-colors">{template.name}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="text" className="flex-1 overflow-y-auto mt-4">
          <p className="text-muted-foreground p-4 text-center">Text formatting options will be here.</p>
        </TabsContent>
        <TabsContent value="layout" className="flex-1 overflow-y-auto mt-4">
          <p className="text-muted-foreground p-4 text-center">Layout options will be here.</p>
        </TabsContent>
      </Tabs>
    </>
  );

  if (isMobile) {
    return (
      <div className="bg-background text-foreground">
        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
          <Link href="/resume/builder" className="inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="font-semibold">Templates</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[85vw] flex flex-col gap-6 p-4">
              <SheetHeader>
                <SheetTitle>Customize</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>
        <main className="p-4 bg-muted/30">
          <div className="relative group">
            <div
              className="w-full bg-white shadow-lg rounded-lg my-4 overflow-hidden"
            >
              {selectedTemplate && (
                <SelectionPreview
                  color={selectedColor}
                  data={dummyResumeData}
                  templateId={selectedTemplate.uuid}
                />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
              <Button onClick={handleUseTemplate} size="lg">Use This Template</Button>
            </div>
          </div>

          {/* Mobile-specific apply button - always visible */}
          <div className="mt-6">
            <Button onClick={handleUseTemplate} size="lg" className="w-full">
              Use This Template
            </Button>
          </div>
        </main>

      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-[40%] bg-card p-6 border-r flex flex-col gap-6">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start p-6 bg-muted/30 overflow-y-auto">
        <div className="w-full max-w-2xl flex justify-between items-center mb-4">
          <Button onClick={handleUseTemplate} size="lg">
            Use This Template
          </Button>
        </div>

        <div className="relative group w-full max-w-2xl my-auto">

          {selectedTemplate && (
            <SelectionPreview
              templateId={selectedTemplate.uuid}
              color={selectedColor}
              data={dummyResumeData}
            />
          )}

        </div>
      </main>
    </div>
  );
};

const TemplateSelectionPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateSelectionContent />
    </Suspense>
  );
};

export default TemplateSelectionPage;
