import { dev } from '$app/environment';
import fs from 'node:fs';
import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

const GLOBAL_KEY = '__ptgFormsReportPool';

type GlobalWithPool = typeof globalThis & {
	[GLOBAL_KEY]?: Pool;
};

function boolFromEnv(value: string | undefined, fallback: boolean): boolean {
	if (value == null || value === '') return fallback;
	return value === '1' || value.toLowerCase() === 'true';
}

function buildConfig(): PoolOptions {
	const connectionString = process.env.AWS_RDS_DATABASE_URL;
	const useSsl = boolFromEnv(process.env.AWS_RDS_SSL, !dev);
	const caPath = process.env.AWS_RDS_SSL_CA_PATH;
	const caPem = process.env.AWS_RDS_SSL_CA_PEM;
	const rejectUnauthorized = boolFromEnv(process.env.AWS_RDS_SSL_VERIFY_IDENTITY, true);
	const ssl =
		useSsl
			? {
					rejectUnauthorized,
					ca: caPem || (caPath ? fs.readFileSync(caPath, 'utf8') : undefined)
				}
			: undefined;

	if (connectionString) {
		return {
			uri: connectionString,
			ssl
		};
	}

	const host = process.env.AWS_RDS_HOST;
	const port = Number(process.env.AWS_RDS_PORT ?? '3306');
	const database = process.env.AWS_RDS_DATABASE;
	const user = process.env.AWS_RDS_USER;
	const password = process.env.AWS_RDS_PASSWORD;

	if (!host || !database || !user || !password) {
		throw new Error(
			'RDS configuration is missing. Set AWS_RDS_DATABASE_URL or AWS_RDS_HOST/AWS_RDS_DATABASE/AWS_RDS_USER/AWS_RDS_PASSWORD.'
		);
	}

	return {
		host,
		port,
		database,
		user,
		password,
		ssl
	};
}

export function getFormsReportPool(): Pool {
	const g = globalThis as GlobalWithPool;
	if (!g[GLOBAL_KEY]) {
		g[GLOBAL_KEY] = mysql.createPool(buildConfig());
	}
	return g[GLOBAL_KEY];
}
