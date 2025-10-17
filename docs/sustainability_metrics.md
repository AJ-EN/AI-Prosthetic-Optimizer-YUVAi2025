# Sustainability Metrics

## Overview

The Prosthetic Optimizer now includes comprehensive sustainability tracking to help users make environmentally conscious design decisions.

## Metrics

### 1. CO₂ Emissions (kg)

- **What it measures**: Total carbon dioxide emissions from material production
- **Formula**: `CO₂ = (mass_kg) × (material_co2_per_kg)`
- **Material CO₂ Values**:
  - PLA (3D printing): 1.8 kg CO₂/kg
  - Aluminum 6061-T6: 10.0 kg CO₂/kg
  - Steel 1045: 1.9 kg CO₂/kg
- **Interpretation**: Lower is better - indicates lower environmental impact

### 2. Efficiency Index

- **What it measures**: Safety factor per kilogram of material (structural efficiency)
- **Formula**: `Efficiency = safety_factor / mass_kg`
  - Where `safety_factor = yield_strength / predicted_stress`
- **Interpretation**: Higher is better - more safety with less material
- **Typical Range**: 0-20 (scaled to 0-100% in visualization)

## Why Sustainability Matters

### Environmental Impact

- Manufacturing processes contribute significantly to global CO₂ emissions
- Material choice dramatically affects carbon footprint (Aluminum ~5.5x higher than PLA or Steel)
- Optimizing for lower mass reduces both emissions and material waste

### Material Efficiency

- Higher efficiency means better structural performance per kg of material
- Encourages designs that maximize safety factor while minimizing mass
- Promotes resource conservation and cost reduction

## Using Sustainability Metrics

### In Design Selection

1. **Low CO₂ Priority**: Choose designs with lowest CO₂ emissions for eco-friendly applications
2. **High Efficiency Priority**: Select designs with high efficiency index for resource optimization
3. **Balanced Approach**: Find sweet spot on Pareto front considering mass, cost, AND sustainability

### Comparative Analysis

- Sort designs table by CO₂ or Efficiency columns
- Compare sustainability across different materials
- Identify trade-offs between performance, cost, and environmental impact

### Example Scenarios

#### Scenario 1: Eco-Conscious Client

- **Priority**: Minimize CO₂ emissions
- **Action**: Sort by CO₂ column (ascending), select lowest emission design
- **Expected Result**: Likely PLA or Steel designs with lower mass

#### Scenario 2: Resource Optimization

- **Priority**: Maximum efficiency (best safety per kg)
- **Action**: Sort by Efficiency column (descending), select highest efficiency
- **Expected Result**: Lightweight designs with robust structural performance

#### Scenario 3: Material Comparison

- **Priority**: Understand environmental impact across materials
- **Action**: Run optimization for each material, compare CO₂ values
- **Expected Result**: PLA and Steel ~1.8-1.9 kg CO₂/kg vs Aluminum ~10.0 kg CO₂/kg

## Integration with Other Metrics

The Sustainability Meter works alongside:

- **Print Readiness Score**: Ensures design is manufacturable
- **AI Mentor Insights**: Provides educational context on trade-offs
- **Pareto Front**: Shows multi-objective optimization including sustainability

## Visualization

### Design Info Panel

- **🍃 Sustainability** section shows:
  - CO₂ Emissions value in kg (3 decimal places)
  - Efficiency Index with progress bar (scaled to 20 max)
  - Green gradient styling emphasizes eco-friendly focus

### Designs Table

- **🍃 CO₂(kg)** column: Sortable, shows emissions
- **⚡ Efficiency** column: Sortable, shows efficiency index

## Technical Implementation

### Backend (optimizer.py)

```python
# Calculate CO₂ emissions
mass_kg = mass_g / 1000.0
co2_per_kg = material.get('co2_per_kg', 2.0)  # Default 2.0
co2_kg = mass_kg * co2_per_kg

# Calculate efficiency index
actual_safety_factor = yield_strength / predicted_stress
efficiency_index = actual_safety_factor / mass_kg
```

### Frontend (app.js)

```javascript
// Display in design panel
document.getElementById("co2-value").textContent = co2.toFixed(3);
document.getElementById("efficiency-value").textContent = efficiency.toFixed(2);

// Scale efficiency bar (0-20 maps to 0-100%)
const efficiencyPercent = Math.min((efficiency / 20) * 100, 100);
document.getElementById("efficiency-bar").style.width = `${efficiencyPercent}%`;
```

## Educational Value

### For Students

- Understand relationship between material choice and environmental impact
- Learn about life cycle assessment in engineering
- Practice multi-criteria decision making including sustainability

### For YUVAi Challenge

- Demonstrates holistic approach to design optimization
- Shows consideration of modern engineering priorities (sustainability)
- Aligns with global focus on reducing carbon emissions

## Future Enhancements

- Add manufacturing energy consumption
- Include transportation and end-of-life disposal impacts
- Integrate with carbon offset calculators
- Add sustainability score (weighted combination of metrics)

## References

- CO₂ values based on typical material production processes
- Efficiency index inspired by structural optimization literature
- Visualization follows modern UX patterns for sustainability metrics
