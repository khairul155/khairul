
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, User, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {session?.user?.email || "User"}
        </DropdownMenuLabel>
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal">
          {profile?.subscription_plan === 'pro' ? (
            <>
              <Crown className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-500 font-medium">Pro Plan</span>
            </>
          ) : (
            <span className="text-gray-500">Free Plan</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
