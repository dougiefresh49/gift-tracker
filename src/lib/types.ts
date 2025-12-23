// Database types matching Supabase schema
export interface Profile {
  id: string;
  name: string;
  created_at: string;
}

export interface Gift {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  status: "available" | "claimed" | "santa";
  claimed_by_id: string | null;
  is_santa: boolean;
  created_at: string;
  gift_recipients: { profile: Profile }[];
}

export interface Budget {
  id: string;
  gifter_id: string;
  recipient_id: string;
  limit_amount: number;
}

// Import data types
export interface MasterImportItem {
  name: string;
  price: number;
  imageUrl: string;
  recipientName: string;
  isSanta: boolean;
}

