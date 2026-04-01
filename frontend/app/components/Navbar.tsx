'use client'

import { Button } from "@/components/ui/button";
import { ChevronDown, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            {/* <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">📄</span>
            </div> */}
            <Link href="/"><Image src="/images/pushmycv-logo-2.png" alt="logo" width={200} height={100} /></Link>
            {/* <span className="text-xs text-gray-500">by career.io</span> */}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {/* <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
            <Link to="#" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
              <span>How It Works </span>
            </Link>
          </div> */}
          {/* <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
            <Link to="/resume/builder" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
              <span>CV Builder</span>
            </Link>
          </div> */}
          <div className="flex items-center space-x-1 cursor-pointer hover:text-primary">
            <Link href="/resume-gallery" className="text-gray-700 hover:text-primary flex items-center space-x-1">
              <span>Templates</span>
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-1 cursor-pointer hover:text-primary">
                <span className="text-gray-700 hover:text-primary flex items-center space-x-1">
                  <span>Resume AI Tools</span>
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/resume-analysis-upload" className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer">
                  Resume Score
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/cover-letter" className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer">
                  Cover Letter Generator
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/job-description-generator" className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer">
                  Job Description Generator
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <div className="flex items-center space-x-1 cursor-pointer hover:text-primary">
            <Link href="#" className="text-gray-700 hover:text-primary flex items-center space-x-1">
              <span>Automate Job Applications</span>
            </Link>
          </div>
          <div className="flex items-center space-x-1 cursor-pointer hover:text-primary">
            <Link href="#" className="text-gray-700 hover:text-primary flex items-center space-x-1">
              <span>Pricing</span>
            </Link>
          </div> */}

        </div>

        {/* Account Button / User Menu */}
        {user ? (
          <>
            <div className="hidden md:flex items-center text-sm font-medium text-gray-700">
              <Link href="/profile/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <span className="mx-3 h-4 w-px bg-gray-300" aria-hidden />
              <button
                type="button"
                onClick={handleSignOut}
                className="hover:text-primary transition-colors"
              >
                Sign Out
              </button>
            </div>

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile/dashboard">
                      <User className="w-4 h-4 mr-2" />
                      User Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <Link href="/auth">
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
