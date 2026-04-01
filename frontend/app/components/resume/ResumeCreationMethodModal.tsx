'use client';
'use client';
import React from "react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FilePlus } from "lucide-react";
import UploadCVModal from "./UploadCVModal";

interface ResumeCreationMethodModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectMethod: (method: 'scratch' | 'upload') => void;
    templateId: string;
    templateName: string;
    onShowNameModal: () => void; // callback to show name modal after upload
}

const ResumeCreationMethodModal: React.FC<ResumeCreationMethodModalProps> = ({
    isOpen,
    onOpenChange,
    onSelectMethod,
    templateId,
    templateName,
    onShowNameModal,
}) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
    const { toast } = useToast();

    const handleSelectMethod = (method: 'scratch' | 'upload') => {
        if (method === 'upload') {
            setIsUploadModalOpen(true);
        } else {
            onSelectMethod(method);
        }
    };

    const handleUploadSuccess = () => {
        setIsUploadModalOpen(false);
        onShowNameModal();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Let's get started</DialogTitle>
                        <DialogDescription className="text-center mt-2">
                            How do you want to create your resume?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            variant="outline"
                            className="flex items-center justify-start gap-2 w-full py-6 text-lg"
                            onClick={() => handleSelectMethod('scratch')}
                        >
                            <FilePlus className="w-5 h-5" />
                            Create New Resume from scratch
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center justify-start gap-2 w-full py-6 text-lg"
                            onClick={() => handleSelectMethod('upload')}
                        >
                            <Upload className="w-5 h-5" />
                            Upload existing resume
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <UploadCVModal isOpen={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} onUploadSuccess={handleUploadSuccess} />
        </>
    );
};

export default ResumeCreationMethodModal; 