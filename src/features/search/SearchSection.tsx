import { SearchBox } from '~/features/search/SearchBox';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { createSignal } from 'solid-js';
import { actions } from 'astro:actions';
import { queryClient } from '~/lib/query.ts';
import { Image } from '@unpic/solid';
import type { Product } from '~/lib/client.types.ts';
import { Button } from '~/components/ui/Button.tsx';
import { CgPokemon } from 'solid-icons/cg';

// TODO detect this from Astro config and expose as public env var to client. Use undefined for
// serving original images, if running in dev without Netlify CLI (netlify dev)
const imageCDN = import.meta.env.DEV ? undefined : 'netlify';

export function SearchSection(props: { withMutations?: boolean }) {
	const [queryText, setQueryText] = createSignal('');

	const searchQuery = createQuery(
		() => ({
			queryKey: ['search', 'simple', queryText()],
			queryFn: () =>
				actions.search.simple.orThrow({
					query: queryText(),
				}),
			initialData: { items: [] },
		}),
		() => queryClient,
	);

	return (
		<div class="flex flex-col gap-4">
			<SearchBox
				allowEmpty={true}
				onSearch={(text) => {
					setQueryText(text);
				}}
			/>
			<div>Results:</div>
			{searchQuery.data.items.map((p) => {
				return <ResultCard product={p} withMutations={props.withMutations} />;
			})}
		</div>
	);
}

function ResultCard(props: { product: Product; withMutations?: boolean }) {
	const p = props.product;

	const withMutations = () => {
		return !!props.withMutations;
	};

	const addPokemonSuffixMutation = withMutations()
		? createMutation(
				() => ({
					mutationKey: ['product', 'addPokemonSuffix', p.id],
					mutationFn: async () => {
						await actions.product.addPokemonSuffix.orThrow({
							id: p.id,
						});
					},
				}),
				() => queryClient,
			)
		: undefined;

	return (
		<div class="flex items-center gap-2 border p-2 pr-4">
			<Image src={p.imageUrl} width={90} height={90} alt={p.name} cdn={imageCDN} />
			<div class="flex flex-grow flex-col gap-2">
				<a href={`/products/${p.slug}`}>
					<h3 class="text-pretty font-medium leading-tight text-theme-base-900">{p.name}</h3>
				</a>
				<div class="max-w-screen-md text-sm	">{p.description}</div>
			</div>
			{!!addPokemonSuffixMutation && (
				<Button
					pending={addPokemonSuffixMutation.isPending}
					onClick={() => {
						addPokemonSuffixMutation.mutate();
					}}
				>
					<CgPokemon size={24} />
					Add Pokemon
				</Button>
			)}
		</div>
	);
}
