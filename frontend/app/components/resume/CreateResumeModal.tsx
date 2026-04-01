'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateResumeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateResume: (title: string) => void;
}

const CreateResumeModal = ({ isOpen, onOpenChange, onCreateResume }: CreateResumeModalProps) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateResume(title.trim());
      setTitle('');
    }
  };

  const handleClose = () => {
    setTitle('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create New Resume
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="resume-title">Resume Name</Label>
            <Input
              id="resume-title"
              type="text"
              placeholder="Enter resume name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Continue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateResumeModal;
