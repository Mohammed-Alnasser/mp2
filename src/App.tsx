import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { initialCatalog, loadCatalog, loadSpecies } from "./api";
import {
  dexNumber,
  displayName,
  localArtwork,
  PAGE_SIZE,
  selectPokemon,
  sortProperties,
  statTotal,
} from "./utils";
import type { ApiSpecies, DataStatus, Pokemon } from "./types";
import "./App.css";

type IconName = "search" | "arrow" | "list" | "grid" | "close" | "leaf";
function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, string> = {
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    close: "m6 6 12 12M6 18 18 6",
    leaf: "M5 19C-2 8 12 2 21 3c0 10-5 17-13 14M4 21 15 10",
  };
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function TypeBadge({ type }: { type: string }) {
  return <span className={`type-badge type-${type}`}>{type}</span>;
}

function Artwork({
  pokemon,
  className = "",
  eager = false,
}: {
  pokemon: Pokemon;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div
        className={`artwork-placeholder ${className}`}
        role="img"
        aria-label={`${displayName(pokemon.name)} artwork unavailable`}
      >
        {dexNumber(pokemon.id)}
      </div>
    );
  return (
    <img
      className={className}
      src={localArtwork(pokemon.id)}
      alt={`${displayName(pokemon.name)} official artwork`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function collectionUrl(gallery: boolean, params: URLSearchParams): string {
  const query = new URLSearchParams(params);
  query.delete("from");
  return `${gallery ? "/gallery" : "/"}${query.size ? `?${query}` : ""}`;
}

function detailUrl(
  id: number,
  gallery: boolean,
  params: URLSearchParams,
): string {
  const query = new URLSearchParams(params);
  query.set("from", gallery ? "gallery" : "list");
  return `/pokemon/${id}?${query}`;
}

function Header() {
  const { search, pathname } = useLocation();
  const params = new URLSearchParams(search);
  const isDetail = pathname.startsWith("/pokemon/");
  const fromGallery = params.get("from") === "gallery";
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="Kanto Field Guide home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            Kanto<span className="brand-subtitle">FIELD GUIDE</span>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <NavLink
            to={collectionUrl(false, params)}
            end
            className={({ isActive }) =>
              `nav-link ${isActive || (isDetail && !fromGallery) ? "active" : ""}`
            }
          >
            <Icon name="list" />
            Explore
          </NavLink>
          <NavLink
            to={collectionUrl(true, params)}
            className={({ isActive }) =>
              `nav-link ${isActive || (isDetail && fromGallery) ? "active" : ""}`
            }
          >
            <Icon name="grid" />
            Gallery
          </NavLink>
        </nav>
        <span className="edition">
          VOL. 01 <span> / </span> KANTO REGION
        </span>
      </div>
    </header>
  );
}

function Hero({ pokemon }: { pokemon: Pokemon[] }) {
  const featured = [1, 25, 4].map((id) => pokemon.find((p) => p.id === id)!);
  return (
    <section className="hero" aria-labelledby="collection-heading">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="tiny-dot" /> A COLLECTION OF THE ORIGINAL 151
        </p>
        <h1 id="collection-heading" tabIndex={-1}>
          Small creatures.
          <br />
          <span>Big discoveries.</span>
        </h1>
        <p className="hero-description">
          A little curiosity goes a long way. Meet the Pokémon of Kanto, find
          your favorites, and get to know them better.
        </p>
        <div className="hero-facts">
          <span>
            <strong>151</strong> Pokémon
          </span>
          <span>
            <strong>01</strong> Region
          </span>
          <span>
            <Icon name="leaf" />
            <strong>Endless</strong> curiosity
          </span>
        </div>
      </div>
      <div className="hero-art" aria-label="Featured Kanto Pokémon">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <span className="art-note">a world worth exploring</span>
        {featured.map((p, i) => (
          <Link
            className={`featured featured-${i}`}
            key={p.id}
            to={`/pokemon/${p.id}`}
            aria-label={`Explore ${displayName(p.name)}`}
          >
            <Artwork pokemon={p} eager />
            <span>
              {dexNumber(p.id)} <strong>{displayName(p.name)}</strong>
            </span>
          </Link>
        ))}
        <span className="field-stamp">
          THE KANTO
          <br />
          <strong>FIELD GUIDE</strong>
          <br />
          EST. 1996
        </span>
      </div>
    </section>
  );
}

function DataNotice({
  status,
  retry,
}: {
  status: DataStatus;
  retry: () => void;
}) {
  const labels: Record<DataStatus, string> = {
    connecting: "Saved field guide ready · refreshing from PokéAPI…",
    live: "Connected to PokéAPI",
    cached: "Using your recent PokéAPI cache",
    offline: "PokéAPI is unavailable. Showing the saved field guide.",
  };
  return (
    <div className={`data-notice status-${status}`} role="status">
      <span className="tiny-dot" />
      <span>{labels[status]}</span>
      {status === "offline" && (
        <button onClick={retry} className="text-button">
          Try again
        </button>
      )}
    </div>
  );
}

function BrowseView({
  pokemon,
  gallery,
  status,
  retry,
}: {
  pokemon: Pokemon[];
  gallery: boolean;
  status: DataStatus;
  retry: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const selectedTypes = params.getAll("type");
  const allTypes = useMemo(
    () => [...new Set(pokemon.flatMap((p) => p.types))].sort(),
    [pokemon],
  );
  const results = useMemo(
    () => selectPokemon(pokemon, params),
    [pokemon, params],
  );
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const requestedPage = Number(params.get("page") ?? "1");
  const page = Math.min(
    pageCount,
    Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1),
  );
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next, { replace: true });
  }
  function toggleType(type: string) {
    const next = new URLSearchParams(params);
    next.delete("type");
    const types = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    types.forEach((t) => next.append("type", t));
    next.delete("page");
    setParams(next, { replace: true });
  }
  function changePage(newPage: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(newPage));
    setParams(next);
    document
      .getElementById("collection-toolbar")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function reset() {
    setParams({}, { replace: true });
  }

  useEffect(() => {
    document.title = `${gallery ? "Gallery" : "Explore"} · Kanto Field Guide`;
  }, [gallery]);

  return (
    <>
      <Hero pokemon={pokemon} />
      <section className="collection" aria-labelledby="browse-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR NEXT DISCOVERY</p>
            <h2 id="browse-heading">
              {gallery
                ? "A gallery of characters."
                : "Find your next favorite."}
            </h2>
          </div>
          <DataNotice status={status} retry={retry} />
        </div>
        <div className="collection-toolbar" id="collection-toolbar">
          <div className="search-field">
            <label className="sr-only" htmlFor="pokemon-search">
              Search Pokémon by name, number, or type
            </label>
            <Icon name="search" />
            <input
              id="pokemon-search"
              type="search"
              placeholder="Search by name, number, or type…"
              value={params.get("q") ?? ""}
              onChange={(e) => update("q", e.target.value)}
              autoComplete="off"
            />
            {params.get("q") && (
              <button
                className="clear-search"
                aria-label="Clear search"
                onClick={() => update("q", "")}
              >
                <Icon name="close" />
              </button>
            )}
          </div>
          <div className="sort-field">
            <label htmlFor="sort-property">Sort by</label>
            <select
              id="sort-property"
              value={
                sortProperties.some((s) => s.value === params.get("sort"))
                  ? params.get("sort")!
                  : "id"
              }
              onChange={(e) => update("sort", e.target.value)}
            >
              {sortProperties.map((s) => (
                <option value={s.value} key={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sort-field order-field">
            <label htmlFor="sort-order">Order</label>
            <select
              id="sort-order"
              value={params.get("order") === "desc" ? "desc" : "asc"}
              onChange={(e) => update("order", e.target.value)}
            >
              <option value="asc">Ascending ↑</option>
              <option value="desc">Descending ↓</option>
            </select>
          </div>
          <div className="view-switch" aria-label="Collection view">
            <Link
              to={collectionUrl(false, params)}
              className={!gallery ? "selected" : ""}
              aria-label="List view"
              aria-current={!gallery ? "page" : undefined}
            >
              <Icon name="list" />
            </Link>
            <Link
              to={collectionUrl(true, params)}
              className={gallery ? "selected" : ""}
              aria-label="Gallery view"
              aria-current={gallery ? "page" : undefined}
            >
              <Icon name="grid" />
            </Link>
          </div>
        </div>
        <fieldset className="type-filters">
          <legend>
            Filter by type <span>· Select one or more</span>
          </legend>
          <div className="filter-options">
            <button
              className={`filter-pill ${!selectedTypes.length ? "filter-active" : ""}`}
              aria-pressed={!selectedTypes.length}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("type");
                next.delete("page");
                setParams(next, { replace: true });
              }}
            >
              All types
            </button>
            {allTypes.map((type) => (
              <button
                key={type}
                className={`filter-pill ${selectedTypes.includes(type) ? "filter-active" : ""}`}
                aria-pressed={selectedTypes.includes(type)}
                onClick={() => toggleType(type)}
              >
                <span className={`type-dot type-${type}`} />
                {displayName(type)}
              </button>
            ))}
          </div>
          {selectedTypes.length > 1 && (
            <p className="filter-hint">
              Showing Pokémon with any of the selected types.
            </p>
          )}
        </fieldset>
        <div className="results-heading">
          <p aria-live="polite">
            <strong>{results.length}</strong> Pokémon
            {results.length === 151 ? " waiting to be discovered" : " found"}
            <span className="result-range">
              {results.length > 0 &&
                ` · Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, results.length)}`}
            </span>
          </p>
          {(params.get("q") || selectedTypes.length > 0) && (
            <button className="text-button" onClick={reset}>
              Reset filters <Icon name="close" />
            </button>
          )}
        </div>
        {results.length === 0 ? (
          <div className="empty-state">
            <span className="empty-mark">?</span>
            <h3>No Pokémon found.</h3>
            <p>
              Try another name, number, or type. A new discovery is just a
              search away.
            </p>
            <button className="button button-dark" onClick={reset}>
              Reset search & filters
            </button>
          </div>
        ) : gallery ? (
          <ul className="pokemon-gallery" aria-label="Pokémon gallery">
            {visible.map((p) => (
              <li key={p.id}>
                <Link
                  to={detailUrl(p.id, true, params)}
                  className={`pokemon-card card-${p.types[0]}`}
                >
                  <div className="card-top">
                    <span className="dex-number">{dexNumber(p.id)}</span>
                    <span className="card-arrow">
                      <Icon name="arrow" />
                    </span>
                  </div>
                  <div className="card-art">
                    <Artwork pokemon={p} />
                  </div>
                  <div className="card-bottom">
                    <h3>{displayName(p.name)}</h3>
                    <div className="type-badges">
                      {p.types.map((type) => (
                        <TypeBadge type={type} key={type} />
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="pokemon-list">
            <div className="list-column-headings" aria-hidden="true">
              <span>POKÉDEX</span>
              <span>POKÉMON</span>
              <span>HEIGHT</span>
              <span>BASE STATS</span>
              <span />
            </div>
            <ul aria-label="Pokémon search results">
              {visible.map((p) => (
                <li key={p.id}>
                  <Link
                    className="pokemon-row"
                    to={detailUrl(p.id, false, params)}
                  >
                    <span className="dex-number">{dexNumber(p.id)}</span>
                    <div className="row-identity">
                      <span className={`row-image card-${p.types[0]}`}>
                        <Artwork pokemon={p} />
                      </span>
                      <div>
                        <h3>{displayName(p.name)}</h3>
                        <div className="type-badges">
                          {p.types.map((type) => (
                            <TypeBadge type={type} key={type} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="row-height">
                      {(p.height / 10).toFixed(1)} <small>m</small>
                    </span>
                    <span className="row-total">
                      {statTotal(p)} <small>total</small>
                    </span>
                    <span className="row-arrow">
                      <Icon name="arrow" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {results.length > PAGE_SIZE && (
          <nav className="pagination" aria-label="Collection pages">
            <button
              className="button button-outline"
              disabled={page === 1}
              onClick={() => changePage(page - 1)}
            >
              <Icon name="arrow" className="rotate-arrow" />
              Previous page
            </button>
            <span>
              Page <strong>{page}</strong> of {pageCount}
            </span>
            <button
              className="button button-outline"
              disabled={page === pageCount}
              onClick={() => changePage(page + 1)}
            >
              Next page
              <Icon name="arrow" />
            </button>
          </nav>
        )}
        <p className="collection-note">
          The original 151, with a little more room to explore.
        </p>
      </section>
    </>
  );
}

const statLabels: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Attack",
  "special-defense": "Sp. Defense",
  speed: "Speed",
};

function DetailView({
  pokemon,
  status,
  retry,
}: {
  pokemon: Pokemon[];
  status: DataStatus;
  retry: () => void;
}) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const selected = pokemon.find((p) => String(p.id) === id);
  const gallery = params.get("from") === "gallery";
  const filtered = selectPokemon(pokemon, params);
  const sequence = filtered.some((p) => p.id === selected?.id)
    ? filtered
    : pokemon;
  const position = sequence.findIndex((p) => p.id === selected?.id);
  const previous = sequence[(position - 1 + sequence.length) % sequence.length];
  const next = sequence[(position + 1) % sequence.length];
  const [speciesState, setSpeciesState] = useState<{
    id: number;
    data: ApiSpecies | null;
    loading: boolean;
  }>({ id: 0, data: null, loading: true });
  const species = speciesState.id === selected?.id ? speciesState.data : null;
  const speciesLoading =
    speciesState.id !== selected?.id || speciesState.loading;

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    const speciesId = selected.id;
    document.title = `${displayName(selected.name)} ${dexNumber(selected.id)} · Kanto Field Guide`;
    loadSpecies(speciesId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setSpeciesState({ id: speciesId, data, loading: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSpeciesState({ id: speciesId, data: null, loading: false });
      });
    return () => controller.abort();
  }, [selected]);

  if (!selected) return <NotFound />;
  const genus = species?.genera.find((g) => g.language.name === "en")?.genus;
  const description = species?.flavor_text_entries
    .find((f) => f.language.name === "en")
    ?.flavor_text.replace(/[\n\f\r]/g, " ");
  return (
    <section className="detail-page">
      <div className="detail-breadcrumb">
        <Link to={collectionUrl(gallery, params)} className="back-link">
          <Icon name="arrow" className="rotate-arrow" />
          Back to {gallery ? "gallery" : "explore"}
        </Link>
        <DataNotice status={status} retry={retry} />
      </div>
      <div className="detail-grid">
        <div className={`detail-art-panel card-${selected.types[0]}`}>
          <span className="eyebrow">
            FIELD NOTES / {dexNumber(selected.id)}
          </span>
          <span className="detail-watermark" aria-hidden="true">
            {String(selected.id).padStart(3, "0")}
          </span>
          <Artwork
            key={selected.id}
            pokemon={selected}
            className="detail-artwork"
            eager
          />
          <span className="art-caption">KANTO REGION · GENERATION I</span>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">MEET {dexNumber(selected.id)}</p>
          <h1 tabIndex={-1}>{displayName(selected.name)}</h1>
          <div className="type-badges detail-types">
            {selected.types.map((type) => (
              <TypeBadge type={type} key={type} />
            ))}
          </div>
          <div className="species-copy" aria-live="polite">
            <h2>{genus ?? "A Kanto original"}</h2>
            <p>
              {description ??
                (speciesLoading
                  ? "Looking up this Pokémon’s field notes…"
                  : "Extra species notes are unavailable right now. Its measurements, abilities, and base stats are listed below.")}
            </p>
            {species && (species.is_legendary || species.is_mythical) && (
              <span className="special-badge">
                {species.is_mythical ? "Mythical Pokémon" : "Legendary Pokémon"}
              </span>
            )}
          </div>
          <dl className="measurements">
            <div>
              <dt>HEIGHT</dt>
              <dd>
                {(selected.height / 10).toFixed(1)} <span>m</span>
              </dd>
            </div>
            <div>
              <dt>WEIGHT</dt>
              <dd>
                {(selected.weight / 10).toFixed(1)} <span>kg</span>
              </dd>
            </div>
            <div>
              <dt>HABITAT</dt>
              <dd className="habitat">
                {species?.habitat ? displayName(species.habitat.name) : "—"}
              </dd>
            </div>
          </dl>
          <div className="abilities">
            <h2>Abilities</h2>
            <ul>
              {selected.abilities.map((ability) => (
                <li key={ability.name}>
                  {displayName(ability.name)}
                  {ability.hidden && <span>Hidden</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <section className="stats-section" aria-labelledby="stats-heading">
        <div className="stats-intro">
          <p className="eyebrow">A CLOSER LOOK</p>
          <h2 id="stats-heading">Strength in numbers.</h2>
          <p>Base stats describe this species’ natural strengths.</p>
          <div className="total-stat">
            <strong>{statTotal(selected)}</strong>
            <span>BASE STAT TOTAL</span>
          </div>
        </div>
        <dl className="stats-grid">
          {selected.stats.map((stat) => (
            <div className="stat" key={stat.name}>
              <div className="stat-label">
                <dt>{statLabels[stat.name] ?? displayName(stat.name)}</dt>
                <dd>{stat.value}</dd>
              </div>
              <meter
                min={0}
                max={255}
                value={stat.value}
                aria-label={`${statLabels[stat.name] ?? stat.name} base stat`}
              >
                {stat.value} / 255
              </meter>
            </div>
          ))}
        </dl>
      </section>
      <nav className="detail-pagination" aria-label="Browse Pokémon details">
        {sequence.length > 1 ? (
          <Link
            to={detailUrl(previous.id, gallery, params)}
            className="detail-nav-link previous"
          >
            <Icon name="arrow" className="rotate-arrow" />
            <span>
              <small>PREVIOUS</small>
              <strong>{displayName(previous.name)}</strong>
            </span>
          </Link>
        ) : (
          <button className="detail-nav-link" disabled>
            Previous
          </button>
        )}
        <div className="sequence-info">
          <strong>
            {position + 1} <span>/ {sequence.length}</span>
          </strong>
          <small>
            {sequence.length === 151
              ? "KANTO COLLECTION"
              : "YOUR FILTERED RESULTS"}
          </small>
          <span>Cycles at each end</span>
        </div>
        {sequence.length > 1 ? (
          <Link
            to={detailUrl(next.id, gallery, params)}
            className="detail-nav-link next"
          >
            <span>
              <small>NEXT</small>
              <strong>{displayName(next.name)}</strong>
            </span>
            <Icon name="arrow" />
          </Link>
        ) : (
          <button className="detail-nav-link" disabled>
            Next
          </button>
        )}
      </nav>
    </section>
  );
}

function NotFound() {
  useEffect(() => {
    document.title = "Not found · Kanto Field Guide";
  }, []);
  return (
    <section className="empty-state not-found">
      <span className="empty-mark">?</span>
      <h1 tabIndex={-1}>An undiscovered path.</h1>
      <p>
        This page isn’t in our field guide. Explore the original 151 Pokémon
        instead.
      </p>
      <Link className="button button-dark" to="/">
        Back to the collection
        <Icon name="arrow" />
      </Link>
    </section>
  );
}

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document
      .querySelector<HTMLElement>("main h1")
      ?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

function App() {
  const [pokemon, setPokemon] = useState<Pokemon[]>(initialCatalog);
  const [status, setStatus] = useState<DataStatus>("connecting");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadCatalog(attempt > 0)
      .then((result) => {
        if (active) {
          setPokemon(result.pokemon);
          setStatus(result.source);
        }
      })
      .catch(() => {
        if (active) setStatus("offline");
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  function retry() {
    setStatus("connecting");
    setAttempt((value) => value + 1);
  }
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <BrowseView
                pokemon={pokemon}
                gallery={false}
                status={status}
                retry={retry}
              />
            }
          />
          <Route
            path="/gallery"
            element={
              <BrowseView
                pokemon={pokemon}
                gallery
                status={status}
                retry={retry}
              />
            }
          />
          <Route
            path="/pokemon/:id"
            element={
              <DetailView pokemon={pokemon} status={status} retry={retry} />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <RouteEffects />
      </main>
      <footer className="site-footer">
        <span className="footer-brand">
          Kanto <span>FIELD GUIDE</span>
        </span>
        <p>
          Made for curious minds. Data & artwork from{" "}
          <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">
            PokéAPI ↗
          </a>
          .
        </p>
        <span className="footer-credit">MOHAMMED ALNASSER · CS 409 MP2</span>
      </footer>
    </>
  );
}

export default App;
