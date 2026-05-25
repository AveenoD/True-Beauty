import { authenticateUser } from "./auth";
import { assertTenantUser } from "./assertTenantUser";

/** Authenticated user routes that must match the resolved tenant (Phase 3). */
export const authenticateTenantUser = [authenticateUser, assertTenantUser];
