
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-md mx-auto pt-16">
          <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md mx-auto pt-16">
        <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl">User Profile</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                <User className="h-10 w-10 text-purple-600 dark:text-purple-300" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium">{user?.email}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.phone || "No phone number"}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h4 className="font-medium">Account Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500 dark:text-gray-400">Account ID:</div>
                <div className="truncate">{user?.id}</div>
                
                <div className="text-gray-500 dark:text-gray-400">Last Sign In:</div>
                <div>{new Date(user?.last_sign_in_at || "").toLocaleString()}</div>
                
                <div className="text-gray-500 dark:text-gray-400">Email Confirmed:</div>
                <div>{user?.email_confirmed_at ? "Yes" : "No"}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
            <Button 
              variant="destructive" 
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
