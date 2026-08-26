export function isSessionExpiredStatus(status: number) {
  return status === 401;
}

export function isAuthorizationDeniedStatus(status: number) {
  return status === 403;
}
