<script context="module">
	import StyledButton from '$lib/components/StyledButton.svelte';
	import Text from '$lib/components/atoms/Text.svelte';
	import Logo from '$lib/components/atoms/Logo.svelte';
	import VSpacer from '$lib/components/atoms/VSpacer.svelte';
</script>

<section
	class="relative flex flex-col overflow-hidden rounded-xl border-2 border-neutral-600/20 bg-white/70 shadow-xl backdrop-blur-md"
>
	<!-- OVERLAY FOR GRADIENT ACCENT -->
	<div class="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-indigo-100/40 pointer-events-none"></div>

	<!-- CONTENT AREA -->
	<main class="relative z-10 flex w-full max-w-7xl flex-grow flex-col items-center justify-center px-6 text-center lg:px-8">
		<!-- HERO SECTION CENTERED -->
		<div class="mx-auto mt-8 flex w-full max-w-2xl flex-col justify-center px-6 py-12 lg:px-8">
			<!-- CAPTION -->
			<span class="text-base font-semibold text-indigo-600">Streamlined Reporting</span>

			<VSpacer size="sm" />
			<div class="flex w-full items-center justify-center gap-4">
				<!-- HERO LOGO -->
				<Logo height="2xl" />
				<!-- HERO TEXT -->
				<h1 class="mt-2 text-4xl font-bold text-neutral-900 -ml-2">OpStats Web Form</h1>
			</div>

			<VSpacer size="sm" />

			<!-- SUBHEADING -->
			<h2 class="mb-4 text-xl font-medium leading-9 tracking-tight text-neutral-700">
				Submit required transportation data with ease
			</h2>

			<VSpacer size="xl" />

			<StyledButton href="/auth" text="Login to Get Started" variant="primary" />
		</div>
	</main>
</section>