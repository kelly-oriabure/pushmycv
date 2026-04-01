import { Button } from '@/components/ui/button';

function DashboardHeader() {
    return (
        <header className="py-6 px-6 bg-white flex flex-col gap-2 items-center text-center">
            <div className="text-2xl font-bold text-gray-900">Hi Firmcode!</div>
            <div className="text-gray-500 text-base">What's your goal today?</div>
            {/* <div className="flex gap-2 mt-4 bg-gray-50 rounded-lg p-1 w-fit justify-center">
                <Button variant="secondary" className="bg-white shadow text-indigo-700 font-semibold">Resume building</Button>
                <Button variant="ghost">Job search</Button>
                <Button variant="ghost">Interview prep</Button>
                <Button variant="ghost">Learning</Button>
            </div> */}
            {/* <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 justify-center">
                <span className="font-medium text-indigo-700">Resume building</span>
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                <span>Job search</span>
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                <span>Interview prep</span>
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                <span>Learning</span>
            </div> */}
        </header>
    );
}

export default DashboardHeader; 