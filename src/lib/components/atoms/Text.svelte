<script lang="ts" context="module">
	export interface TypographyProps {
		variant?: 'heading' | 'subheading' | 'body' | 'caption';
		text?: string;
		as?: string;
		color?: 'primary' | 'secondary' | 'tertiary';
		padding?: 'none' | 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
		className?: string;
	}
</script>

<script lang="ts">
	export let variant: 'heading' | 'subheading' | 'body' | 'caption' = 'body';
	export let text: string | undefined = undefined;
	export let as: string | undefined = undefined;
	export let color: 'primary' | 'secondary' | 'tertiary' = 'primary';
	export let padding: 'none' | 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge' = 'none';
	export let className = '';
</script>

<!-- Tag to render, defaulting based on variant -->
<svelte:element
	this={as ||
		(variant === 'heading'
			? 'h1'
			: variant === 'subheading'
				? 'h2'
				: variant === 'caption'
					? 'span'
					: 'p')}
	class={`
  
      ${variant === 'heading' ? 'text-4xl leading-12 font-semibold tracking-tight text-balance sm:text-5xl' : ''}
      ${variant === 'subheading' ? 'text-2xl leading-9 font-medium tracking-tight' : ''}
      ${variant === 'body' ? 'text-lg leading-7' : ''}
      ${variant === 'caption' ? 'text-base/7 font-semibold text-neutral-500' : ''}
  
      ${color === 'primary' ? 'text-neutral-950' : ''}
      ${color === 'secondary' ? 'text-green-600' : ''}
      ${color === 'tertiary' ? 'text-amber-500' : ''}
  
      ${padding === 'extraSmall' ? 'py-1' : ''}
      ${padding === 'small' ? 'py-2' : ''}
      ${padding === 'medium' ? 'py-4' : ''}
      ${padding === 'large' ? 'py-6' : ''}
      ${padding === 'extraLarge' ? 'py-8' : ''}
  
      ${className}
    `}
>
	{text}
</svelte:element>
