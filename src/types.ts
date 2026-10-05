export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  abilities: { name: string; hidden: boolean }[];
  stats: { name: string; value: number }[];
  artwork: string | null;
}

export interface ApiPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  stats: { stat: { name: string }; base_stat: number }[];
  sprites: { other: { "official-artwork": { front_default: string | null } } };
}

export interface ApiSpecies {
  genera: { genus: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  habitat: { name: string } | null;
  is_legendary: boolean;
  is_mythical: boolean;
}

export type SortProperty = "id" | "name" | "total" | "height" | "weight";
export type DataStatus = "connecting" | "live" | "cached" | "offline";
