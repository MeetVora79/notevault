import { useEffect, useState } from "react";

const STATUS_MESSAGES = [
  "Connecting to your workspace...",
  "Verifying your session...",
  "Almost there...",
];

export default function AppLoadingScreen() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) =>
        prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skeleton app shell — gives a sense of the real layout loading in */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex w-60 shrink-0 h-screen border-r border-border flex-col p-4 gap-2">
          <div className="h-6 w-24 rounded-md bg-muted animate-pulse mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 rounded-md bg-muted animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b border-border flex items-center px-6">
            <div className="h-8 w-64 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="flex-1 p-8">
            <div className="h-16 rounded-xl bg-muted animate-pulse mb-6 max-w-2xl" />
            <div className="columns-2 lg:columns-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-muted animate-pulse mb-4 break-inside-avoid"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center overlay — logo + status */}
      <div className="fixed inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {/* Logo with breathing pulse */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center animate-[pulse_1.6s_ease-in-out_infinite]">
              <span className="text-white font-display font-bold text-xl">N</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ai border-2 border-background" />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground transition-opacity duration-300">
              {STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}