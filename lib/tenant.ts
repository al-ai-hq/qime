export function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL
  if (!email) throw new Error('ADMIN_EMAIL environment variable is not set')
  return email
}

export function isAdmin(email: string): boolean {
  return email.toLowerCase() === getAdminEmail().toLowerCase()
}
