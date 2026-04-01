'use client';
import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '@/store/templateStore';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import TemplateFormModal from '@/components/TemplateFormModal';
import { useToast } from '@/hooks/use-toast';

const AdminTemplates = () => {
    const { templates, loading, fetchTemplates, deleteTemplate } = useTemplateStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleAddNew = () => {
        setEditingTemplate(null);
        setIsModalOpen(true);
    };

    const handleEdit = (template: any) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        try {
            await deleteTemplate(deleteTarget);
            toast({ title: 'Success', description: 'Template deleted successfully.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete template.', variant: 'destructive' });
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Manage Templates</h2>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add New Template
                </Button>
            </div>
            <div className="bg-white rounded-lg shadow-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Thumbnail</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Premium</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : (
                            templates.map((template) => (
                                <TableRow key={template.uuid}>
                                    <TableCell>
                                        <img
                                            src={template.image}
                                            alt={template.name}
                                            className="w-24 h-auto rounded-md"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{template.name}</TableCell>
                                    <TableCell>{template.categories?.join(', ')}</TableCell>
                                    <TableCell>
                                        {template.is_premium ? 'Yes' : 'No'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(template)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteTarget(template)} className="text-red-600">
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <TemplateFormModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                template={editingTemplate}
            />

            {deleteTarget && (
                <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the template
                                and its associated thumbnail.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
};

export default AdminTemplates; 