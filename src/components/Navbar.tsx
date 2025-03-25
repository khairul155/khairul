
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wand2, Menu, X, Coins, Zap } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import UserNav from "./UserNav";
import CreditsDisplay from "./CreditsDisplay";
import { useAuth } from "./AuthProvider";
import { useCredits } from "@/hooks/use-credits";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, mobile }) => {
  return (
    <Link
      to={href}
      className={`block text-sm font-medium transition-colors hover:text-blue-500 ${
        mobile ? "text-gray-300" : "text-gray-400"
      }`}
    >
      {children}
    </Link>
  );
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { credits, isLoading } = useCredits();

  // Calculate remaining credits
  const getRemainingCredits = () => {
    if (!credits) return null;
    
    if (credits.subscription_plan === 'free') {
      return credits.daily_credits - credits.credits_used_today;
    } else {
      return credits.monthly_credits - credits.credits_used_this_month;
    }
  };

  // Determine if credits are low (less than 10% remaining)
  const isLow = () => {
    if (!credits) return false;
    
    const remaining = getRemainingCredits();
    const total = credits.subscription_plan === 'free' ? credits.daily_credits : credits.monthly_credits;
    
    return remaining !== null && remaining < total * 0.1;
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-900 py-3">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Left Side: Logo and Navigation Links */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Wand2 className="h-6 w-6 text-blue-500 mr-2" />
            <span className="text-white font-bold text-xl">PixcraftAI</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-6">
            <NavLink href="/image-generator">AI Image Generator</NavLink>
            <NavLink href="/image-to-prompt">Image to Prompt</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
          </div>
        </div>

        {/* Right Side: Credits, Theme Toggle, Login/User Menu */}
        <div className="flex items-center space-x-4">
          {/* Credits Display for Logged-in Users */}
          {user && !isLoading && credits && (
            <Link 
              to="/pricing" 
              className={`hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                isLow() 
                  ? "bg-red-600/20 text-red-400 hover:bg-red-600/30" 
                  : credits.slow_mode_enabled
                    ? "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                    : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
              }`}
            >
              {credits.slow_mode_enabled ? (
                <Zap className="h-4 w-4" />
              ) : (
                <Coins className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{getRemainingCredits()}</span>
            </Link>
          )}

          {/* Mobile Navigation Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Auth Button or User Menu */}
          <UserNav />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-3 space-y-2 bg-gray-800">
          <NavLink href="/image-generator" mobile>AI Image Generator</NavLink>
          <NavLink href="/image-to-prompt" mobile>Image to Prompt</NavLink>
          <NavLink href="/pricing" mobile>Pricing</NavLink>
          
          {/* Credits Display in Mobile Menu */}
          {user && !isLoading && credits && (
            <div className="flex items-center space-x-2 py-2 px-1">
              <Coins className={`h-4 w-4 ${isLow() ? "text-red-400" : "text-blue-400"}`} />
              <span className={`text-sm ${isLow() ? "text-red-400" : "text-gray-300"}`}>
                Credits: {getRemainingCredits()}
              </span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
