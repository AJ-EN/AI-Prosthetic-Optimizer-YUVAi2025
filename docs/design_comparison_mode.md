# Design Comparison Mode

## Overview

The Design Comparison Mode allows users to select and compare two Pareto-optimal designs side-by-side with detailed delta calculations. This feature helps users make informed decisions by quantifying trade-offs between different design choices.

## How to Use

### Method 1: Shift+Click

1. Hold down the **Shift** key
2. Click on a point in the Pareto chart
3. While still holding Shift, click on a second point
4. The comparison card will appear with detailed metrics

### Method 2: Compare Button

1. Click the **🔍 Compare Designs** button (turns green when active)
2. Click on any point in the Pareto chart
3. Click on a second point
4. View the comparison card
5. Click the button again to exit comparison mode

## Visual Indicators

### Chart Colors

- **Blue points**: Unselected designs
- **Green point (Design A)**: First selected design
- **Amber/Orange point (Design B)**: Second selected design
- **Larger points**: Selected designs are displayed larger for visibility

### Selection States

- **0 designs selected**: Comparison card hidden
- **1 design selected**: Card shows "Design X selected, select another"
- **2 designs selected**: Full comparison table displayed

## Comparison Metrics

The comparison card displays a comprehensive table with the following metrics:

| Metric            | Description                       | Delta Interpretation                           |
| ----------------- | --------------------------------- | ---------------------------------------------- |
| **Mass (g)**      | Total mass of the design          | Green = lighter (better), Red = heavier        |
| **Cost (₹)**      | Manufacturing cost                | Green = cheaper (better), Red = more expensive |
| **Safety Factor** | Yield strength / predicted stress | Green = higher (better), Red = lower           |
| **Print Score**   | DFM readiness (0-100)             | Green = higher (better), Red = lower           |
| **CO₂ (kg)**      | Carbon emissions                  | Green = lower (better), Red = higher           |
| **Efficiency**    | Safety factor per kg              | Green = higher (better), Red = lower           |

### Delta Calculations

#### Mass, Cost, CO₂ (Lower is Better)

```
Δ = Design B - Design A
Green (good) = negative delta (B is lighter/cheaper/lower emissions)
Red (bad) = positive delta (B is heavier/more expensive/higher emissions)
```

#### Safety Factor (Percentage Change)

```
Δ% = ((Safety_B - Safety_A) / Safety_A) × 100
Green (good) = positive percentage (B is safer)
Red (bad) = negative percentage (B is less safe)
```

#### Print Score, Efficiency (Higher is Better)

```
Δ = Design B - Design A
Green (good) = positive delta (B scores higher)
Red (bad) = negative delta (B scores lower)
```

## Example Scenarios

### Scenario 1: Mass vs. Cost Trade-off

**Goal**: Understand if slightly heavier design saves money

**Steps**:

1. Select lightweight design (left side of Pareto front)
2. Shift+click on slightly heavier, cheaper design
3. Review comparison:
   - Mass: +0.36g (red, but small increase)
   - Cost: -₹0.50 (green, saves money!)
   - Safety: +5% (green, bonus improvement)

**Decision**: Accept small mass increase for cost savings

### Scenario 2: Safety vs. Sustainability

**Goal**: Compare high-safety design with eco-friendly option

**Steps**:

1. Select design with highest safety factor
2. Compare with lowest CO₂ design
3. Review comparison:
   - Safety: -12% (red, reduced safety)
   - CO₂: -0.005kg (green, 25% less emissions)
   - Efficiency: +2.5 (green, better material usage)

**Decision**: Depends on priorities (safety-critical vs. eco-conscious)

### Scenario 3: Print Readiness Check

**Goal**: Find manufacturability differences

**Steps**:

1. Select design with score 65 (yellow warning)
2. Compare with score 92 (green, ready)
3. Review comparison:
   - Print Score: +27 (green, much better manufacturability)
   - Mass: +0.15g (red, but negligible)
   - Cost: +₹0.08 (red, but negligible)

**Decision**: Choose higher print score to avoid manufacturing issues

## Technical Implementation

### Frontend State Management

```javascript
// Global variables
let selectedDesigns = []; // Max 2 designs
let comparisonMode = false; // Toggle via button

// Selection handling
function handleComparisonSelect(design) {
  // Add/remove from selectedDesigns array
  // Max 2 designs (FIFO replacement)
  // Update chart colors dynamically
  // Show/update comparison card
}
```

### Chart Integration

```javascript
// Dynamic point colors based on selection
backgroundColor: function(context) {
    if (selected for comparison) {
        return firstSelected ? 'green' : 'amber';
    }
    return 'blue';
}

// Click handler with shift detection
onClick: (event, elements) => {
    if (event.native.shiftKey || comparisonMode) {
        handleComparisonSelect(design);
    } else {
        selectDesign(design);
    }
}
```

### Comparison Card Rendering

```javascript
function displayComparison() {
  // Calculate deltas
  const massDelta = designB.mass - designA.mass;
  const safetyDeltaPercent = ((safetyB - safetyA) / safetyA) * 100;

  // Format with color coding
  const formatDelta = (value, inverse = false) => {
    const color = (inverse ? value < 0 : value > 0) ? "green" : "red";
    return `<span class="${color}">${value}</span>`;
  };

  // Render HTML table
}
```

## User Experience Features

### 1. Clear Visual Feedback

- Selected points highlighted with distinct colors
- Larger point size for selected designs
- Color-coded table cells for easy interpretation

### 2. Flexible Interaction

