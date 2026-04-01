'use client';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface ResumeUploadFormProps {
  onUploadSuccess?: (id: string, file: File, pdfUrl?: string) => Promise<void>;
}

export function ResumeUploadForm({ onUploadSuccess }: ResumeUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: (files) => {
      if (files.length > 0) {
        setUploadedFile(files[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive"
        });
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file.",
          variant: "destructive"
        });
      }
    }
  });

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (isUploading) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/resume-score/upload', {
        method: 'POST',
        body: formData
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON: ${text.substring(0, 200)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast({
        title: "Upload successful",
        description: "Resume uploaded and processing started!",
      });

      // Call optional callback if provided, then navigate
      if (onUploadSuccess) {
        await onUploadSuccess(data.uploadId, uploadedFile, data.pdfUrl);
      }
      router.push(`/resume-score?id=${data.uploadId}`);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <p className="text-xl mb-2 text-gray-900">
            {isDragActive ? 'Drop your resume here' : 'Drop your resume here or click to browse'}
          </p>
          <p className="text-gray-600">Supported format: PDF (max 10MB)</p>
        </div>
      ) : (
        <div className="border-2 border-solid border-green-300 rounded-lg p-6 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!uploadedFile || isUploading || loading}
        className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isUploading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Uploading...</span>
          </div>
        ) : loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Loading...</span>
          </div>
        ) : (
          'Upload Resume'
        )}
      </Button>
    </div>
  );
}
