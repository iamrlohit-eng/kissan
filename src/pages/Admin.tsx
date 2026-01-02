import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  ArrowLeft, 
  Users, 
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

const MAIN_ADMIN_EMAIL = 'iamrlohit@gmail.com';

interface UserRecord {
  user_id: string;
  email: string;
  created_at: string;
  role: string;
  last_login?: string;
  login_location?: string;
}

interface AdminRequest {
  id: string;
  user_id: string;
  user_email: string;
  reason: string | null;
  status: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Check if current user is the main admin
  const isMainAdmin = user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && !isMainAdmin) {
      toast({
        title: "Access Denied",
        description: "Only the main admin can access this portal",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isMainAdmin, authLoading, user, navigate, toast]);

  useEffect(() => {
    if (isMainAdmin) {
      fetchUsersWithLoginInfo();
      fetchRequests();
      
      // Set up real-time subscription for admin requests
      const channel = supabase
        .channel('admin-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_requests'
          },
          () => {
            fetchRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isMainAdmin]);

  const fetchUsersWithLoginInfo = async () => {
    setIsLoadingUsers(true);
    try {
      const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_with_roles');
      
      if (usersError) throw usersError;

      const usersWithLoginInfo: UserRecord[] = await Promise.all(
        (usersData || []).map(async (u: UserRecord) => {
          const { data: loginData } = await supabase
            .from('audit_logs')
            .select('created_at, metadata')
            .eq('user_id', u.user_id)
            .eq('activity_type', 'login')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...u,
            last_login: loginData?.created_at || null,
            login_location: (loginData?.metadata as Record<string, unknown>)?.location as string || 'Unknown'
          };
        })
      );

      setUsers(usersWithLoginInfo);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('admin_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const approveRequest = async (request: AdminRequest) => {
    setProcessingRequestId(request.id);
    try {
      const { error: updateError } = await supabase
        .from('admin_requests')
        .update({ 
          status: 'approved', 
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: request.user_id, role: 'admin' });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'request_approved',
          userEmail: request.user_email,
        },
      });

      toast({
        title: "Request Approved",
        description: `${request.user_email} is now a Group Admin`,
      });

      fetchRequests();
      fetchUsersWithLoginInfo();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const rejectRequest = async (request: AdminRequest) => {
    setProcessingRequestId(request.id);
    try {
      const { error } = await supabase
        .from('admin_requests')
        .update({ 
          status: 'rejected', 
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'request_rejected',
          userEmail: request.user_email,
        },
      });

      toast({
        title: "Request Rejected",
        description: `${request.user_email}'s request has been rejected`,
      });

      fetchRequests();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const promoteToAdmin = async (userId: string, userEmail: string) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${userEmail} is now a Group Admin`,
      });
      
      fetchUsersWithLoginInfo();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to promote user",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const demoteFromAdmin = async (userId: string, userEmail: string) => {
    if (userEmail.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()) {
      toast({
        title: "Error",
        description: "Cannot demote the main admin",
        variant: "destructive",
      });
      return;
    }

    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      toast({
        title: "Success",
        description: `${userEmail} is now a regular user`,
      });
      
      fetchUsersWithLoginInfo();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to demote user",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    return u.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMainAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Notification Bell */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                className={pendingRequests.length > 0 ? "animate-pulse" : ""}
                onClick={() => {
                  const element = document.querySelector('[data-value="requests"]');
                  if (element instanceof HTMLElement) element.click();
                }}
              >
                <Bell className={`w-5 h-5 ${pendingRequests.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </Button>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Main Admin
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Group Admins</p>
                  <p className="text-2xl font-bold text-foreground">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={pendingRequests.length > 0 ? "border-amber-300 bg-amber-50/50" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className={`text-2xl font-bold ${pendingRequests.length > 0 ? 'text-amber-600' : 'text-foreground'}`}>
                    {pendingRequests.length}
                  </p>
                </div>
                <Bell className={`w-8 h-8 ${pendingRequests.length > 0 ? 'text-amber-500' : 'text-muted-foreground'} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={pendingRequests.length > 0 ? "requests" : "users"}>
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Records
            </TabsTrigger>
            <TabsTrigger value="requests" data-value="requests" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-1 bg-amber-500 text-white text-xs">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Records
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full sm:w-64"
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchUsersWithLoginInfo}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((u) => (
                            <TableRow key={u.user_id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium block">{u.email}</span>
                                    {u.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase() && (
                                      <Badge variant="outline" className="text-xs mt-1 bg-primary/10 text-primary">Main Admin</Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={u.role === 'admin' 
                                    ? 'bg-primary/10 text-primary border-primary/20' 
                                    : 'bg-muted text-muted-foreground'
                                  }
                                >
                                  {u.role === 'admin' ? (
                                    <><Shield className="w-3 h-3 mr-1" /> Admin</>
                                  ) : (
                                    <><User className="w-3 h-3 mr-1" /> User</>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {u.last_login 
                                    ? format(new Date(u.last_login), 'MMM d, yyyy HH:mm')
                                    : 'Never'
                                  }
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {u.login_location || 'Unknown'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(u.created_at), 'MMM d, yyyy')}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {u.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase() ? (
                                  <Badge variant="outline" className="text-xs">Protected</Badge>
                                ) : u.role === 'admin' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => demoteFromAdmin(u.user_id, u.email)}
                                    disabled={updatingUserId === u.user_id}
                                    className="text-orange-600 hover:text-orange-700"
                                  >
                                    {updatingUserId === u.user_id ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <ShieldX className="w-4 h-4 mr-1" />
                                        Remove
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => promoteToAdmin(u.user_id, u.email)}
                                    disabled={updatingUserId === u.user_id}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    {updatingUserId === u.user_id ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <ShieldCheck className="w-4 h-4 mr-1" />
                                        Promote
                                      </>
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Admin Requests
                  </CardTitle>
                  <Button variant="outline" size="icon" onClick={fetchRequests}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No admin requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div 
                        key={request.id} 
                        className={`p-4 rounded-lg border ${
                          request.status === 'pending' 
                            ? 'bg-amber-50 border-amber-200' 
                            : request.status === 'approved'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{request.user_email}</span>
                              {request.status === 'pending' && (
                                <Badge className="bg-amber-500 text-white">Pending</Badge>
                              )}
                              {request.status === 'approved' && (
                                <Badge className="bg-green-500 text-white">Approved</Badge>
                              )}
                              {request.status === 'rejected' && (
                                <Badge className="bg-red-500 text-white">Rejected</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {request.reason || 'No reason provided'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested: {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveRequest(request)}
                                disabled={processingRequestId === request.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingRequestId === request.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectRequest(request)}
                                disabled={processingRequestId === request.id}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                {processingRequestId === request.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
