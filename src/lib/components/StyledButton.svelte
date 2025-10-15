

<script lang="ts">
	export let text: string;
	export let variant: 'primary' | 'secondary' | 'tertiary' = 'primary';
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabled: boolean = false;
	export let extraClass: string = '';
	export let href: string | undefined = undefined;

	const isTertiary = variant === 'tertiary';
</script>

{#if href}
	<a
		{href}
		class={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-10 py-4 font-mono font-medium tracking-tighter hover:text-white
			${isTertiary 
				? 'bg-neutral-200 text-black focus-visible:outline-neutral-500' 
				: 'text-white'}
			${variant === 'primary' ? 'bg-neutral-800 focus-visible:outline-green-600' : ''}
			${variant === 'secondary' ? 'bg-neutral-800 focus-visible:outline-amber-600' : ''}
			${extraClass}`}
	>
		<span
			class={`absolute h-0 w-0 rounded-full transition-all duration-500 ease-out 
				${variant === 'primary' ? 'bg-gradient-to-r from-green-500 to-green-800 group-hover:h-[120%] group-hover:w-[120%]' : ''}
				${variant === 'secondary' ? 'bg-gradient-to-r from-amber-500 to-amber-800 group-hover:h-[120%] group-hover:w-[120%]' : ''}
				${isTertiary ? 'bg-gradient-to-r from-neutral-300 to-neutral-500 group-hover:h-[120%] group-hover:w-[120%]' : ''}`}
		></span>
		<span
			class={`absolute inset-0 -mt-1 h-full w-full rounded-xl opacity-30 
				${variant === 'primary' ? 'bg-gradient-to-b from-transparent via-transparent to-green-700' : ''}
				${variant === 'secondary' ? 'bg-gradient-to-b from-transparent via-transparent to-amber-700' : ''}
				${isTertiary ? 'bg-gradient-to-b from-transparent via-transparent to-neutral-400' : ''}`}
		></span>
		<span class="relative z-10 text-base">{text}</span>
	</a>
{:else}
	<button
		type={type}
		disabled={disabled}
		aria-label={text}
		class={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-10 py-4 font-mono font-medium tracking-tighter 
			${isTertiary 
				? 'bg-neutral-200 text-black focus-visible:outline-neutral-500' 
				: 'text-white'}
			${variant === 'primary' ? 'bg-neutral-800 focus-visible:outline-blue-600' : ''}
			${variant === 'secondary' ? 'bg-neutral-900 focus-visible:outline-amber-600' : ''}
			${extraClass}`}
	>
		<span
			class={`absolute h-0 w-0 rounded-full transition-all duration-500 ease-out 
				${variant === 'primary' ? 'bg-gradient-to-r from-neutral-500 to-neutral-700 group-hover:h-[120%] group-hover:w-[120%]' : ''}
				${variant === 'secondary' ? 'bg-gradient-to-r from-amber-500 to-yellow-400 group-hover:h-[120%] group-hover:w-[120%]' : ''}
				${isTertiary ? 'bg-gradient-to-r from-neutral-300 to-neutral-500 group-hover:h-[120%] group-hover:w-[120%]' : ''}`}
		></span>
		<span
			class={`absolute inset-0 -mt-1 h-full w-full rounded-xl opacity-30 
				${variant === 'primary' ? 'bg-gradient-to-b from-transparent via-transparent to-neutral-700' : ''}
				${variant === 'secondary' ? 'bg-gradient-to-b from-transparent via-transparent to-yellow-400' : ''}
				${isTertiary ? 'bg-gradient-to-b from-transparent via-transparent to-neutral-400' : ''}`}
		></span>
		<span class="relative z-10 text-base">{text}</span>
	</button>
{/if}
