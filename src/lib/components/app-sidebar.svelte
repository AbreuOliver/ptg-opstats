<script lang="ts" module>
	// sample data
	const data = {
		versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
		navMain: [
			{
				title: "Getting Started",
				url: "#",
				items: [
					{
						title: "Installation",
						url: "#",
					},
					{
						title: "Project Structure",
						url: "#",
					},
				],
			},
			{
				title: "Building Your Application",
				url: "#",
				items: [
					{
						title: "Routing",
						url: "#",
					},
					{
						title: "Data Fetching",
						url: "#",
						isActive: true,
					},
					{
						title: "Rendering",
						url: "#",
					},
					{
						title: "Caching",
						url: "#",
					},
					{
						title: "Styling",
						url: "#",
					},
					{
						title: "Optimizing",
						url: "#",
					},
					{
						title: "Configuring",
						url: "#",
					},
					{
						title: "Testing",
						url: "#",
					},
					{
						title: "Authentication",
						url: "#",
					},
					{
						title: "Deploying",
						url: "#",
					},
					{
						title: "Upgrading",
						url: "#",
					},
					{
						title: "Examples",
						url: "#",
					},
				],
			},
			{
				title: "API Reference",
				url: "#",
				items: [
					{
						title: "Components",
						url: "#",
					},
					{
						title: "File Conventions",
						url: "#",
					},
					{
						title: "Functions",
						url: "#",
					},
					{
						title: "next.config.js Options",
						url: "#",
					},
					{
						title: "CLI",
						url: "#",
					},
					{
						title: "Edge Runtime",
						url: "#",
					},
				],
			},
			{
				title: "Architecture",
				url: "#",
				items: [
					{
						title: "Accessibility",
						url: "#",
					},
					{
						title: "Fast Refresh",
						url: "#",
					},
					{
						title: "Svelte Compiler",
						url: "#",
					},
					{
						title: "Supported Browsers",
						url: "#",
					},
					{
						title: "Rollup",
						url: "#",
					},
				],
			},
		],
	};
</script>

<script lang="ts">
	import { CollapsibleTrigger, CollapsibleContent, Collapsible } from "$lib/components/ui/collapsible";
	import { SidebarMenuButton, SidebarMenuItem, SidebarMenu, SidebarHeader, SidebarMenuSubButton, SidebarMenuSubItem, SidebarMenuSub, SidebarGroup, SidebarContent, SidebarRail, Sidebar } from "$lib/components/ui/sidebar";
	import { GalleryVerticalEnd, Minus, Plus } from "lucide-svelte";
	import type { ComponentProps } from "svelte";
	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();
</script>

<Sidebar bind:ref {...restProps}>
	<SidebarHeader>
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size="lg">
					<!-- {#snippet child({ props })} -->
					{#snippet child({ props }: { props: Record<string, any> })}
						<a href="##" {...props}>
							<div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
								<GalleryVerticalEnd class="size-4" />
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-semibold">Documentation</span>
								<span class="">v1.0.0</span>
							</div>
						</a>
					{/snippet}
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarHeader>
	<SidebarContent>
		<SidebarGroup>
			<SidebarMenu>
				{#each data.navMain as mainItem, index (mainItem.title)}
					<Collapsible open={index === 1} class="group/collapsible">
						<SidebarMenuItem>
							<!-- <CollapsibleTrigger>
								{#snippet asChild({ props }: { props: Record<string, any> })}
										<SidebarMenuButton {...props}>
											{mainItem.title}{" "}
											<Plus class="ml-auto group-data-[state=open]/collapsible:hidden" />
											<Minus class="ml-auto group-data-[state=closed]/collapsible:hidden" />
										</SidebarMenuButton>						
								{/snippet}
							</CollapsibleTrigger> -->
							<CollapsibleTrigger asChild>
								<SidebarMenuButton>
								  {mainItem.title}
								  <Plus class="ml-auto group-data-[state=open]/collapsible:hidden" />
								  <Minus class="ml-auto group-data-[state=closed]/collapsible:hidden" />
								</SidebarMenuButton>
							  </CollapsibleTrigger>
							{#if mainItem.items?.length}
								<CollapsibleContent>
									<SidebarMenuSub>
										{#each mainItem.items as item (item.title)}
											<SidebarMenuSubItem>
												<SidebarMenuSubButton isActive={item.isActive}>
													<!-- {#snippet child({ props })} -->
													{#snippet child({ props }: { props: Record<string, any> })}
														<a href={item.url} {...props}>{item.title}</a>
													{/snippet}
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										{/each}
									</SidebarMenuSub>
								</CollapsibleContent>
							{/if}
						</SidebarMenuItem>
					</Collapsible>
				{/each}
			</SidebarMenu>
		</SidebarGroup>
	</SidebarContent>
	<SidebarRail />
</Sidebar>
