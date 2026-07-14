import { renderInviteEmail } from './inviteEmail';
import { sendEmail } from './ses';

export async function sendInviteEmail(args: { to: string; recipientName?: string }) {
	const rendered = renderInviteEmail({
		recipientName: args.recipientName
	});

	await sendEmail({
		to: args.to,
		subject: rendered.subject,
		html: rendered.html,
		text: rendered.text
	});
}
