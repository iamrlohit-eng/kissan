import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Loader2, Key, AlertCircle } from "lucide-react";

const MAIN_ADMIN_EMAIL = 'iamrlohit@gmail.com';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [accessKey, setAccessKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if user can access admin portal
  const canAccessAdmin = user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!accessKey.trim()) {
      toast({
        title: "Access Key Required",
        description: "Please enter your admin access key",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to your account first",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!canAccessAdmin) {
      setErrorMessage("Access denied. Only the main admin can access this portal.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-key', {
        body: { 
          accessKey: accessKey.trim(),
          userEmail: user.email 
        }
      });

      if (error) {
        setErrorMessage("Could not verify access key. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (data.valid) {
        toast({
          title: "Welcome Admin",
          description: "Access granted to admin dashboard",
        });
        navigate("/admin");
      } else {
        setErrorMessage(data.error || "The access key you entered is incorrect");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
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
            {!user ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-amber-800 font-medium">
                    You need to login first
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Please login with your account to access the admin portal
                  </p>
                </div>
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Go to Login
                </Button>
              </div>
            ) : !canAccessAdmin ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-800 font-medium">
                    Access Restricted
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    This portal is only accessible by the main admin ({MAIN_ADMIN_EMAIL})
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center mb-4">
                  <p className="text-sm text-green-800">
                    ✓ Logged in as <strong>{user.email}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessKey">Admin Access Key</Label>
                  <Input
                    id="accessKey"
                    type="password"
                    placeholder="Enter your secret key"
                    value={accessKey}
                    onChange={(e) => {
                      setAccessKey(e.target.value);
                      setErrorMessage("");
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
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
            )}

            <p className="text-center text-xs text-muted-foreground mt-6">
              Admin portal access is restricted to authorized personnel only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
