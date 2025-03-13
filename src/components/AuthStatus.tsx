
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthStatus() {
  return (
    <Alert className="mt-8 backdrop-blur-lg bg-white/70 dark:bg-gray-800/70 border border-amber-200 dark:border-amber-800">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-700 dark:text-amber-400">Authentication Setup</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p className="mt-2">
          For authentication to work properly, you need to:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Configure the Site URL in Supabase Auth Settings to match your app's URL (e.g., <code>http://localhost:8080</code>)</li>
          <li>
            For Google/Discord authentication, you'll need to:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Set up an OAuth app in Google/Discord Developer Console</li>
              <li>Add the correct redirect URL (<code>http://localhost:8080/auth/callback</code>)</li>
              <li>Configure the provider in Supabase Auth settings</li>
            </ul>
          </li>
          <li>Consider disabling "Confirm email" in Supabase Auth settings during development</li>
        </ol>
        <div className="flex gap-2 mt-4 pt-2 border-t border-amber-200 dark:border-amber-800">
          <Button variant="outline" size="sm" asChild>
            <a href="https://supabase.com/dashboard/project/napbrxjntjvkjwlcpwql/auth/providers" target="_blank" rel="noreferrer" className="text-xs">
              Supabase Auth Providers
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://supabase.com/dashboard/project/napbrxjntjvkjwlcpwql/auth/url-configuration" target="_blank" rel="noreferrer" className="text-xs">
              Supabase URL Config
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
