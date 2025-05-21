<script lang="ts">
	export let text: string;
	export let variant: 'primary' | 'secondary' = 'primary';
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabled: boolean = false;
	export let extraClass: string = '';
	export let href: string | undefined = undefined;
</script>

{#if href}
	<a
		href={href}
		class={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-10 py-4 font-mono font-medium tracking-tighter text-white focus-visible:outline-2 focus-visible:outline-offset-2 
			${variant === 'primary' ? 'bg-gray-800 focus-visible:outline-indigo-600' : 'bg-gray-800 focus-visible:outline-amber-600'} 
			${extraClass}`}
	>
		<span
			class={`absolute h-0 w-0 rounded-full transition-all duration-500 ease-out 
				${variant === 'primary' ? 'bg-gradient-to-r from-indigo-500 to-indigo-800 group-hover:h-[120%] group-hover:w-[120%]' : 'bg-gradient-to-r from-amber-500 to-amber-800 group-hover:h-[120%] group-hover:w-[120%]'}`}
		></span>
		<span
			class={`absolute inset-0 -mt-1 h-full w-full rounded-xl opacity-30 
				${variant === 'primary' ? 'bg-gradient-to-b from-transparent via-transparent to-indigo-700' : 'bg-gradient-to-b from-transparent via-transparent to-amber-700'}`}
		></span>
		<span class="relative z-10">{text}</span>
	</a>
{:else}
	<button
		type={type}
		disabled={disabled}
		class={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-10 py-4 font-mono font-medium tracking-tighter text-white focus-visible:outline-2 focus-visible:outline-offset-2 
			${variant === 'primary' ? 'bg-gray-800 focus-visible:outline-indigo-600' : 'bg-gray-800 focus-visible:outline-amber-600'} 
			${extraClass}`}
	>
		<span
			class={`absolute h-0 w-0 rounded-full transition-all duration-500 ease-out 
				${variant === 'primary' ? 'bg-gradient-to-r from-indigo-500 to-indigo-800 group-hover:h-[120%] group-hover:w-[120%]' : 'bg-gradient-to-r from-amber-500 to-amber-800 group-hover:h-[120%] group-hover:w-[120%]'}`}
		></span>
		<span
			class={`absolute inset-0 -mt-1 h-full w-full rounded-xl opacity-30 
				${variant === 'primary' ? 'bg-gradient-to-b from-transparent via-transparent to-indigo-700' : 'bg-gradient-to-b from-transparent via-transparent to-amber-700'}`}
		></span>
		<span class="relative z-10">{text}</span>
	</button>
{/if}
