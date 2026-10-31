import { Link } from "react-router-dom"
import {
  ArrowRight,
  Bird,
  Check,
  ClipboardCheck,
  CloudOff,
  HandCoins,
  Menu,
  Wheat,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const highlights = [
  {
    icon: ClipboardCheck,
    title: "Daily rounds, made simple",
    description: "Capture mortality, feed, water, and shed conditions in one focused workflow.",
  },
  {
    icon: Wheat,
    title: "Know your feed runway",
    description: "Keep stock, usage, and upcoming needs visible before they become urgent.",
  },
  {
    icon: HandCoins,
    title: "Make better decisions",
    description: "Bring operational and financial context together when it matters most.",
  },
]

const benefits = ["Works offline on the farm", "Built for every team role", "One calm view of operations"]

export function LandingPage() {
  return (
    <div className="min-h-svh overflow-hidden bg-[#f7faf6] text-[#17231f]">
      <header className="relative z-10 border-b border-[#dfe8e2]/80 bg-[#f7faf6]/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#dff2d1] text-[#155d4e] shadow-sm">
              <Bird className="size-5" />
            </span>
            <div>
              <p className="text-sm leading-none font-bold tracking-tight sm:text-base">Poultry Intelligence</p>
              <p className="mt-1 text-[9px] font-medium tracking-[0.18em] text-[#6b8176] uppercase">Farm operations</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#68756e] md:flex">
            <a href="#why" className="transition-colors hover:text-[#087f73]">Why Poultry Intelligence</a>
            <a href="#features" className="transition-colors hover:text-[#087f73]">Features</a>
            <Link to="/login" className="text-[#087f73] transition-colors hover:text-[#155d4e]">Sign in</Link>
          </nav>
          <Button asChild className="hidden rounded-full px-5 md:inline-flex">
            <Link to="/login">Get started <ArrowRight className="size-4" /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="md:hidden">
            <Link to="/login" aria-label="Get started"><Menu className="size-5" /></Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute -top-20 right-0 size-[32rem] rounded-full bg-[#dff2d1]/70 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-28">
            <div className="relative">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b9d9c2] bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#087f73]">
                <span className="size-1.5 rounded-full bg-[#3aa47f]" />
                A calmer way to run your farm
              </p>
              <h1 className="max-w-3xl text-4xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[4.5rem]">
                Every decision starts with a clearer <span className="text-[#087f73]">farm.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#68756e] sm:text-lg">
                Poultry Intelligence brings your daily farm work into one calm, offline-first operating system—so
                your team can spend less time chasing records and more time caring for birds.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-11 rounded-full px-6 shadow-[0_8px_20px_rgba(8,127,115,0.2)]">
                  <Link to="/login">Start your farm workspace <ArrowRight className="size-4" /></Link>
                </Button>
                <a href="#features" className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[#68756e] transition-colors hover:text-[#087f73]">
                  See what it does
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#68756e]">
                {benefits.map((benefit) => (
                  <span key={benefit} className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5 text-[#3aa47f]" /> {benefit}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[31rem]">
              <div className="absolute -inset-4 rounded-[2rem] bg-[#dff2d1]/60 blur-2xl" />
              <div className="relative rounded-[1.75rem] border border-[#cbded0] bg-[#17231f] p-3 shadow-[0_25px_70px_rgba(23,35,31,0.2)]">
                <div className="rounded-[1.25rem] bg-[#f7faf6] p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-[#dfe8e2] pb-4">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.15em] text-[#68756e] uppercase">Today</p>
                      <p className="mt-1 text-lg font-bold tracking-tight">Good morning, Arun</p>
                    </div>
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#dff2d1] text-[#087f73]">
                      <Bird className="size-4" />
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#dfe8e2] bg-white p-3">
                      <p className="text-[10px] font-semibold tracking-wide text-[#68756e] uppercase">Active birds</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight">18,420</p>
                      <p className="mt-1 text-[11px] text-[#3aa47f]">+2.4% this week</p>
                    </div>
                    <div className="rounded-xl border border-[#dfe8e2] bg-white p-3">
                      <p className="text-[10px] font-semibold tracking-wide text-[#68756e] uppercase">Feed runway</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight">12 days</p>
                      <p className="mt-1 text-[11px] text-[#b8670b]">Plan next purchase</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-[#c9e6d4] bg-[#eef8ef] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-white text-[#087f73]"><ClipboardCheck className="size-3.5" /></span>
                        <p className="text-xs font-bold">Daily round</p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#3aa47f]">Ready to start</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#cce4d3]"><div className="h-full w-[68%] rounded-full bg-[#3aa47f]" /></div>
                    <p className="mt-2 text-[11px] text-[#68756e]">4 of 6 checks completed</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-[#cbded0] px-3 py-2.5 text-[11px] text-[#68756e]">
                    <CloudOff className="size-3.5 text-[#087f73]" /> Changes are saved locally and sync when you&apos;re back online.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="border-y border-[#dfe8e2] bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#087f73] uppercase">Built for the real work</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Less admin. More confident decisions.</h2>
              <p className="mt-4 text-base leading-7 text-[#68756e]">Your farm does not need another complicated dashboard. It needs the right information, at the right moment, for the people doing the work.</p>
            </div>
            <div id="features" className="mt-10 grid gap-4 md:grid-cols-3">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="rounded-2xl border border-[#dfe8e2] bg-[#f7faf6] p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#dff2d1] text-[#087f73]"><highlight.icon className="size-5" /></span>
                  <h3 className="mt-5 text-base font-bold">{highlight.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#68756e]">{highlight.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#17231f] text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center lg:px-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9ed9be] uppercase">Ready when you are</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Bring a little more calm to every round.</h2>
            </div>
            <Button asChild size="lg" className="h-11 rounded-full bg-[#dff2d1] px-6 text-[#155d4e] hover:bg-[#cce9bb]">
              <Link to="/login">Open your workspace <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-[#17231f] px-5 pb-8 text-[#9eb2a7] sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Poultry Intelligence</p>
          <p>Demo mode · records stay on this device</p>
        </div>
      </footer>
    </div>
  )
}
