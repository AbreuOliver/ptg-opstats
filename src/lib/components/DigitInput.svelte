<script lang="ts">
	let {
		index,
		value,
		onInput,
		onKeyDown,
		bindRef
	}: {
		index: number;
		value: string;
		onInput: (i: number) => void;
		onKeyDown: (e: KeyboardEvent, i: number) => void;
		bindRef: (i: number, el: HTMLInputElement) => void;
	} = $props();

	let el: HTMLInputElement;

	$effect(() => {
		if (el) bindRef(index, el);
	});
</script>

<input
	bind:this={el}
	class="form-input w-12 text-center text-xl tracking-widest"
	type="text"
	inputmode="numeric"
	maxlength="1"
	bind:value={value}
	oninput={() => onInput(index)}
	onkeydown={(e) => onKeyDown(e, index)}
	required
/>
