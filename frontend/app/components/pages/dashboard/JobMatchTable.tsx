interface JobMatch {
    id: string;
    role: string;
    location: string;
    company: string;
    matchPercentage: number;
}

interface JobMatchTableProps {
    jobs: JobMatch[];
    onViewJob?: (jobId: string) => void;
}

export default function JobMatchTable({ jobs, onViewJob }: JobMatchTableProps) {
    const getMatchColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-green-500';
        if (percentage >= 80) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getMatchTextColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600 dark:text-green-400';
        if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-orange-600 dark:text-orange-400';
    };

    return (
        <div className="col-span-3 lg:col-span-2 space-y-4">
            <h2 className="text-[#111618] dark:text-white text-[22px] font-bold tracking-[-0.015em]">
                Your Top Job Matches
            </h2>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Company
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Match
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr
                                    key={job.id}
                                    className="bg-white dark:bg-gray-800/50 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        <p>{job.role}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{job.location}</p>
                                    </td>
                                    <td className="px-6 py-4">{job.company}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                <div
                                                    className={`${getMatchColor(job.matchPercentage)} h-1.5 rounded-full transition-all`}
                                                    style={{ width: `${job.matchPercentage}%` }}
                                                />
                                            </div>
                                            <span className={`font-medium ${getMatchTextColor(job.matchPercentage)}`}>
                                                {job.matchPercentage}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => onViewJob?.(job.id)}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
