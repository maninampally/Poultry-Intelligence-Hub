// NativeWind className typing.
//
// NativeWind 4.2.x ships a `types.d.ts` that references
// `react-native-css-interop/types`, which is not resolvable in this install
// (the interop package was absorbed and no longer published separately).
// To keep `tsc --noEmit` green we augment React Native's component props
// directly with the `className` / `tw` style props NativeWind injects at
// runtime via the babel preset.
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface SwitchProps {
    className?: string;
  }
}
