import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fact, PageHeader, StatusPill } from "@/components/farm/chrome"
import { useFarm } from "@/store/farm-store"

const roleLabels = { owner: "Owner", manager: "Manager", worker: "Worker" } as const

export function ProfilePage() {
  const farm = useFarm()
  const navigate = useNavigate()
  const user = farm.currentUser
  const [name, setName] = useState(user?.name ?? "")

  if (!user) {
    return (
      <PageHeader
        title="No profile signed in"
        description="This browser has no active teammate. Sign in to see a profile."
      />
    )
  }

  function save() {
    if (!user) return
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast.error("Enter a name with at least 2 letters.")
      return
    }
    farm.dispatch({ type: "update-team-member", id: user.id, patch: { name: trimmed } })
    toast.success("Profile updated on this device.")
  }

  function signOut() {
    farm.dispatch({ type: "sign-out" })
    navigate("/login", { replace: true })
  }

  return (
    <div>
      <PageHeader eyebrow="You" title="Profile" description="Your identity on this device. Nothing here is synced to a server." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#e5f5ef] text-lg font-bold text-[#087f73]">
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>
                  <StatusPill tone={user.status === "active" ? "good" : "neutral"}>{user.status}</StatusPill>
                  <span className="ml-2">{roleLabels[user.role]} · {user.shed}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label htmlFor="profile-name">Display name</Label>
            <Input id="profile-name" className="h-11" value={name} onChange={(event) => setName(event.target.value)} />
            <Button className="h-11 w-fit" onClick={save}>Save name</Button>
            <div className="pt-2">
              <Fact label="Role" value={roleLabels[user.role]} />
              <Fact label="Shed" value={user.shed} />
              <Fact label="Farm" value={farm.settings.farmName} />
              <Fact label="Location" value={farm.settings.location} />
            </div>
            <p className="text-xs text-muted-foreground">
              Role controls what you can see — workers and managers do not see money. Change roles for this farm in Team, under More.
            </p>
            <Button variant="outline" className="h-11 w-fit" onClick={signOut}>
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">This device</CardTitle>
            <CardDescription>Demo mode. Data stays in this browser until reset.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Signing out does not delete any record. Signing back in as anyone on the team shows the same farm data.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
