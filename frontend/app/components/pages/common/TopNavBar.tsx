'use client';

import { useState } from 'react';

interface TopNavBarProps {
    userAvatar: string;
    userName: string;
    onFindNewRoles?: () => void;
}

export default function TopNavBar({ userAvatar, userName, onFindNewRoles }: TopNavBarProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle search logic
        console.log('Searching for:', searchQuery);
    };

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-gray-800 px-10 py-4 bg-white dark:bg-background-dark sticky top-0 z-10">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative flex-grow max-w-xl">
                <label className="relative w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-input w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 h-10 placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-10 text-base"
                        placeholder="Search for jobs, companies..."
                    />
                </label>
            </form>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onFindNewRoles}
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                    <span className="truncate">Find New Roles</span>
                </button>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                            notifications
                        </span>
                    </button>
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        style={{ backgroundImage: `url("${userAvatar}")` }}
                        aria-label={`Profile picture of ${userName}`}
                    />
                </div>
            </div>
        </header>
    );
}
