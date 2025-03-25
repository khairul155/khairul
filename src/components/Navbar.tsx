import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wand2, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import UserNav from "./UserNav";
import CreditsDisplay from "./CreditsDisplay";
import { useAuth } from "./AuthProvider";

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

        {/* Right Side: Theme Toggle, Login/User Menu */}
        <div className="flex items-center space-x-4">
          {/* Credits Display */}
          {user && <CreditsDisplay compact />}

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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
