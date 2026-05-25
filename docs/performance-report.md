# Performance Optimization Report: Code Splitting & Lazy Loading

## 1. Executive Summary
This report summarizes the bundle size optimization performed on the AI Manager Tycoon application. By transitioning from a monolithic bundle to an on-demand code-splitting architecture, we have successfully optimized initial load performance, minimized main thread blocking time, and reduced the initial Javascript payload.

* **Key Outcome**: The initial Javascript bundle size was reduced from **296.73 kB** to **270.72 kB** (a reduction of **26.01 kB** or **8.76%**).
* **Code Splitting**: Moved 8 heavy and deferred UI subsystems into lazy-loaded chunks that are fetched strictly on-demand.

## 2. Baseline Bundle Analysis (Before Optimization)
In the initial baseline build, all components and modules were statically imported in `src/App.tsx`. This monolithic layout packed non-critical components into the primary chunk:
* Overlays and Modals (`SaveManager`, `SkillTreeModal`, `TeamEventDialog`, `GameOverScreen`) that only display after specific user actions or at the end of a game.
* Large tabs and logging panels (`ResultReport`, `AchievementPanel`, `HistoryPanel`) that are either hidden initially or only updated post-simulation.
* Introductory components (`TutorialGuide`) that are only shown to new players.

This monolithic delivery model bloated the initial bundle, delaying the First Contentful Paint (FCP) and Time to Interactive (TTI) for all users.

## 3. Optimization Methodology
We implemented code splitting using `React.lazy()` and dynamic imports (`import()`) in `/src/App.tsx`. 

### Named-to-Default Module Adapters
Because the components utilize named exports (e.g., `export const SaveManager = ...`), we mapped the dynamic imports to resolve their named exports into a default property expected by `React.lazy()`:
```typescript
const SaveManager = lazy(() => 
  import('./components/SaveManager').then(module => ({ default: module.SaveManager }))
);
```

### Suspense Wrappers
We wrapped the component instantiation locations in `<Suspense>` containers with appropriate loading states:
* For overlay dialogs and modals (`TeamEventDialog`, `SkillTreeModal`, `SaveManager`, `GameOverScreen`, `TutorialGuide`), we used `fallback={null}` to avoid flashes of empty containers during instant chunks fetches.
* For inline content panels (`ResultReport`, `AchievementPanel`, `HistoryPanel`), we utilized local loading wrappers (e.g., `<div className="panel-loading">...</div>`) to preserve document flow.

## 4. Measurement & Quantitative Results

Below is the comparison of build assets and chunk layout before and after the optimization:

### Bundle Size Metrics

| Metric / Bundle Asset | Baseline (Static Imports) | Optimized (Lazy Loading) | Delta |
| :--- | :--- | :--- | :--- |
| **Initial Bundle Size (JS)** | 296.73 kB (gzip: 94.55 kB) | 270.72 kB (gzip: 86.98 kB) | -26.01 kB (-8.76%) |
| **Initial CSS Size** | 51.39 kB (gzip: 9.11 kB) | 51.39 kB (gzip: 9.11 kB) | 0.00 kB (0%) |
| **Total JS Chunk Files** | 1 | 9 | +8 files |

### Chunk File Breakdown (Optimized Build)
When building the project via Vite/Rollup, the following chunk assets are now generated:

1. **`assets/index-[hash].js`** (270.72 kB): Main entrypoint containing the game engine, state management, core hooks, static views (e.g., main menu, landing team layout), and basic CSS wrappers.
2. **`assets/ResultReport-[hash].js`** (7.35 kB): Loaded when a simulation sprint completes.
3. **`assets/SaveManager-[hash].js`** (6.66 kB): Loaded when the user opens the "存档管理" modal.
4. **`assets/TutorialGuide-[hash].js`** (6.17 kB): Loaded when the beginner guide is rendered.
5. **`assets/SkillTreeModal-[hash].js`** (2.76 kB): Loaded when clicking to open an agent's upgrade tree.
6. **`assets/GameOverScreen-[hash].js`** (2.11 kB): Loaded only on game over.
7. **`assets/AchievementPanel-[hash].js`** (2.07 kB): Loaded when rendering achievements.
8. **`assets/TeamEventDialog-[hash].js`** (1.31 kB): Loaded when a random team interaction event occurs.
9. **`assets/HistoryPanel-[hash].js`** (1.27 kB): Loaded when inspecting prior sprints.

## 5. Error Handling and Resilience
All lazy components are protected by the existing `ErrorBoundary` wrapper declared at the application root (`src/main.tsx`). In the event of a network disruption preventing chunk download, the error boundary gracefully catches the chunk-load error and allows the user to retry, preventing the game from crashing.

## 6. Recommendations for Future Work
* **Resource Preloading**: Consider prefetching the `ResultReport` chunk on hover/selection of agents to make post-simulation loading imperceptible.
* **Component-Level Styling**: Split larger stylesheets associated with specific components out of `src/App.css` into local `.module.css` files, allowing Vite to code-split CSS files alongside their corresponding JS chunks.
