import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger, logActivityDirect } from "@/hooks/useActivityLogger";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { FieldHeader } from "@/components/FieldHeader";
import { SoilHealthCard } from "@/components/SoilHealthCard";
import { NutrientGauge } from "@/components/NutrientGauge";
import { RecommendationCard } from "@/components/RecommendationCard";
import { AddFieldDialog } from "@/components/AddFieldDialog";
import { AddReportDialog } from "@/components/AddReportDialog";
import { AIAnalysisCard } from "@/components/AIAnalysisCard";
import { AgricultureChatbot } from "@/components/AgricultureChatbot";
import { RequestAdminDialog } from "@/components/RequestAdminDialog";
import { DeleteFieldDialog } from "@/components/DeleteFieldDialog";
import { Sprout, Plus, LogOut, MapPin, Shield, Trash2 } from "lucide-react";

interface Field {
  id: string;
  name: string;
  location: string | null;
  acres: number | null;
  current_crop: string | null;
}

interface Report {
  id: string;
  field_id: string;
  report_date: string;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  ph: number | null;
  organic_matter: number | null;
  moisture: number | null;
  temperature: number | null;
  ai_analysis: string | null;
  recommended_crops: string[] | null;
  improvement_techniques: string[] | null;
  file_url: string | null;
  file_type: string | null;
  latitude: number | null;
  longitude: number | null;
  preferred_language: string | null;
}

