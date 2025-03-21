import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import { 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  User,
  Wand2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  NavigationMenuLink
} from "@/components/ui/navigation-menu";

// Subcomponent for navigation menu items
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
            {icon}
            <span>{title}</span>
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const navbarClasses = cn(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
    isScrolled 
      ? "bg-black/80 backdrop-blur-md shadow-md"
      : "bg-transparent"
  );

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Centered Logo and Site Name */}
          <Link to="/" className="flex items-center space-x-2 mx-auto">
            <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center border border-white/20">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#443627]">
              PixcraftAI
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on image-generator page */}
          <div className={cn(
            "hidden md:flex items-center space-x-1",
            location.pathname === "/image-generator" ? "invisible" : ""
          )}>
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="ml-4 border-gray-700 text-white bg-transparent hover:bg-white hover:text-black"
                  >
                    My Account
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-black border-gray-800" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="hover:bg-white hover:text-black cursor-pointer">
                      <Link to="/profile" className="flex">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="hover:bg-white hover:text-black cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                className="ml-4 bg-white text-black hover:bg-gray-300"
                asChild
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Empty div to balance the navbar for center alignment */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black shadow-lg">
          <div className="px-4 pt-2 pb-5 space-y-3">
            <Link 
              to="/" 
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              Home
            </Link>
            <Link 
              to="/image-generator" 
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              Image Generator
            </Link>
            <Link 
              to="/image-to-prompt" 
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              Image to Prompt
            </Link>
            <Link 
              to="/image-upscaler" 
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              Image Upscaler
            </Link>
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
                >
                  Profile
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent border-gray-700 text-white hover:bg-white hover:text-black"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <Button 
                className="w-full bg-white text-black hover:bg-gray-300"
                asChild
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
