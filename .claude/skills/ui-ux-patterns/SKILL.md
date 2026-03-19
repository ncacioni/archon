---
name: ui-ux-patterns
description: Modern UI/UX patterns — visual design, interactions, animations, responsive layouts, dark/light mode, design tokens, component composition, state management. Use when building user interfaces.
---

# UI/UX Patterns

## 1. Visual Design Principles

- **Whitespace**: Generous spacing creates hierarchy and breathing room. Use consistent spacing rhythm (4px base unit: 4, 8, 12, 16, 24, 32, 48, 64)
- **Depth**: Layered elevation system with subtle shadows (0/1/2/3/4 levels). Cards float above background.
- **Color**: HSL-based semantic palettes. Accessible contrast ratios (4.5:1 normal text, 3:1 large text) in both modes
- **Typography**: Modular scale (1.25 ratio). Weight contrast for hierarchy (400 body, 500 subheadings, 700 headings). Line-height: 1.5 body, 1.2 headings
- **Gradients**: Subtle, same-hue gradients for backgrounds. Avoid rainbow effects
- **Accents**: Glassmorphism (frosted glass: `backdrop-filter: blur(10px)`) and neumorphism used sparingly for cards/buttons

---

## 2. Micro-Interactions

| State | Effect | Timing |
|-------|--------|--------|
| Hover | Scale 1.02, shadow lift, color shift | 150ms ease-out |
| Focus | Visible ring (2px offset), never hidden | Instant |
| Active/pressed | Scale 0.98, darker shade | 100ms |
| Loading | Skeleton screens (preferred over spinners) | Pulse 1.5s |
| Success | Green checkmark, toast notification | 300ms ease |
| Error | Red shake, inline message | 300ms |

### Transition Timing
- Micro-interactions: 150ms
- Layout changes: 300ms
- Page transitions: 400ms
- Enter: ease-out (decelerate into place)
- Exit: ease-in (accelerate out of view)

---

## 3. Layout Patterns

- **CSS Grid** for page-level layouts (header/sidebar/content/footer)
- **Flexbox** for component internals (nav items, card content, form rows)
- **Responsive containers**: `max-width: 1200px; margin: 0 auto; padding: 0 1rem`
- **Fluid typography**: `font-size: clamp(1rem, 0.5rem + 1.5vw, 1.25rem)`
- **Container queries**: Component-level responsiveness (`@container (min-width: 400px)`)
- **Aspect-ratio**: `aspect-ratio: 16/9` for media containers
- **Z-index scale**: base 0, dropdown 100, sticky 200, modal 300, toast 400, tooltip 500

### Breakpoints (mobile-first)
```css
/* sm */ @media (min-width: 640px)  { }
/* md */ @media (min-width: 768px)  { }
/* lg */ @media (min-width: 1024px) { }
/* xl */ @media (min-width: 1280px) { }
```

---

## 4. Component Composition Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Compound** | Related components sharing state | `<Select>` + `<Option>` |
| **Render Props** | Flexible rendering logic | `<DataFetcher render={data => ...}>` |
| **Headless UI** | Logic without styles | Headless dropdown, combobox |
| **Controlled/Uncontrolled** | Form state ownership | `value` + `onChange` vs `defaultValue` |
| **Polymorphic** | Render as different elements | `<Button as="a" href="...">` |
| **Slot** | Named content areas | `<Card header={...} footer={...}>` |

### Atomic Design
- **Atoms**: Button, Input, Label, Icon, Badge
- **Molecules**: FormField (Label + Input + Error), SearchBar, NavItem
- **Organisms**: Header, UserCard, DataTable, Form
- **Templates**: PageLayout, DashboardLayout, AuthLayout
- **Pages**: Concrete instances with real data

### Component States
Every component handles four states: **loading**, **error**, **empty**, **populated**.

---

## 5. Dark/Light Mode

```css
:root {
  --color-bg: hsl(0 0% 100%);
  --color-text: hsl(0 0% 10%);
  --color-surface: hsl(0 0% 97%);
  --color-primary: hsl(220 90% 50%);
}
[data-theme="dark"] {
  --color-bg: hsl(220 20% 10%);
  --color-text: hsl(0 0% 90%);
  --color-surface: hsl(220 20% 15%);
  --color-primary: hsl(220 90% 65%);
}
```

- Detect with `prefers-color-scheme`, allow manual toggle
- Persist choice in `localStorage`
- Smooth transition: `transition: background-color 200ms, color 200ms`
- **Verify WCAG contrast in BOTH modes** (common mistake: only checking light)

---

## 6. Design Tokens

### Three-Tier Structure
```
Primitive:  --color-blue-500: hsl(220 90% 50%)
Semantic:   --color-primary: var(--color-blue-500)
Component:  --button-bg: var(--color-primary)
```

- JSON/YAML token source files → generate CSS custom properties
- Token naming: `{category}-{property}-{variant}-{state}`
- Sync with Figma via Tokens Studio or Style Dictionary

---

## 7. State Management

| State Type | Solution | Example |
|------------|----------|---------|
| Server state | React Query / TanStack Query | API data, cache, refetch |
| Client state | Zustand / Jotai (lightweight) | UI toggles, form state |
| URL state | Router params + search params | Filters, pagination, active tab |
| Form state | React Hook Form / Formik | Validation, dirty tracking |

- **NEVER** store sensitive data (tokens, PII) in global state
- **ALWAYS** clear auth state on logout
- Optimistic updates for responsive UX (rollback on error)

---

## 8. Animation & Motion

### Framer Motion Patterns
```jsx
// Mount/unmount animation
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    />
  )}
</AnimatePresence>

// Staggered list
<motion.ul>
  {items.map((item, i) => (
    <motion.li key={item.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.05 }}
    />
  ))}
</motion.ul>
```

- **Always** respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 9. Performance

- **Code splitting**: `React.lazy` + `Suspense` per route
- **Virtualization**: TanStack Virtual for lists > 100 items
- **Images**: Lazy loading (`loading="lazy"`), `srcset` for responsive, WebP/AVIF formats
- **Fonts**: `font-display: swap`, preload critical fonts, subset to used characters
- **Bundle analysis**: Track bundle size in CI, fail on regression

### Core Web Vitals Targets
| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
