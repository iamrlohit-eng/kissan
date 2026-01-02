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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield, 
  ArrowLeft, 
  Activity, 
  Users, 
  FileText, 
  Search,
  RefreshCw,
  Calendar,
  LogIn,
  LogOut,
  Eye,
  Plus,
  Edit,
  Trash2,
  Upload,
  Bot,
  MessageSquare,
  User
} from "lucide-react";
import { format } from "date-fns";

type ActivityType = 
  | 'login'
  | 'logout'
  | 'signup'
  | 'page_view'
  | 'field_create'
  | 'field_update'
  | 'field_delete'
  | 'report_create'
  | 'report_update'
  | 'report_delete'
  | 'report_upload'
  | 'ai_analysis'
  | 'ai_chat'
  | 'profile_update';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  activity_type: ActivityType;
  description: string | null;
  metadata: unknown;
  ip_address: string | null;
  user_agent: string | null;
  page_path: string | null;
  created_at: string;
}

interface Stats {
  totalLogs: number;
  uniqueUsers: number;
  todayLogs: number;
  loginCount: number;
}

const activityIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="w-4 h-4" />,
  logout: <LogOut className="w-4 h-4" />,
  signup: <User className="w-4 h-4" />,
  page_view: <Eye className="w-4 h-4" />,
  field_create: <Plus className="w-4 h-4" />,
  field_update: <Edit className="w-4 h-4" />,
  field_delete: <Trash2 className="w-4 h-4" />,
  report_create: <Plus className="w-4 h-4" />,
  report_update: <Edit className="w-4 h-4" />,
  report_delete: <Trash2 className="w-4 h-4" />,
  report_upload: <Upload className="w-4 h-4" />,
  ai_analysis: <Bot className="w-4 h-4" />,
  ai_chat: <MessageSquare className="w-4 h-4" />,
  profile_update: <User className="w-4 h-4" />
};

const activityColors: Record<string, string> = {
  login: "bg-green-500/10 text-green-600 border-green-500/20",
  logout: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  signup: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  page_view: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  field_create: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  field_update: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  field_delete: "bg-red-500/10 text-red-600 border-red-500/20",
  report_create: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  report_update: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  report_delete: "bg-red-500/10 text-red-600 border-red-500/20",
  report_upload: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  ai_analysis: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  ai_chat: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  profile_update: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20"
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats>({ totalLogs: 0, uniqueUsers: 0, todayLogs: 0, loginCount: 0 });
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

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
      fetchLogs();
      fetchStats();
    }
  }, [isAdmin, filterType, page]);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filterType !== "all") {
        query = query.eq('activity_type', filterType as ActivityType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);

    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total logs
      const { count: totalLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Unique users
      const { data: uniqueUsersData } = await supabase
        .from('audit_logs')
        .select('user_id')
        .not('user_id', 'is', null);
      
      const uniqueUsers = new Set(uniqueUsersData?.map(u => u.user_id)).size;

      // Today's logs
      const { count: todayLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Login count
      const { count: loginCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', 'login');

      setStats({
        totalLogs: totalLogs || 0,
        uniqueUsers,
        todayLogs: todayLogs || 0,
        loginCount: loginCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(query) ||
      log.activity_type.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.page_path?.toLowerCase().includes(query)
    );
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Admin Access
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalLogs.toLocaleString()}</p>
                </div>
                <Activity className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Activity</p>
                  <p className="text-2xl font-bold text-foreground">{stats.todayLogs}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logins</p>
                  <p className="text-2xl font-bold text-foreground">{stats.loginCount}</p>
                </div>
                <LogIn className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Activity Logs
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="signup">Signup</SelectItem>
                    <SelectItem value="page_view">Page View</SelectItem>
                    <SelectItem value="field_create">Field Create</SelectItem>
                    <SelectItem value="field_update">Field Update</SelectItem>
                    <SelectItem value="field_delete">Field Delete</SelectItem>
                    <SelectItem value="report_create">Report Create</SelectItem>
                    <SelectItem value="report_upload">Report Upload</SelectItem>
                    <SelectItem value="ai_analysis">AI Analysis</SelectItem>
                    <SelectItem value="ai_chat">AI Chat</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => { fetchLogs(); fetchStats(); }}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead className="hidden lg:table-cell">Page</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm truncate max-w-32 block">
                                {log.user_email || 'Anonymous'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${activityColors[log.activity_type] || 'bg-gray-500/10 text-gray-600'} flex items-center gap-1 w-fit`}
                              >
                                {activityIcons[log.activity_type]}
                                <span className="hidden sm:inline">{log.activity_type.replace('_', ' ')}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm text-muted-foreground truncate max-w-48 block">
                                {log.description || '-'}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-sm text-muted-foreground">
                                {log.page_path || '-'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={logs.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
