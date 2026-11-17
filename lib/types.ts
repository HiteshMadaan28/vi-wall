/** Shared data shapes returned by the API / data layer. None include email. */

export interface WallStats {
  configured: boolean;
  totalPlayers: number;
  totalTiles: number;
  wallCapacity: number;
  availableTiles: number;
  pendingReservations: number;
  completionPercent: number;
  completed: boolean;
  completedAt: string | null;
  participatingCountries: number;
  fillPercent: number;
  leader: { iso: string; name: string; flag: string; tiles: number } | null;
}

export interface OccupiedTile {
  tileIndex: number;
  x: number;
  y: number;
  username: string;
  countryIso: string;
  avatar: string;
  avatarUrl: string | null;
  /** 'approved' tiles are lit; 'verified' tiles are pending admin approval. */
  status: "approved" | "verified";
}

/** A tile that is currently reserved (mid-claim). No participant data exposed. */
export interface ReservedTile {
  tileIndex: number;
  x: number;
  y: number;
}

export interface PublicProfile {
  username: string;
  countryIso: string;
  countryName: string;
  countryFlag: string;
  avatar: string;
  avatarUrl: string | null;
  message: string | null;
  socialUrl: string | null;
  tileIndex: number | null;
  x: number | null;
  y: number | null;
  joinedAt: string;
  status: string;
}

export interface ActivityItem {
  id: number;
  type: string;
  countryIso: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface SearchHit {
  username: string;
  countryIso: string;
  countryFlag: string;
  tileIndex: number | null;
}
