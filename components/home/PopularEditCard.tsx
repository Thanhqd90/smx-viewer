import Link from "next/link";

import type { PopularEdit } from "@/lib/smx/popular";

const modeLabels = {
  single: "Single",
  dual: "Dual",
  full: "Full",
} as const;

export default function PopularEditCard({ edit }: { edit: PopularEdit }) {
  return (
    <Link
      className="popular-card"
      href={`/edit/${encodeURIComponent(edit.displayId)}`}
    >
      <div className="popular-card-heading">
        <h3>{edit.title}</h3>
        <span>{edit.displayId}</span>
      </div>
      <p>by {edit.author}</p>
      <div className="popular-card-meta">
        <span>
          {modeLabels[edit.mode]} · {edit.meter}
        </span>
        <span>{edit.likes} likes</span>
        <span>{edit.playCount} plays</span>
      </div>
    </Link>
  );
}
