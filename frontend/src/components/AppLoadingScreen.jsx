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
        prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev,
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
          {/* Logo */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center animate-[pulse_1.6s_ease-in-out_infinite]">
              <svg
                width="28"
                height="28"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 6H29L37 14V38C37 40.2091 35.2091 42 33 42H11C8.79086 42 7 40.2091 7 38V10C7 7.79086 8.79086 6 11 6Z"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M29 6V13C29 14.1046 29.8954 15 31 15H37"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 30L20 19L25 30L31 19"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M39.5 5L40.3 7.7L43 8.5L40.3 9.3L39.5 12L38.7 9.3L36 8.5L38.7 7.7L39.5 5Z"
                  fill="white"
                />
              </svg>
            </div>
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
