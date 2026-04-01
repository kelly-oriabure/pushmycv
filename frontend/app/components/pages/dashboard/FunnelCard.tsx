interface FunnelCardProps {
    icon: string;
    label: string;
    count: number;
    color: 'blue' | 'indigo' | 'purple' | 'green';
}

const colorClasses = {
    blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/50',
        text: 'text-blue-500',
    },
    indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/50',
        text: 'text-indigo-500',
    },
    purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/50',
        text: 'text-purple-500',
    },
    green: {
        bg: 'bg-green-100 dark:bg-green-900/50',
        text: 'text-green-500',
    },
};

export default function FunnelCard({ icon, label, count, color }: FunnelCardProps) {
    const colors = colorClasses[color];

    return (
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-full ${colors.bg}`}>
                <span className={`material-symbols-outlined ${colors.text}`}>{icon}</span>
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
                <p className="text-[#111618] dark:text-white text-xl font-bold">{count}</p>
            </div>
        </div>
    );
}
