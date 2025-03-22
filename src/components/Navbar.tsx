
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import { 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  User,
  Wand2,
  HelpCircle,
  UserMinus,
  Settings,
  Upgrade
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("Current auth user:", user); // Debug user state

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
    console.log("Sign out clicked");
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
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
          <Link to="/" className="flex items-center space-x-2 mx-auto md:mx-0">
            <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center border border-white/20">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              PixcraftAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="ml-2 border-gray-700 text-white bg-transparent hover:bg-white hover:text-black flex items-center gap-2"
                  >
                    <Avatar className="h-8 w-8 border border-gray-700">
                      <AvatarImage 
                        src={user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=80&h=80"} 
                        alt={user.email || "User"} 
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {user.email ? user.email.substring(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.user_metadata?.name || user.email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-black border-gray-800" align="end">
                  <DropdownMenuLabel className="text-white border-b border-gray-700 pb-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.user_metadata?.name || user.email}</span>
                      <span className="text-xs text-gray-400">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuGroup className="py-1">
                    <DropdownMenuItem onClick={handleProfileClick} className="hover:bg-white hover:text-black cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>View Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white hover:text-black cursor-pointer">
                      <Upgrade className="mr-2 h-4 w-4" />
                      <span>Upgrade Plan</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuGroup className="py-1">
                    <DropdownMenuItem className="hover:bg-white hover:text-black cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Documentation</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white hover:text-black cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Manage Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white hover:text-black cursor-pointer">
                      <UserMinus className="mr-2 h-4 w-4" />
                      <span>Delete Account</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={handleSignOut} className="hover:bg-white hover:text-black cursor-pointer text-red-400 hover:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
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

          {/* Mobile user avatar or empty spacer */}
          <div className="md:hidden">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                  >
                    <Avatar className="h-8 w-8 border border-gray-700">
                      <AvatarImage 
                        src={user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=80&h=80"} 
                        alt={user.email || "User"} 
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {user.email ? user.email.substring(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-black border-gray-800" align="end">
                  <DropdownMenuLabel className="text-white border-b border-gray-700 pb-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.user_metadata?.name || user.email}</span>
                      <span className="text-xs text-gray-400">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuGroup className="py-1">
                    <DropdownMenuItem onClick={handleProfileClick} className="hover:bg-white hover:text-black cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>View Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white hover:text-black cursor-pointer">
                      <Upgrade className="mr-2 h-4 w-4" />
                      <span>Upgrade Plan</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuGroup className="py-1">
                    <DropdownMenuItem className="hover:bg-white hover:text-black cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Documentation</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white hover:text-black cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Manage Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white hover:text-black cursor-pointer">
                      <UserMinus className="mr-2 h-4 w-4" />
                      <span>Delete Account</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={handleSignOut} className="hover:bg-white hover:text-black cursor-pointer text-red-400 hover:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 pointer-events-none"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Empty div for balance on desktop */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu - modified to remove duplicated profile functionality */}
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
            <Button 
              className="w-full bg-white text-black hover:bg-gray-300"
              asChild
            >
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
