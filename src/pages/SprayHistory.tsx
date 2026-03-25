import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Sprout } from "lucide-react";

interface SprayOp {
  id: string;
  spray_date: string | null;
  pesticide_used: string | null;
  quantity_used: number | null;
  coverage_area: number | null;
  application_method: string | null;
  status: string | null;
  infection_reduction: number | null;
  created_at: string;
}

const SprayHistory = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [operations, setOperations] = useState<SprayOp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchOperations();
    }
  }, [user]);

  const fetchOperations = async () => {
    try {
      const { data, error } = await supabase
        .from("spray_operations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOperations((data as SprayOp[]) || []);
    } catch (error) {
      console.error("Failed to fetch operations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "in_progress":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl font-bold text-foreground">
                Spray History
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {operations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sprout className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No spray operations recorded yet
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {operations.map((op) => (
              <Card key={op.id} className="hover:border-primary/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {op.pesticide_used || "Unknown Pesticide"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {op.spray_date
                          ? new Date(op.spray_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "No date set"}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(op.status)}>
                      {(op.status || "planned").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Quantity</p>
                      <p className="font-semibold text-foreground">
                        {op.quantity_used || 0}L
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Coverage</p>
                      <p className="font-semibold text-foreground">
                        {op.coverage_area || 0} ha
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Method</p>
                      <p className="font-semibold text-foreground">
                        {(op.application_method || "manual")
                          .replace("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Reduction</p>
                      <p className="font-semibold text-primary">
                        {op.infection_reduction != null
                          ? `${op.infection_reduction}%`
                          : "--"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SprayHistory;
