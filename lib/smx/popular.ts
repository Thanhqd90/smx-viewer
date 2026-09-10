import type { EditChart573 } from "../smx573/types";

export interface BrowseEdit {
  displayId: string;
  title: string;
  artist?: string;
  author: string;
  mode: "single" | "dual" | "full";
  meter: number;
  tags: string[];
  publishedAt: string;
  likes: number;
  playCount: number;
  passCount: number;
}

export interface SongMetadata {
  title: string;
  artist?: string;
}

export function toBrowseEdit(
  edit: EditChart573,
  song: SongMetadata,
): BrowseEdit {
  return {
    displayId: edit.edit_display_id,
    title: song.title,
    artist: song.artist,
    author: edit.edit_author,
    mode: edit.edit_style,
    meter: edit.meter,
    tags: edit.edit_tags ?? [],
    publishedAt: edit.edit_published_at,
    likes: edit.edit_likes ?? 0,
    playCount: edit.play_count ?? 0,
    passCount: edit.pass_count ?? 0,
  };
}
