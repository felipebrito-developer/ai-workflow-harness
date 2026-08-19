# React Native: Component Architecture

1. **Atomic Layouts:** Split large screens into sub-components under `components/`.
2. **Platform Handling:** Use `Platform.select` or `.native.ts` extensions for OS-specific behaviors.
3. **Accessibility:** Every interactive element must supply `accessibilityLabel` and `accessibilityRole`.
4. **Style Encapsulation:** Use `StyleSheet.create` or Tailwind/NativeWind utility tokens; avoid inline object literal styles in render loops.