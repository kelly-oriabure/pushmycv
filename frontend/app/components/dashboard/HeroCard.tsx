import { Button } from '@/components/ui/button';

function HeroCard() {
    return (
        <div className="relative bg-green-50 rounded-xl p-8 flex items-center overflow-hidden min-h-[160px]">
            <div className="z-10 max-w-[60%]">
                <div className="text-lg font-semibold text-gray-900 mb-2">Resume complete!</div>
                <div className="text-gray-600 mb-4">Nice work. Your new resume will literally open doors. Now let's use AI to tailor it for any job…</div>
                <Button variant="secondary" className="text-indigo-700 border-indigo-600">Tailor your resume with AI</Button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 max-w-[40%] z-0 opacity-90">
                {/* Illustration placeholder */}
                <svg width="120" height="100" viewBox="0 0 120 100" fill="none"><rect width="120" height="100" rx="20" fill="#6366F1" fillOpacity="0.12" /><rect x="20" y="30" width="80" height="40" rx="8" fill="#4F46E5" fillOpacity="0.18" /><rect x="40" y="45" width="40" height="10" rx="4" fill="#4F46E5" fillOpacity="0.28" /></svg>
            </div>
        </div>
    );
}

export default HeroCard; 