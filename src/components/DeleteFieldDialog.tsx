import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: { id: string; name: string } | null;
  onFieldDeleted: () => void;
}

export const DeleteFieldDialog = ({
  open,
  onOpenChange,
  field,
  onFieldDeleted,
}: DeleteFieldDialogProps) => {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!field) return;
    
    setIsDeleting(true);
    try {
      // First delete all reports associated with this field
      const { error: reportsError } = await supabase
        .from("fertilizer_reports")
        .delete()
        .eq("field_id", field.id);

      if (reportsError) throw reportsError;

      // Then delete the field
      const { error: fieldError } = await supabase
        .from("fields")
        .delete()
        .eq("id", field.id);

      if (fieldError) throw fieldError;

      // Log activity
      logActivity({
        activityType: "field_delete",
        description: `Deleted field: ${field.name}`,
        metadata: { fieldId: field.id, fieldName: field.name },
      });

      toast({
        title: "Field deleted",
        description: `"${field.name}" and all its reports have been deleted.`,
      });

      onFieldDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting field:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete field",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Field</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{field?.name}"? This will also delete all
            soil reports associated with this field. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Field"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
