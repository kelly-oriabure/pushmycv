import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

const LoadingScreen = ({ 
  className, 
  title = "Processing.",
  subtitle = "Please wait while AI processes the information from your resume."
}: LoadingScreenProps) => {
  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center bg-background p-8",
      className
    )}>
      {/* Circular Progress Spinner */}
      <div className="relative w-24 h-24 mb-8">
        <svg 
          className="w-full h-full animate-spin" 
          viewBox="0 0 24 24"
          aria-label="Loading progress"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="hsl(var(--spinner-inactive))"
            strokeWidth="2"
            className="opacity-80"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="hsl(var(--spinner-active))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="23.562"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-center">
        {title}
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-muted-foreground text-center max-w-2xl leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};

export default LoadingScreen;