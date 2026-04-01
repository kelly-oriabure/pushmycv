interface StatsCardProps {
    title: string;
    value: number | string;
    change: string;
    trend?: 'up' | 'down';
}

export default function StatsCard({ title, value, change, trend = 'up' }: StatsCardProps) {
    const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';

    return (
        <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-shadow">
            <p className="text-[#111618] dark:text-gray-300 text-base font-medium">{title}</p>
            <p className="text-[#111618] dark:text-white tracking-light text-4xl font-bold">{value}</p>
            <p className={`${trendColor} text-sm font-medium`}>{change}</p>
        </div>
    );
}
