<script lang="ts">
	export let index: number;
	export let value: string;
	export let onInput: (i: number) => void;
	export let onKeyDown: (e: KeyboardEvent, i: number) => void;
	export let bindRef: (i: number, el: HTMLInputElement) => void;

	let el: HTMLInputElement;

	// Assign the reference on mount
	$: bindRef(index, el);
</script>

<input
	bind:this={el}
	class="form-input w-12 text-center text-xl tracking-widest"
	type="text"
	inputmode="numeric"
	maxlength="1"
	bind:value={value}
	on:input={() => onInput(index)}
	on:keydown={(e) => onKeyDown(e, index)}
	required
/>
