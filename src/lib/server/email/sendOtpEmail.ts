import { renderOtpEmail } from './otpEmail';
import { sendEmail } from './ses';

export async function sendOtpEmail(args: { to: string; code: string; expiresInMinutes: number }) {
	const rendered = renderOtpEmail({
		code: args.code,
		expiresInMinutes: args.expiresInMinutes
	});

	await sendEmail({
		to: args.to,
		subject: rendered.subject,
		html: rendered.html,
		text: rendered.text
	});
}
