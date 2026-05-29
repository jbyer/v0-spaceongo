import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import LoginForm from "@/components/login-form"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 bg-gradient-to-br from-green-50 to-blue-50">
        <LoginForm />
      </main>
      <SiteFooter />
     
    </div>
  )
}
