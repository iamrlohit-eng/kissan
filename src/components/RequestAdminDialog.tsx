import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

// Admin email for notifications
const ADMIN_EMAIL = "iamrlohit@gmail.com";

interface AdminRequest {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
}

export const RequestAdminDialog = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<AdminRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && open) {
      checkExistingRequest();
    }
  }, [user, open]);

  const checkExistingRequest = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setExistingRequest(data);
    } catch (error) {
      console.error('Error checking request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Insert the request
      const { error } = await supabase
        .from('admin_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          reason: reason.trim() || null,
        });

      if (error) throw error;

      // Send email notification to admin
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'admin_request',
          userEmail: user.email,
          adminEmail: ADMIN_EMAIL,
          reason: reason.trim() || 'No reason provided',
        },
      });

      toast({
        title: "Request Submitted",
        description: "Your admin access request has been submitted. You'll receive an email when it's reviewed.",
      });

      setOpen(false);
      setReason("");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show for admins
  if (isAdmin) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          Request Admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Admin Access</DialogTitle>
          <DialogDescription>
            Submit a request to become a Group Admin. The main admin will review your request.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : existingRequest && existingRequest.status === 'pending' ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">You already have a pending request:</p>
              <div className="flex items-center justify-between">
                {getStatusBadge(existingRequest.status)}
                <span className="text-xs text-muted-foreground">
                  Submitted: {new Date(existingRequest.created_at).toLocaleDateString()}
                </span>
              </div>
              {existingRequest.reason && (
                <p className="text-sm mt-2 italic">"{existingRequest.reason}"</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Please wait for the admin to review your request. You'll receive an email notification.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {existingRequest && existingRequest.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-sm text-red-600">Your previous request was not approved. You can submit a new request with additional information.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Why do you want admin access? (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Describe why you need admin access..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
