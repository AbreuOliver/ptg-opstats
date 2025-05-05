<script>
    console.log("Testing!")
    console.log(import.meta.env.PUBLIC_SUPABASE_URL);
</script>

<section
	class="from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-900 flex min-h-screen items-center justify-center bg-gradient-to-br px-6 "
>
	<div
		class="card preset-glass border-surface-300 dark:border-surface-700 w-full max-w-xl space-y-8 border p-10 text-center shadow-2xl"
	>
		<!-- Title & Tagline -->
		<header class="space-y-2">
			<h1 class="text-primary-700 dark:text-primary-300 text-4xl font-extrabold tracking-tight">
				OpStats
			</h1>
			<p class="text-lg opacity-80">
				Streamlined reporting and form tracking for your organization.
			</p>
		</header>

		<!-- Call to Action -->
		<button class="btn btn-primary w-full sm:w-auto">
			<a href="/auth" class="min-h-12"> Log In to Get Started </a>
		</button>
	</div>
</section>
