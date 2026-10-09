import { View } from "react-native";

interface ProgressBarProps {
  /** 0..100 */
  percent: number;
  height?: number;
}

/** Cycle-progress bar under the flock card ("80% completed"). */
export function ProgressBar({ percent, height = 8 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View
      className="w-full overflow-hidden rounded-pill bg-brand-50"
      style={{ height }}
    >
      <View
        className="rounded-pill bg-brand"
        style={{ height, width: `${clamped}%` }}
      />
    </View>
  );
}
