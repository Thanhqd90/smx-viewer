import type { EditChart573 } from "../smx573/types";

export interface PopularEdit {
  displayId: string;
  title: string;
  author: string;
  mode: "single" | "dual" | "full";
  meter: number;
  likes: number;
  playCount: number;
  passCount: number;
}

export interface SongMetadata {
  title: string;
  artist?: string;
}

export function rankPopularEdits(edits: EditChart573[]): EditChart573[] {
  return edits
    .filter(
      (edit) =>
        edit.is_edit &&
        edit.edit_publicity === "published" &&
        ["single", "dual", "full"].includes(edit.edit_style),
    )
    .sort((first, second) => {
      const likesDifference =
        (second.edit_likes ?? 0) - (first.edit_likes ?? 0);

      if (likesDifference !== 0) {
        return likesDifference;
      }

      return (second.play_count ?? 0) - (first.play_count ?? 0);
    });
}

export function toPopularEdit(
  edit: EditChart573,
  song: SongMetadata,
): PopularEdit {
  return {
    displayId: edit.edit_display_id,
    title: song.title,
    author: edit.edit_author,
    mode: edit.edit_style,
    meter: edit.meter,
    likes: edit.edit_likes ?? 0,
    playCount: edit.play_count ?? 0,
    passCount: edit.pass_count ?? 0,
  };
}
