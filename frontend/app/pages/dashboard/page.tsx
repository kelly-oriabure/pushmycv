'use client';

import { useState } from 'react';
import { SideNavBar, TopNavBar } from '@/components/pages/common';
import StatsCard from '@/components/pages/dashboard/StatsCard';
import FunnelCard from '@/components/pages/dashboard/FunnelCard';
import JobMatchTable from '@/components/pages/dashboard/JobMatchTable';
import ProfileStrength from '@/components/pages/dashboard/ProfileStrength';

// Mock data - replace with actual data from API/database
const mockUser = {
    name: 'Alex Chen',
    email: 'alex.chen@email.com',
    avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAwOoUV67fHeFLAvNJPlHC-jpjlG6ZxLmN8N-genconbXOIbetIXfIsYtxI4BER7QsOnKv4HBFyoPoMFrVHzyvgVyNz4B-gl5xV75-_XtL6sXvaESINNZEmr0iLkjqrNB0ZZnG08JttKZcZnNqlK7EtQE79YzfX6macar6SlnTKTTU6CNktl3Ng0Po_X5BnmCwX9SOgG0R_M0YWet_tcmX2f2dvKqC8MNrKDk0GkJTocQX8pJbqhmIAUxdlZ13rmasQQ112edMtudA',
};

const mockJobMatches = [
    {
        id: '1',
        role: 'Senior Product Designer',
        location: 'San Francisco, CA',
        company: 'Innovate Inc.',
        matchPercentage: 95,
    },
    {
        id: '2',
        role: 'UX Researcher',
        location: 'Remote',
        company: 'DataDriven Co.',
        matchPercentage: 91,
    },
    {
        id: '3',
        role: 'Frontend Developer',
        location: 'New York, NY',
        company: 'CodeCrafters',
        matchPercentage: 88,
    },
];

export default function DashboardPage() {
    const [userName] = useState(mockUser.name.split(' ')[0]); // Get first name

    const handleLogout = () => {
        // Implement logout logic
        console.log('Logging out...');
    };

    const handleFindNewRoles = () => {
        // Navigate to job search
        console.log('Finding new roles...');
    };

    const handleUploadResume = () => {
        // Open resume upload modal/page
        console.log('Upload resume...');
    };

    const handleRefinePreferences = () => {
        // Open preferences modal/page
        console.log('Refine preferences...');
    };

    const handleViewJob = (jobId: string) => {
        // Navigate to job details
        console.log('Viewing job:', jobId);
    };

    const handleCompleteProfile = () => {
        // Navigate to profile completion
        console.log('Complete profile...');
    };

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
            {/* Side Navigation */}
            <SideNavBar user={mockUser} onLogout={handleLogout} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                {/* Top Navigation */}
                <TopNavBar
                    userAvatar={mockUser.avatar}
                    userName={mockUser.name}
                    onFindNewRoles={handleFindNewRoles}
                />

                {/* Page Content */}
                <div className="flex-1 p-10">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Page Heading */}
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <p className="text-[#111618] dark:text-white tracking-light text-[32px] font-bold leading-tight">
                                Welcome back, {userName}!
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleUploadResume}
                                    className="flex items-center gap-2 min-w-[84px] cursor-pointer justify-center overflow-hidden rounded-lg h-10 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">upload_file</span>
                                    <span className="truncate">Upload Resume</span>
                                </button>
                                <button
                                    onClick={handleRefinePreferences}
                                    className="flex items-center gap-2 min-w-[84px] cursor-pointer justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">tune</span>
                                    <span className="truncate">Refine Preferences</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatsCard title="Applications Sent" value={12} change="+2% this week" trend="up" />
                            <StatsCard
                                title="Interviews Scheduled"
                                value={2}
                                change="+100% this week"
                                trend="up"
                            />
                            <StatsCard title="New Job Matches" value={8} change="+5% today" trend="up" />
                        </div>

                        {/* Application Funnel */}
                        <div className="space-y-4">
                            <h2 className="text-[#111618] dark:text-white text-[22px] font-bold tracking-[-0.015em]">
                                Your Application Funnel
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FunnelCard icon="lightbulb" label="Matched" count={25} color="blue" />
                                <FunnelCard icon="send" label="Applied" count={12} color="indigo" />
                                <FunnelCard icon="groups" label="Interviewing" count={2} color="purple" />
                                <FunnelCard icon="workspace_premium" label="Offer" count={0} color="green" />
                            </div>
                        </div>

                        {/* Job Matches and Profile Strength */}
                        <div className="grid grid-cols-3 gap-6">
                            <JobMatchTable jobs={mockJobMatches} onViewJob={handleViewJob} />
                            <ProfileStrength
                                percentage={75}
                                message="Profile is strong!"
                                suggestion="Add your work experience to get even better matches."
                                onCompleteProfile={handleCompleteProfile}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
