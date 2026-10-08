import { Suspense } from 'react'
import ResetPasswordContent from '@/components/auth/ResetPasswordContent'
import ResetPasswordLoading from '@/components/auth/ResetPasswordLoading'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
