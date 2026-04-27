import { dev } from '$app/environment';
import { Pool, type PoolConfig } from 'pg';

const GLOBAL_KEY = '__ptgFormsReportPool';

type GlobalWithPool = typeof globalThis & {
	[GLOBAL_KEY]?: Pool;
};

function boolFromEnv(value: string | undefined, fallback: boolean): boolean {
	if (value == null || value === '') return fallback;
	return value === '1' || value.toLowerCase() === 'true';
}

function buildConfig(): PoolConfig {
	const connectionString = process.env.AWS_RDS_DATABASE_URL;
	if (connectionString) {
		return {
			connectionString,
			ssl: boolFromEnv(process.env.AWS_RDS_SSL, !dev) ? { rejectUnauthorized: false } : false
		};
	}

	const host = process.env.AWS_RDS_HOST;
	const port = Number(process.env.AWS_RDS_PORT ?? '5432');
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
		ssl: boolFromEnv(process.env.AWS_RDS_SSL, !dev) ? { rejectUnauthorized: false } : false
	};
}

export function getFormsReportPool(): Pool {
	const g = globalThis as GlobalWithPool;
	if (!g[GLOBAL_KEY]) {
		g[GLOBAL_KEY] = new Pool(buildConfig());
	}
	return g[GLOBAL_KEY];
}
