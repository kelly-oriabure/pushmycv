'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    icon: string;
    label: string;
    href: string;
}

interface UserProfile {
    name: string;
    email: string;
    avatar: string;
}

interface SideNavBarProps {
    user: UserProfile;
    onLogout?: () => void;
}

const navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { icon: 'person', label: 'My Profile', href: '/profile' },
    { icon: 'work', label: 'Job Search', href: '/job-search' },
    { icon: 'check_box', label: 'Applications', href: '/applications' },
    { icon: 'description', label: 'Resume Manager', href: '/resume-manager' },
    { icon: 'settings', label: 'Settings', href: '/settings' },
];

export default function SideNavBar({ user, onLogout }: SideNavBarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-background-dark border-r border-gray-200 dark:border-gray-800 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                <div className="size-8 text-primary">
                    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z"
                            fillRule="evenodd"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-[#111618] dark:text-white">JobAI</h2>
            </div>

            {/* Navigation */}
            <div className="flex flex-col justify-between flex-1 p-4">
                <div className="flex flex-col gap-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive
                                        ? 'bg-primary/20'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/10'
                                    }`}
                            >
                                <span
                                    className={`material-symbols-outlined ${isActive ? 'fill text-primary' : 'text-[#111618] dark:text-gray-300'
                                        }`}
                                >
                                    {item.icon}
                                </span>
                                <p
                                    className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-[#111618] dark:text-gray-300'
                                        }`}
                                >
                                    {item.label}
                                </p>
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile & Logout */}
                <div className="flex flex-col gap-1 border-t border-gray-200 dark:border-gray-800 pt-2">
                    <div className="flex gap-3 p-3 items-center">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                            style={{ backgroundImage: `url("${user.avatar}")` }}
                            aria-label={`Profile picture of ${user.name}`}
                        />
                        <div className="flex flex-col">
                            <h1 className="text-[#111618] dark:text-white text-base font-medium leading-normal">
                                {user.name}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-[#111618] dark:text-gray-300">
                            logout
                        </span>
                        <p className="text-[#111618] dark:text-gray-300 text-sm font-medium">Logout</p>
                    </button>
                </div>
            </div>
        </aside>
    );
}
