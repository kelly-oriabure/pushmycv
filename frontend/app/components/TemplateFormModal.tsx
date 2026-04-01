'use client';
import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '@/store/templateStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { slugify } from '@/lib/utils';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSupabaseClient } from '@/integrations/supabase/client';

interface Template {
    id: string;
    name: string;
    category: string;
    category_id: string;
    is_premium: boolean;
    thumbnail_url?: string | File;
    description: string;
}

interface TemplateFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    template?: Template;
}

interface Category {
    id: string;
    name: string;
}

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    category_id: z.string().min(1, 'Category is required'),
    thumbnail_url: z.union([z.instanceof(File), z.string()]).optional(),
    is_premium: z.boolean(),
});

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
    isOpen,
    onOpenChange,
    template,
}) => {
    const { addTemplate, updateTemplate } = useTemplateStore();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            category_id: '',
            thumbnail_url: undefined,
            is_premium: false,
        },
    });

    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.from('template_categories').select('id, name');
            if (error) {
                toast({ title: 'Error', description: 'Failed to fetch categories.', variant: 'destructive' });
            } else if (data) {
                setCategories(data);
            }
        };

        if (isOpen) {
            fetchCategories();
        }

        if (template) {
            form.reset({
                name: template.name || '',
                description: template.description || '',
                category_id: template.category_id || '',
                thumbnail_url: template.thumbnail_url || undefined,
                is_premium: template.is_premium || false,
            });
        } else {
            form.reset({
                name: '',
                description: '',
                category_id: '',
                thumbnail_url: undefined,
                is_premium: false,
            });
        }
    }, [template, isOpen, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            if (template) {
                await updateTemplate({ ...(values as any), id: template.id });
            } else {
                await addTemplate(values as any);
            }
            toast({ title: 'Success', description: `Template ${template ? 'updated' : 'created'} successfully.` });
            onOpenChange(false);
        } catch (error) {
            toast({ title: 'Save Error', description: error instanceof Error ? error.message : 'An error occurred', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{template ? 'Edit Template' : 'Add New Template'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Modern Professional" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="A modern and clean resume template." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="thumbnail_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Thumbnail</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="is_premium"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>Premium Template</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Template'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default TemplateFormModal; 