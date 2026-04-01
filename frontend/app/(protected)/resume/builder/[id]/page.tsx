'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import { PersonalDetails } from '@/components/resume/PersonalDetails';
import ProfessionalSummary from '@/components/resume/ProfessionalSummary';
import { Education } from '@/components/resume/Education';
import { EmploymentHistory } from '@/components/resume/EmploymentHistory';
import { Skills } from '@/components/resume/Skills';
import { Languages } from '@/components/resume/Languages';
import { References } from '@/components/resume/References';
import { Courses } from '@/components/resume/Courses';
import { useIsMobile } from '@/hooks/use-mobile';

import { dummyResumeData } from '@/data/dummyData';
import { hasContent } from '@/lib/helpers';
import { useResumeBuilder } from '@/hooks/useResumeBuilder';
import { ResumePreview, getResumeTemplateElement } from '@/components/resume/builder/ResumePreview';
import { FormSection } from '@/components/resume/builder/FormSection';
import { MobileHeader } from '@/components/resume/builder/MobileHeader';
import { MobileNavigation } from '@/components/resume/builder/MobileNavigation';
import { ResumeBuilderHeaderActionsProvider } from '@/components/resume/builder/ResumeBuilderHeaderActionsContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Check, Plus, Download, Mail, Share2, FileText, Settings } from 'lucide-react';
import { EmailResumeModal } from '@/components/resume/EmailResumeModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/integrations/supabase/client';
// Removed ResumeOrchestrator - using JSONB approach
import { UnifiedSyncService, useUnifiedSync } from '@/lib/services/unifiedSyncService';
import { useResumeSectionSyncs } from '@/hooks/useResumeSectionSyncs';
// Removed optimized resume loader - using JSONB approach
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { usePdfExport } from '@/hooks/usePdfExport';
// Removed extraction status - using old resume upload module
import { useToast } from '@/hooks/use-toast';
import { ResumeBuilderErrorBoundary } from '@/components/ErrorBoundary';
import { NetworkStatusIndicator } from '@/components/NetworkStatusIndicator';
import { RESUME_IDS } from '@/constants/resume';
import { clearDraft, loadDraft, saveDraft } from '@/store/resumeStore/helpers';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const colors = ['#64748b', '#0f766e', '#D8B589', '#A93400', '#040273', '#25A385', '#800080'];

export default function ResumeBuilder() {
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseClient> | null>(null);
  const params = useParams();
  const id = params?.id as string;
  const searchParams = useSearchParams();
  const templateIdFromUrl = searchParams?.get('templateId');
  const templateNameFromUrl = searchParams?.get('templateName') || '';
  const colorFromUrl = searchParams?.get('color');
  const draftTitleFromUrl = searchParams?.get('draftTitle') || '';
  // Removed extraction status - using old resume upload module
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isMobile = useIsMobile();
  const [zoomLevel, setZoomLevel] = useState(isMobile ? 1.0 : 0.8);
  const [initialized, setInitialized] = useState(false);
  const [resumeTitle, setResumeTitle] = useState<string>('Untitled Resume');
  const [templateName, setTemplateName] = useState<string>('');
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const { toast } = useToast();

  // Initialize services
  // Removed resumeOrchestrator - using JSONB approach

  const {
    resumeData,
    updateResumeData,
    currentResumeId,
    setCurrentResumeId,
    templateId,
    setTemplateId,
    color,
    setColor,
    user,
    loadResume,
    createResume,
    fetchResumes,
    resetResumeData,
    setResumeData
  } = useResumeBuilder();

  const {
    isExporting,
    exportResumeTemplateToPdf,
    getElementAsPdf,
    usePuppeteer,
    togglePdfEngine
  } = usePdfExport();
  const previewRef = React.useRef<HTMLDivElement>(null);

  // Extraction status management
  // Removed extraction status hook - using old resume upload module

  // Using JSONB approach - no need for optimized loader

  // Check if we have actual data loaded (not empty)
  const hasLoadedData = resumeData.personalDetails.firstName ||
    resumeData.personalDetails.lastName ||
    resumeData.personalDetails.email ||
    resumeData.education.length > 0 ||
    resumeData.employmentHistory.length > 0 ||
    resumeData.skills.length > 0;

  // Removed extraction loading - using old resume upload module

  // Don't block UI for optimized loading - it's an enhancement, not a requirement
  // No optimized loading needed with JSONB approach

  // On mount, set resumeId and templateId from URL if not already set
  useEffect(() => {
    if (id && currentResumeId !== id) {
      setCurrentResumeId(id);
    }
    if (templateIdFromUrl && templateId !== templateIdFromUrl) {
      setTemplateId(templateIdFromUrl);
    }
    if (colorFromUrl && color !== colorFromUrl) {
      setColor(colorFromUrl);
    }
    if (templateNameFromUrl && templateName !== templateNameFromUrl) {
      setTemplateName(templateNameFromUrl);
    }
    if (draftTitleFromUrl && id === RESUME_IDS.TEMP && resumeTitle === 'Untitled Resume') {
      setResumeTitle(draftTitleFromUrl);
    }
  }, [
    id,
    currentResumeId,
    setCurrentResumeId,
    templateIdFromUrl,
    templateId,
    setTemplateId,
    colorFromUrl,
    color,
    setColor,
    templateNameFromUrl,
    templateName,
    draftTitleFromUrl,
    resumeTitle,
  ]);


  // Update zoom level when mobile/desktop changes
  useEffect(() => {
    setZoomLevel(isMobile ? 1.0 : 0.8);
  }, [isMobile]);

  // Handle 'new' route - redirect to template selection
  useEffect(() => {
    if (id === 'new') {
      if (user) {
        router.push('/template-selection');
      } else {
        router.push('/resume-gallery');
      }
      return;
    }

    if (!id) {
      if (user) {
        router.push('/template-selection');
      } else {
        router.push('/resume-gallery');
      }
    }
  }, [id, user, router]);

  // Load resume data using the store's loadResume function
  useEffect(() => {
    const loadResumeData = async () => {
      if (!currentResumeId || !user?.id) {
        if (!currentResumeId) {
          console.warn('No resume ID provided');
        }
        if (!user?.id) {
          console.warn('User not authenticated');
        }
        return;
      }

      if (currentResumeId === RESUME_IDS.TEMP) {
        return;
      }

      try {
        console.log('Loading resume data for resume ID:', currentResumeId);
        await loadResume(currentResumeId, user.id);
        console.log('Resume data loaded successfully');
      } catch (error) {
        console.error('Error loading resume data:', error);
      }
    };

    loadResumeData();
  }, [currentResumeId, user?.id, loadResume]);

  // Removed extraction status handling - using old resume upload module

  // Use section-specific sync service to sync each form section individually
  // This prevents race conditions by syncing sections independently
  const sectionSyncs = useResumeSectionSyncs(
    currentResumeId || '',
    resumeData,
    {
      debounceMs: 2000, // 2 seconds for individual sections
      showToasts: false, // Disable individual toasts to avoid spam
    }
  );

  // Also keep unified sync as backup for full resume syncs
  const { syncState, forceSave, retryLastFailed } = useUnifiedSync(
    currentResumeId || '',
    resumeData,
    {
      debounceMs: 5000, // Longer debounce for full sync (backup)
      showToasts: true,
      enableOptimisticUpdates: true,
    }
  );

  useEffect(() => {
    setSupabase(getSupabaseClient());
  }, []);

  useEffect(() => {
    async function fetchResumeTitle() {
      if (!id || !supabase || id === RESUME_IDS.TEMP) return;
      type ResumeTitleRow = { title: string | null };

      // Use a more robust approach without .single() to avoid coercion errors
      const { data: resumes, error } = await supabase
        .from('resumes')
        .select('title')
        .eq('id', id)
        .limit(1)
        .overrideTypes<ResumeTitleRow[], { merge: false }>();

      if (error) {
        console.error('Error fetching resume title:', error);
        return;
      }

      // Check if data is returned and handle accordingly
      if (!resumes || resumes.length === 0) {
        console.warn('No resume found with ID:', id);
        return;
      }

      // Get the first (and should be only) record
      const resume = resumes[0];
      if (resume?.title) setResumeTitle(resume.title);
    }
    fetchResumeTitle();
  }, [id, supabase]);

  useEffect(() => {
    if (!user?.id || id !== RESUME_IDS.TEMP) return;
    const draft = loadDraft<any>(user.id);
    const draftData = draft?.resumeData;
    const draftTemplateId = draft?.templateId;
    const draftColor = draft?.color;
    const draftTitle = draft?.title;
    const draftTemplateName = draft?.templateName;

    if (draftTemplateId && templateIdFromUrl && draftTemplateId !== templateIdFromUrl) {
      clearDraft(user.id);
      resetResumeData();
      setTemplateId(templateIdFromUrl);
      if (templateNameFromUrl) setTemplateName(templateNameFromUrl);
      if (colorFromUrl) setColor(colorFromUrl);
      if (draftTitleFromUrl) setResumeTitle(draftTitleFromUrl);
      return;
    }

    if (draftTemplateId && templateId !== draftTemplateId) {
      setTemplateId(draftTemplateId);
    }
    if (draftTemplateName && templateName !== draftTemplateName) {
      setTemplateName(draftTemplateName);
    }
    if (draftColor && color !== draftColor) {
      setColor(draftColor);
    }
    if (draftTitle && resumeTitle !== draftTitle) {
      setResumeTitle(draftTitle);
    }
    if (draftData) {
      setResumeData(draftData);
    } else {
      resetResumeData();
      if (draftTitleFromUrl) setResumeTitle(draftTitleFromUrl);
    }
  }, [
    user?.id,
    id,
    templateId,
    templateIdFromUrl,
    templateName,
    templateNameFromUrl,
    color,
    colorFromUrl,
    resumeTitle,
    setTemplateId,
    setTemplateName,
    setColor,
    setResumeTitle,
    setResumeData,
    resetResumeData,
    draftTitleFromUrl,
  ]);

  useEffect(() => {
    if (!user?.id || id !== RESUME_IDS.TEMP) return;
    const timeout = setTimeout(() => {
      saveDraft(user.id, {
        v: 1,
        updatedAt: Date.now(),
        title: resumeTitle,
        templateId: templateIdFromUrl || templateId || null,
        templateName: templateName || templateNameFromUrl || null,
        color: colorFromUrl || color || '#000000',
        resumeData,
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [user?.id, id, resumeData, resumeTitle, templateId, templateIdFromUrl, templateName, templateNameFromUrl, color, colorFromUrl]);

  const dataToRender = hasContent(resumeData) ? resumeData : dummyResumeData;

  const sectionConfigs = [
    { name: 'Personal Details', component: PersonalDetails, displayName: 'Personal Details' },
    { name: 'Education', component: Education, displayName: 'Education' },
    { name: 'Employment History', component: EmploymentHistory, displayName: 'Employment History' },
    { name: 'Skills', component: Skills, displayName: 'Skills' },
    { name: 'Languages', component: Languages, displayName: 'Languages' },
    { name: 'References', component: References, displayName: 'References' },
    { name: 'Courses', component: Courses, displayName: 'Courses' },
    { name: 'Professional Summary', component: ProfessionalSummary, displayName: 'Profile' },
  ];

  const handleNext = () => {
    setCurrentStepIndex(prev => Math.min(prev + 1, sectionConfigs.length - 1));
  };

  const handleBack = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  // Export logic

  // Generate PDF from rendered template
  const generatePDF = async () => {
    if (!previewRef.current) {
      alert('Resume preview not found.');
      return false;
    }

    const templateElement = getResumeTemplateElement(previewRef.current);
    if (!templateElement) {
      alert('Resume template not found.');
      return false;
    }

    try {
      const success = await exportResumeTemplateToPdf(
        templateElement,
        `resume-${currentResumeId || 'untitled'}.pdf`
      );

      if (!success) {
        alert('Failed to generate PDF.');
      }
      return success;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF.');
      return false;
    }
  };

  // Email export using PDF to match the rendered template
  const getResumeAsPdfBase64 = async (): Promise<string | null> => {
    try {
      // Use HTML-to-PDF to match the rendered template
      if (!previewRef.current) {
        alert('Resume preview not found.');
        return null;
      }

      const templateElement = getResumeTemplateElement(previewRef.current);
      if (!templateElement) {
        alert('Resume template not found.');
        return null;
      }

      return await getElementAsPdf(templateElement);
    } catch (error) {
      console.error('Error generating PDF for email:', error);
      alert('Failed to generate PDF for email.');
      return null;
    }
  };

  // Updated export handler
  const handleExport = async (type: 'pdf' | 'share') => {
    switch (type) {
      case 'pdf':
        await generatePDF();
        break;
      case 'share':
        router.push('/payment');
        break;
      default:
        router.push('/payment');
    }
  };

  // Export button for ResumePreview header

  const handleSaveDraft = async () => {
    if (!user?.id) {
      toast({ title: 'Authentication required', description: 'Please sign in to save.', variant: 'destructive' });
      return;
    }
    const title = saveTitle.trim();
    if (!title) {
      toast({ title: 'Missing title', description: 'Please enter a resume title.', variant: 'destructive' });
      return;
    }
    const templateIdToUse = templateIdFromUrl || templateId;
    if (!templateIdToUse) {
      toast({ title: 'Missing template', description: 'Please select a template.', variant: 'destructive' });
      return;
    }

    const newId = await createResume(
      title,
      user.id,
      templateIdToUse,
      templateName || templateNameFromUrl || undefined,
      colorFromUrl || color || '#000000'
    );
    if (!newId) {
      toast({ title: 'Save failed', description: 'Could not create the resume record.', variant: 'destructive' });
      return;
    }

    const sync = new UnifiedSyncService({ debounceMs: 0, showToasts: false });
    sync.scheduleResumeSync(newId, resumeData);
    const ok = await sync.forceSave();
    sync.destroy();

    if (!ok) {
      try {
        const supabaseClient = getSupabaseClient();
        await supabaseClient.from('resumes').delete().eq('id', newId);
      } catch { }
      toast({ title: 'Save failed', description: 'Could not persist resume data.', variant: 'destructive' });
      return;
    }

    clearDraft(user.id);
    setResumeTitle(title);
    setIsSaveOpen(false);
    setCurrentResumeId(newId, user.id);
    await fetchResumes(user.id);
    router.replace(
      `/resume/builder/${newId}?templateId=${encodeURIComponent(templateIdToUse)}&templateName=${encodeURIComponent(
        templateName || templateNameFromUrl || ''
      )}&color=${encodeURIComponent(colorFromUrl || color || '#000000')}`
    );
  };
  const exportButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="flex items-center gap-2 bg-gray-50 text-black">
          <Download className="w-4 h-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" /> PDF {usePuppeteer ? '(High Quality)' : '(Standard)'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={togglePdfEngine}>
          <Settings className="w-4 h-4 mr-2" />
          Switch to {usePuppeteer ? 'Standard' : 'High Quality'} Engine
        </DropdownMenuItem>
        <EmailResumeModal getResumeAsPdfBase64={getResumeAsPdfBase64}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Mail className="w-4 h-4 mr-2" /> Send to Email
          </DropdownMenuItem>
        </EmailResumeModal>
        <DropdownMenuItem onClick={() => handleExport('share')}>
          <Share2 className="w-4 h-4 mr-2" /> Share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Use default color if none is set to prevent blocking
  const effectiveColor = color || '#000000';

  // Color palette for ResumePreview
  const colorPalette = templateId ? (
    <>
      {colors.map((c) => (
        <button
          key={c}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${effectiveColor === c ? 'border-primary ring-2 ring-primary/50' : 'border-muted'}`}
          style={{ backgroundColor: c }}
          onClick={() => setColor(c)}
        >
          {effectiveColor === c && <Check className="w-5 h-5 text-black" />}
        </button>
      ))}
    </>
  ) : null;

  const headerRightActions = (
    <>
      <SyncStatusIndicator
        syncState={syncState}
        onRetry={retryLastFailed}
        showLabel
        className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-2 py-1"
      />
      {id === RESUME_IDS.TEMP ? (
        <Button
          onClick={() => {
            setSaveTitle(resumeTitle === 'Untitled Resume' ? draftTitleFromUrl : resumeTitle);
            setIsSaveOpen(true);
          }}
          className="shadow-lg"
        >
          Save Resume
        </Button>
      ) : null}
    </>
  );


  return (
    <ResumeBuilderErrorBoundary>
      <NetworkStatusIndicator />
      <div className="h-screen bg-[#eff2f9] flex flex-col">
        {isMobile && (
          <MobileHeader
            sections={sectionConfigs}
            currentIndex={currentStepIndex}
            currentDisplayName={sectionConfigs[currentStepIndex]?.displayName}
            isSheetOpen={isSheetOpen}
            onSheetOpenChange={setIsSheetOpen}
            onSectionChange={setCurrentStepIndex}
            resumeId={id}
            templateId={templateId ?? undefined}
          />
        )}

        {isMobile && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {id === RESUME_IDS.TEMP ? (
              <Button
                onClick={() => {
                  setSaveTitle(resumeTitle === 'Untitled Resume' ? draftTitleFromUrl : resumeTitle);
                  setIsSaveOpen(true);
                }}
                className="shadow-lg"
              >
                Save Resume
              </Button>
            ) : null}
            <SyncStatusIndicator
              syncState={syncState}
              onRetry={retryLastFailed}
              showLabel={false}
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-2 py-1"
            />
          </div>
        )}

        <div className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : ''}`}>
          <div className={`h-full min-h-0 overflow-y-auto ${isMobile ? (mobileView === 'form' ? 'block' : 'hidden') : 'w-1/2'}`}>
            {!isMobile ? (
              <ResumeBuilderHeaderActionsProvider headerRight={headerRightActions}>
                <FormSection
                  sections={sectionConfigs}
                  currentIndex={currentStepIndex}
                  resumeData={resumeData}
                  updateResumeData={updateResumeData}
                  onNext={handleNext}
                  onBack={handleBack}
                  onSectionChange={setCurrentStepIndex}
                  resumeId={currentResumeId || ''}
                  className="block min-h-0"
                  resumeTitle={resumeTitle}
                  templateId={templateId ?? undefined}
                  isExtracting={false}
                />
              </ResumeBuilderHeaderActionsProvider>
            ) : (
              <FormSection
                sections={sectionConfigs}
                currentIndex={currentStepIndex}
                resumeData={resumeData}
                updateResumeData={updateResumeData}
                onNext={handleNext}
                onBack={handleBack}
                onSectionChange={setCurrentStepIndex}
                resumeId={currentResumeId || ''}
                className="block min-h-0"
                resumeTitle={resumeTitle}
                templateId={templateId ?? undefined}
                isExtracting={false}
              />
            )}
          </div>
          <div className={`h-full overflow-y-auto ${isMobile ? (mobileView === 'preview' ? 'block' : 'hidden') : 'w-1/2'}`} ref={previewRef}>
            <ResumePreview
              templateId={templateId}
              color={effectiveColor}
              data={dataToRender}
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              className="block"
              colorPalette={colorPalette}
              exportButton={exportButton}
              resumeId={id}
            />
          </div>
        </div>

        {isMobile && (
          <MobileNavigation
            mobileView={mobileView}
            onViewChange={setMobileView}
          />
        )}

        <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save resume</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Input value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} placeholder="Resume title" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaveOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDraft}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </ResumeBuilderErrorBoundary>
  );
};
