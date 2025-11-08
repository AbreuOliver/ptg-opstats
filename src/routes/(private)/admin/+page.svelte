<script lang="ts">
	import { AccordionItem, Accordion } from 'flowbite-svelte';

	// 1) "Getting Started" steps shown to a non-technical first-time cloner.
	// Replace the  placeholders with your actual instructions.
	type Step = {
		title: string;
		detail?: string;
		code?: string; // shown in a copyable code block
	};

	const steps: Step[] = [
		{
			title: 'Install prerequisites ',
			detail: 'Install Node.js (v20+ recommended). Optionally install PNPM if this repo uses it.',
			code: `# macOS (Homebrew examples)
brew install node

# optional: install pnpm if this project uses it
npm i -g pnpm`
		},
		{
			title: 'Clone this repository ',
			detail: 'Download the code to your computer using Git.',
			code: `git clone https://github.com/your-org/your-repo.git
cd your-repo`
		},
		{
			title: 'Create your environment file ',
			detail:
				'Copy .env.example to .env and fill in any required values. If none are needed yet, you can skip.',
			code: `cp .env.example .env
# then open .env and fill in required values`
		},
		{
			title: 'Install dependencies ',
			detail: 'Install the project dependencies with your chosen package manager.',
			code: `# if using pnpm
pnpm install

# or yarn
# yarn

# or npm
# npm install`
		},
		{
			title: 'Run the dev server ',
			detail: 'Start the local development server and open the app in your browser.',
			code: `pnpm dev
# then open http://localhost:5173`
		},
		{
			title: 'Verify the UI',
			detail:
				'Navigate to /readme to see this page. Use the “Content Demo: Beliefs” accordion below to confirm things render correctly.'
		}
	];
</script>

<!-- <section id="readme" class="w-full scroll-mt-28">
	<div class="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16 xl:px-6">
		<h1
			class="text-center text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-200"
		>
			Project README
		</h1>
		<p class="mx-auto mt-4 max-w-2xl text-center text-zinc-700 dark:text-zinc-300">
			Follow these steps to get the project running on your computer.
		</p>

		<ol class="mx-auto mt-10 w-full max-w-3xl space-y-6">
			{#each steps as step, i}
				<li class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
					<div class="flex items-start gap-4">
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50 text-sm font-semibold text-zinc-900"
						>
							{i + 1}
						</div>
						<div class="min-w-0">
							<h2 class="text-lg font-semibold text-zinc-900 md:text-xl">
								{step.title}
							</h2>
							{#if step.detail}
								<p class="mt-2 leading-7 text-zinc-700">{step.detail}</p>
							{/if}
							{#if step.code}
								<pre
									class="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900"><code
										>{step.code}</code
									></pre>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ol>
	</div>
</section> -->

<section id="readme" class="w-full scroll-mt-28">
	<div class="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16 xl:px-6">
		<h1
			class="text-center text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-200"
		>
			Getting Started
		</h1>
		<p class="mx-auto mt-4 max-w-2xl text-center text-zinc-700 dark:text-zinc-300">
			Follow these steps to get the project running on your computer.
		</p>

		<!-- Steps as Flowbite-Svelte Accordion items -->
		<Accordion class="mx-auto mt-10 w-full max-w-3xl rounded-xl  bg-white">
			{#each steps as step, i}
				<AccordionItem class="rounded-2xl bg-zinc-200 p-0">
					<!-- Use the HEADER slot so we fully control the button contents -->
					{#snippet header()}
						<div class="flex h-12 w-full items-center gap-4 pr-2">
							<!-- number badge -->
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full  bg-zinc-50 text-sm font-semibold text-zinc-900"
							>
								{i + 1}
							</div>
							<!-- scan-able title -->
							<h2 class="min-w-0 flex-1 text-left text-lg font-semibold text-zinc-900 md:text-xl">
								{step.title}
							</h2>
				
						</div>
					{/snippet}

					{#if step.detail}
						<p class="px-6 pt-2 text-left leading-7 text-zinc-700">{step.detail}</p>
					{/if}
					{#if step.code}
						<pre
							class="mx-6 my-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left text-sm text-zinc-900">
<code>{step.code}</code>
            </pre>
					{/if}
				</AccordionItem>
			{/each}
		</Accordion>
	</div>
</section>

<style>
</style>
