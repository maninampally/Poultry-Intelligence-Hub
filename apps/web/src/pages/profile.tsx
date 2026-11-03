import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Camera, Check, ImageIcon, LockKeyhole, LogOut, Pencil, ShieldCheck, Trash2, UserRound, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Fact, PageHeader, StatusPill } from "@/components/farm/chrome"
import { useFarm } from "@/store/farm-store"

const roleLabels = { owner: "Owner", manager: "Manager", worker: "Worker" } as const

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8 MB raw upload ceiling
const AVATAR_SIZE = 256 // px; square output, downscaled before storing
const VIEWPORT = 240 // px; on-screen circular crop frame

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read the image."))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("That file is not a valid image."))
      img.onload = () => resolve(img)
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

interface EditState {
  img: HTMLImageElement
  /** Scale that makes the image exactly cover the viewport at zoom = 1. */
  baseScale: number
  zoom: number
  offset: { x: number; y: number }
}

export function ProfilePage() {
  const farm = useFarm()
  const navigate = useNavigate()
  const user = farm.currentUser
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [personalNotifications, setPersonalNotifications] = useState(user?.personalNotifications ?? true)
  const [language, setLanguage] = useState<"English">(user?.language ?? "English")
  const [editing, setEditing] = useState(false)
  const [draftAvatar, setDraftAvatar] = useState<string | undefined>(user?.avatar)
  const [viewingAvatar, setViewingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  if (!user) {
    return (
      <PageHeader
        title="No profile signed in"
        description="This browser has no active teammate. Sign in to see a profile."
      />
    )
  }

  const activeUser = user
  const avatar = editing ? draftAvatar : activeUser.avatar
  const isDirty =
    name.trim() !== activeUser.name ||
    email.trim() !== (activeUser.email ?? "") ||
    phone.trim() !== (activeUser.phone ?? "") ||
    personalNotifications !== (activeUser.personalNotifications ?? true) ||
    language !== (activeUser.language ?? "English") ||
    draftAvatar !== activeUser.avatar

  function startEditing() {
    setName(activeUser.name)
    setEmail(activeUser.email ?? "")
    setPhone(activeUser.phone ?? "")
    setPersonalNotifications(activeUser.personalNotifications ?? true)
    setLanguage(activeUser.language ?? "English")
    setDraftAvatar(activeUser.avatar)
    setEditing(true)
  }

  function save() {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast.error("Enter a name with at least 2 letters.")
      return
    }
    farm.dispatch({
      type: "update-team-member",
      id: activeUser.id,
      patch: {
        name: trimmed,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        personalNotifications,
        language,
        avatar: draftAvatar,
      },
    })
    setEditing(false)
    toast.success("Profile updated on this device.")
  }

  function cancelProfileEdit() {
    setName(activeUser.name)
    setEmail(activeUser.email ?? "")
    setPhone(activeUser.phone ?? "")
    setPersonalNotifications(activeUser.personalNotifications ?? true)
    setLanguage(activeUser.language ?? "English")
    setDraftAvatar(activeUser.avatar)
    setEdit(null)
    setEditing(false)
  }

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = "" // allow re-selecting the same file later
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPG or PNG).")
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("That image is too large. Use one under 8 MB.")
      return
    }
    try {
      const img = await readImage(file)
      const baseScale = VIEWPORT / Math.min(img.width, img.height)
      setEdit({ img, baseScale, zoom: 1, offset: { x: 0, y: 0 } })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not use that image.")
    }
  }

  function clampOffset(next: { x: number; y: number }, scale: number, img: HTMLImageElement) {
    // Keep the image covering the circular viewport (no empty gaps).
    const drawW = img.width * scale
    const drawH = img.height * scale
    const maxX = Math.max(0, (drawW - VIEWPORT) / 2)
    const maxY = Math.max(0, (drawH - VIEWPORT) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!edit) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: edit.offset.x, oy: edit.offset.y }
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d || !edit) return
    const scale = edit.baseScale * edit.zoom
    const next = clampOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) }, scale, edit.img)
    setEdit({ ...edit, offset: next })
  }
  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  function onZoom(value: number) {
    if (!edit) return
    const scale = edit.baseScale * value
    const offset = clampOffset(edit.offset, scale, edit.img)
    setEdit({ ...edit, zoom: value, offset })
  }

  function renderCrop(state: EditState): string {
    const canvas = document.createElement("canvas")
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Image processing is not supported here.")
    // Map the on-screen VIEWPORT transform to the output canvas scale.
    const ratio = AVATAR_SIZE / VIEWPORT
    const scale = state.baseScale * state.zoom * ratio
    const drawW = state.img.width * scale
    const drawH = state.img.height * scale
    const cx = AVATAR_SIZE / 2 + state.offset.x * ratio
    const cy = AVATAR_SIZE / 2 + state.offset.y * ratio
    ctx.fillStyle = "#e5f5ef"
    ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
    ctx.drawImage(state.img, cx - drawW / 2, cy - drawH / 2, drawW, drawH)
    return canvas.toDataURL("image/jpeg", 0.82)
  }

  function confirmCrop() {
    if (!edit) return
    setSaving(true)
    try {
      const dataUrl = renderCrop(edit)
      setDraftAvatar(dataUrl)
      farm.dispatch({ type: "update-team-member", id: activeUser.id, patch: { avatar: dataUrl } })
      toast.success("Profile photo updated on this device.")
      setEdit(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that image.")
    } finally {
      setSaving(false)
    }
  }

  function removePhoto() {
    setDraftAvatar(undefined)
    farm.dispatch({ type: "update-team-member", id: activeUser.id, patch: { avatar: undefined } })
    toast.success("Profile photo removed.")
  }

  function signOut() {
    farm.dispatch({ type: "sign-out" })
    navigate("/login", { replace: true })
  }

  return (
    <div>
      <PageHeader
        eyebrow="You"
        title="Profile"
        description="Your identity on this device. Nothing here is synced to a server."
      />
      {editing ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm text-accent-foreground" role="status">
          <div>
            <p className="font-semibold">Editing profile</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Changes are pending until you select Save changes.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Edit mode</span>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className={editing ? "border-primary/40 shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_10%,transparent)]" : undefined}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-[#e5f5ef] text-2xl font-bold text-[#087f73] outline-none ring-offset-2 transition-shadow focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => avatar && setViewingAvatar(true)}
                  disabled={!avatar}
                  aria-label={avatar ? "View profile photo" : "No profile photo"}
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={`${activeUser.name}'s profile photo`}
                      className="size-full object-cover"
                    />
                  ) : initials(activeUser.name) ? (
                    initials(activeUser.name)
                  ) : (
                    <UserRound className="size-8" />
                  )}
                </button>
              </div>
              <div className="min-w-0">
                <CardTitle>{activeUser.name}</CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusPill tone={activeUser.status === "active" ? "good" : "neutral"}>
                    {activeUser.status}
                  </StatusPill>
                  <span>
                    {roleLabels[activeUser.role]} · {activeUser.shed}
                  </span>
                </CardDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-9" onClick={() => fileRef.current?.click()}>
                    <Camera data-icon="inline-start" />
                    {avatar ? "Change photo" : "Add photo"}
                  </Button>
                  {avatar ? (
                    <Button variant="ghost" size="sm" className="h-9 text-destructive" onClick={removePhoto}>
                      <Trash2 data-icon="inline-start" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onPickFile}
                aria-hidden
                tabIndex={-1}
              />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {!editing ? (
              <div className="flex justify-end">
                <Button variant="outline" className="h-10" onClick={startEditing}>
                  <Pencil data-icon="inline-start" /> Edit profile
                </Button>
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="profile-name" className="font-semibold text-foreground">Display name</Label>
              <Input
                id="profile-name"
                className={`h-12 text-foreground disabled:opacity-100 disabled:text-foreground ${editing ? "bg-accent/35" : "bg-background"}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!editing}
              />
            </div>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                <Button className="h-12 w-fit" onClick={save} disabled={!isDirty || saving}>
                  <Check data-icon="inline-start" /> Save changes
                </Button>
                <Button variant="outline" className="h-12" onClick={cancelProfileEdit} disabled={saving}>
                  <X data-icon="inline-start" /> Cancel
                </Button>
              </div>
            ) : null}
            <div className="grid gap-4 border-t border-border pt-5">
              <div className="grid gap-1.5">
                <Label htmlFor="profile-email" className="font-semibold text-foreground">Email</Label>
                <Input id="profile-email" type="email" className={`h-12 text-foreground disabled:opacity-100 disabled:text-foreground ${editing ? "bg-accent/35" : "bg-background"}`} value={email} onChange={(event) => setEmail(event.target.value)} disabled={!editing} placeholder="name@example.com" autoComplete="email" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="profile-phone" className="font-semibold text-foreground">Phone or WhatsApp</Label>
                <Input id="profile-phone" type="tel" className={`h-12 text-foreground disabled:opacity-100 disabled:text-foreground ${editing ? "bg-accent/35" : "bg-background"}`} value={phone} onChange={(event) => setPhone(event.target.value)} disabled={!editing} placeholder="+91 00000 00000" autoComplete="tel" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="profile-language" className="font-semibold text-foreground">Language</Label>
                <select id="profile-language" className={`h-12 rounded-lg border border-input px-3 text-sm disabled:cursor-not-allowed disabled:opacity-100 ${editing ? "bg-accent/35" : "bg-background"}`} value={language} onChange={(event) => setLanguage(event.target.value as "English")} disabled={!editing}>
                  <option value="English">English</option>
                </select>
              </div>
              <label className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border px-3 text-sm ${editing ? "bg-accent/35" : "bg-background"}`}>
                <span>
                  <span className="block font-semibold">Personal notifications</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Alerts assigned to your account.</span>
                </span>
                <Switch checked={personalNotifications} onCheckedChange={setPersonalNotifications} disabled={!editing} />
              </label>
            </div>
            <div className="pt-2">
              <Fact label="Role" value={roleLabels[activeUser.role]} />
              <Fact label="Shed" value={activeUser.shed} />
              <Fact label="Farm" value={farm.settings.farmName || "Not recorded"} />
              <Fact label="Location" value={farm.settings.location || "Not recorded"} />
            </div>
            <p className="text-xs text-muted-foreground">
              Role controls what you can see — workers and managers do not see money. Change roles for this
              farm in Team, under More.
            </p>
            <Button variant="outline" className="h-12 w-fit" onClick={signOut}>
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">This device</CardTitle>
            <CardDescription>Your photo and details stay in this browser until reset.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <p>
              Signing out does not delete any record. Signing back in as anyone on the team shows the same
              farm data.
            </p>
            <p>The profile photo is resized on this device and never uploaded to a server.</p>
          </CardContent>
        </Card>
        <Card className="h-fit lg:col-start-2">
          <CardHeader>
            <CardTitle className="text-base">Security</CardTitle>
            <CardDescription>Account security controls will be connected when authentication moves to the server.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" /><p>Password changes, active sessions, and two-step verification are not available in local demo mode.</p></div>
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /><p>Your profile data and photo currently stay in this browser.</p></div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={edit !== null} onOpenChange={(open) => (!open ? setEdit(null) : undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust your photo</DialogTitle>
            <DialogDescription>Drag to reposition and use the slider to zoom. The circle is what others see.</DialogDescription>
          </DialogHeader>
          {edit ? (
            <div className="grid justify-items-center gap-5 py-2">
              <div
                ref={previewRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="relative overflow-hidden rounded-full border border-border bg-[#e5f5ef] touch-none select-none"
                style={{ width: VIEWPORT, height: VIEWPORT, cursor: "grab" }}
                role="img"
                aria-label="Profile photo preview — drag to reposition"
              >
                <img
                  src={edit.img.src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute max-w-none"
                  style={{
                    width: edit.img.width * edit.baseScale * edit.zoom,
                    height: edit.img.height * edit.baseScale * edit.zoom,
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${edit.offset.x}px), calc(-50% + ${edit.offset.y}px))`,
                  }}
                />
              </div>
              <div className="flex w-full items-center gap-3">
                <ZoomIn className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={edit.zoom}
                  onChange={(e) => onZoom(Number(e.target.value))}
                  aria-label="Zoom"
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={confirmCrop} disabled={saving}>
              {saving ? "Saving…" : "Save photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewingAvatar} onOpenChange={setViewingAvatar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Profile photo</DialogTitle>
            <DialogDescription>{activeUser.name}&apos;s photo saved on this device.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center rounded-xl bg-muted p-4">
            {avatar ? (
              <img
                src={avatar}
                alt={`${activeUser.name}'s profile photo enlarged`}
                className="max-h-[min(60vh,28rem)] max-w-full rounded-xl object-contain"
              />
            ) : (
              <div className="flex size-48 items-center justify-center rounded-xl bg-secondary text-primary">
                <ImageIcon className="size-10" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