- Two methods: Shift+click (power users) or button (discoverable)
- Replace oldest selection when clicking third design
- Easy clear with button or exit comparison mode

### 3. Educational Tooltips

- Color legend in comparison card
- Hover text on table headers
- Instructions in UI panel

### 4. Responsive Design

- Scrollable table on small screens
- Compact text sizes for mobile
- Touch-friendly button sizes

## Integration with Other Features

### Works With:

- **Pareto Front Chart**: Primary interaction point
- **Design Info Panel**: Single design details
- **Designs Table**: Can also select from table (future enhancement)
- **AI Mentor**: Explains why certain trade-offs exist
- **3D Viewer**: Updates to show selected design
- **Manufacturing Pack**: Can download either compared design

### Complements:

- **Print Readiness Score**: Compare manufacturability
- **Sustainability Meter**: Compare environmental impact
- **Cost Estimation**: Direct cost comparison
- **Safety Analysis**: Compare stress/deflection predictions

## Best Practices

### For Students

1. **Explore extremes**: Compare lightest vs. cheapest designs
2. **Understand trade-offs**: Note which metrics improve/worsen together
3. **Check safety margins**: Ensure acceptable safety factor in comparison
4. **Consider manufacturing**: Higher print score = fewer production issues

### For Engineers

1. **Document decisions**: Screenshot comparisons for design review
2. **Multi-criteria analysis**: Balance mass, cost, safety, sustainability
3. **Sensitivity analysis**: Compare similar designs to see sensitivity
4. **Client presentations**: Visual comparison aids stakeholder communication

## Future Enhancements

### Planned Features

- [ ] Compare 3+ designs (matrix view)
- [ ] Export comparison table to CSV/PDF
- [ ] Historical comparisons across optimization runs
- [ ] Add "Why?" explanations for each delta (AI-generated)
- [ ] Comparison from table view (click checkboxes)
- [ ] Side-by-side 3D model viewing
- [ ] Normalized scoring (weighted importance)
- [ ] Compare parameter sets (not just results)

### Advanced Analytics

- [ ] Statistical significance of deltas
- [ ] Pareto dominance indicators
- [ ] Distance metrics between designs
- [ ] Recommendation: "Choose A if X, choose B if Y"

## Educational Value

### Learning Objectives

1. **Multi-objective optimization**: Understand Pareto trade-offs
2. **Engineering judgment**: Learn to prioritize conflicting criteria
3. **Quantitative decision-making**: Use data to justify choices
4. **Systems thinking**: See how one change affects multiple metrics

### YUVAi Challenge Alignment

- Demonstrates critical thinking in design selection
- Shows understanding of trade-off analysis
- Highlights real-world engineering constraints
- Promotes data-driven decision making

## Keyboard Shortcuts

| Key               | Action                           |
| ----------------- | -------------------------------- |
| **Shift + Click** | Select/deselect for comparison   |
| **Escape**        | Clear comparison (planned)       |
| **C**             | Toggle comparison mode (planned) |

## Troubleshooting

### Issue: "Can't select second design"

- **Solution**: Make sure comparison mode is ON or holding Shift key
- Check if button is green (comparison mode active)

### Issue: "Chart colors not updating"

- **Solution**: Clear comparison and try again
- Refresh page if issue persists

### Issue: "Delta calculations seem wrong"

- **Solution**: Verify both designs are from same optimization run
- Different materials have different yield strengths (affects safety factor)

### Issue: "Comparison card not showing"

- **Solution**: Need to select exactly 2 designs
- Check browser console for errors

## API Reference

### Functions

#### `toggleComparisonMode()`

Enables/disables comparison mode for easier multi-select without Shift key.

#### `handleComparisonSelect(design)`

Handles design selection logic, manages selectedDesigns array, updates chart.

#### `displayComparison()`

Renders comparison card with calculated deltas and color-coded table.

#### `clearComparison()`

Resets selectedDesigns array, hides comparison card, updates chart colors.

### Global Variables

```javascript
selectedDesigns = []; // Array of 0-2 design objects
comparisonMode = false; // Boolean toggle for comparison mode
```

## Code Examples

### Example 1: Manual Comparison Trigger

```javascript
// Select two specific designs by ID
const design1 = currentResults.pareto_front.find((d) => d.id === 0);
const design2 = currentResults.pareto_front.find((d) => d.id === 5);
selectedDesigns = [design1, design2];
displayComparison();
```

### Example 2: Find Best/Worst

```javascript
// Compare lightest vs. cheapest
const lightest = paretoFront.reduce((min, d) => (d.mass < min.mass ? d : min));
const cheapest = paretoFront.reduce((min, d) => (d.cost < min.cost ? d : min));
selectedDesigns = [lightest, cheapest];
displayComparison();
```

### Example 3: Custom Delta Logic

```javascript
// Add custom metric comparison
const customDelta =
  calculateCustomMetric(designB) - calculateCustomMetric(designA);
// Inject into comparison table
```

## Performance Notes

- Comparison calculations are O(1) - instant
- Chart recoloring uses Chart.js update() - efficient
- No backend API calls required
- Table rendering handles 2-10 metrics smoothly
- Delta calculations use simple arithmetic (no heavy compute)

## Accessibility

- **Color blind friendly**: Uses icons + text, not just color
- **Screen readers**: Table has proper ARIA labels
- **Keyboard navigation**: Tab through selections
- **High contrast**: Strong color differences for visibility
- **Text alternatives**: Numbers shown alongside colors

## References

- Multi-objective optimization visualization patterns
- Pareto front interaction best practices
- Delta visualization in engineering tools
- Comparison table UX conventions
