import Link from "next/link";

import EditCard from "@/components/edits/EditCard";
import {
  CATALOG_LIMIT,
  filterEdits,
  getEditCatalog,
  sortEdits,
  type EditStyle,
  type SortKey,
} from "@/lib/smx573/catalog";

const PAGE_SIZE = 24;

interface EditsPageProps {
  searchParams: Promise<{
    q?: string;
    style?: string;
    meterMin?: string;
    meterMax?: string;
    sort?: string;
    page?: string;
  }>;
}

function parseStyle(value: string | undefined): EditStyle | undefined {
  return value === "single" || value === "dual" || value === "full"
    ? value
    : undefined;
}

function parseSort(value: string | undefined): SortKey {
  return value === "likes" || value === "plays" ? value : "newest";
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildQueryString(
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export default async function EditsPage({ searchParams }: EditsPageProps) {
  const params = await searchParams;

  const style = parseStyle(params.style);
  const sort = parseSort(params.sort);
  const meterMin = parseNumber(params.meterMin);
  const meterMax = parseNumber(params.meterMax);
  const page = Math.max(1, parseNumber(params.page) ?? 1);

  let catalog = null;

  try {
    catalog = await getEditCatalog();
  } catch (error) {
    console.error("Failed to load edit catalog", error);
  }

  const filtered = catalog
    ? sortEdits(
        filterEdits(catalog, { query: params.q, style, meterMin, meterMax }),
        sort,
      )
    : [];

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageEdits = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const baseParams = {
    q: params.q,
    style: params.style,
    meterMin: params.meterMin,
    meterMax: params.meterMax,
    sort: params.sort,
  };

  return (
    <main className="edits-page">
      <Link className="viewer-home-link" href="/">
        ← Home
      </Link>
      <p className="eyebrow">BROWSE THE CATALOG</p>
      <h1 className="edits-header">Browse Edits</h1>
      <p className="edits-subtitle">
        Browsing the latest {CATALOG_LIMIT} published edits.
      </p>

      <form method="GET" className="edits-filters">
        <div className="filter-field">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            name="q"
            type="text"
            placeholder="Title, artist, author, or code"
            defaultValue={params.q ?? ""}
          />
        </div>
        <div className="filter-field">
          <label htmlFor="style">Style</label>
          <select id="style" name="style" defaultValue={params.style ?? ""}>
            <option value="">Any</option>
            <option value="single">Single</option>
            <option value="dual">Dual</option>
            <option value="full">Full</option>
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="meterMin">Min meter</label>
          <input
            id="meterMin"
            name="meterMin"
            type="number"
            min={1}
            defaultValue={params.meterMin ?? ""}
          />
        </div>
        <div className="filter-field">
          <label htmlFor="meterMax">Max meter</label>
          <input
            id="meterMax"
            name="meterMax"
            type="number"
            min={1}
            defaultValue={params.meterMax ?? ""}
          />
        </div>
        <div className="filter-field">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={sort}>
            <option value="newest">Newest</option>
            <option value="likes">Most liked</option>
            <option value="plays">Most played</option>
          </select>
        </div>
        <button type="submit">Apply</button>
      </form>

      {catalog === null ? (
        <p className="popular-message">
          The edit catalog is temporarily unavailable.
        </p>
      ) : pageEdits.length === 0 ? (
        <p className="popular-message">No edits match those filters.</p>
      ) : (
        <>
          <div className="popular-grid edits-grid">
            {pageEdits.map((edit) => (
              <EditCard key={edit.displayId} edit={edit} />
            ))}
          </div>
          <nav className="edits-pagination" aria-label="Pagination">
            {currentPage > 1 ? (
              <Link
                href={`/edits${buildQueryString({ ...baseParams, page: String(currentPage - 1) })}`}
              >
                ← Previous
              </Link>
            ) : (
              <span className="pagination-disabled">← Previous</span>
            )}
            <span>
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                href={`/edits${buildQueryString({ ...baseParams, page: String(currentPage + 1) })}`}
              >
                Next →
              </Link>
            ) : (
              <span className="pagination-disabled">Next →</span>
            )}
          </nav>
        </>
      )}
    </main>
  );
}
