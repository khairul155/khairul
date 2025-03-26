import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Nav Links */}
        <div className="flex gap-6 md:gap-10">
          {/* Logo */}
          <Link to="/" className="flex items-center font-bold text-2xl text-white">
            PixcraftAI
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden gap-6 md:flex">
            <Link
              to="/"
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-white",
                pathname === "/" ? "text-white" : "text-gray-400"
              )}
            >
              Home
            </Link>
            <Link
              to="/image-generator"
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-white",
                pathname === "/image-generator" ? "text-white" : "text-gray-400"
              )}
            >
              Generator
            </Link>
            <Link
              to="/pricing"
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-white",
                pathname === "/pricing" ? "text-white" : "text-gray-400"
              )}
            >
              Pricing
            </Link>
            {user && (
              <Link
                to="/profile"
                className={cn(
                  "flex items-center text-lg font-medium transition-colors hover:text-white",
                  pathname === "/profile"
                    ? "text-white"
                    : "text-gray-400"
                )}
              >
                Profile
              </Link>
            )}
          </nav>
        </div>

        {/* Authentication Buttons */}
        <div className="flex items-center gap-4">
          {user ? (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate("/auth")}>
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
