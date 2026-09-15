export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.'
  
  const errObj = error as { message?: string; error_description?: string; status?: number; code?: string }
  const message = (errObj.message || errObj.error_description || (typeof error === 'string' ? error : '')).toLowerCase()

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Email or password is incorrect.'
  }
  if (message.includes('email not confirmed') || message.includes('email link is invalid or has expired')) {
    return 'Please verify your email before signing in.'
  }
  if (message.includes('user not found') || message.includes('no user found')) {
    return 'No account was found with these details.'
  }
  if (message.includes('unsupported provider') || message.includes('provider is not enabled')) {
    return 'Sign-in is temporarily unavailable. Please try again.'
  }
  if (message.includes('user already registered') || message.includes('already registered')) {
    return 'An account with this email already exists. Please sign in instead.'
  }
  if (message.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.'
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many login attempts. Please wait a few moments before trying again.'
  }

  return errObj.message || 'Something went wrong. Please try again.'
}
