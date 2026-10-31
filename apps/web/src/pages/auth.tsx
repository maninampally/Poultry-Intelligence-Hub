import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bird,
  ClipboardCheck,
  Eye,
  EyeOff,
  HandCoins,
  Lock,
  User,
  Wheat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Role } from "@/domain/types"
import { cn } from "@/lib/utils"
import { newId, useFarm } from "@/store/farm-store"

const roleLabels: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  worker: "Worker",
}

const features = [
  { icon: ClipboardCheck, title: "Daily farm rounds", detail: "Mortality, feed, and water in one quick record." },
  { icon: Wheat, title: "Feed & stock runway", detail: "Know how many days of feed are left, automatically." },
  { icon: HandCoins, title: "Owner-only finance", detail: "Costs and dues stay hidden from workers and managers." },
]

export function LoginPage() {
  const farm = useFarm()
  const navigate = useNavigate()
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [role, setRole] = useState<Role>("worker")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  function signIn() {
    const trimmed = name.trim()
    if (trimmed.length < 2 || password.length === 0) {
      setError("Enter your name and password.")
      return
    }
    const match = farm.team.find(
      (member) => member.status === "active" && member.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (!match || match.passcode !== password) {
      setError("No account matches that name and password.")
      return
    }
    setError("")
    farm.dispatch({ type: "sign-in", userId: match.id })
    navigate("/dashboard", { replace: true })
  }

  function signUp() {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError("Enter your name.")
      return
    }
    if (password.length < 4) {
      setError("Use a password with at least 4 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (farm.team.some((member) => member.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("That name is already in use. Sign in instead.")
      return
    }
    setError("")
    const id = newId("user")
    if (role === "owner") {
      const owner = {
        id,
        name: trimmed,
        role,
        shed: "All sheds",
        status: "active" as const,
        passcode: password,
      }
      farm.dispatch({ type: "init-owner-workspace", owner })
      navigate("/onboarding", { replace: true })
      return
    }
    farm.dispatch({
      type: "add-team-member",
      member: { id, name: trimmed, role, shed: farm.sheds[0]?.name ?? "All sheds", status: "active", passcode: password },
    })
    farm.dispatch({ type: "sign-in", userId: id })
    navigate("/dashboard", { replace: true })
  }

  return (
    <div className="flex min-h-svh bg-background">
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#14211c] to-[#1b2c25] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
            backgroundSize: "44px 44px, 64px 64px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br from-[#e2f5cf] to-[#9ed9be] text-[#155d4e] shadow-[0_8px_20px_rgba(140,214,171,0.18)]">
            <Bird className="size-5" />
          </span>
          <div>
            <p className="text-lg leading-none font-semibold tracking-tight">Poultry Intelligence</p>
            <p className="mt-1 text-[10px] tracking-[0.18em] text-[#87a597] uppercase">Farm operations</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="max-w-sm text-[2.1rem] leading-[1.15] font-semibold tracking-tight">
            Run broiler farms with a calm, offline-first operating system.
          </h1>
          <div className="mt-9 space-y-5">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10">
                  <feature.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[#a9c7b8]">{feature.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-[#7f9287]">Demo mode · all records stay on this device</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-[#e2f5cf] to-[#9ed9be] text-[#155d4e]">
              <Bird className="size-4.5" />
            </span>
            <p className="text-base leading-none font-semibold tracking-tight">Poultry Intelligence</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
            {(["sign-in", "sign-up"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item)
                  setError("")
                }}
                className={cn(
                  "h-9 rounded-full text-sm font-semibold transition-all",
                  mode === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {item === "sign-in" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-semibold tracking-tight">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "sign-in" ? "Sign in to pick up where you left off." : "Set a name and password for this device."}
          </p>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="auth-name">Name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-name"
                  className="h-11 pl-9"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="username"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  className="h-11 pr-9 pl-9"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && mode === "sign-in") signIn()
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {mode === "sign-up" ? (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="auth-confirm">Confirm password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="auth-confirm"
                      type={showPassword ? "text" : "password"}
                      className="h-11 pl-9"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(roleLabels) as Role[]).map((item) => (
                        <SelectItem key={item} value={item}>
                          {roleLabels[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>
            ) : null}

            <Button
              className="h-11 rounded-full bg-primary text-primary-foreground shadow-[0_7px_16px_rgba(8,127,115,0.18)] hover:bg-primary/90"
              onClick={mode === "sign-in" ? signIn : signUp}
            >
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
