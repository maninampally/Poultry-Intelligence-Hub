import { useState } from "react"
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
import { PageHeader, StatusPill } from "@/components/farm/chrome"
import { formatDay, todayISO } from "@/domain/format"
import type { Severity, WorkStatus } from "@/domain/types"
import { newId, useFarm } from "@/store/farm-store"

const schema = z.object({
  title: z.string().trim().min(3, "Give the task a short title."),
  assignee: z.string().trim().min(2, "Name the person."),
  severity: z.enum(["urgent", "attention", "due", "information"]),
})

const tone = {
  urgent: "bad",
  attention: "warn",
  due: "good",
  information: "neutral",
} as const

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

  return (
    <div>
      <PageHeader
        eyebrow="Today"
        title="My tasks"
        description="Work that someone owns. Resolving a task keeps the note."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          {farm.tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={tone[task.severity]}>{task.severity}</StatusPill>
                  <StatusPill>{task.status}</StatusPill>
                </div>
                <CardTitle>{task.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{task.detail}</p>
                <p>
                  {task.assignee} · due {formatDay(task.due)}
                </p>
                {task.status !== "resolved" ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-10" onClick={() => setStatus(task.id, "acknowledged")}>
                      Acknowledge
                    </Button>
                    <Button className="h-10" onClick={() => setStatus(task.id, "resolved")}>
                      Resolve
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New task</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" className="h-11" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-person">Assignee</Label>
              <Input
                id="task-person"
                className="h-11"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as Severity)}>
                <SelectTrigger className="h-11 w-full">
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
            <Button className="h-11" onClick={addTask}>
              Add task
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
