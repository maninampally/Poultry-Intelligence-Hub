import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { useState } from "react"
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  CloudOff,
  HandCoins,
  HeartHandshake,
  Leaf,
  Mail,
  Menu,
  MapPin,
  ShieldCheck,
  Smartphone,
  Wheat,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: ClipboardCheck,
    title: "Daily rounds that take minutes",
    detail: "Record feed, water, mortality, weight, and shed checks in one focused flow.",
  },
  {
    icon: CloudOff,
    title: "Works when the signal does not",
    detail: "Keep working offline. Changes stay on the device and sync when you are back online.",
  },
  {
    icon: Wheat,
    title: "Feed decisions with context",
    detail: "See runway, usage, and the next purchase before stock becomes an emergency.",
  },
  {
    icon: HandCoins,
    title: "Know the cost of a batch",
    detail: "Keep feed, medicine, labour, and settlement information together for clearer margins.",
  },
  {
    icon: ShieldCheck,
    title: "The right view for each role",
    detail: "Workers see today’s work. Owners see the numbers that need an owner’s attention.",
  },
  {
    icon: Smartphone,
    title: "Made for a phone in a shed",
    detail: "Large touch targets, plain language, and fast screens built for real farm conditions.",
  },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Poultry Intelligence home">
      <img src="/brand/logo.svg" alt="" width={40} height={40} className="size-10 rounded-xl" />
      <span>
        <span className="block text-sm leading-none font-bold tracking-tight sm:text-base">Poultry Intelligence</span>
        <span className="mt-1 block text-[9px] font-medium tracking-[0.18em] text-[#6b8176] uppercase">Farm operations</span>
      </span>
    </Link>
  )
}

function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-[#dfe8e2] bg-[#f7faf6]">
      <div className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#68756e] md:flex" aria-label="Marketing">
          <Link to="/features" className="hover:text-[#087f73]">Features</Link>
          <Link to="/pricing" className="hover:text-[#087f73]">Pricing</Link>
          <Link to="/about" className="hover:text-[#087f73]">About</Link>
          <Link to="/faq" className="hover:text-[#087f73]">FAQ</Link>
          <Link to="/contact" className="hover:text-[#087f73]">Contact</Link>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-full px-4">
            <Link to="/demo">Request a walkthrough <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="sm:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
        {menuOpen && (
          <nav className="order-3 grid w-full gap-1 border-t border-[#dfe8e2] py-3 text-sm font-medium text-[#52655b] sm:hidden" aria-label="Mobile marketing">
            <Link to="/features" className="rounded-lg px-3 py-3 hover:bg-white" onClick={() => setMenuOpen(false)}>Features</Link>
            <Link to="/pricing" className="rounded-lg px-3 py-3 hover:bg-white" onClick={() => setMenuOpen(false)}>Pricing</Link>
            <Link to="/about" className="rounded-lg px-3 py-3 hover:bg-white" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/faq" className="rounded-lg px-3 py-3 hover:bg-white" onClick={() => setMenuOpen(false)}>FAQ</Link>
            <Link to="/contact" className="rounded-lg px-3 py-3 hover:bg-white" onClick={() => setMenuOpen(false)}>Contact</Link>
            <Link to="/login" className="rounded-lg px-3 py-3 text-[#087f73] hover:bg-white" onClick={() => setMenuOpen(false)}>Sign in</Link>
            <Link to="/demo" className="mt-1 rounded-full bg-[#087f73] px-4 py-3 text-center text-white" onClick={() => setMenuOpen(false)}>Request a walkthrough</Link>
          </nav>
        )}
      </div>
    </header>
  )
}

