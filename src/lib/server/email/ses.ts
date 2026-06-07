import { env } from '$env/dynamic/private';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export type SendEmailInput = {
	to: string;
	subject: string;
	html: string;
	text: string;
};

let sesClient: SESClient | null = null;

function getSesCredentials() {
	if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) return undefined;
	return {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
		sessionToken: env.AWS_SESSION_TOKEN
	};
}

function getSesClient(): SESClient {
	if (!sesClient) {
		sesClient = new SESClient({
			region: env.AWS_REGION ?? 'us-east-1',
			credentials: getSesCredentials()
		});
	}
	return sesClient;
}

function getSourceAddress(): string {
	const fromEmail = env.SES_FROM_EMAIL ?? 'no-reply@ncopstats.org';
	return `NC OpStats <${fromEmail}>`;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
	await getSesClient().send(
		new SendEmailCommand({
			Source: getSourceAddress(),
			Destination: {
				ToAddresses: [input.to]
			},
			Message: {
				Subject: {
					Charset: 'UTF-8',
					Data: input.subject
				},
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: input.html
					},
					Text: {
						Charset: 'UTF-8',
						Data: input.text
					}
				}
			}
		})
	);
}
