---
name: mobile-patterns
description: Cross-platform mobile patterns — PWA, hybrid (Capacitor/React Native), touch interactions, offline-first, navigation, platform conventions (iOS HIG/Android Material), push notifications, app lifecycle. Use when building mobile-capable applications.
---

# Mobile Patterns

## 1. Progressive Enhancement Path

| Level | Tech | When to Use |
|-------|------|-------------|
| Responsive Web | CSS media queries | Content sites, internal tools |
| PWA | Service worker + manifest | Offline-capable web apps, e-commerce |
| Hybrid | Capacitor / Expo | Native features (camera, push, biometrics) with web codebase |
| Native | Swift/Kotlin or React Native | Performance-critical, deep platform integration |

### PWA Requirements
- Service worker with caching strategy (cache-first for assets, network-first for API)
- Web manifest (`manifest.json`) with icons, theme color, display mode
- Offline shell: app shell cached, data fetched when online
- HTTPS required
- Installability: `beforeinstallprompt` event handling

---

## 2. Touch Interactions

- **Minimum touch target**: 44×44px (48×48px recommended by Material Design)
- **Gestures**: Swipe (navigation, dismiss), pinch-to-zoom (media), long-press (context menu), double-tap (zoom), pull-to-refresh
- **Haptic feedback**: Light (selection), medium (action), heavy (error/warning)
- **Pull-to-refresh**: Visual indicator, threshold before triggering, cancel on reverse
- **Infinite scroll**: Loading skeleton at bottom, "Load more" fallback button, preserve scroll position
- **Swipe-to-delete**: Reveal action, confirm for destructive operations

---

## 3. Offline-First

### Storage Options
| Storage | Capacity | Use Case |
|---------|----------|----------|
| Cache API | Large (dynamic) | HTTP responses, assets |
| IndexedDB | Large (50MB+) | Structured data, search |
| SQLite (hybrid) | Large | Complex queries, relational data |
| localStorage | 5MB | Simple key-value (non-sensitive) |

### Sync Strategies
- **Last-write-wins**: Simple, works for single-user data (timestamps)
- **CRDT**: Conflict-free for collaborative editing (Yjs, Automerge)
- **Conflict resolution UI**: Show both versions, let user choose
- **Background Sync API**: Queue failed requests, retry when online

### Network Detection
```javascript
navigator.onLine                    // Basic check
navigator.connection?.effectiveType // '4g', '3g', '2g', 'slow-2g'
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
```

---

## 4. Navigation Patterns

- **Stack navigation**: Push/pop with slide transitions; maintain back stack
- **Tab bars**: 3-5 items, persistent state per tab, icons + labels
- **Drawer/sidebar**: For secondary navigation; hamburger menu or swipe from edge
- **Deep linking**: Universal Links (iOS), App Links (Android), URL scheme fallback
- **Back button**: Android hardware back, iOS swipe-back gesture, always provide escape
- **Modal presentation**: Sheet (partial cover), full-screen modal, bottom sheet (drag to dismiss)
- **Scroll position**: Restore on back navigation, reset on forward navigation

---

## 5. Platform Conventions — iOS (HIG)

- **Navigation bars**: Large title that shrinks on scroll (`prefersLargeTitles`)
- **Tab bars**: Max 5 items, SF Symbols icons, "More" tab for overflow
- **Sheets/action sheets**: Detents (medium/large), drag indicator, dismiss by swiping
- **Haptic patterns**: `UIImpactFeedbackGenerator` (.light, .medium, .heavy)
- **Safe area insets**: Respect notch, home indicator, dynamic island
- **Dynamic Type**: Support text size accessibility settings (min/max with `clamp()`)
- **Color**: System colors adapt automatically to light/dark + accessibility settings

---

## 6. Platform Conventions — Android (Material 3)

- **Top app bar**: Regular or collapsing; contextual actions
- **Bottom navigation**: 3-5 destinations, badges for notifications
- **FAB** (Floating Action Button): Primary action, expandable for secondary actions
- **Adaptive icons**: Foreground + background layers, system-applied mask
- **Predictive back**: Gesture shows destination preview before completing
- **Material You**: Dynamic color from user wallpaper (`DynamicColors.applyToActivitiesIfAvailable()`)
- **Edge-to-edge**: Content extends behind system bars with proper insets

---

## 7. Performance

- **Lazy loading screens**: Load route components on demand, show skeleton immediately
- **Image caching**: Memory cache (LRU) + disk cache, progressive JPEG for large images
- **List virtualization**: Only render visible items + buffer (FlatList, RecyclerView, TanStack Virtual)
- **Bundle splitting**: Per-route code splitting, shared vendor chunk
- **Startup time**: Show splash screen, defer non-critical initialization, prefetch critical data
- **Memory management**: Dispose subscriptions, clear image cache on memory warning, avoid memory leaks in event listeners

---

## 8. Push Notifications

### Permission Flow
1. Explain value proposition BEFORE requesting permission
2. Use in-app prompt first, then system prompt
3. Respect denial — don't re-request immediately
4. Provide settings to control notification categories

### Implementation
- **Rich notifications**: Images, action buttons, expandable content
- **Notification channels** (Android): Group by category, user controls per channel
- **Critical alerts** (iOS): Bypass silent mode for urgent notifications (requires entitlement)
- **Silent push**: Background data sync without user-visible notification
- **Deep link from notification**: Route to specific screen with proper back stack

---

## 9. App Lifecycle

- **Background/foreground**: Save state on background, reconnect sockets on foreground, pause timers
- **State persistence**: Save navigation state, form drafts, scroll positions across app kills
- **Biometric auth**: FaceID/TouchID (iOS), BiometricPrompt (Android), fallback to PIN
- **App update prompts**: In-app update API (Android), check version on app open (iOS)
- **Force update**: For critical security patches, block usage until updated
- **Network reconnection**: Exponential backoff for WebSocket/API reconnection on resume
