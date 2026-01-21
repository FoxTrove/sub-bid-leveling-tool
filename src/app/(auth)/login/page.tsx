import Link from "next/link"
import { Scale, Gift } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PROMO_CODES } from "@/lib/utils/constants"

interface LoginPageProps {
  searchParams: Promise<{ code?: string; redirect?: string; plan?: string; interval?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const promoCode = params.code?.toUpperCase()
  const isValidPromo = promoCode && promoCode in PROMO_CODES
  const plan = params.plan as "pro" | "team" | undefined
  const interval = (params.interval || "monthly") as "monthly" | "annual"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Scale className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">BidVet</span>
      </Link>

      {isValidPromo && (
        <div className="mb-4 flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <Gift className="h-4 w-4" />
          <span className="text-sm font-medium">
            Special offer code <Badge variant="secondary" className="ml-1">{promoCode}</Badge> applied!
          </span>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to BidVet</CardTitle>
          <CardDescription>
            {isValidPromo
              ? "Sign up to claim your free unlimited access"
              : "Sign in to start leveling your subcontractor bids"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            promoCode={isValidPromo ? promoCode : undefined}
            plan={plan}
            interval={interval}
          />
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link href="/terms-of-service" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}
