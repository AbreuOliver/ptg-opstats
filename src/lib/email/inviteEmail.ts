import htmlTemplate from './templates/invite.maizzle.html?raw';
import textTemplate from './templates/invite.txt?raw';

export type InviteEmailRenderInput = {
	recipientName?: string;
	appUrl?: string;
};

export type RenderedInviteEmail = {
	subject: string;
	html: string;
	text: string;
};

const DEFAULT_APP_URL = 'https://ncopstats.org';

function renderTemplate(template: string, input: Required<InviteEmailRenderInput>): string {
	return template
		.replaceAll('[[RECIPIENT_NAME]]', input.recipientName)
		.replaceAll('[[APP_URL]]', input.appUrl)
		.replaceAll('[[CURRENT_YEAR]]', String(new Date().getFullYear()));
}

export function renderInviteEmail(input: InviteEmailRenderInput): RenderedInviteEmail {
	const payload = {
		recipientName: input.recipientName?.trim() || 'there',
		appUrl: input.appUrl?.trim() || DEFAULT_APP_URL
	};

	return {
		subject: "You're invited to NC OpStats",
		html: renderTemplate(htmlTemplate, payload),
		text: renderTemplate(textTemplate, payload)
	};
}
