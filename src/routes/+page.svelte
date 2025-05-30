<script context="module">
	import StyledButton from '$lib/components/StyledButton.svelte';
	import Text from '$lib/components/atoms/Text.svelte';
	import Logo from '$lib/components/atoms/Logo.svelte';
	import VSpacer from '$lib/components/atoms/VSpacer.svelte';
</script>

<section
	class="relative flex flex-col overflow-hidden rounded-xl border-2 border-gray-200 shadow-xl backdrop-blur-[1.5px] bg-white/45"
>
	<!-- CONTENT AREA -->
	<main
		class="relative z-10 flex w-full max-w-7xl flex-grow flex-col items-center justify-center border-0 px-6 text-center lg:px-8"
	>
		<!-- HERO SECTION CENTERED -->
		<div class="mx-auto mt-8 flex w-full max-w-2xl flex-col justify-center px-6 py-12 lg:px-8">
			<!-- CAPTION -->
			<span class="text-base/7 font-semibold text-indigo-600"> Streamlined Reporting </span>

			<VSpacer size="sm" />
			<div class="flex w-full items-center justify-center">
				<!-- HERO LOGO -->
				<Logo height="2xl" marginRight="sm" />
				<!-- HERO TEXT -->
				<div role="heading" aria-level="1" class="mt-2 text-4xl font-bold">OpStats Web Form</div>
			</div>
			<VSpacer size="sm" />

			<!-- SUBHEADING -->
			<h2 class="mb-4 text-xl leading-9 font-medium tracking-tight text-gray-950">
				Submit required transportation data with ease
			</h2>

			<VSpacer size="xl" />

			<StyledButton href="/auth" text="Login to Get Started" variant="primary" />
		</div>
	</main>
</section>
