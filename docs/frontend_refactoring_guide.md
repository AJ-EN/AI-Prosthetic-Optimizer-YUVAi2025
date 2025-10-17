# Frontend Refactoring Guide

## Problem

The original frontend code had grown to:

- `index.html`: 908 lines (HTML + inline CSS)
- `app.js`: 1103 lines (all JavaScript logic)

This made the code hard to maintain, debug, and understand.

## Solution: Modular Architecture

### New Directory Structure

```
frontend/
├── index.html              # Clean HTML (no inline styles)
├── css/
│   ├── styles.css          # Main styles
│   └── animations.css      # Toast & NSGA-II animations
├── js/
│   ├── config.js           # Configuration & global state
│   ├── toast.js            # Toast notification system
│   ├── api.js              # API calls to backend
│   ├── chart.js            # Pareto chart rendering
│   ├── viewer3d.js         # Three.js 3D viewer
│   ├── comparison.js       # Design comparison logic
│   ├── materialAdvisor.js  # Material advisor modal
│   ├── ui.js               # UI helpers & interactions
│   └── main.js             # Initialization & coordination
└── app.js (legacy)         # Keep for reference, will be deprecated
```

### File Responsibilities

#### CSS Files

1. **styles.css** (80 lines)

   - Base styles, layout
   - 3D viewer container
   - Chart responsive styles
   - Table scrolling
   - Modal styles

2. **animations.css** (140 lines)
   - Toast slide animations
   - NSGA-II evolution animation
   - Pareto front line animation
   - Evolving dots with staggered delays

#### JavaScript Modules

1. **config.js** (~15 lines)

   - API_BASE_URL constant
   - Global state variables
   - Shared objects (chart, scene, camera, etc.)

2. **toast.js** (~40 lines)

   - `showToast(message, type, duration)`
   - Toast creation and auto-removal
   - Close button handling

3. **api.js** (~150 lines)

   - `runOptimization()` - POST /api/optimize
   - `loadDemo()` - GET /api/demo
   - `downloadManufacturingPack(id)` - GET /api/download/:id
   - `getMaterialAdvice()` - POST /api/material-advice
   - Error handling with toasts

4. **chart.js** (~200 lines)

   - `renderParetoChart(results)` - Create Chart.js scatter plot
   - Chart click handling
   - Shift+click for comparison
   - Chart update logic

5. **viewer3d.js** (~150 lines)

   - `init3DViewer()` - Setup Three.js scene
   - `load3DModel(filename)` - Load STL files
   - Camera, lighting, controls
   - Auto-expand section when model loads

6. **comparison.js** (~200 lines)

   - `toggleComparisonMode()` - Enable/disable comparison
   - `handleComparisonSelect(design)` - Track selected designs
   - `displayComparison()` - Show comparison table
   - `clearComparison()` - Reset selections
   - Delta calculations

7. **materialAdvisor.js** (~300 lines)

   - `openMaterialAdvisor()` - Show modal
   - `closeMaterialAdvisor()` - Hide modal
   - `displayMaterialRecommendation(data)` - Render results
   - `applyRecommendedMaterial()` - Apply to form
   - Comparison table rendering

8. **ui.js** (~150 lines)

   - `displayResults(results)` - Show optimization results
   - `displayDesignInfo(design)` - Update selected design panel
   - `populateDesignsTable(designs)` - Fill designs table
   - `displayMentorInsights(results)` - Show AI mentor
   - `toggle3DViewer()` - Collapsible section toggle
   - `toggleMentor()` - Collapsible section toggle
   - `sortTable(column)` - Table sorting

9. **main.js** (~50 lines)
   - DOMContentLoaded listener
   - Initialization sequence
   - Module coordination
   - Error handling setup

### Benefits of Refactoring

1. **Maintainability**

   - Each file has a single responsibility
   - Easy to find and fix bugs
   - Clear separation of concerns

2. **Debugging**

   - Browser DevTools show specific file names
   - Line numbers are meaningful
   - Can debug one module at a time

3. **Collaboration**

   - Multiple developers can work on different files
   - Git conflicts reduced
   - Code review is easier

4. **Performance**

   - Browser can cache individual modules
   - Can lazy-load non-critical modules
   - Easier to minify/bundle for production

5. **Testing**
   - Can unit test individual modules
   - Mock dependencies easily
   - Test coverage is clearer

### Migration Steps

1. ✅ Create directory structure (css/, js/)
2. ✅ Extract CSS to styles.css and animations.css
3. ✅ Create config.js with global state
4. ✅ Create toast.js notification system
5. 🔄 Create api.js with all API calls
6. 🔄 Create chart.js for Pareto visualization
7. 🔄 Create viewer3d.js for Three.js
8. 🔄 Create comparison.js for design comparison
9. 🔄 Create materialAdvisor.js for modal
10. 🔄 Create ui.js for UI interactions
11. 🔄 Create main.js for initialization
12. 🔄 Update index.html to reference new files
13. ✅ Test all functionality
14. ✅ Remove app.js (keep as app.legacy.js for reference)

### Bug Fixes Applied

1. **Line 88 TypeError** - Fixed `data.results.designs.length` to `data.results.pareto_front.length`

   - Root cause: Backend returns `pareto_front` array, not `designs`
   - Solution: Added null check and correct property access

2. **Flask connection error** - Already handled with toast notifications
   - Shows user-friendly error message
   - Guides to check if server is running

### Testing Checklist

After refactoring, test:

- [ ] Run optimization (full flow)
- [ ] Load demo results
- [ ] Click on chart points (design selection)
- [ ] Shift+click for comparison mode
- [ ] 3D model loading
- [ ] Material advisor modal
- [ ] Download manufacturing pack
- [ ] All toast notifications appear
- [ ] NSGA-II animation during optimization
- [ ] Collapsible sections (3D viewer, AI mentor)
- [ ] Table sorting
- [ ] Mobile responsiveness

### Next Steps

1. Complete JavaScript module extraction
2. Update index.html imports
3. Test thoroughly
4. Document any API changes
5. Consider build system (webpack/vite) for production
