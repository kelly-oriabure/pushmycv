import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EmailResumeModalProps {
  getResumeAsPdfBase64: () => Promise<string | null>;
  children: React.ReactNode;
}

export const EmailResumeModal = ({ children, getResumeAsPdfBase64 }: EmailResumeModalProps) => {
  const supabase = getSupabaseClient();
  const [isOpen, setIsOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter a recipient email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsOpen(false);
    toast({
      title: 'Sending Resume...',
      description: 'Your resume is being prepared and sent.',
    });

    try {
      const base64Pdf = await getResumeAsPdfBase64();
      if (!base64Pdf) throw new Error('Failed to generate PDF for the resume.');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to send emails.');

      // Email functionality temporarily unavailable - edge function not deployed
      throw new Error('Email functionality is currently unavailable. Please download your resume and send it manually.');

    } catch (err: any) {
      toast({
        title: 'Error Sending Resume',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Resume via Email</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter recipient's email address"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Send Email</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
