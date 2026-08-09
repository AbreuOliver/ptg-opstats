import { formatEditableDecimal, formatRoundedWhole } from '$lib/shared/forms/numeric';

type NumericFieldParams = number | null | undefined;

export function numericField(node: HTMLInputElement, params: NumericFieldParams) {
	let focusedValue: string | null = null;
	let currentValue = params;

	function sync() {
		if (focusedValue !== null) {
			node.value = focusedValue;
			return;
		}
		node.value = formatRoundedWhole(currentValue ?? null);
	}

	function handleFocus() {
		focusedValue = formatEditableDecimal(currentValue ?? null);
		node.value = focusedValue;
	}

	function handleInput() {
		focusedValue = node.value;
	}

	function handleBlur() {
		focusedValue = null;
		node.value = formatRoundedWhole(currentValue ?? null);
	}

	node.addEventListener('focus', handleFocus);
	node.addEventListener('input', handleInput);
	node.addEventListener('blur', handleBlur);
	sync();

	return {
		update(nextParams: NumericFieldParams) {
			currentValue = nextParams;
			sync();
		},
		destroy() {
			node.removeEventListener('focus', handleFocus);
			node.removeEventListener('input', handleInput);
			node.removeEventListener('blur', handleBlur);
		}
	};
}
