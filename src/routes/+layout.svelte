<script lang="ts">
	import '../app.css';
</script>

<section class="relative min-h-screen overflow-hidden border-b bg-gray-50">
	<!-- GRID BACKGROUND -->
	<div class="pointer-events-none absolute inset-0">
		<svg
			class="absolute inset-0 h-full w-full stroke-gray-400/60 [mask-image:radial-gradient(ellipse_50%_50%_at_center,white,transparent)]"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg>
	</div>
	
	<div class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center lg:max-w-7xl lg:px-8">
		<slot />
	</div>
</section>
