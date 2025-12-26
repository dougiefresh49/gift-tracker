// Database types matching Supabase schema
export interface Profile {
  id: string;
  name: string;
  created_at: string;
}

export type GiftType = 'item' | 'cash' | 'gift_card';

export interface Gift {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  status: 'available' | 'claimed' | 'santa';
  claimed_by_id: string | null;
  purchaser_id: string | null;
  created_by_id: string | null;
  is_santa: boolean;
  gift_type: GiftType;
  return_status: 'NONE' | 'TO_RETURN' | 'RETURNED';
  created_at: string;
  gift_recipients: { profile: Profile }[];
  gift_tags: { tag: string }[];
}

export interface Budget {
  id: string;
  gifter_id: string;
  recipient_id: string;
  limit_amount: number;
}

export interface Reconciliation {
  id: string;
  gifter_id: string;
  recipient_id: string;
  purchaser_id: string;
  amount: number;
  transaction_type: 'iou' | 'cash' | 'check' | 'bank_transfer' | 'trade';
  notes: string | null;
  created_at: string;
}

// Import data types
export interface MasterImportItem {
  name: string;
  price: number;
  imageUrl: string;
  recipientName: string;
  isSanta: boolean;
}
