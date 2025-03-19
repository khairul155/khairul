
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import { 
  Menu, 
  X, 
  Wand2, 
  ChevronDown, 
  LogOut, 
  User,
  Image,
  ImagePlus,
  Sparkles
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
      ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md"
      : "bg-transparent"
  );

  const navLinkClasses = cn(
    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
    isScrolled 
      ? "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      : "text-gray-200 hover:text-white"
  );

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Wand2 className={cn(
              "h-6 w-6 transition-colors",
              isScrolled ? "text-purple-600 dark:text-purple-400" : "text-purple-400"
            )} />
            <span className={cn(
              "text-xl font-bold",
              isScrolled 
                ? "text-gray-900 dark:text-white" 
                : "text-white"
            )}>
              AIMagine
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavigationMenu className="hidden md:block">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={isScrolled 
                    ? "text-gray-700 dark:text-gray-300" 
                    : "text-gray-200 dark:text-gray-200"}>
                    Tools
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <ListItem 
                        title="Image Generator" 
                        href="/image-generator"
                        icon={<ImagePlus className="h-4 w-4 text-purple-500" />}>
                        Create stunning AI-generated images from text descriptions
                      </ListItem>
                      <ListItem 
                        title="Image to Prompt" 
                        href="/image-to-prompt"
                        icon={<Image className="h-4 w-4 text-blue-500" />}>
                        Convert images to detailed text prompts
                      </ListItem>
                      <ListItem 
                        title="Image Upscaler" 
                        href="/image-upscaler"
                        icon={<Sparkles className="h-4 w-4 text-amber-500" />}>
                        Enhance resolution and quality of your images
                      </ListItem>
                      <ListItem 
                        title="Bulk Image Size Increaser" 
                        href="/bulk-image-size-increaser"
                        icon={<Image className="h-4 w-4 text-green-500" />}>
                        Process multiple images at once
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/image-generator" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Create
                    </NavigationMenuLink>
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
                    className={cn(
                      "ml-4",
                      isScrolled 
                        ? "border-gray-300 dark:border-gray-700" 
                        : "border-gray-700 text-white"
                    )}
                  >
                    My Account
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                className="ml-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
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
              className={cn(
                "ml-2",
                isScrolled 
                  ? "text-gray-700 dark:text-gray-300" 
                  : "text-white"
              )}
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
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg">
          <div className="px-4 pt-2 pb-5 space-y-3">
            <Link 
              to="/" 
              className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              Home
            </Link>
            <Link 
              to="/image-generator" 
              className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              Image Generator
            </Link>
            <Link 
              to="/image-to-prompt" 
              className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              Image to Prompt
            </Link>
            <Link 
              to="/image-upscaler" 
              className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              Image Upscaler
            </Link>
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                >
                  Profile
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
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

export default Navbar;
