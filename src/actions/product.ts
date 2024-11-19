import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getProductById, updateProductName } from 'storefront:client';
import { addPokemonSuffix } from '~/lib/pokemons.ts';

export const product = {
	addPokemonSuffix: defineAction({
		input: z.object({
			id: z.string(),
		}),
		handler: async (input) => {
			const { id } = input;
			const originalProduct = (await getProductById({ path: { id } })).data;
			if (originalProduct) {
				const newName = addPokemonSuffix(originalProduct.name);
				await updateProductName({ id, name: newName });
				console.log(
					`addPokemonSuffix: updated product ID ${id} name from "${originalProduct.name}" to "${newName}"`,
				);
			} else {
				throw new ActionError({
					message: `Cannot find product with ID: ${id}`,
					code: 'BAD_REQUEST',
				});
			}
		},
	}),
};
