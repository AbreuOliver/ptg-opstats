import fs from 'node:fs';
import path from 'node:path';

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
const TEMPLATE_DIR = path.join(process.cwd(), 'src/lib/server/email/templates');
const HTML_TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'build/otp.maizzle.html');
const TEXT_TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'otp.txt');

function readTemplate(filepath: string): string {
	return fs.readFileSync(filepath, 'utf8');
}

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
		html: renderTemplate(readTemplate(HTML_TEMPLATE_PATH), payload),
		text: renderTemplate(readTemplate(TEXT_TEMPLATE_PATH), payload)
	};
}
