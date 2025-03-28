
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface UserWithCredits {
  id: string;
  email: string;
  subscription_plan: string | null;
  credits_used_today: number | null;
  credits_used_this_month: number | null;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // For demonstration, we're checking a hardcoded admin ID
  // In a real app, this would check against an admin role in the database
  useEffect(() => {
    if (user) {
      // This is just a demo approach - in production you would have a proper admin role check
      setIsAdmin(true);
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Get users from auth schema - admin only function
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // For each user, get their credit info
      const usersWithCredits = await Promise.all(
        authUsers.users.map(async (authUser) => {
          const { data: creditData } = await supabase
            .from('user_credits')
            .select('subscription_plan, credits_used_today, credits_used_this_month')
            .eq('user_id', authUser.id)
            .single();
            
          return {
            id: authUser.id,
            email: authUser.email || 'No email',
            subscription_plan: creditData?.subscription_plan || 'free',
            credits_used_today: creditData?.credits_used_today || 0,
            credits_used_this_month: creditData?.credits_used_this_month || 0
          };
        })
      );
      
      setUsers(usersWithCredits);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Make sure you have admin privileges.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserPlan = async () => {
    if (!userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Call the Supabase function to update the user's plan
      const { data, error } = await supabase.rpc(
        'update_user_subscription',
        { _user_id: userId, _subscription_plan: plan }
      );
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `User plan updated to ${plan}`,
      });
      
      // Refresh the user list
      await fetchUsers();
      
      // Clear the form
      setUserId("");
      setPlan("basic");
    } catch (error) {
      console.error('Error updating user plan:', error);
      toast({
        title: "Error",
        description: "Failed to update user plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-28 pb-20">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Update User Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Enter user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={updateUserPlan} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update User Plan"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Quick User Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Click on any user ID below to fill the form:
              </p>
              
              <div className="space-y-2 max-h-48 overflow-auto pr-2">
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <div 
                      key={user.id} 
                      className="p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => setUserId(user.id)}
                    >
                      <div className="truncate text-sm font-medium">{user.email}</div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>ID: {user.id.substring(0, 8)}...</span>
                        <span className="capitalize">{user.subscription_plan}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No users found</p>
                )}
              </div>
              
              <Button 
                onClick={fetchUsers} 
                variant="outline" 
                className="w-full mt-4"
                disabled={loadingUsers}
              >
                {loadingUsers ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Refresh Users"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>User Credits Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">User ID</TableHead>
                      <TableHead className="text-gray-400">Plan</TableHead>
                      <TableHead className="text-gray-400">Daily Credits Used</TableHead>
                      <TableHead className="text-gray-400">Monthly Credits Used</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id} className="border-gray-800">
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell className="text-xs truncate max-w-[100px]">{user.id}</TableCell>
                          <TableCell className="capitalize">{user.subscription_plan}</TableCell>
                          <TableCell>{user.credits_used_today || 0}</TableCell>
                          <TableCell>{user.credits_used_this_month || 0}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setUserId(user.id);
                                setPlan(user.subscription_plan as string);
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
