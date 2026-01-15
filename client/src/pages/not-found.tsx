import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-6 p-8">
        <div className="w-24 h-24 bg-pastel-yellow rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-12 h-12 text-pastel-yellow-dark" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800">404 Page Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Oops! It looks like you've wandered off the menu. Let's get you back to something tasty.
        </p>
        <Link href="/">
          <Button className="rounded-xl h-12 px-8 bg-slate-900 text-white hover:bg-slate-800">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
