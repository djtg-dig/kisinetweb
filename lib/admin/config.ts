export const adminEntrySegment =
  process.env.NEXT_PUBLIC_ADMIN_ENTRY_PATH?.replace(/^\/+|\/+$/g, "") ||
  "lapatatedoucue";

export const adminLoginPath = "/" + adminEntrySegment + "/admin";
export const adminDashboardPath = "/admin/dashboard";
