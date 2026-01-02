import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface UserRecord {
  user_id: string;
  email: string;
  created_at: string;
  role: string;
  last_login?: string;
  login_location?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsersWithLoginInfo();
    }
  }, [isAdmin]);

  const fetchUsersWithLoginInfo = async () => {
    setIsLoadingUsers(true);
    try {
      // Get all users with roles
      const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_with_roles');
      
      if (usersError) throw usersError;

      // Get last login info for each user from audit_logs
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
    if (userId === user?.id) {
      toast({
        title: "Error",
        description: "You cannot demote yourself",
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

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Main Admin
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
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
        </div>

        {/* User Records */}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                                {u.user_id === user?.id && (
                                  <Badge variant="outline" className="text-xs mt-1">You</Badge>
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
                                <><Shield className="w-3 h-3 mr-1" /> Group Admin</>
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
                            {u.role === 'admin' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => demoteFromAdmin(u.user_id, u.email)}
                                disabled={updatingUserId === u.user_id || u.user_id === user?.id}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                {updatingUserId === u.user_id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <ShieldX className="w-4 h-4 mr-1" />
                                    Remove Admin
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
                                    Make Admin
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
      </main>
    </div>
  );
};

export default Admin;
