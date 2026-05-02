export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
};
type ProfileInsert = {
  id: string;
  full_name: string;
  phone?: string | null;
  created_at?: string;
};
type ProfileUpdate = {
  id?: string;
  full_name?: string;
  phone?: string | null;
  created_at?: string;
};

type WorkOrderRow = {
  id: string;
  plumber_id: string;
  sheet_number: number | null;
  location: string;
  requested_by: string | null;
  received_by: string | null;
  request_date: string | null;
  start_date: string | null;
  end_date: string | null;
  remit_number: string | null;
  description: string;
  total_labor: number;
  total_materials: number;
  grand_total: number;
  observations: string | null;
  upds_responsible: string | null;
  ramper_responsible: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};
type WorkOrderInsert = {
  id?: string;
  plumber_id: string;
  sheet_number?: number | null;
  location: string;
  requested_by?: string | null;
  received_by?: string | null;
  request_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  remit_number?: string | null;
  description?: string;
  total_labor?: number;
  total_materials?: number;
  grand_total?: number;
  observations?: string | null;
  upds_responsible?: string | null;
  ramper_responsible?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};
type WorkOrderUpdate = {
  id?: string;
  plumber_id?: string;
  sheet_number?: number | null;
  location?: string;
  requested_by?: string | null;
  received_by?: string | null;
  request_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  remit_number?: string | null;
  description?: string;
  total_labor?: number;
  total_materials?: number;
  grand_total?: number;
  observations?: string | null;
  upds_responsible?: string | null;
  ramper_responsible?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type LaborItemRow = {
  id: string;
  work_order_id: string;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
};
type LaborItemInsert = {
  id?: string;
  work_order_id: string;
  description: string;
  unit?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
};
type LaborItemUpdate = {
  id?: string;
  work_order_id?: string;
  description?: string;
  unit?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
};

type MaterialItemRow = {
  id: string;
  work_order_id: string;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
};
type MaterialItemInsert = {
  id?: string;
  work_order_id: string;
  description: string;
  unit?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
};
type MaterialItemUpdate = {
  id?: string;
  work_order_id?: string;
  description?: string;
  unit?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
};

type PhotoRow = {
  id: string;
  work_order_id: string;
  photo_type: string;
  url: string;
  created_at: string;
};
type PhotoInsert = {
  id?: string;
  work_order_id: string;
  photo_type: string;
  url: string;
  created_at?: string;
};
type PhotoUpdate = {
  id?: string;
  work_order_id?: string;
  photo_type?: string;
  url?: string;
  created_at?: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      work_orders: {
        Row: WorkOrderRow;
        Insert: WorkOrderInsert;
        Update: WorkOrderUpdate;
        Relationships: [];
      };
      work_order_labor_items: {
        Row: LaborItemRow;
        Insert: LaborItemInsert;
        Update: LaborItemUpdate;
        Relationships: [];
      };
      work_order_material_items: {
        Row: MaterialItemRow;
        Insert: MaterialItemInsert;
        Update: MaterialItemUpdate;
        Relationships: [];
      };
      work_order_photos: {
        Row: PhotoRow;
        Insert: PhotoInsert;
        Update: PhotoUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
