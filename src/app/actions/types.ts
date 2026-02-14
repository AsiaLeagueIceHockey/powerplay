
export interface Rink {
  id: string;
  name_ko: string;
  name_en: string;
  map_url?: string;
  address?: string;
  rink_type?: "FULL" | "MINI";
  lat?: number;
  lng?: number;
}

export interface Club {
  id: string;
  name: string;
  kakao_open_chat_url?: string;
  description?: string;
  logo_url?: string;
  rep_name?: string;
  rep_phone?: string;
  created_by?: string;
  created_at?: string;
  member_count?: number;
  rinks?: Rink[];
  members?: { full_name: string | null; email: string; }[];
}

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: "admin" | "member";
  status: "pending" | "approved" | "rejected";
  intro_message?: string;
  created_at?: string;
  club?: Club;
}

export interface RegularMatchResponse {
  id: string;
  match_id: string;
  user_id: string;
  response: "attending" | "not_attending";
  position?: "FW" | "DF" | "G";
  created_at?: string;
  updated_at?: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface ClubPost {
  id: string;
  club_id: string;
  title: string;
  content: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}
