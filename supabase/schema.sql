-- ============================================================
-- Esquema de Base de Datos — Plomería
-- Basado en el análisis de "PLANILLA DE TRABAJOS DE MANTENIMIENTO"
-- ============================================================

-- 1. EXTENSIÓN DE UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PERFILES (vinculados a auth.users de Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfil: lectura propia"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Perfil: inserción propia"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Perfil: actualización propia"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. ÓRDENES DE TRABAJO
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plumber_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sheet_number INTEGER,
  location TEXT NOT NULL,
  requested_by TEXT,
  received_by TEXT,
  request_date DATE,
  start_date DATE,
  end_date DATE,
  remit_number TEXT,
  description TEXT NOT NULL,
  total_labor NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_materials NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  observations TEXT,
  upds_responsible TEXT,
  ramper_responsible TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Órdenes: lectura propia"
  ON work_orders FOR SELECT
  USING (auth.uid() = plumber_id);

CREATE POLICY "Órdenes: inserción propia"
  ON work_orders FOR INSERT
  WITH CHECK (auth.uid() = plumber_id);

CREATE POLICY "Órdenes: actualización propia"
  ON work_orders FOR UPDATE
  USING (auth.uid() = plumber_id);

CREATE POLICY "Órdenes: eliminación propia"
  ON work_orders FOR DELETE
  USING (auth.uid() = plumber_id);

-- 4. ITEMS DE MANO DE OBRA (detalle)
CREATE TABLE work_order_labor_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  unit TEXT,
  quantity NUMERIC(10,2),
  unit_price NUMERIC(10,2),
  total NUMERIC(10,2) GENERATED ALWAYS AS (COALESCE(quantity,0) * COALESCE(unit_price,0)) STORED
);

ALTER TABLE work_order_labor_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labor: lectura según orden"
  ON work_order_labor_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

CREATE POLICY "Labor: inserción según orden"
  ON work_order_labor_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

CREATE POLICY "Labor: eliminación según orden"
  ON work_order_labor_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

-- 5. ITEMS DE MATERIALES (detalle)
CREATE TABLE work_order_material_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  unit TEXT,
  quantity NUMERIC(10,2),
  unit_price NUMERIC(10,2),
  total NUMERIC(10,2) GENERATED ALWAYS AS (COALESCE(quantity,0) * COALESCE(unit_price,0)) STORED
);

ALTER TABLE work_order_material_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Material: lectura según orden"
  ON work_order_material_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

CREATE POLICY "Material: inserción según orden"
  ON work_order_material_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

CREATE POLICY "Material: eliminación según orden"
  ON work_order_material_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

-- 6. FOTOS (antes / después)
CREATE TABLE work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before','after')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fotos: lectura según orden"
  ON work_order_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

CREATE POLICY "Fotos: inserción según orden"
  ON work_order_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

CREATE POLICY "Fotos: eliminación según orden"
  ON work_order_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM work_orders WHERE id = work_order_id AND plumber_id = auth.uid()
  ));

-- 7. BUCKET DE STORAGE para fotos (ejecutar en SQL Editor de Supabase)
-- NOTA: Crear bucket "work-photos" desde el dashboard de Supabase Storage
-- y configurar política pública de lectura / inserción autenticada.

-- Política para el bucket (ejecutar en SQL Editor):
/*
INSERT INTO storage.buckets (id, name, public) VALUES ('work-photos', 'work-photos', true);

CREATE POLICY "Fotos: lectura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'work-photos');

CREATE POLICY "Fotos: subida autenticada"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'work-photos'
    AND auth.role() = 'authenticated'
  );
*/

-- 8. TRIGGER: actualizar updated_at en work_orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. TRIGGER: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 10. RPC: transacción atómica para crear orden + ítems
CREATE OR REPLACE FUNCTION create_work_order_transaction(
  p_plumber_id UUID,
  p_sheet_number INTEGER DEFAULT NULL,
  p_location TEXT,
  p_requested_by TEXT DEFAULT NULL,
  p_received_by TEXT DEFAULT NULL,
  p_request_date DATE DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_remit_number TEXT DEFAULT NULL,
  p_description TEXT,
  p_total_labor NUMERIC(10,2) DEFAULT 0,
  p_total_materials NUMERIC(10,2) DEFAULT 0,
  p_grand_total NUMERIC(10,2) DEFAULT 0,
  p_observations TEXT DEFAULT NULL,
  p_upds_responsible TEXT DEFAULT NULL,
  p_ramper_responsible TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending',
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  INSERT INTO work_orders (
    plumber_id, sheet_number, location, requested_by, received_by,
    request_date, start_date, end_date, remit_number, description,
    total_labor, total_materials, grand_total, observations,
    upds_responsible, ramper_responsible, status
  ) VALUES (
    p_plumber_id, p_sheet_number, p_location, p_requested_by, p_received_by,
    p_request_date, p_start_date, p_end_date, p_remit_number, p_description,
    p_total_labor, p_total_materials, p_grand_total, p_observations,
    p_upds_responsible, p_ramper_responsible, p_status
  )
  RETURNING id INTO v_order_id;

  IF jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO work_order_items (
        work_order_id, item_type, description, unit, quantity, unit_price
      ) VALUES (
        v_order_id,
        v_item ->> 'item_type',
        v_item ->> 'description',
        COALESCE(v_item ->> 'unit', 'pza'),
        COALESCE((v_item ->> 'quantity')::NUMERIC(10,2), 0),
        COALESCE((v_item ->> 'unit_price')::NUMERIC(10,2), 0)
      );
    END LOOP;
  END IF;

  RETURN v_order_id;
END;
$$;
