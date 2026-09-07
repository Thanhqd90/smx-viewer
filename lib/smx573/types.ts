export interface EditChart573 {
  _id: number;
  id: number;

  difficulty: number;
  difficulty_display: string;

  edit_author: string;
  edit_display_id: string;
  edit_gamer_id: number;
  edit_likes: number;
  edit_publicity: string;
  edit_published_at: string;
  edit_serial: number;
  edit_style: "single" | "dual" | "full";
  edit_tags: string[];

  game_song_id: number;
  song_id: number;

  meter: number;
  play_count?: number;
  pass_count?: number;
  is_edit: true;

  user_bookmarked: boolean;
  user_liked: boolean;
}
