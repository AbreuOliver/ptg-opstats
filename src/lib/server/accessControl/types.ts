import type { AppRole } from '$lib/server/rbac';

export type UserAccessMapping = {
	email: string;
	role: AppRole;
	transitSystem: string | null;
	canManageUsers: boolean;
	isActive: boolean;
};

export interface AccessControlRepository {
	getUserAccessByEmail(email: string): Promise<UserAccessMapping | null>;
}
