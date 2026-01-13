
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
  created_by?: string;
  created_at?: string;
  member_count?: number;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: "admin" | "member";
  created_at?: string;
  club?: Club;
}

