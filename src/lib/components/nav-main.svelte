<script lang="ts">
	import { DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent, DropdownMenu } from "$lib/components/ui/dropdown-menu";
	import { SidebarMenuButton, SidebarMenuItem, SidebarMenu, SidebarGroup } from "$lib/components/ui/sidebar";
	import { useSidebar } from "$lib/components/ui/sidebar";
	import { Ellipsis } from "lucide-svelte";
	let {
		items,
	}: {
		items: {
			title: string;
			url: string;
			icon?: typeof Ellipsis;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();
	const sidebar = useSidebar();
</script>

<SidebarGroup>
	<SidebarMenu>
		{#each items as mainItem (mainItem.title)}
			<DropdownMenu>
				<SidebarMenuItem>
					<DropdownMenuTrigger>
						{#snippet child({ props })}
							<SidebarMenuButton {...props} class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
								{mainItem.title}
								<Ellipsis class="ml-auto" />
							</SidebarMenuButton>
						{/snippet}
					</DropdownMenuTrigger>
					{#if mainItem.items?.length}
						<DropdownMenuContent side={sidebar.isMobile ? "bottom" : "right"} align={sidebar.isMobile ? "end" : "start"} class="min-w-56 rounded-lg">
							{#each mainItem.items as item (item.title)}
								<DropdownMenuItem>
									{#snippet child({ props })}
										<a href={item.url} {...props}>{item.title}</a>
									{/snippet}
								</DropdownMenuItem>
							{/each}
						</DropdownMenuContent>
					{/if}
				</SidebarMenuItem>
			</DropdownMenu>
		{/each}
	</SidebarMenu>
</SidebarGroup>
