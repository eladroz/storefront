import pokemons from '@data/pokemons.json';

export function isPokemon(name: string) {
	return pokemons.includes(name);
}

export function randomPokemon(options?: { exclude?: string }): string {
	const exclude = options?.exclude;
	while (true) {
		const name: string = pokemons[Math.floor(Math.random() * pokemons.length)]!;
		if (!exclude || name !== exclude) return name;
	}
}

/* Add a suffix like " (random-pokemon-name)" to a string, or replace an existing suffix */
export function addPokemonSuffix(text: string) {
	const SUFFIX_LOOKUP_REGEX = /^.*\((?<currentName>[^)]+)\)$/;
	const SUFFIX_REPLACE_REGEX = /\([^)]+\)$/;

	const currPokemon = text.match(SUFFIX_LOOKUP_REGEX)?.groups?.currentName;

	if (currPokemon && isPokemon(currPokemon)) {
		const newPokemon = randomPokemon({ exclude: currPokemon });
		return text.replace(SUFFIX_REPLACE_REGEX, `(${newPokemon})`);
	} else {
		return `${text} (${randomPokemon()})`;
	}
}
