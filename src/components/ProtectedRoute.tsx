
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  // If authentication is still loading, show nothing
  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }
  
  // If user is not authenticated, redirect to auth page
  if (!user) {
    toast({
      title: "Authentication required",
      description: "Please sign in to access this feature",
      variant: "destructive",
    });
    
    return <Navigate to="/auth" replace />;
  }
  
  // If user is authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
