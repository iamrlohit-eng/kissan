import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldAdded: () => void;
}

export const AddFieldDialog = ({ open, onOpenChange, onFieldAdded }: AddFieldDialogProps) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [acres, setAcres] = useState("");
  const [currentCrop, setCurrentCrop] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("fields").insert({
        name,
        location: location || null,
        acres: acres ? parseFloat(acres) : null,
        current_crop: currentCrop || null,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Field Added",
        description: `${name} has been added to your fields.`,
      });

      // Log field creation
      logActivity({
        activityType: 'field_create',
        description: `Created field: ${name}`,
        metadata: { fieldName: name, location, acres: acres ? parseFloat(acres) : null }
      });

      setName("");
      setLocation("");
      setAcres("");
      setCurrentCrop("");
      onOpenChange(false);
      onFieldAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Field</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Field Name *</Label>
            <Input
              id="name"
              placeholder="North Field - Block A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Green Valley Farm, Iowa"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acres">Acres</Label>
              <Input
                id="acres"
                type="number"
                step="0.1"
                placeholder="45"
                value={acres}
                onChange={(e) => setAcres(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crop">Current Crop</Label>
              <Input
                id="crop"
                placeholder="Corn"
                value={currentCrop}
                onChange={(e) => setCurrentCrop(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Field"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
