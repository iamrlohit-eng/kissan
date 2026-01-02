import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Loader2, Key } from "lucide-react";

// Special admin access key - only you know this
const ADMIN_ACCESS_KEY = "KISAAN2025ADMIN";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  
  const [accessKey, setAccessKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && !adminLoading && user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessKey.trim()) {
      toast({
        title: "Access Key Required",
        description: "Please enter your admin access key",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Check if user is logged in first
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to your account first, then access admin portal",
        variant: "destructive",
      });
      setIsSubmitting(false);
      navigate("/auth");
      return;
    }

    // Verify the special access key
    if (accessKey.trim() === ADMIN_ACCESS_KEY) {
      if (isAdmin) {
        toast({
          title: "Welcome Admin",
          description: "Access granted to admin dashboard",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Access Denied",
          description: "Your account does not have admin privileges. Contact the main admin to request access.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Invalid Key",
        description: "The access key you entered is incorrect",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-earth">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription>
              Enter your special access key to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessKey">Admin Access Key</Label>
                <Input
                  id="accessKey"
                  type="password"
                  placeholder="Enter your secret key"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {!user && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  You need to login to your account first before accessing admin portal.
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Access Admin Panel
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Only the main admin has access to this portal. To become a group admin, request access from the main admin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
