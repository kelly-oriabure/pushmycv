import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const mockJobs = [
    { title: 'Fullstack Developer', company: 'Intellisync', location: 'Acireale, Sicily, Italy', posted: '3 days ago' },
    { title: 'Fullstack Developer', company: 'Expleo Group', location: 'Greater Gothenburg Metropolitan Area', posted: '3 days ago' },
    { title: 'Fullstack Developer', company: 'emagine', location: 'Katowice, Śląskie, Poland', posted: '20 hours ago' },
    { title: 'Fullstack Developer', company: 'Valsoft Corporation', location: 'Beirut, Lebanon', posted: '22 hours ago' },
    { title: 'Fullstack Developer', company: 'Digg', location: 'Los Angeles, CA', posted: '6 days ago' },
    { title: 'Fullstack Developer', company: 'RedAnt Media LLP', location: 'Chennai, India', posted: '6 days ago' },
];

function JobMatches() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="font-semibold text-gray-900 text-lg mb-4">Your job matches</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockJobs.slice(0, 6).map((job, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 flex flex-col gap-1 border border-gray-100 hover:shadow transition-shadow">
                        <div className="font-medium text-gray-800 text-base">{job.title}</div>
                        <div className="text-gray-500 text-sm">{job.company} - {job.location}</div>
                        <div className="text-gray-400 text-xs mt-1">Posted {job.posted}</div>
                    </div>
                ))}
            </div>
            <Button variant="ghost" className="mt-4 text-indigo-700 flex items-center gap-1">See all jobs <ChevronRight className="w-4 h-4" /></Button>
        </div>
    );
}

export default JobMatches; 