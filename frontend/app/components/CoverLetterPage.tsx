'use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, ArrowLeft, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import Footer from "./Footer";
import Navbar from "./Navbar";

const CoverLetterPage = () => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
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
        setUploadedFile(file);
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

    const handleGenerateCoverLetter = () => {
        if (!uploadedFile || !jobDescription.trim()) {
            alert("Please upload a resume and provide a job description");
            return;
        }
        console.log("Generating cover letter with:", {
            resume: uploadedFile.name,
            jobDescription
        });
        // Handle cover letter generation logic here
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">

            <main className="relative px-4 py-8">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-40 right-20 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-40 left-1/3 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-6xl mx-auto">

                    {/* Hero Section */}
                    <div className="text-center mb-16 animate-fade-in">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            AI-Powered Cover Letters
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                            Craft Perfect Cover Letters
                        </h1>
                        {/* <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your resume and job descriptions into compelling cover letters that get you noticed by hiring managers.
            </p> */}
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-8 md:p-12 animate-scale-in">
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Resume Upload Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <span className="text-primary font-bold text-sm">1</span>
                                    </div>
                                    <h2 className="text-2xl font-semibold text-foreground">Upload Resume</h2>
                                </div>

                                <div
                                    className={`
                    relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 hover:scale-[1.02] group
                    ${isDragOver
                                            ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                                            : uploadedFile
                                                ? 'border-primary bg-primary/5 shadow-md'
                                                : 'border-border hover:border-primary/50 hover:bg-primary/5'
                                        }
                  `}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {uploadedFile ? (
                                        <div className="animate-scale-in">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="font-semibold text-foreground text-lg">{uploadedFile.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in">
                                            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Upload className="w-8 h-8 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-foreground mb-3">
                                                Drop your resume here
                                            </h3>
                                            <p className="text-muted-foreground mb-6 text-lg">or click to browse files</p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleButtonClick}
                                        variant={uploadedFile ? "outline" : "default"}
                                        className="hover:scale-105 transition-transform duration-200"
                                        size="lg"
                                    >
                                        {uploadedFile ? "Change File" : "Browse Files"}
                                    </Button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".docx,.pdf,.html,.txt"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    <p className="text-sm text-muted-foreground mt-4">
                                        Supports DOCX, PDF, HTML, TXT files up to 10MB
                                    </p>
                                </div>
                            </div>

                            {/* Job Description Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                                        <span className="text-secondary-foreground font-bold text-sm">2</span>
                                    </div>
                                    <h2 className="text-2xl font-semibold text-foreground">Job Details</h2>
                                </div>

                                <div className="relative">
                                    <Textarea
                                        placeholder="Paste the complete job description here."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="min-h-[400px] resize-none text-base leading-relaxed border-border/50 focus:border-primary transition-colors duration-200"
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                                        {jobDescription.length} characters
                                    </div>
                                </div>

                                <div className="bg-accent/30 border border-accent-blue/20 rounded-lg p-4">
                                    <Button
                                        onClick={handleGenerateCoverLetter}
                                        size="lg"
                                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        disabled={!uploadedFile || !jobDescription.trim()}
                                    >
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Generate My Cover Letter
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
};

export default CoverLetterPage;