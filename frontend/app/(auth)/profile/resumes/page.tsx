'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Copy, FileText, MoreVertical, Pencil, Plus, Search, Trash2, Type } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useResumeStore } from '@/store/resumeStore';
import { useToast } from '@/hooks/use-toast';
import { getTemplateKeyFromUuid } from '@/lib/utils/templateUtils';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SortKey = 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc';

function formatUpdatedAt(value: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
}

export default function ResumesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    resumes,
    loading: resumesLoading,
    error,
    duplicateResume,
    deleteResume,
    updateResumeTitle,
    setCurrentResumeId,
    resetResumeData,
    initialize,
  } = useResumeStore();

  const [sortKey, setSortKey] = useState<SortKey>('updated_desc');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) initialize(user.id);
  }, [initialize, user?.id]);

  const isLoading = !user || resumesLoading;

  const toDisplayString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (value instanceof Error) return value.message || value.name || 'Error';
    if (typeof value === "object") {
      const maybeRecord = value as Record<string, unknown>;
      const message = maybeRecord.message;
      if (typeof message === "string") return message;
      const name = maybeRecord.name;
      if (typeof name === "string") return name;
      try {
        return JSON.stringify(value);
      } catch {
        return 'Unknown error';
      }
    }
    return String(value);
  };

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? resumes.filter((r) => (r.title || '').toLowerCase().includes(q)) : resumes.slice();

    base.sort((a, b) => {
      if (sortKey === 'updated_desc' || sortKey === 'updated_asc') {
        const at = new Date(a.updatedAt || 0).getTime();
        const bt = new Date(b.updatedAt || 0).getTime();
        return sortKey === 'updated_desc' ? bt - at : at - bt;
      }
      const at = (a.title || '').toLowerCase();
      const bt = (b.title || '').toLowerCase();
      if (sortKey === 'title_asc') return at.localeCompare(bt);
      return bt.localeCompare(at);
    });

    return base;
  }, [query, resumes, sortKey]);

  const selectedResume = useMemo(() => {
    if (!selectedId) return null;
    return resumes.find((r) => r.id === selectedId) || null;
  }, [resumes, selectedId]);

  useEffect(() => {
    if (selectedId && resumes.some((r) => r.id === selectedId)) return;
    if (filteredAndSorted.length > 0) setSelectedId(filteredAndSorted[0].id);
    else setSelectedId(null);
  }, [filteredAndSorted, resumes, selectedId]);

  const templateImageMap: Record<string, string> = {
    artisan: '/templates/artisan.png',
    cascade: '/templates/cascade.png',
    cool: '/templates/cool.png',
    executive: '/templates/executive.png',
    milan: '/templates/milan.png',
    modernist: '/templates/modernist.png',
    'simple-white': '/templates/simple-white.png',
  };

  const openRename = (id: string, currentTitle: string) => {
    setRenameId(id);
    setRenameTitle(currentTitle || '');
  };

  const commitRename = async () => {
    if (!renameId) return;
    const nextTitle = renameTitle.trim();
    if (!nextTitle) {
      toast({ title: 'Invalid title', description: 'Resume title cannot be empty.', variant: 'destructive' });
      return;
    }
    await updateResumeTitle(renameId, nextTitle);
    setRenameId(null);
    toast({ title: 'Renamed', description: 'Resume title updated.' });
  };

  const handleDuplicate = async (id: string) => {
    if (!user?.id) return;
    const newId = await duplicateResume(id, user.id);
    if (!newId) {
      toast({ title: 'Error', description: 'Failed to duplicate resume.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Duplicated', description: 'A copy has been created.' });
    setSelectedId(newId);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteResume(deleteId);
    setDeleteId(null);
    if (!ok) {
      toast({ title: 'Error', description: 'Failed to delete resume.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Resume has been deleted.' });
  };

  const handleEdit = (resumeId: string, templateId?: string) => {
    if (!user?.id) return;
    if (!resumeId || !templateId) {
      toast({
        title: 'Missing Data',
        description: 'Cannot edit resume: missing template or resume ID.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentResumeId(resumeId, user.id);
    router.push(`/resume/builder/${resumeId}?templateId=${templateId}`);
  };

  const selectedTemplateKey = selectedResume ? getTemplateKeyFromUuid(selectedResume.template_id || undefined) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight">Resumes</div>
          <div className="text-sm text-muted-foreground">Manage your resume library.</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild>
            <Link href="/resume-gallery">
              <Plus className="h-4 w-4 mr-2" />
              Create Resume
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Loading</CardTitle>
              <CardDescription>Preparing your library…</CardDescription>
            </CardHeader>
            <CardContent className="h-72" />
          </Card>
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Loading preview…</CardDescription>
            </CardHeader>
            <CardContent className="h-72" />
          </Card>
        </div>
      ) : error ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-destructive">Couldn’t load resumes</CardTitle>
            <CardDescription>{toDisplayString(error) || 'Unknown error'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => user?.id && initialize(user.id)}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : resumes.length === 0 ? (
        <Card className="mt-6 overflow-hidden">
          <CardContent className="py-14">
            <div className="max-w-xl mx-auto text-center space-y-5">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="text-xl font-semibold">Start your first resume</div>
                <div className="text-sm text-muted-foreground">Pick a template to create a new resume.</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild>
                  <Link href="/resume-gallery">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Resume
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">Library</CardTitle>
                  <CardDescription>Search, sort, and pick a resume</CardDescription>
                </div>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="h-10 w-44 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="updated_desc">Updated (newest)</option>
                  <option value="updated_asc">Updated (oldest)</option>
                  <option value="title_asc">Title (A–Z)</option>
                  <option value="title_desc">Title (Z–A)</option>
                </select>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by title..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
                {filteredAndSorted.map((r) => {
                  const isActive = r.id === selectedId;
                  const templateKey = getTemplateKeyFromUuid(r.template_id || undefined);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        'w-full text-left rounded-2xl border px-3 py-3 transition-colors',
                        isActive ? 'border-primary/20 bg-accent' : 'border-border bg-card hover:bg-accent/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.title || 'Untitled resume'}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                              {templateKey}
                            </span>
                            <span className="text-xs text-muted-foreground">Updated {formatUpdatedAt(r.updatedAt)}</span>
                          </div>
                        </div>
                        <img
                          src={templateImageMap[templateKey] || '/placeholder.svg'}
                          alt={templateKey}
                          className="h-10 w-8 rounded-lg border border-border object-cover bg-background"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{selectedResume?.title || 'Resume details'}</CardTitle>
                  <CardDescription>
                    {selectedResume
                      ? `Updated ${formatUpdatedAt(selectedResume.updatedAt)} · ${selectedTemplateKey}`
                      : 'Select a resume to view actions.'}
                  </CardDescription>
                </div>
                {selectedResume ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(selectedResume.id, selectedResume.template_id || undefined)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openRename(selectedResume.id, selectedResume.title)}>
                          <Type className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(selectedResume.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(selectedResume.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedResume ? (
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Template</div>
                      <div className="text-sm text-muted-foreground">{selectedTemplateKey}</div>
                    </div>
                    {selectedTemplateKey ? (
                      <img
                        src={templateImageMap[selectedTemplateKey] || '/placeholder.svg'}
                        alt={selectedTemplateKey}
                        className="h-16 w-12 rounded-xl border border-border object-cover bg-background"
                      />
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
                  Choose a resume from the left to manage it.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} placeholder="Resume title" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button onClick={commitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
