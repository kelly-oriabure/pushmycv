
'use client';
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    FilePlus2,
    Upload,
    ChevronRight,
    X,
} from "lucide-react";
import UploadCVModal from './UploadCVModal';

interface GetStartedModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateFromScratch: () => void;
}

const GetStartedModal = ({ isOpen, onOpenChange, onCreateFromScratch }: GetStartedModalProps) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleUploadClick = () => {
        setIsUploadModalOpen(true);
    };

    const handleUploadSuccess = () => {
        // Close upload modal
        setIsUploadModalOpen(false);
        // Close the GetStarted modal
        onOpenChange(false);
        // Set localStorage flag to prevent modal from showing again
        if (typeof window !== 'undefined') {
            localStorage.setItem('hasSeenGetStartedModal', 'true');
        }
    };

    const handleCreateFromScratchClick = () => {
        onCreateFromScratch();
        // Set localStorage flag to prevent modal from showing again
        if (typeof window !== 'undefined') {
            localStorage.setItem('hasSeenGetStartedModal', 'true');
        }
    };

    const actions = [
        {
            icon: <FilePlus2 className="w-5 h-5" />,
            text: "Create New Resume from scratch",
            onClick: handleCreateFromScratchClick,
        },
        {
            icon: <Upload className="w-5 h-5" />,
            text: "Upload existing resume",
            onClick: handleUploadClick,
        },
    ];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[480px] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">
                            {"Let's get started"}
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            How do you want to create your resume?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6 space-y-3">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="w-full justify-between items-center p-6 text-base"
                                onClick={action.onClick}
                            >
                                <div className="flex items-center gap-4">
                                    {action.icon}
                                    <span className="font-semibold">{action.text}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogContent>
            </Dialog>
            
            <UploadCVModal
                isOpen={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
                onUploadSuccess={handleUploadSuccess}
            />
        </>
    );
};

export default GetStartedModal;
