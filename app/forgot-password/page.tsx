import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import ForgotPasswordForm from "@/components/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 bg-gradient-to-br from-green-50 to-blue-50">
        <ForgotPasswordForm />
      </main>
      <SiteFooter />
      
    </div>
  )
}
