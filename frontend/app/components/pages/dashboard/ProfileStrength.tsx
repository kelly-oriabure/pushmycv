interface ProfileStrengthProps {
    percentage: number;
    message: string;
    suggestion: string;
    onCompleteProfile?: () => void;
}

export default function ProfileStrength({
    percentage,
    message,
    suggestion,
    onCompleteProfile,
}: ProfileStrengthProps) {
    // Calculate stroke-dashoffset for circular progress
    const circumference = 2 * Math.PI * 16; // radius is 16
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="col-span-3 lg:col-span-1 space-y-4">
            <h2 className="text-[#111618] dark:text-white text-[22px] font-bold tracking-[-0.015em]">
                Profile Strength
            </h2>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 flex flex-col items-center justify-center text-center border border-gray-200 dark:border-gray-800 h-full">
                {/* Circular Progress */}
                <div className="relative size-32">
                    <svg
                        className="size-full -rotate-90"
                        width="36"
                        height="36"
                        viewBox="0 0 36 36"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Background Circle */}
                        <circle
                            className="stroke-current text-gray-200 dark:text-gray-700"
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            strokeWidth="3"
                        />
                        {/* Progress Circle */}
                        <circle
                            className="stroke-current text-primary transition-all duration-500"
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-[#111618] dark:text-white">
                        {percentage}%
                    </div>
                </div>

                {/* Message */}
                <p className="mt-4 text-lg font-semibold text-[#111618] dark:text-white">{message}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{suggestion}</p>

                {/* Action Button */}
                <button
                    onClick={onCompleteProfile}
                    className="mt-4 flex items-center gap-2 min-w-[84px] cursor-pointer justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 text-primary text-sm font-bold hover:bg-primary/30 transition-colors"
                >
                    <span>Complete Profile</span>
                </button>
            </div>
        </div>
    );
}