function MarketingFooter() {
  return (
    <footer className="bg-[#17231f] px-5 py-12 text-[#c2d0c8] sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-6 text-[#9eb2a7]">Clearer decisions for the people who keep every flock moving.</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#9ed9be] uppercase">Product</p>
          <div className="mt-4 grid gap-3 text-sm"><Link to="/features">Features</Link><Link to="/pricing">Pricing</Link><Link to="/demo">Request a walkthrough</Link></div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#9ed9be] uppercase">Company</p>
          <div className="mt-4 grid gap-3 text-sm"><Link to="/about">About</Link><Link to="/faq">FAQ</Link><Link to="/contact">Contact</Link></div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#9ed9be] uppercase">Legal</p>
          <div className="mt-4 grid gap-3 text-sm"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[#9eb2a7] sm:flex-row sm:justify-between">
        <p>© 2026 Poultry Intelligence</p>
        <p>Demo mode · records stay on this device</p>
      </div>
    </footer>
  )
}

function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-[#f7faf6] text-[#17231f]"><MarketingHeader /><main>{children}</main><MarketingFooter /></div>
}

export function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#087f73] uppercase">One calm workspace</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold tracking-[-0.045em] sm:text-6xl">The work between placement and dispatch, made visible.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#68756e]">Poultry Intelligence turns everyday farm records into the next useful action—without asking your team to become data analysts.</p>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, detail }) => <article key={title} className="rounded-2xl border border-[#dfe8e2] bg-white p-6"><span className="flex size-11 items-center justify-center rounded-xl bg-[#dff2d1] text-[#087f73]"><Icon className="size-5" /></span><h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#68756e]">{detail}</p></article>)}
        </div>
      </section>
    </MarketingLayout>
  )
}

export function PricingPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#087f73] uppercase">Simple to start</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Start with the farm you have.</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#68756e]">The demo workspace is free while we build with farmers. No card, contract, or setup call required.</p>
        <div className="mx-auto mt-12 max-w-md rounded-3xl border-2 border-[#087f73] bg-white p-8 text-left shadow-[0_20px_60px_rgba(23,35,31,0.08)]">
          <p className="text-sm font-bold text-[#087f73]">Farm workspace</p><p className="mt-3 text-5xl font-semibold tracking-tight">Free</p><p className="mt-2 text-sm text-[#68756e]">For early farm teams and product partners.</p>
          <ul className="mt-7 grid gap-3 text-sm">{["Daily records and farm rounds", "Offline-first demo workspace", "Role-based views", "Batch and finance foundations"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="size-4 text-[#3aa47f]" />{item}</li>)}</ul>
          <Button asChild size="lg" className="mt-8 h-12 w-full rounded-full"><Link to="/login">Open your workspace <ArrowRight className="size-4" /></Link></Button>
        </div>
      </section>
    </MarketingLayout>
  )
}

export function AboutPage() {
  return <MarketingLayout><section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-28"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#087f73] uppercase">Why we are building this</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Good farm decisions should not depend on a good internet connection.</h1></div><div className="rounded-3xl bg-[#e6f2e4] p-8 text-lg leading-8 text-[#315447]"><HeartHandshake className="size-8 text-[#087f73]" /><p className="mt-6">Poultry Intelligence is being shaped for Indian broiler farms: practical, offline-first, and respectful of the people who already know their birds. We turn records into a shared picture so owners, managers, and workers can act earlier.</p><p className="mt-5 text-base text-[#68756e]">No decorative dashboards. No opaque scores. Just the few things that help the next round go better.</p></div></section></MarketingLayout>
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <MarketingLayout>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-10 lg:py-28">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#087f73] uppercase">Talk to us</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Tell us what makes your next round harder.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#68756e]">Request a practical walkthrough for your farm or share the workflow you want to improve.</p>
          <div className="mt-10 grid gap-4">
            <a href="mailto:hello@poultryintelligence.in" className="rounded-2xl border border-[#dfe8e2] bg-white p-5 hover:border-[#087f73]"><Mail className="size-5 text-[#087f73]" /><p className="mt-3 font-bold">Email the team</p><p className="mt-1 text-sm text-[#68756e]">hello@poultryintelligence.in</p></a>
            <div className="rounded-2xl border border-[#dfe8e2] bg-white p-5"><MapPin className="size-5 text-[#087f73]" /><p className="mt-3 font-bold">India-first, field-ready</p><p className="mt-1 text-sm text-[#68756e]">Designed around the realities of farm teams and patchy connectivity.</p></div>
          </div>
        </div>
        <LeadForm submitted={submitted} onSubmitted={() => setSubmitted(true)} />
      </section>
    </MarketingLayout>
  )
}

