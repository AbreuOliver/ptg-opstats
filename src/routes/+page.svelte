<script>
	import StyledButton from '$lib/components/StyledButton.svelte';

	// console.log('Testing!');
	// console.log(import.meta.env.PUBLIC_SUPABASE_URL);
</script>

<!-- HERO SECTION CENTERED -->
<section
	class="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center rounded-md px-6 py-12 backdrop-blur-[2px] lg:px-8"
>
	<div>
		<p class="text-base/7 font-semibold text-indigo-600">Streamlined Reporting</p>
		<h1
			class="mt-6 max-w-xl text-4xl leading-12 font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl"
		>
			OpStats Web Form
		</h1>
		<hr class="mt-6 w-full border-none" />
		<h2 class="mb-6 text-xl font-medium tracking-tight text-gray-950">
			Submit required transportation data with ease
		</h2>
	</div>
	<hr class="mt-6 w-full border-none" />
	<div class="max-w- mx-auto">
	<!-- CALL TO ACTION -->
	<StyledButton href="/auth" text="Login to Get Started" variant="primary" />
</div>
</section>
