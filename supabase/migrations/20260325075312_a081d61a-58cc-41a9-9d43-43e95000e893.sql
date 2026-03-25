
-- Create field_images table
CREATE TABLE public.field_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  image_url TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  image_metadata JSONB DEFAULT '{}'::jsonb,
  processing_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.field_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own field images" ON public.field_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own field images" ON public.field_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own field images" ON public.field_images FOR DELETE USING (auth.uid() = user_id);

-- Create pest_detection_results table
CREATE TABLE public.pest_detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_image_id UUID REFERENCES public.field_images(id) ON DELETE SET NULL,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  infection_level NUMERIC(5,1),
  pest_types JSONB DEFAULT '[]'::jsonb,
  disease_detected TEXT,
  affected_areas JSONB DEFAULT '[]'::jsonb,
  severity_classification TEXT,
  confidence_score NUMERIC(3,2),
  analysis_text TEXT,
  recommended_pesticides JSONB DEFAULT '[]'::jsonb,
  spray_urgency TEXT,
  estimated_spray_cost NUMERIC(10,2),
  weather_conditions JSONB,
  crop_type TEXT,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pest_detection_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pest detections" ON public.pest_detection_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pest detections" ON public.pest_detection_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pest detections" ON public.pest_detection_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pest detections" ON public.pest_detection_results FOR DELETE USING (auth.uid() = user_id);

-- Create spray_operations table
CREATE TABLE public.spray_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  pest_detection_id UUID REFERENCES public.pest_detection_results(id) ON DELETE SET NULL,
  spray_date TIMESTAMP WITH TIME ZONE,
  pesticide_used TEXT,
  quantity_used NUMERIC(10,2),
  coverage_area NUMERIC(10,2),
  application_method TEXT,
  spray_pattern JSONB,
  equipment_id TEXT,
  gps_coordinates JSONB,
  status TEXT DEFAULT 'planned',
  actual_coverage_area NUMERIC(10,2),
  completion_notes TEXT,
  before_image_url TEXT,
  after_image_url TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  infection_reduction NUMERIC(5,1),
  weather_conditions JSONB,
  safety_precautions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.spray_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spray operations" ON public.spray_operations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own spray operations" ON public.spray_operations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own spray operations" ON public.spray_operations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own spray operations" ON public.spray_operations FOR DELETE USING (auth.uid() = user_id);

-- Create spray_recommendations table
CREATE TABLE public.spray_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pest_detection_id UUID REFERENCES public.pest_detection_results(id) ON DELETE CASCADE,
  pesticide_name TEXT,
  concentration NUMERIC(5,2),
  quantity_liters NUMERIC(10,2),
  application_method TEXT,
  weather_requirements JSONB,
  safety_precautions TEXT,
  waiting_period_days INTEGER,
  cost_estimate NUMERIC(10,2),
  success_rate NUMERIC(5,1),
  alternative_pesticides JSONB,
  urgency_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.spray_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spray recommendations" ON public.spray_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own spray recommendations" ON public.spray_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indices for performance
CREATE INDEX idx_pest_detection_field ON public.pest_detection_results(field_id);
CREATE INDEX idx_pest_detection_user ON public.pest_detection_results(user_id);
CREATE INDEX idx_spray_operations_field ON public.spray_operations(field_id);
CREATE INDEX idx_spray_operations_user ON public.spray_operations(user_id);
CREATE INDEX idx_spray_operations_status ON public.spray_operations(status);
CREATE INDEX idx_field_images_field ON public.field_images(field_id);
