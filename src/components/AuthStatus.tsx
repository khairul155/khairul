
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const AuthStatus = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the URL parameters
    const url = new URL(window.location.href);
    const errorDescription = url.searchParams.get("error_description");
    
    if (errorDescription) {
      setError(errorDescription);
    }

    // Check for authentication events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        console.log("User signed in:", session?.user?.email);
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription>
        {error}
        <p className="mt-2 text-sm">
          Make sure you've configured the correct redirect URL in the Supabase dashboard:
          <br />
          <strong>{window.location.origin}</strong>
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default AuthStatus;