function LeadForm({ submitted, onSubmitted }: { submitted: boolean; onSubmitted: () => void }) {
  if (submitted) {
    return <div className="rounded-3xl border border-[#b9d9c2] bg-[#e6f2e4] p-8"><Check className="size-8 text-[#087f73]" /><h2 className="mt-5 text-2xl font-bold">Thanks, we captured your details.</h2><p className="mt-3 leading-7 text-[#52655b]">This preview form is not connected to a live inbox yet. Please email hello@poultryintelligence.in to send your request, or explore the product in demo mode.</p><div className="mt-7 flex flex-wrap gap-3"><Button asChild className="rounded-full"><a href="mailto:hello@poultryintelligence.in">Email the team <Mail className="size-4" /></a></Button><Button asChild variant="outline" className="rounded-full"><Link to="/login">Explore the workspace <ArrowRight className="size-4" /></Link></Button></div></div>
  }

  return (
    <form className="rounded-3xl border border-[#dfe8e2] bg-white p-6 shadow-[0_20px_60px_rgba(23,35,31,0.07)] sm:p-8" onSubmit={(event) => { event.preventDefault(); onSubmitted() }}>
      <div className="mb-7"><p className="text-sm font-bold text-[#087f73]">Request a farm walkthrough</p><p className="mt-1 text-sm text-[#68756e]">Tell us enough to make the conversation useful.</p></div>
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-medium">Your name<input required name="name" className="h-11 rounded-lg border border-[#dfe8e2] px-3 outline-none focus:border-[#087f73] focus:ring-2 focus:ring-[#b9d9c2]" /></label>
        <label className="grid gap-2 text-sm font-medium">Phone or WhatsApp<input required name="phone" type="tel" className="h-11 rounded-lg border border-[#dfe8e2] px-3 outline-none focus:border-[#087f73] focus:ring-2 focus:ring-[#b9d9c2]" /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">Farm size<select required name="farmSize" className="h-11 rounded-lg border border-[#dfe8e2] bg-white px-3 outline-none focus:border-[#087f73]"><option value="">Select</option><option>Under 10,000 birds</option><option>10,000–50,000 birds</option><option>Over 50,000 birds</option></select></label>
          <label className="grid gap-2 text-sm font-medium">Sheds<input required name="sheds" type="number" min="1" className="h-11 rounded-lg border border-[#dfe8e2] px-3 outline-none focus:border-[#087f73] focus:ring-2 focus:ring-[#b9d9c2]" /></label>
        </div>
        <label className="grid gap-2 text-sm font-medium">What is hardest today?<textarea required name="challenge" rows={4} className="resize-y rounded-lg border border-[#dfe8e2] p-3 outline-none focus:border-[#087f73] focus:ring-2 focus:ring-[#b9d9c2]" placeholder="For example: keeping daily records consistent across sheds." /></label>
        <p className="text-xs leading-5 text-[#68756e]">Preview only: this form does not send data to a server yet. Use the email option after submitting to contact the team. We do not publish or sell farm information.</p>
        <Button type="submit" size="lg" className="h-12 rounded-full">Request walkthrough <ArrowRight className="size-4" /></Button>
      </div>
    </form>
  )
}

const faqItems = [
  ["Will it work without internet?", "Yes. The product is designed around offline-first farm work. Records can be saved on the device and synced when connectivity returns."],
  ["Who is it for?", "It is designed for Indian broiler farm owners, managers, and workers who need one shared view of daily work, flock performance, and batch context."],
  ["Is this veterinary or financial advice?", "No. Poultry Intelligence helps organize records and explain operational signals. Important health, safety, and financial decisions should still involve the responsible professional."],
  ["Can I try it before committing?", "Yes. The current workspace is a demo and early-access product. Request a walkthrough if you want to discuss your farm workflow."],
  ["What happens to my data?", "The current demo keeps records on the device. Production data handling, export, retention, and access controls will be documented before launch."],
]

export function FaqPage() {
  return <MarketingLayout><section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-28"><p className="text-xs font-semibold tracking-[0.16em] text-[#087f73] uppercase">Questions, answered plainly</p><h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Before you bring it to the farm.</h1><div className="mt-12 grid gap-3">{faqItems.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-[#dfe8e2] bg-white px-5 py-1"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">{question}<ChevronDown className="size-5 shrink-0 text-[#087f73] transition-transform group-open:rotate-180" /></summary><p className="max-w-3xl pb-5 text-sm leading-6 text-[#68756e]">{answer}</p></details>)}</div><div className="mt-12 rounded-3xl bg-[#17231f] p-8 text-white"><h2 className="text-2xl font-semibold">Still have a question?</h2><p className="mt-2 text-[#c2d0c8]">Tell us what your farm needs and we will make the walkthrough practical.</p><Button asChild className="mt-6 rounded-full bg-[#dff2d1] text-[#155d4e] hover:bg-[#cce9bb]"><Link to="/demo">Request a walkthrough <ArrowRight className="size-4" /></Link></Button></div></section></MarketingLayout>
}

export function DemoPage() {
  const [submitted, setSubmitted] = useState(false)

  return <MarketingLayout><section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-10 lg:py-28"><div className="max-w-3xl"><p className="text-xs font-semibold tracking-[0.16em] text-[#087f73] uppercase">A useful first conversation</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">See how it could fit your next round.</h1><p className="mt-6 text-lg leading-8 text-[#68756e]">We will walk through the daily dashboard, offline records, feed runway, and role-based views that matter to your team.</p><div className="mt-8 grid gap-3 text-sm text-[#52655b]"><p className="flex items-center gap-2"><Check className="size-4 text-[#3aa47f]" />A walkthrough around your actual workflow</p><p className="flex items-center gap-2"><Check className="size-4 text-[#3aa47f]" />No commitment or card required</p><p className="flex items-center gap-2"><Check className="size-4 text-[#3aa47f]" />Clear answers about offline use and data</p></div></div><LeadForm submitted={submitted} onSubmitted={() => setSubmitted(true)} /></section></MarketingLayout>
}

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <MarketingLayout><article className="mx-auto max-w-3xl px-5 py-20 sm:px-8 lg:py-28"><p className="text-xs font-semibold tracking-[0.16em] text-[#087f73] uppercase">Poultry Intelligence</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1><div className="mt-10 grid gap-6 text-base leading-7 text-[#52655b]">{children}</div></article></MarketingLayout>
}

export function PrivacyPage() {
  return <LegalPage title="Privacy"><p>We use the information you enter to provide the workspace and improve the product. The demo stores farm records on this device; do not enter sensitive personal information into a demo workspace.</p><h2 className="text-xl font-bold text-[#17231f]">Your control</h2><p>You can stop using the workspace and remove local demo data through your browser storage. Contact us if you need help understanding or removing information shared with us.</p></LegalPage>
}

export function TermsPage() {
  return <LegalPage title="Terms of use"><p>Poultry Intelligence is an early product and the current workspace is a demonstration. It is not veterinary, financial, or legal advice. Check important decisions with the people responsible for your flock and business.</p><h2 className="text-xl font-bold text-[#17231f]">Use it thoughtfully</h2><p>Keep account details secure, enter accurate records, and do not rely on the demo as the only source for urgent animal-health or safety decisions.</p></LegalPage>
}

export function NotFoundPage() {
  return <MarketingLayout><section className="mx-auto max-w-3xl px-5 py-28 text-center sm:px-8"><Leaf className="mx-auto size-10 text-[#087f73]" /><h1 className="mt-6 text-5xl font-semibold tracking-[-0.04em]">That path is not on the farm map.</h1><p className="mx-auto mt-5 max-w-md text-[#68756e]">The page may have moved. Let’s get you back to a useful view.</p><Button asChild size="lg" className="mt-8 rounded-full px-6"><Link to="/">Back to home <ArrowRight className="size-4" /></Link></Button></section></MarketingLayout>
}
