import { type JSX } from 'solid-js';
import { createStore } from 'solid-js/store';
import { RiSystemSearchLine } from 'solid-icons/ri';

export function SearchBox(
	props: JSX.InputHTMLAttributes<HTMLInputElement> & {
		placeholder?: string;
		allowEmpty?: boolean;
		onSearch?: (text: string) => void;
	},
) {
	const placeholder = () => {
		return props.placeholder ?? 'Search...';
	};
	const allowEmpty = () => {
		return !!props.allowEmpty;
	};

	const [fields, setFields] = createStore({ search: '' });
	return (
		<form
			class="flex"
			onSubmit={(event) => {
				event.preventDefault();
				console.log('search onSubmit');
				if (props.onSearch) {
					props.onSearch(fields.search);
				}
			}}
		>
			<div class="flex h-11 w-fit items-stretch divide-x divide-slate-300 border border-slate-300 bg-slate-100 text-slate-600">
				<input
					type="text"
					name="search"
					required={!allowEmpty()}
					placeholder={placeholder()}
					class="w-56 bg-transparent bg-white p-2 ring-inset ring-transparent"
					onInput={(e) => setFields({ search: e.target.value })}
				/>
				<button
					type="submit"
					class="flex aspect-square h-full items-center justify-center transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400"
				>
					<RiSystemSearchLine />
				</button>
			</div>
		</form>
	);
}

export function SearchIconLink() {
	return (
		<a href="/search">
			<RiSystemSearchLine />
		</a>
	);
}
