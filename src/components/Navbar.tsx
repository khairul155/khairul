
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Home,
  Image,
  MessageSquare,
  Zap,
  Briefcase,
  CreditCard,
  HelpCircle,
  Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/components/AuthProvider";

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
  const location = useLocation();
  const { toast } = useToast();
  const { credits } = useAuth();

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

  const isLandingPage = location.pathname === "/";
  const isGeneratorPage = location.pathname === "/image-generator";

  const navbarClasses = cn(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
    isScrolled || !isLandingPage
      ? "bg-black/80 backdrop-blur-md shadow-md"
      : "bg-transparent"
  );

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side: Logo & Site Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md flex items-center justify-center border border-white/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h4V7h2v4h4v2h-4v4h-2v-4H7v-2z" 
                  fill="white"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                PixcraftAI
              </span>
            </Link>
          </div>

          {/* Center: Navigation Links (desktop only) */}
          <div className="hidden md:flex items-center space-x-1">
            <NavigationMenu className="hidden md:block">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Home
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-300 hover:text-white bg-transparent hover:bg-transparent focus:bg-transparent">
                    Products
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <ListItem
                        title="AI Image Generator"
                        icon={<Image className="h-4 w-4" />}
                        href="/image-generator"
                      >
                        Generate stunning images from text descriptions
                      </ListItem>
                      <ListItem
                        title="Image to Prompt"
                        icon={<MessageSquare className="h-4 w-4" />}
                        href="/image-to-prompt"
                      >
                        Extract detailed prompts from existing images
                      </ListItem>
                      <ListItem
                        title="Image Upscaler"
                        icon={<Zap className="h-4 w-4" />}
                        href="/image-upscaler"
                      >
                        Enhance and upscale your images
                      </ListItem>
                      <ListItem
                        title="Metadata Generator"
                        icon={<Briefcase className="h-4 w-4" />}
                        href="/metadata-generator"
                      >
                        Generate metadata for your images
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link to="/pricing" className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link to="/about" className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    About
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side: Theme Toggle & Credits */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2 text-white">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{credits} tokens</span>
            </div>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white"
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
        <div className="md:hidden bg-black/95 shadow-lg">
          <div className="px-4 pt-2 pb-5 space-y-3">
            <Link 
              to="/" 
              className="flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
            
            <div className="border-t border-gray-800 py-2">
              <p className="px-3 py-1 text-xs text-gray-500 uppercase">Products</p>
            </div>
            
            <Link 
              to="/image-generator" 
              className="flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              <Image className="mr-2 h-4 w-4" />
              Image Generator
            </Link>
            <Link 
              to="/image-to-prompt" 
              className="flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Image to Prompt
            </Link>
            <Link 
              to="/image-upscaler" 
              className="flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              <Zap className="mr-2 h-4 w-4" />
              Image Upscaler
            </Link>
            <Link 
              to="/metadata-generator" 
              className="flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Metadata Generator
            </Link>
            
            <div className="border-t border-gray-800 py-2">
              <p className="px-3 py-1 text-xs text-gray-500 uppercase">Company</p>
            </div>
            
            <Link 
              to="/pricing" 
              className="flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pricing
            </Link>
            
            <Link 
              to="/about" 
              className="flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 rounded-md"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              About
            </Link>
            
            <div className="flex items-center px-3 py-2 text-base font-medium text-gray-300">
              <Coins className="mr-2 h-5 w-5 text-yellow-500" />
              <span>{credits} tokens</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
