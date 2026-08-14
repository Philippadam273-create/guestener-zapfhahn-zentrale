type Profile = {
  id: string;
  created_at?: string | null;

  user_id?: string | null;

  role?: string | null;
  points?: number | null;
  drinks_count?: number | null;

  username?: string | null;
  name?: string | null;
  email?: string | null;

  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;

  gewicht_kg?: number | null;
  alter?: number | null;
  geschlecht?: string | null;

  avatar_url?: string | null;

  // Wichtig für den aktuellen Vercel-Fehler
  is_global_admin?: boolean | null;
};
