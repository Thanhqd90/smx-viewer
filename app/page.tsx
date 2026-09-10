import Link from "next/link";

import EditCard from "@/components/edits/EditCard";
import EditLookup from "@/components/home/EditLookup";
import { CATALOG_LIMIT } from "@/lib/smx573/catalog";
import { getPopularEdits } from "@/lib/smx573/popular";

export default async function Home() {
  let popularEdits = null;

  try {
    popularEdits = await getPopularEdits();
  } catch (error) {
    console.error("Failed to load popular edits", error);
  }

  return (
    <main className="home-page">
      <section className="home-hero">
        <p className="eyebrow">SMX EDIT VIEWER</p>
        <h1>SMX Edit Viewer</h1>
        <p className="home-intro">
          View published StepManiaX edits directly in your browser.
        </p>
        <EditLookup />
        <p className="example-link">
          Example: <Link href="/edit/2P6-239">2P6-239 — Night In Motion</Link>
        </p>
        <div className="home-actions">
          <Link className="browse-link" href="/edits">
            Browse the last {CATALOG_LIMIT} edits
          </Link>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- redirecting route handler, not a page */}
          <a className="random-link" href="/edit/random">
            🎲 Random edit
          </a>
        </div>
      </section>
      <section className="popular-section" aria-labelledby="popular-heading">
        <div className="section-heading">
          <p className="eyebrow">FROM THE PUBLISHED CATALOG</p>
          <h2 id="popular-heading">Popular Edits</h2>
        </div>
        {popularEdits === null ? (
          <p className="popular-message">
            Popular edits are temporarily unavailable.
          </p>
        ) : popularEdits.length === 0 ? (
          <p className="popular-message">No popular edits are available yet.</p>
        ) : (
          <div className="popular-grid">
            {popularEdits.map((edit) => (
              <EditCard key={edit.displayId} edit={edit} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
