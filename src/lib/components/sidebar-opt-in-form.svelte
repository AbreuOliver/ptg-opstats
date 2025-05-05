<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "$lib/components/ui/card";
	import { SidebarInput } from "$lib/components/ui/sidebar";
</script>

<Card class="shadow-none">
	<form>
		<CardHeader class="p-4 pb-0">
			<CardTitle class="text-sm">Subscribe to our newsletter</CardTitle>
			<CardDescription>Opt-in to receive updates and news about the sidebar.</CardDescription>
		</CardHeader>
		<CardContent class="grid gap-2.5 p-4">
			<SidebarInput type="email" placeholder="Email" />
			<Button class="bg-sidebar-primary text-sidebar-primary-foreground w-full shadow-none" size="sm">Subscribe</Button>
		</CardContent>
	</form>
</Card>
