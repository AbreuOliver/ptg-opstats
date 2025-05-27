<script context="module">
	import StyledButton from '$lib/components/StyledButton.svelte';
	import Text from '$lib/components/atoms/Text.svelte';
	import Logo from '$lib/components/atoms/Logo.svelte';
	import VSpacer from '$lib/components/atoms/VSpacer.svelte';
	import ITRELogo from '$lib/components/atoms/ITRELogo.svelte';

	const currentYear = new Date().getFullYear();
</script>

<section class="relative flex flex-col overflow-hidden cur">
	<!-- CONTENT AREA -->
	<main
		class="relative z-10 mx-auto flex w-full max-w-7xl flex-grow flex-col items-center justify-center px-6 text-center lg:px-8"
	>
		<!-- HERO SECTION CENTERED -->
		<div
			class="mx-auto mt-8 flex w-full max-w-2xl flex-col justify-center rounded-md px-6 py-12 backdrop-blur-[2px] lg:px-8"
		>
			<!-- CAPTION -->
			<span class="text-base/7 font-semibold text-indigo-600"> Streamlined Reporting </span>

			 <VSpacer size="sm"/>
			<div class="flex w-full items-center justify-center">
				<!-- HERO LOGO -->
				<Logo height="2xl" marginRight="sm" />
				<!-- HERO TEXT -->
				<div role="heading" aria-level="1" class="text-4xl mt-2 font-bold">OpStats Web Form</div>
			</div>
			<VSpacer size="sm"/>

			<!-- SUBHEADING -->
			<h2 class="text-xl leading-9 font-medium tracking-tight text-gray-950 mb-4">
				Submit required transportation data with ease
			</h2>

			<VSpacer size="xl"/>

			<div class="max-w- mx-auto">
				<StyledButton href="/auth" text="Login to Get Started" variant="primary" />
			</div>
		</div>
	</main>
</section>