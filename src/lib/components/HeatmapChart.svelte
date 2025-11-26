<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type ApexCharts from 'apexcharts';

	// --- Types ---
	interface HeatmapPoint {
		x: string | number;
		y: number;
	}

	interface HeatmapSeries {
		name: string;
		data: HeatmapPoint[];
	}

	export let series: HeatmapSeries[] = [];
	export let title: string = '';

	// Sort alphabetically
	series = [...series].sort((b, a) => a.name.localeCompare(b.name));

	let chart: ApexCharts | null = null;
	let chartEl: HTMLDivElement | null = null;

	// Detect dark mode from Tailwind (checks for .dark on <html>)
	const isDark = (): boolean => document.documentElement.classList.contains('dark');

	// function to generate colors based on theme
	const getThemeColors = (): { text: string; bg: string; grid: string } => {
		if (isDark()) {
			return {
				text: '#e5e7eb', // gray-200
				bg: '#18181b', // gray-800
				grid: '#374151' // gray-700
			};
		} else {
			return {
				text: '#1f2937', // gray-800
				bg: '#ffffff',
				grid: '#d1d5db' // gray-300
			};
		}
	};

	async function buildChart(): Promise<void> {
		const ApexChartsModule = await import('apexcharts');
		const ApexChartsConstructor = ApexChartsModule.default;

		const { text, bg, grid } = getThemeColors();

		const options: ApexCharts.ApexOptions = {
			chart: {
				type: 'heatmap',
				height: 630,
				foreColor: text,
				background: bg,
				fontFamily: 'inherit'
			},

			title: {
				text: title,
				style: {
					color: text,
					fontSize: '20px',
					fontWeight: 600,
					fontFamily: 'inherit'
				}
			},

			legend: {
				position: 'top',
				labels: {
					colors: text,
					fontFamily: 'inherit'
				},
				fontSize: '14px'
			},

			xaxis: {
				labels: {
					style: {
						colors: text,
						fontSize: '12px',
						fontFamily: 'inherit'
					}
				},
				axisBorder: { color: grid },
				axisTicks: { color: grid }
			},

			yaxis: {
				labels: {
					style: {
						colors: text,
						fontSize: '12px'
					}
				}
			},

			grid: {
				borderColor: grid
			},

			plotOptions: {
				heatmap: {
					shadeIntensity: 1,
					colorScale: {
						ranges: [
							{ from: 0, to: 0, color: '#ef4444', name: 'Not Submitted' },
							{ from: 1, to: 1, color: '#16a34a', name: 'Submitted' }
						]
					}
				}
			},

			dataLabels: { enabled: false },

			tooltip: {
				theme: isDark() ? 'dark' : 'light',
				y: {
					formatter: (val: number) => (val === 1 ? 'Submitted' : 'Not Submitted')
				}
			},

			series
		};

		chart = new ApexChartsConstructor(chartEl as HTMLDivElement, options);
		chart.render();
	}

	onMount(buildChart);

	// Re-render on theme changes
	const observer = new MutationObserver(() => {
		chart?.destroy();
		buildChart();
	});

	onMount(() => {
		observer.observe(document.documentElement, { attributes: true });
	});

	onDestroy(() => {
		observer.disconnect();
		chart?.destroy();
	});
</script>

<div bind:this={chartEl} class="w-full"></div>
