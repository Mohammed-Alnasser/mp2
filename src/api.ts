import axios from "axios";
import snapshot from "./data/kanto.json";
import type { ApiPokemon, ApiSpecies, Pokemon } from "./types";

const client = axios.create({
  baseURL: "https://pokeapi.co/api/v2/",
  timeout: 10000,
});
const CACHE_KEY = "kanto-field-guide-v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;
interface CatalogCache {
  savedAt: number;
  pokemon: Pokemon[];
}

function readCache(): CatalogCache | null {
  try {
    const raw = JSON.parse(
      localStorage.getItem(CACHE_KEY) ?? "null",
    ) as CatalogCache | null;
    if (
      !raw ||
      !Number.isFinite(raw.savedAt) ||
      !Array.isArray(raw.pokemon) ||
      raw.pokemon.length !== 151
    )
      return null;
    if (
      !raw.pokemon.every(
        (p, i) =>
          p.id === i + 1 &&
          typeof p.name === "string" &&
          typeof p.height === "number" &&
          typeof p.weight === "number" &&
          Array.isArray(p.types) &&
          p.types.length > 0 &&
          p.types.every((t) => typeof t === "string") &&
          Array.isArray(p.abilities) &&
          Array.isArray(p.stats) &&
          p.stats.length === 6 &&
          p.stats.every(
            (s) => typeof s.name === "string" && typeof s.value === "number",
          ),
      )
    )
      return null;
    return raw;
  } catch {
    // Storage may be unavailable in private browsing or contain outdated data.
    return null;
  }
}

export function initialCatalog(): Pokemon[] {
  return readCache()?.pokemon ?? snapshot;
}

function normalize(raw: ApiPokemon): Pokemon {
  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    types: [...raw.types]
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name),
    abilities: raw.abilities.map((a) => ({
      name: a.ability.name,
      hidden: a.is_hidden,
    })),
    stats: raw.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
    artwork: raw.sprites.other["official-artwork"].front_default,
  };
}

interface CatalogResult {
  pokemon: Pokemon[];
  source: "live" | "cached";
}
let inFlight: Promise<CatalogResult> | null = null;

async function requestCatalog(): Promise<CatalogResult> {
  const controller = new AbortController();
  try {
    const { data } = await client.get<{ results: { name: string }[] }>(
      "pokemon",
      {
        params: { limit: 151, offset: 0 },
        signal: controller.signal,
      },
    );
    const pokemon: Pokemon[] = new Array(data.results.length);
    let cursor = 0;
    // Bound concurrency instead of launching 151 requests together.
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        while (cursor < data.results.length) {
          const index = cursor++;
          const response = await client.get<ApiPokemon>(
            `pokemon/${data.results[index].name}`,
            { signal: controller.signal },
          );
          pokemon[index] = normalize(response.data);
        }
      }),
    );
    pokemon.sort((a, b) => a.id - b.id);
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), pokemon }),
      );
    } catch {
      /* The site still works if the browser cannot save the cache. */
    }
    return { pokemon, source: "live" };
  } catch (error) {
    controller.abort();
    throw error;
  }
}

export function loadCatalog(force = false): Promise<CatalogResult> {
  if (inFlight) return inFlight;
  const cached = readCache();
  if (!force && cached && Date.now() - cached.savedAt < CACHE_TTL) {
    return Promise.resolve({ pokemon: cached.pokemon, source: "cached" });
  }
  // StrictMode mounts twice in development; both mounts share the same request.
  inFlight = requestCatalog().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function loadSpecies(
  id: number,
  signal: AbortSignal,
): Promise<ApiSpecies> {
  const { data } = await client.get<ApiSpecies>(`pokemon-species/${id}`, {
    signal,
  });
  return data;
}
