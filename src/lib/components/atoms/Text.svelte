<script lang="ts" module>
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
	let {
		variant = 'body',
		text = undefined,
		as = undefined,
		color = 'primary',
		padding = 'none',
		className = ''
	}: {
		variant?: 'heading' | 'subheading' | 'body' | 'caption';
		text?: string | undefined;
		as?: string | undefined;
		color?: 'primary' | 'secondary' | 'tertiary';
		padding?: 'none' | 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
		className?: string;
	} = $props();
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
