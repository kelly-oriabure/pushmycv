'use client';
import React from 'react';
import Link from 'next/link';
import { Home, LayoutTemplate, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminSidebar = () => (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
            PushMyCV
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
                href="/admin/dashboard"
                className="flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-gray-700"
            >
                <Home className="w-5 h-5 mr-3" />
                Dashboard
            </Link>
            <Link
                href="/admin/templates"
                className="flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-gray-700"
            >
                <LayoutTemplate className="w-5 h-5 mr-3" />
                Templates
            </Link>
            {/* Add more links as needed */}
        </nav>
    </aside>
);

// Accept children as prop
const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    return (
        <div className="flex h-screen bg-gray-100">
            <AdminSidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm h-16 flex items-center px-8 justify-between">
                    <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
                    {user ? (
                        <Avatar>
                            <AvatarImage src={user.user_metadata?.avatar_url} alt={`${user.email}'s avatar`} />
                            <AvatarFallback>{user.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <span className="text-gray-600">Not Logged In</span>
                    )}
                </header>
                <div className="flex-1 p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout; 