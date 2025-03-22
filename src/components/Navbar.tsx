import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import { 
  Menu, 
  X, 
  Image, 
  ChevronDown, 
  LogOut, 
  User,
  ImagePlus,
  Sparkles,
  Wand
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

  const navLinkClasses = cn(
    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
    isScrolled 
      ? "text-gray-300 hover:text-white"
      : "text-gray-200 hover:text-white"
  );

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center">
              <Wand className="h-5 w-5 text-black" />
            </div>
            <span className={cn(
              "text-xl font-bold",
              isScrolled 
                ? "text-white" 
                : "text-white"
            )}>
              PixcraftAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavigationMenu className="hidden md:block">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-200">
                    Tools
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-black">
                      <ListItem 
                        title="Image Generator" 
                        href="/image-generator"
                        icon={<ImagePlus className="h-4 w-4 text-white" />}>
                        Create stunning AI-generated images from text descriptions
                      </ListItem>
                      <ListItem 
                        title="Image to Prompt" 
                        href="/image-to-prompt"
                        icon={<Image className="h-4 w-4 text-white" />}>
                        Convert images to detailed text prompts
                      </ListItem>
                      <ListItem 
                        title="Image Upscaler" 
                        href="/image-upscaler"
                        icon={<Sparkles className="h-4 w-4 text-white" />}>
                        Enhance resolution and quality of your images
                      </ListItem>
                      <ListItem 
                        title="Bulk Image Size Increaser" 
                        href="/bulk-image-size-increaser"
                        icon={<Image className="h-4 w-4 text-white" />}>
                        Process multiple images at once
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/image-generator" className={navigationMenuTriggerStyle()}>
                    Create
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2 text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
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

// Keep ListItem component as it was

export default Navbar;
