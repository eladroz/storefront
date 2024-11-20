import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:content';
import {
	authConfigError,
	clearSession,
	createVerifiedSession,
	verifyPassword,
	verifySession,
} from '~/features/cart/auth.server.ts';

export const auth = {
	login: defineAction({
		accept: 'form',
		input: z.object({
			password: z.string(),
		}),
		handler: async ({ password }, ctx) => {
			let configError = authConfigError();
			if (configError) {
				console.error('ERROR:', configError);
				throw new ActionError({ code: 'INTERNAL_SERVER_ERROR' });
			}

			if (verifyPassword(password)) {
				createVerifiedSession(ctx.cookies);
				return;
			} else {
				clearSession(ctx.cookies);
				throw new ActionError({ message: 'Invalid credentials', code: 'UNAUTHORIZED' });
			}
		},
	}),
	logout: defineAction({
		accept: 'form',
		input: z.object({}),
		handler: async (_, ctx) => {
			clearSession(ctx.cookies);
		},
	}),
	isLoggedIn: defineAction({
		handler: (_, ctx) => {
			return { isLoggedIn: verifySession(ctx.cookies) };
		},
	}),
};
