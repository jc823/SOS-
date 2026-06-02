import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-display text-gold">404</h1>
        <p className="text-foreground text-xl">Page not found</p>
        <Link href="/" className="text-gold hover:underline text-sm">
          Return to Scale Toolkit
        </Link>
      </div>
    </div>
  );
}
