import { createQuery } from '@tanstack/solid-query';
import { actions } from 'astro:actions';
import { RiSystemLoginCircleLine, RiSystemShieldStarFill } from 'solid-icons/ri';
import { Show } from 'solid-js';
import { queryClient } from '~/lib/query.ts';

export function LoginStatus() {
	const searchQuery = createQuery(
		() => ({
			queryKey: ['login', 'status'],
			queryFn: () => actions.auth.isLoggedIn.orThrow(),
		}),
		() => queryClient,
	);

	return (
		<Show when={searchQuery.data}>
			{searchQuery?.data?.isLoggedIn ? (
				<div>
					<RiSystemShieldStarFill size="20" />
				</div>
			) : (
				<a href="/login">
					<RiSystemLoginCircleLine size="20" />
				</a>
			)}
		</Show>
	);
}
