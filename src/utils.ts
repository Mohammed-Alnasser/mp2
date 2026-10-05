import type { Pokemon, SortProperty } from "./types";

export const PAGE_SIZE = 18;
export const sortProperties: { value: SortProperty; label: string }[] = [
  { value: "id", label: "Pokédex number" },
  { value: "name", label: "Name" },
  { value: "total", label: "Base stat total" },
  { value: "height", label: "Height" },
  { value: "weight", label: "Weight" },
];

export const displayName = (name: string): string => {
  if (name === "nidoran-f") return "Nidoran ♀";
  if (name === "nidoran-m") return "Nidoran ♂";
  if (name === "mr-mime") return "Mr. Mime";
  if (name === "farfetchd") return "Farfetch’d";
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
export const dexNumber = (id: number): string =>
  `#${String(id).padStart(3, "0")}`;
export const statTotal = (p: Pokemon): number =>
  p.stats.reduce((total, s) => total + s.value, 0);
export const localArtwork = (id: number): string =>
  `${import.meta.env.BASE_URL}pokemon/${id}.webp`;

export function selectPokemon(
  pokemon: Pokemon[],
  params: URLSearchParams,
): Pokemon[] {
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const types = params.getAll("type");
  const sort = params.get("sort") ?? "id";
  const direction = params.get("order") === "desc" ? -1 : 1;
  return pokemon
    .filter(
      (p) =>
        (!query ||
          p.name.includes(query) ||
          displayName(p.name).toLowerCase().includes(query) ||
          dexNumber(p.id).includes(query) ||
          p.types.some((type) => type.includes(query))) &&
        (!types.length || types.some((type) => p.types.includes(type))),
    )
    .sort((a, b) => {
      let value: number;
      switch (sort) {
        case "name":
          value = displayName(a.name).localeCompare(displayName(b.name));
          break;
        case "total":
          value = statTotal(a) - statTotal(b);
          break;
        case "height":
          value = a.height - b.height;
          break;
        case "weight":
          value = a.weight - b.weight;
          break;
        default:
          value = a.id - b.id;
      }
      return value * direction || a.id - b.id;
    });
}
