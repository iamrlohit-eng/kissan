import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Json } from "@/integrations/supabase/types";

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

interface LogActivityParams {
  activityType: ActivityType;
  description?: string;
  metadata?: Record<string, unknown>;
  pagePath?: string;
}

export const useActivityLogger = () => {
  const { user } = useAuth();

  const logActivity = useCallback(async ({
    activityType,
    description,
    metadata = {},
    pagePath
  }: LogActivityParams) => {
    try {
      const { error } = await supabase.rpc('log_activity', {
        _user_id: user?.id || null,
        _user_email: user?.email || null,
        _activity_type: activityType,
        _description: description || null,
        _metadata: metadata as Json,
        _ip_address: null,
        _user_agent: navigator.userAgent,
        _page_path: pagePath || window.location.pathname
      });

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  }, [user]);

  return { logActivity };
};

// Standalone function for logging without hook (for auth events)
export const logActivityDirect = async (
  userId: string | null,
  userEmail: string | null,
  activityType: ActivityType,
  description?: string,
  metadata: Record<string, unknown> = {}
) => {
  try {
    const { error } = await supabase.rpc('log_activity', {
      _user_id: userId,
      _user_email: userEmail,
      _activity_type: activityType,
      _description: description || null,
      _metadata: metadata as Json,
      _ip_address: null,
      _user_agent: navigator.userAgent,
      _page_path: window.location.pathname
    });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};