const Dashboard = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { logActivity } = useActivityLogger();
  
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [showAddField, setShowAddField] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const [showDeleteField, setShowDeleteField] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      // Log page view
      logActivity({ activityType: 'page_view', description: 'Viewed dashboard' });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFields();
    }
  }, [user]);

  useEffect(() => {
    if (selectedField) {
      fetchReports(selectedField.id);
    }
  }, [selectedField]);

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from("fields")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFields(data || []);
      if (data && data.length > 0) {
        setSelectedField(data[0]);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to load fields",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFields(false);
    }
  };

  const fetchReports = async (fieldId: string) => {
    try {
      const { data, error } = await supabase
        .from("fertilizer_reports")
        .select("*")
        .eq("field_id", fieldId)
        .order("report_date", { ascending: false });

      if (error) throw error;
      setReports(data || []);
      if (data && data.length > 0) {
        setSelectedReport(data[0]);
        if (data[0].ai_analysis) {
          try {
            setAiAnalysis(JSON.parse(data[0].ai_analysis));
          } catch {
            setAiAnalysis(null);
          }
        } else {
          setAiAnalysis(null);
        }
      } else {
        setSelectedReport(null);
        setAiAnalysis(null);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to load reports",
        variant: "destructive",
      });
    }
  };

  const analyzeReport = async (report: Report) => {
    if (!selectedField) return;
    setIsAnalyzing(true);
    try {
      let fileBase64: string | null = null;
      if (report.file_url && report.file_type) {
        try {
          const response = await fetch(report.file_url);
          const blob = await response.blob();
          fileBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error("Failed to fetch file for analysis:", e);
        }
      }

      const { data, error } = await supabase.functions.invoke("analyze-soil", {
        body: {
          nitrogen: report.nitrogen,
          phosphorus: report.phosphorus,
          potassium: report.potassium,
          ph: report.ph,
          organicMatter: report.organic_matter,
          moisture: report.moisture,
          temperature: report.temperature,
          currentCrop: selectedField.current_crop,
          location: selectedField.location,
          latitude: report.latitude,
          longitude: report.longitude,
          preferredLanguage: report.preferred_language || "auto",
          fileBase64: fileBase64,
          fileType: report.file_type,
        },
      });

      if (error) throw error;
      if (data.success && data.analysis) {
        setAiAnalysis({
          ...data.analysis,
          detectedLanguage: data.detectedLanguage,
        });

        const updateData: any = {
          ai_analysis: JSON.stringify(data.analysis),
          recommended_crops: data.analysis.recommendedCrops,
          improvement_techniques: data.analysis.improvementTechniques?.map((t: any) => t.title),
        };

        if (data.analysis.extractedData) {
          const extracted = data.analysis.extractedData;
          if (extracted.nitrogen != null) updateData.nitrogen = extracted.nitrogen;
          if (extracted.phosphorus != null) updateData.phosphorus = extracted.phosphorus;
          if (extracted.potassium != null) updateData.potassium = extracted.potassium;
          if (extracted.ph != null) updateData.ph = extracted.ph;
          if (extracted.organicMatter != null) updateData.organic_matter = extracted.organicMatter;
          if (extracted.moisture != null) updateData.moisture = extracted.moisture;
        }

        await supabase.from("fertilizer_reports").update(updateData).eq("id", report.id);

        if (selectedField) {
          fetchReports(selectedField.id);
        }

        toast({
          title: t("common.success"),
          description: data.detectedLanguage
            ? `AI analyzed your report in ${data.detectedLanguage.languageName}.`
            : "AI has analyzed your soil report with recommendations.",
        });
        
        // Log AI analysis activity
        logActivity({
          activityType: 'ai_analysis',
          description: `AI analyzed soil report for ${selectedField.name}`,
          metadata: { fieldId: selectedField.id, reportId: report.id }
        });
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "Could not analyze the report",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    if (user) {
      await logActivityDirect(user.id, user.email || null, 'logout', 'User signed out');
    }
    await signOut();
    navigate("/");
  };

  if (authLoading || isLoadingFields) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-earth rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">{t("app.title")}</h1>
                <p className="text-xs text-muted-foreground">{t("dashboard.welcome")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                {t("dashboard.signOut")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Field Selector */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {fields.map((field) => (
            <div key={field.id} className="relative group">
              <button
                onClick={() => setSelectedField(field)}
                className={`px-4 py-2 rounded-lg border transition-all pr-10 ${
                  selectedField?.id === field.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                {field.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFieldToDelete(field);
                  setShowDeleteField(true);
                }}
                className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedField?.id === field.id
                    ? "hover:bg-primary-foreground/20 text-primary-foreground"
                    : "hover:bg-destructive/10 text-destructive"
                }`}
                title="Delete field"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setShowAddField(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t("dashboard.addField")}
          </Button>
        </div>

        {selectedField ? (
          <div className="space-y-6">
            <FieldHeader
              fieldName={selectedField.name}
              location={selectedField.location || t("common.location")}
              reportDate={selectedReport?.report_date || t("dashboard.noReports")}
              acres={selectedField.acres || 0}
            />

            {/* Report Selector & Add Button */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">{t("dashboard.reports")}:</span>
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => {
                    setSelectedReport(report);
                    if (report.ai_analysis) {
                      try {
                        setAiAnalysis(JSON.parse(report.ai_analysis));
                      } catch {
                        setAiAnalysis(null);
                      }
                    } else {
                      setAiAnalysis(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedReport?.id === report.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {new Date(report.report_date).toLocaleDateString()}
                </button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setShowAddReport(true)}>
                <Plus className="w-4 h-4 mr-1" />
                {t("dashboard.addReport")}
              </Button>
            </div>

            {selectedReport ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <SoilHealthCard
                    ph={selectedReport.ph || 7}
                    organicMatter={selectedReport.organic_matter || 0}
                    moisture={selectedReport.moisture || 0}
                    temperature={selectedReport.temperature || 20}
                  />

                  {/* AI Analysis Button */}
                  <Button
                    className="w-full"
                    onClick={() => analyzeReport(selectedReport)}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing
                      ? t("dashboard.analyzing")
                      : aiAnalysis
                      ? t("dashboard.analyzeWithAI")
                      : t("dashboard.analyzeWithAI")}
                  </Button>

                  {aiAnalysis && (
                    <AIAnalysisCard
                      analysis={aiAnalysis}
                      detectedLanguage={aiAnalysis.detectedLanguage}
                      fieldName={selectedField.name}
                      location={selectedField.location || "Unknown"}
                      reportDate={selectedReport.report_date}
                      reportData={{
                        nitrogen: selectedReport.nitrogen,
                        phosphorus: selectedReport.phosphorus,
                        potassium: selectedReport.potassium,
                        ph: selectedReport.ph,
                        organicMatter: selectedReport.organic_matter,
                        moisture: selectedReport.moisture,
                        temperature: selectedReport.temperature,
                      }}
                    />
                  )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {t("ai.npkAnalysis")}
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <NutrientGauge
                      label={t("soil.nitrogen") + " (N)"}
                      value={selectedReport.nitrogen || 0}
                      unit="ppm"
                      min={0}
                      max={100}
                      optimal={{ min: 25, max: 50 }}
                      color="nitrogen"
                    />
                    <NutrientGauge
                      label={t("soil.phosphorus") + " (P)"}
                      value={selectedReport.phosphorus || 0}
                      unit="ppm"
                      min={0}
                      max={60}
                      optimal={{ min: 15, max: 30 }}
                      color="phosphorus"
                    />
                    <NutrientGauge
                      label={t("soil.potassium") + " (K)"}
                      value={selectedReport.potassium || 0}
                      unit="ppm"
                      min={0}
                      max={400}
                      optimal={{ min: 120, max: 250 }}
                      color="potassium"
                    />
                  </div>

                  {aiAnalysis?.improvementTechniques && (
                    <RecommendationCard
                      recommendations={aiAnalysis.improvementTechniques.map((t: any, i: number) => ({
                        id: String(i),
                        title: t.title,
                        description: t.description,
                        priority: t.priority,
                      }))}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl">
                <p className="text-muted-foreground mb-4">{t("dashboard.noReports")}</p>
                <Button onClick={() => setShowAddReport(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("dashboard.addFirstReport")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl animate-fade-up">
            <Sprout className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              {t("dashboard.welcome")}
            </h2>
            <p className="text-muted-foreground mb-6">{t("dashboard.addFirstField")}</p>
            <Button onClick={() => setShowAddField(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.addField")}
            </Button>
          </div>
        )}
      </main>

      <AddFieldDialog open={showAddField} onOpenChange={setShowAddField} onFieldAdded={fetchFields} />
      <AddReportDialog
        open={showAddReport}
        onOpenChange={setShowAddReport}
        fieldId={selectedField?.id || ""}
        onReportAdded={() => selectedField && fetchReports(selectedField.id)}
      />
      <DeleteFieldDialog
        open={showDeleteField}
        onOpenChange={setShowDeleteField}
        field={fieldToDelete}
        onFieldDeleted={() => {
          fetchFields();
          if (fieldToDelete?.id === selectedField?.id) {
            setSelectedField(null);
            setSelectedReport(null);
            setAiAnalysis(null);
          }
        }}
      />
      <AgricultureChatbot />
    </div>
  );
};

export default Dashboard;
