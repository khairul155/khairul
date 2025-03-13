
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const AuthStatus = () => {
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get the URL parameters
    const url = new URL(window.location.href);
    const errorDescription = url.searchParams.get("error_description");
    
    if (errorDescription) {
      setError(errorDescription);
      setRedirectUrl(`${window.location.origin}/auth/callback`);
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
          Make sure you've configured the correct redirect URL in both the Supabase dashboard and your OAuth provider:
          <br />
          <strong>Site URL: {window.location.origin}</strong>
          <br />
          <strong>Redirect URL: {redirectUrl || `${window.location.origin}/auth/callback`}</strong>
        </p>
        <p className="mt-2 text-sm">
          For Discord authentication, you need to:
          <br />
          1. Go to the Discord Developer Portal and add the exact redirect URL shown above.
          <br />
          2. In Supabase, ensure the Discord provider is enabled with the correct Client ID and Client Secret.
          <br />
          3. Set the Site URL in Supabase to match your application URL: {window.location.origin}
        </p>
        <p className="mt-2 text-sm">
          After making these changes, try logging in again.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default AuthStatus;
