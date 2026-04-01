"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronUp, Sparkles, FileText, User, Building } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import Footer from "./Footer";

const formSchema = z.object({
    tone: z.string().min(1, "Please select a tone"),
    jobTitle: z.string().min(1, "Job title is required"),
    yourName: z.string().min(1, "Your name is required"),
    companyName: z.string().min(1, "Company name is required"),
    recipient: z.string().min(1, "Recipient is required"),
    skills: z.string().optional(),
    roleType: z.string().optional(),
    location: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const toneOptions = [
    { value: "convincing", label: "Convincing" },
    { value: "professional", label: "Professional" },
    { value: "enthusiastic", label: "Enthusiastic" },
    { value: "confident", label: "Confident" },
    { value: "friendly", label: "Friendly" },
    { value: "formal", label: "Formal" },
];

export function CoverLetterForm() {
    const [showOptional, setShowOptional] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tone: "",
            jobTitle: "",
            yourName: "",
            companyName: "",
            recipient: "",
            skills: "",
            roleType: "",
            location: "",
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsGenerating(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            toast({
                title: "Cover Letter Generated! ✨",
                description: "Your AI-powered cover letter has been created successfully.",
            });

            console.log("Form data:", data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to generate cover letter. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (

        <div className="container mx-auto max-w-4xl">
            {/* Header */}
            <div className="text-center mb-2">
                <div className="inline-flex items-center gap-2 mb-4">
                    <div className="p-2 bg-gradient-ai rounded-lg">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl mt-4 font-bold font-heading text-black">
                        AI Cover Letter Generator
                    </h1>
                </div>
                {/* <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        Create compelling, personalized cover letters in seconds with the power of AI
                    </p> */}
            </div>

            {/* Form */}
            <Card className="shadow-ai border-0 bg-white/80 backdrop-blur-sm">
                {/* <CardHeader className="pb-6">
                         <CardTitle className="flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5 text-center" />
                            Tell us about the position
                        </CardTitle> */}
                {/* <CardDescription>
                            Fill in the details below to generate your perfect cover letter
                        </CardDescription>
                    </CardHeader> */}

                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Required Fields - 2 Column Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Tone Selection - Full Width */}
                                <div className="md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="tone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Select a tone <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose the tone for your cover letter" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-white border-border">
                                                        {toneOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Job Title */}
                                <FormField
                                    control={form.control}
                                    name="jobTitle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Job Title <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Senior Software Engineer"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Your Name */}
                                <FormField
                                    control={form.control}
                                    name="yourName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Your Name <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="e.g., John Smith"
                                                        className="pl-10"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Company Name */}
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Company Name <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="e.g., Google Inc."
                                                        className="h-11 pl-10 bg-white border-border hover:border-ai-primary focus:border-ai-primary transition-colors"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Recipient */}
                                <FormField
                                    control={form.control}
                                    name="recipient"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Recipient <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Hiring Manager or Sarah Johnson"
                                                    className="h-11 bg-white border-border hover:border-ai-primary focus:border-ai-primary transition-colors"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Optional Fields - Collapsible */}
                            <Collapsible open={showOptional} onOpenChange={setShowOptional}>
                                <CollapsibleTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between"
                                    >
                                        {showOptional ? "Hide" : "Show"} Optional Parameters
                                        {showOptional ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Skills - Full Width */}
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name="skills"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Skills</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="e.g., React, TypeScript, Node.js, Project Management"
                                                                className="bg-white border-border hover:border-ai-primary focus:border-ai-primary transition-colors resize-none"
                                                                rows={3}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <p className="text-xs text-muted-foreground">
                                                            Separate multiple skills with commas
                                                        </p>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Role Type */}
                                        <FormField
                                            control={form.control}
                                            name="roleType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Role Type</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g., Full-time, Remote, Contract"
                                                            className="h-11 bg-white border-border hover:border-ai-primary focus:border-ai-primary transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {/* Location */}
                                        <FormField
                                            control={form.control}
                                            name="location"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Location</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g., San Francisco, CA or Remote"
                                                            className="h-11 bg-white border-border hover:border-ai-primary focus:border-ai-primary transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Generate Button */}
                            <Button
                                type="submit"
                                variant="default"
                                size="lg"
                                disabled={isGenerating}
                                className="w-full h-12 text-base font-medium !bg-[#0F52BA]"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate Cover Letter
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

        </div>

    );
}