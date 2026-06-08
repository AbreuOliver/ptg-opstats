import htmlTemplate from './templates/build/otp.maizzle.html?raw';
import textTemplate from './templates/otp.txt?raw';

export type OtpEmailRenderInput = {
	code: string;
	expiresInMinutes?: number;
};

export type RenderedOtpEmail = {
	subject: string;
	html: string;
	text: string;
};

const DEFAULT_EXPIRES_IN_MINUTES = 10;

function renderTemplate(template: string, input: Required<OtpEmailRenderInput>): string {
	return template
		.replaceAll('[[OTP_CODE]]', input.code)
		.replaceAll('[[EXPIRES_MINUTES]]', String(input.expiresInMinutes));
}

export function renderOtpEmail(input: OtpEmailRenderInput): RenderedOtpEmail {
	const payload = {
		code: input.code,
		expiresInMinutes: input.expiresInMinutes ?? DEFAULT_EXPIRES_IN_MINUTES
	};

	return {
		subject: 'Your NC OpStats sign-in code',
		html: renderTemplate(htmlTemplate, payload),
		text: renderTemplate(textTemplate, payload)
	};
}
