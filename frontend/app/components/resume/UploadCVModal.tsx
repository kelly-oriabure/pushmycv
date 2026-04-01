'use client';
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UploadCVModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onUploadSuccess?: () => void; // <-- Add this prop
}

const ALLOWED_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};
const MAX_SIZE_MB = 5;

const UploadCVModal: React.FC<UploadCVModalProps> = ({ isOpen, onOpenChange, onUploadSuccess }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const { toast } = useToast();



    const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);

        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            return;
        }

        if (rejectedFiles.length > 0) {
            const firstError = rejectedFiles[0].errors[0];
            if (firstError.code === 'file-too-large') {
                setError(`File size must be less than ${MAX_SIZE_MB}MB.`);
            } else if (firstError.code === 'file-invalid-type') {
                setError('Invalid file type. Please upload a PDF or DOCX file.');
            } else {
                setError('An unknown file error occurred.');
            }
            setFile(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ALLOWED_TYPES,
        maxSize: MAX_SIZE_MB * 1024 * 1024,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        if (!user?.id) {
            // Store current page as referrer for post-auth redirect
            if (typeof window !== 'undefined') {
                localStorage.setItem('authReferrer', window.location.pathname + window.location.search);
            }
            handleClose();
            router.push('/auth');
            return;
        }

        setIsParsing(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.id);
            const res = await fetch('/api/upload-to-supabase', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Upload failed.');
            }
            // On success, close the modal and trigger onUploadSuccess
            handleClose();
            if (onUploadSuccess) onUploadSuccess();
        } catch (err: any) {
            setError(err?.message || 'An error occurred during upload.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        setIsParsing(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Upload Your Resume</DialogTitle>
                    <DialogDescription>
                        Drag and drop your PDF or DOCX file below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div
                        {...getRootProps()}
                        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : error ? 'border-red-500' : 'border-gray-300'}`}>
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-gray-500" />
                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">{isDragActive ? 'Drop the file here...' : 'Drag & drop or click to select'}</p>
                                <p className="text-xs text-gray-500">PDF or DOCX, up to {MAX_SIZE_MB}MB</p>
                            </>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!file || isParsing}>
                        {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isParsing ? 'Uploading...' : 'Upload & Analyze'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default UploadCVModal;