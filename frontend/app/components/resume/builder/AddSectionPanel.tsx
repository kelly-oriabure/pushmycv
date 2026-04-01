
import React from 'react';
import { Wand2, Settings, BookOpen, Briefcase, Globe2, Megaphone, Users, Star } from 'lucide-react';

export const AddSectionPanel: React.FC = () => (
  <div className="max-w-4xl mx-auto mt-8">
    <div className="bg-indigo-50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <span className="bg-indigo-200 text-indigo-800 text-xs font-bold px-3 py-1 rounded uppercase mr-2">Next Step</span>
        <span className="text-indigo-900 font-medium">You're a perfect match! Generate your cover letter in seconds.</span>
      </div>
      <button className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition-all flex items-center gap-2">
        <Wand2 className="w-5 h-5" /> Generate
      </button>
    </div>
    <div>
      <h2 className="text-xl font-bold mb-4">Add Section</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-3 cursor-pointer text-indigo-700 font-semibold">
          <Settings className="w-7 h-7" /> Custom Section
        </div>
        <div className="flex items-center gap-3 cursor-pointer text-indigo-700 font-semibold">
          <BookOpen className="w-7 h-7" /> Courses
        </div>
        <div className="flex items-center gap-3 cursor-pointer text-indigo-700 font-semibold">

        </div>
        <div className="flex items-center gap-3 cursor-pointer text-indigo-700 font-semibold">
          <Globe2 className="w-7 h-7" /> Languages
        </div>
        <div className="flex items-center gap-3 cursor-pointer text-indigo-400 font-semibold opacity-50">
          <Users className="w-7 h-7" /> Extra-curricular Activities
        </div>
        <div className="flex items-center gap-3 cursor-pointer text-indigo-400 font-semibold opacity-50">
          <Star className="w-7 h-7" /> Hobbies
        </div>
        <div className="flex items-center gap-3 cursor-pointer text-indigo-400 font-semibold opacity-50">
          <Megaphone className="w-7 h-7" /> References
        </div>
      </div>
    </div>
  </div>
);
