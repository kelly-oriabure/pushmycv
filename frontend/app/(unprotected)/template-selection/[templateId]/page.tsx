"use client"
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Plus, FileText, LayoutTemplate, AppWindow, Check, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useResumeStore } from '@/store/resumeStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { dummyResumeData } from '@/data/dummyData';
import { SelectionPreview } from '@/components/resume/builder/SelectionPreview';
import { useTemplateStore } from '@/store/templateStore';
import type { Template } from '@/store/templateStore';
import templatesData from '@/data/templates';
import { getSupabaseClient } from '@/integrations/supabase/client';

const colors = ['#64748b', '#0f766e', '#D8B589', '#A93400', '#040273', '#25A385', '#800080'];

const TemplateSelection = () => {
    const supabase = getSupabaseClient();
    const params = useParams();
    const searchParams = useSearchParams();
    const routeTemplateUuid = params?.templateId as string | undefined;
    const resumeId = searchParams?.get('resumeId');
    const queryColor = searchParams?.get('color');
    const [selectedColor, setSelectedColor] = useState(colors[0]);
    const [isApplying, setIsApplying] = useState(false);
    const templates = useTemplateStore((state) => state.templates);
    const setSelectedTemplate = useTemplateStore((state) => state.setSelectedTemplate);
    const selectedTemplate = useTemplateStore((state) => state.selectedTemplate);
    const isMobile = useIsMobile();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const { resumes, fetchResumes } = useResumeStore();

    useEffect(() => {
        if (queryColor && colors.includes(queryColor)) {
            setSelectedColor(queryColor);
        }
    }, [queryColor]);

    // Redirect if either resumeId or templateId is missing
    useEffect(() => {
        if (!resumeId || !routeTemplateUuid) {
            router.replace('/resume-gallery');
        }
    }, [resumeId, routeTemplateUuid, router]);

    // Set selected template on mount or when templateId changes
    useEffect(() => {
        if (routeTemplateUuid) {
            setSelectedTemplate(routeTemplateUuid);
        }
    }, [routeTemplateUuid, setSelectedTemplate]);

    // Update URL when a new template is selected
    const handleTemplateSelect = (templateUuid: string) => {
        setSelectedTemplate(templateUuid);
        router.replace(`/template-selection/${templateUuid}?resumeId=${resumeId}`);
    };

    // Apply Template handler
    const handleApplyTemplate = async () => {
        if (!resumeId || !selectedTemplate) {
            toast({
                title: 'Missing information',
                description: 'Resume or template not found.',
                variant: 'destructive',
            });
            return;
        }
        setIsApplying(true);
        try {
            // Update the resume's templateId in Supabase
            const { error } = await (supabase.from('resumes') as any)
                .update({ template_id: selectedTemplate.uuid, template_name: selectedTemplate.name })
                .eq('id', resumeId);
            if (error) throw error;
            toast({
                title: 'Template Applied',
                description: 'The template has been updated for your resume.',
                variant: 'default',
            });
            if (user?.id) {
                fetchResumes(user.id);
            }
            // Redirect to resume builder with new templateId (no color param)
            router.push(`/resume/builder/${resumeId}?templateId=${selectedTemplate.uuid}`);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update template. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsApplying(false);
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
                    onClick={handleApplyTemplate}
                    disabled={isApplying}
                >
                    {isApplying ? 'Applying...' : 'Apply Template'}
                </Button>
            </div>

            <Tabs defaultValue="templates" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="templates"><AppWindow className="w-4 h-4 mr-2" />Templates</TabsTrigger>
                    <TabsTrigger value="text"><FileText className="w-4 h-4 mr-2" />Text</TabsTrigger>
                    <TabsTrigger value="layout"><LayoutTemplate className="w-4 h-4 mr-2" />Layout</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="flex-1 overflow-y-auto mt-4">
                    {/* <div className="mb-6">
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
                    </div> */}

                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                        {templates.length === 0 ? (
                            <div>No templates found.</div>
                        ) : (
                            templates.map(template => (
                                <div
                                    key={template.uuid}
                                    className="cursor-pointer group space-y-2"
                                    onClick={() => handleTemplateSelect(template.uuid)}
                                >
                                    <Card className={`overflow-hidden transition-all ${selectedTemplate?.uuid === template.uuid ? 'border-2 border-primary' : 'border'}`}>
                                        <CardContent className="p-1.5">
                                            <div className="relative">
                                                <img src={template.image || '/Images/empty-resume.png'} alt={template.name} className="w-full h-auto rounded-md aspect-[1/1.414]" />
                                                <div className="absolute bottom-2 right-2 flex gap-1.5">
                                                    <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">PDF</Badge>
                                                    <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">DOCX</Badge>
                                                </div>
                                            </div>
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
                        <div className="w-full bg-white shadow-lg rounded-lg my-4 overflow-hidden">
                            {!selectedTemplate ? (
                                <div className="flex items-center justify-center h-64 text-lg font-semibold text-muted-foreground">Loading templates...</div>
                            ) : (
                                <SelectionPreview
                                    color={selectedColor}
                                    data={dummyResumeData}
                                    templateId={selectedTemplate.uuid}
                                />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                            <Button onClick={handleApplyTemplate} size="lg" disabled={isApplying}>{isApplying ? 'Applying...' : 'Apply Template'}</Button>
                        </div>
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
                    <Button onClick={handleApplyTemplate} size="lg" disabled={isApplying}>
                        {isApplying ? 'Applying...' : 'Apply Template'}
                    </Button>
                </div>

                <div className="relative group w-full max-w-2xl my-auto">
                    {!selectedTemplate ? (
                        <div className="flex items-center justify-center h-64 text-lg font-semibold text-muted-foreground">Loading templates...</div>
                    ) : (
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

export default TemplateSelection;
