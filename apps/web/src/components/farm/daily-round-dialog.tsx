import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DailyRoundForm } from "@/pages/daily-round"

/**
 * Quick popup for the Daily Farm Round, opened from the header button and the
 * mobile "Record" tab. The full page at /record still renders the same form,
 * so deep links and the sidebar link keep working.
 */
export function DailyRoundDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <DialogTitle>Daily Farm Round</DialogTitle>
          <DialogDescription>
            Count what you saw. Zero means you counted none. Not recorded means you have not entered it yet.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <DailyRoundForm variant="dialog" onSaved={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
