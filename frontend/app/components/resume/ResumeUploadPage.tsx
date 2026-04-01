"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

const ResumeUploadPage = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Handle file upload logic here
    console.log("Uploaded file:", file.name);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Go Back Link */}
        <Link 
          href="/resume-options" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Link>

        {/* Upload Area */}
        <div className="max-w-2xl mx-auto">
          <div
            className={`
              border-2 border-dashed rounded-lg p-16 text-center transition-colors
              ${isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/30 hover:border-primary/50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Upload Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-lg flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>

            {/* Upload Text */}
            <h2 className="text-xl font-medium text-foreground mb-4">
              Drag and drop your resume here
            </h2>

            <p className="text-muted-foreground mb-6">or</p>

            {/* Upload Button */}
            <Button 
              onClick={handleButtonClick}
              className="bg-primary hover:bg-primary/80 text-white px-8 py-2 rounded-md font-medium"
            >
              Upload from device
            </Button>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.html,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Supported File Types */}
            <p className="text-sm text-muted-foreground mt-8">
              Files we can read: PDF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadPage;