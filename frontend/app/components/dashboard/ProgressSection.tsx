import { CheckCircle, FileText, Send, Edit } from 'lucide-react';

function ProgressSection() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="font-semibold text-gray-900 text-lg mb-2">Progress</div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" />
                    <span className="font-medium text-gray-700">Resume building</span>
                    <span className="ml-auto text-green-600 font-semibold">100%</span>
                </div>
                <div className="flex items-center gap-3">
                    <FileText className="text-gray-400" />
                    <span className="font-medium text-gray-700">Resume tailoring</span>
                    <span className="ml-auto text-gray-400 font-semibold">0%</span>
                </div>
                <div className="flex items-center gap-3">
                    <Send className="text-gray-400" />
                    <span className="font-medium text-gray-700">Resume distribution</span>
                    <span className="ml-auto text-gray-400 font-semibold">0%</span>
                </div>
                <div className="flex items-center gap-3">
                    <Edit className="text-gray-400" />
                    <span className="font-medium text-gray-700">Cover letter crafting</span>
                    <span className="ml-auto text-gray-400 font-semibold">0%</span>
                </div>
            </div>
        </div>
    );
}

export default ProgressSection; 