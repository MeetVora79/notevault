import { Component } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App error caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            <h1 className="font-display font-semibold text-xl mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              An unexpected error occurred. Try refreshing the page — your notes are safe.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-muted rounded-lg p-4 mb-6 overflow-auto max-h-40 text-destructive">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;