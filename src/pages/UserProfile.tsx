
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { UserProfileCredits } from "@/components/UserProfileCredits";
import { Container } from "@/components/ui/container";

export default function UserProfile() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Container className="py-8">
          <div className="max-w-md mx-auto">
            <p>Loading profile...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="py-8">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-medium">Account Information</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Email: {user?.email}
              </p>
            </div>
            
            <UserProfileCredits />
          </div>
        </div>
      </Container>
    </>
  );
}
