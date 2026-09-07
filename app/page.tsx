import Link from "next/link";

import EditLookup from "@/components/home/EditLookup";
import PopularEditCard from "@/components/home/PopularEditCard";
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
              <PopularEditCard key={edit.displayId} edit={edit} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
