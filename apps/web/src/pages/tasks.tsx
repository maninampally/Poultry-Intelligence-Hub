import { useState } from "react"
import { AlertTriangle, CheckCircle2, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ColorStat, swatches } from "@/components/farm/color"
import { EmptyNote, PageHeader, SeverityBadge } from "@/components/farm/chrome"
import { cn } from "@/lib/utils"
import { formatDay, todayISO } from "@/domain/format"
import type { Severity, WorkStatus } from "@/domain/types"
import { newId, useFarm } from "@/store/farm-store"

const schema = z.object({
  title: z.string().trim().min(3, "Give the task a short title."),
  assignee: z.string().trim().min(2, "Name the person."),
  severity: z.enum(["urgent", "attention", "due", "information"]),
})

export function TasksPage() {
  const farm = useFarm()
  const [title, setTitle] = useState("")
  const [assignee, setAssignee] = useState("Karthik R.")
  const [severity, setSeverity] = useState<Severity>("due")
  const [error, setError] = useState("")

  function addTask() {
    const parsed = schema.safeParse({ title, assignee, severity })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the task.")
      return
    }
    farm.dispatch({
      type: "save-task",
      task: {
        id: newId("task"),
        title: parsed.data.title,
        detail: "Added from My Tasks.",
        severity: parsed.data.severity,
        status: "open",
        assignee: parsed.data.assignee,
        due: todayISO(),
        shedId: farm.sheds[0]?.id ?? null,
      },
    })
    setTitle("")
    setError("")
    toast.success("Task saved locally.")
  }

  function setStatus(id: string, status: WorkStatus) {
    farm.dispatch({ type: "set-task-status", id, status })
  }

  const open = farm.tasks.filter((task) => task.status !== "resolved")
  const urgent = open.filter((task) => task.severity === "urgent").length

  return (
    <div>
      <PageHeader
        eyebrow="Today"
        title="My tasks"
        description="Work that someone owns. Resolving a task keeps the note."
      />
      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <ColorStat label="Open" value={String(open.length)} hint="Assigned and not closed." icon={ListChecks} swatch="purple" />
        <ColorStat label="At risk" value={String(urgent)} hint="Urgent tasks still open." tone={urgent > 0 ? "alert" : "good"} icon={AlertTriangle} swatch="orange" />
        <ColorStat label="Resolved" value={String(farm.tasks.length - open.length)} hint="Closed without deleting the note." tone="good" icon={CheckCircle2} swatch="teal" />
      </section>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          {farm.tasks.length === 0 ? (
            <EmptyNote>No tasks yet. Add one on the right, or they will appear here as risks are found.</EmptyNote>
          ) : (
            farm.tasks.map((task) => (
              <article key={task.id} className="rounded-xl border bg-card p-4">
                <div className="flex gap-3">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", task.severity === "urgent" ? swatches.orange : task.severity === "information" ? swatches.blue : swatches.amber)}>
                    <ListChecks className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="font-bold tracking-tight">{task.title}</h2>
                      <SeverityBadge severity={task.severity} status={task.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{task.detail}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">{task.assignee}</span>
                      <span className="text-muted-foreground"> · due {formatDay(task.due)}</span>
                    </p>
                    {task.status !== "resolved" ? (
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" className="h-12" onClick={() => setStatus(task.id, "acknowledged")}>
                          Acknowledge
                        </Button>
                        <Button className="h-12" onClick={() => setStatus(task.id, "resolved")}>
                          Resolve
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New task</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" className="h-12" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-person">Assignee</Label>
              <Input
                id="task-person"
                className="h-12"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-severity">Severity</Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as Severity)}>
                <SelectTrigger id="task-severity" className="h-12 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="attention">Attention</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="information">Information</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button className="h-12" onClick={addTask}>
              Add task
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
