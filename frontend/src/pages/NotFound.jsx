import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
          <FileQuestion size={26} className="text-muted-foreground" />
        </div>
        <h1 className="font-display font-semibold text-2xl mb-2">
          404 — Page not found
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link to="/">
          <Button>Back to notes</Button>
        </Link>
      </div>
    </div>
  );
}
