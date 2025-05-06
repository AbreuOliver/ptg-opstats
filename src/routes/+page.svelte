<script>
	console.log('Testing!');
	console.log(import.meta.env.PUBLIC_SUPABASE_URL);
</script>

<section
	class="from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-900 flex min-h-screen items-center justify-center "
>
	<div
		class="card preset-glass w-full max-w-xl space-y-8 border p-10 text-center shadow-2xl rounded-2xl bg-neutral-200"
	>
		<!-- Title & Tagline -->
		<header class="space-y-2">
			<h1 class="text-neutral-900 text-4xl py-6 font-extrabold tracking-tight">
				OpStats Web Form
			</h1>
			<p class="text-lg opacity-100 font-[600] text-neutral-700">
				Streamlined reporting and form tracking for your organization.
			</p>
		</header>

		<!-- Call to Action -->
		<button class="btn btn-primary w-full sm:w-auto">

            <a href="/auth" class="relative inline-flex items-center justify-center px-10 py-4 overflow-hidden font-mono font-medium tracking-tighter text-white bg-gray-800 rounded-lg group">
                <span class="absolute w-0 h-0 transition-all duration-500 ease-out bg-gradient-to-r from-blue-500 to-blue-800 rounded-full hover:text-black group-hover:w-[120%] group-hover:h-[120%]"></span>
                <span class="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-blue-700"></span>
                <span class="relative">Login to Get Started</span>
            </a>
		</button>
        
	</div>
</section>
