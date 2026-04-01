'use client'
import {
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { User, FileText, Briefcase, Layers, Send, Star, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { label: 'Dashboard', icon: User, to: '/profile/dashboard' },
    { label: 'Resume', icon: FileText, to: '/profile/resumes' },
    { label: 'Jobs', icon: Briefcase, to: '/jobs' },
    { label: 'Job Tracker', icon: Layers, to: '/job-tracker' },
    { label: 'Resume Distribution', icon: Send, to: '/distribution' },
    { label: 'AI Tools', icon: Star, to: '/ai-tools' },
];

function SidebarNav() {
    const pathname = usePathname();
    return (
        <div className="flex flex-col h-full">
            <SidebarHeader>
                <div className="flex flex-col items-center gap-2 mb-8 mt-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-sm transition-transform hover:scale-105 cursor-pointer">R</div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Firmcode Limited</span>
                </div>
            </SidebarHeader>
            <SidebarMenu>
                {navItems.map(({ label, icon: Icon, to }) => (
                    <SidebarMenuItem key={label}>
                        <Link href={to} className={`block w-full ${pathname === to ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <SidebarMenuButton
                                isActive={pathname === to}
                                className={`transition-all ${pathname === to ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm' : 'hover:bg-indigo-50 hover:text-indigo-700'} rounded-lg px-3 py-2 flex items-center gap-3`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
            <div className="absolute bottom-20 left-0 right-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/logout" className="flex items-center gap-3 text-gray-500 hover:text-red-600 transition-colors">
                            <LogOut className="w-5 h-5" />
                            Logout
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </div>
        </div>
    );
}

export default SidebarNav;