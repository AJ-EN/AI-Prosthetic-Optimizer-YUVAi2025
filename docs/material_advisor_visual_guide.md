# Smart Material Advisor - Visual Guide

## 🎨 User Interface Overview

### Main Button Location

```
┌────────────────────────────────────────┐
│ AI Prosthetic Optimizer                │
│                                        │
│ ┌────────────────────────────────┐   │
│ │ Control Panel                  │   │
│ │                                │   │
│ │ Load: [100] N                 │   │
│ │ Material: [Aluminum 6061▾]    │   │
│ │                                │   │
│ │ ┌──────────────────────────┐  │   │
│ │ │ 🚀 Run Optimization      │  │   │
│ │ └──────────────────────────┘  │   │
│ │ ┌──────────────────────────┐  │   │
│ │ │ ⚡ Load Demo Results     │  │   │
│ │ └──────────────────────────┘  │   │
│ │ ┌──────────────────────────┐  │   │
│ │ │ 🧠 Smart Material Advisor│  │ ← Click here!
│ │ └──────────────────────────┘  │   │
│ └────────────────────────────────┘   │
└────────────────────────────────────────┘
```

### Modal Structure (Full View)

```
╔══════════════════════════════════════════════════════════════╗
║ 🧠 Smart Material Advisor                                  × ║
║ AI-powered material selection guidance                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ Tell us about your application                              ║
║                                                              ║
║ ┌──────────────┐ ┌────────────────┐ ┌──────────────────┐  ║
║ │ Load (N)     │ │ Environment    │ │ Budget           │  ║
║ │ [100      ]  │ │ [Industrial ▾] │ │ [Medium ▾]      │  ║
║ └──────────────┘ └────────────────┘ └──────────────────┘  ║
║                                                              ║
║           ┌────────────────────────────────┐                ║
║           │ 🔍 Get Recommendation         │                ║
║           └────────────────────────────────┘                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ ┌──────────────────────────────────────────────────────┐   ║
║ │ ✅ Recommended Material                              │   ║
║ │                                                      │   ║
║ │    Aluminum 6061-T6                                  │   ║
║ │    Manufacturing: CNC Machining                      │   ║
║ │                                                      │   ║
║ │    Cost: ₹300/kg | Strength: 240 MPa | CO₂: 10.0   │   ║
║ └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║ 💡 Why this material?                                       ║
║ ┌──────────────────────────────────────────────────────┐   ║
║ │ ✓ Excellent strength-to-weight ratio                 │   ║
║ │ ✓ Ideal for weight-critical industrial applications  │   ║
║ │ ✓ Good machinability for tight tolerances            │   ║
║ └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║ 🔧 Design Recommendations                                   ║
║ ┌──────────────────────────────────────────────────────┐   ║
║ │ 💡 Maintain wall thickness ≥ 3mm for 100N load      │   ║
║ │ 💡 Consider adding reinforcement ribs for stress     │   ║
║ └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║ 📊 Material Comparison for Your Load                       ║
║ ┌──────────────────────────────────────────────────────┐   ║
║ │ Material    │Safety│ Cost │ CO₂  │ Suitability      │   ║
║ │─────────────┼──────┼──────┼──────┼──────────────────│   ║
║ │⭐Aluminum   │ 2.40 │ ₹300 │ 10.0 │ Good             │   ║
║ │ Steel       │ 3.10 │  ₹80 │  1.9 │ Excellent        │   ║
║ │ PLA         │ 0.50 │ ₹150 │  1.8 │ Insufficient     │   ║
║ └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║              ┌──────────────────────────────┐               ║
║              │ ✓ Apply Recommended Material │               ║
║              └──────────────────────────────┘               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## 🎯 Interaction Flow

### Step-by-Step Walkthrough

#### Step 1: Open Modal

```
User Action: Click "🧠 Smart Material Advisor" button
Result:      Modal slides in from center
State:       Form visible, results hidden
Pre-fill:    Load value copied from main form
```

#### Step 2: Fill Requirements

```
User Action: Select values from dropdowns
Options:
  Load:        1-1000 N (numeric input)
  Environment: General | Medical | Industrial | Outdoor
  Budget:      Low | Medium | High

Example:
  Load:        150 N
  Environment: Industrial
  Budget:      Medium
```

#### Step 3: Get Recommendation

```
User Action: Click "🔍 Get Recommendation"
Loading:     Spinner appears, "Analyzing requirements..."
API Call:    POST /api/material-advice
Wait Time:   <100ms (instant)
```

#### Step 4: Review Results

```
Display Order:
1. ✅ Recommended Material (green card)
   - Material name (bold, large)
   - Manufacturing method
   - Key properties (cost, strength, CO₂)

2. 💡 Rationale (blue background)
   - 3-5 bullet points explaining WHY
   - Checkmarks for positive points
   - ⚠️ warnings for limitations

3. 🔧 Design Tips (yellow background)
   - Practical implementation guidance
   - Wall thickness recommendations
   - Safety factor advice
   - Manufacturing tips

4. 🔄 Alternatives (if any)
   - Other viable materials
   - Trade-off explanations

5. 📊 Comparison Table
   - All materials side-by-side
   - Safety factors calculated
   - Suitability color-coded
   - Recommended row highlighted (⭐)
```

#### Step 5: Apply or Explore

```
Option A: Apply Recommendation
  Action: Click "✓ Apply Recommended Material"
  Result: Main form updated, modal closes
  Alert:  Success message shown

Option B: Explore More
  Action: Change inputs, get new recommendation
  Result: New recommendation displayed
  State:  Previous results cleared

Option C: Close
  Action: Click × or click outside modal
  Result: Modal closes, no changes applied
```

## 🎨 Color Coding Guide

### Button Colors

```
🧠 Smart Material Advisor Button
├─ Default: Purple (#9333EA) - Purple 600
├─ Hover:   Darker Purple (#7E22CE) - Purple 700
└─ Active:  Even Darker (#6B21A8) - Purple 800
```

### Modal Header

```
Background: Purple Gradient
├─ From: Purple 600 (#9333EA)
└─ To:   Indigo 600 (#4F46E5)

Text: White (#FFFFFF)
```

### Result Cards

#### Recommended Material Card

```
Background: Green Gradient
├─ From: Green 50 (#F0FDF4)
└─ To:   Emerald 50 (#ECFDF5)

Border: Green 300 (#86EFAC) - 2px
Text:   Green 700 (#15803D) - Material name
```

#### Rationale Section

```
Background: Blue 50 (#EFF6FF)
Icons:
├─ ✓ (checkmark) - Positive points
└─ ⚠️ (warning) - Caveats/limitations

Warning Items:
├─ Background: Yellow 100 (#FEF9C3)
└─ Border:     Yellow 300 (#FDE047)
```

#### Design Tips Section

```
Background: Yellow 50 (#FEFCE8)
Icon:       💡 (light bulb)
Border:     Yellow 200 (#FEF08A)
```

#### Comparison Table

```
Header Row:    Gray 100 (#F3F4F6)
Hover Row:     Gray 50 (#F9FAFB)
Recommended:   Green 50 (#F0FDF4) + Bold + ⭐

Suitability Colors:
├─ Excellent:     Green 600 (#16A34A) + Bold
├─ Good:          Blue 600 (#2563EB) + Bold
├─ Acceptable:    Yellow 600 (#CA8A04) + Bold
└─ Insufficient:  Red 600 (#DC2626) + Bold
```

## 📊 Example Scenarios with Visuals

### Scenario 1: Medical Device (Low Load)

```
┌─────────────────────────────────────────┐
│ Input                                   │
├─────────────────────────────────────────┤
│ Load:        75 N                       │
│ Environment: Medical                    │
│ Budget:      Medium                     │
└─────────────────────────────────────────┘
           ↓ Click "Get Recommendation"
┌─────────────────────────────────────────┐
│ ✅ Recommended: PLA (Polylactic Acid)   │
├─────────────────────────────────────────┤
│ 💡 Why?                                 │
│ ✓ Biocompatible for patient contact    │
│ ✓ Sufficient for low-load medical use  │
│ ✓ Easy to 3D print custom fit          │
├─────────────────────────────────────────┤
│ 🔧 Tips                                 │
│ 💡 Wall thickness ≥ 3mm for 75N        │
│ 💡 Round all edges for comfort         │
├─────────────────────────────────────────┤
│ 📊 Comparison                           │
│ ⭐PLA:    SF=0.67  ₹150  1.8 CO₂       │
│  Aluminum: SF=3.20  ₹300 10.0 CO₂      │
│  Steel:    SF=4.13  ₹80   1.9 CO₂      │
└─────────────────────────────────────────┘
```

### Scenario 2: Outdoor Equipment (High Load)

```
┌─────────────────────────────────────────┐
│ Input                                   │
├─────────────────────────────────────────┤
│ Load:        300 N                      │
│ Environment: Outdoor                    │
│ Budget:      High                       │
└─────────────────────────────────────────┘
           ↓ Click "Get Recommendation"
┌─────────────────────────────────────────┐
│ ✅ Recommended: Steel 1045              │
├─────────────────────────────────────────┤
│ 💡 Why?                                 │
│ ✓ Excellent weather resistance         │
│ ✓ No UV degradation                    │
│ ✓ Temp stable (-40°C to 200°C)        │
│ ✓ Required for high loads             │
├─────────────────────────────────────────┤
│ 🔧 Tips                                 │
│ 💡 Critical: Wall ≥ 5mm for 300N      │
│ 💡 Apply powder coating protection     │
│ 💡 Add substantial ribs (≥3mm)        │
│ 💡 Design for water drainage           │
├─────────────────────────────────────────┤
│ 📊 Comparison                           │
│ ⭐Steel:    SF=1.03  ₹80   1.9 CO₂     │
│  Aluminum: SF=0.80  ₹300 10.0 CO₂      │
│  PLA:      SF=0.17  ₹150  1.8 CO₂      │
└─────────────────────────────────────────┘
```

### Scenario 3: Industrial + Budget Constraint

```
┌─────────────────────────────────────────┐
│ Input                                   │
├─────────────────────────────────────────┤
│ Load:        120 N                      │
│ Environment: Industrial                 │
│ Budget:      Low                        │
└─────────────────────────────────────────┘
           ↓ Click "Get Recommendation"
┌─────────────────────────────────────────┐
│ ✅ Recommended: PLA (with caveats)      │
├─────────────────────────────────────────┤
│ 💡 Why?                                 │
│ ✓ Most cost-effective option           │
│ ✓ Can handle moderate loads            │
│ ⚠️ WARNING: Higher safety factor needed│
├─────────────────────────────────────────┤
│ 🔧 Tips                                 │
│ 💡 CRITICAL: Min 5mm wall thickness    │
│ 💡 Safety factor must be ≥ 2.0         │
│ 💡 3D print with 100% infill           │
├─────────────────────────────────────────┤
│ 🔄 Alternatives                         │
│ • Aluminum 6061: Better strength for   │
│   medium loads (but ₹300/kg)           │
├─────────────────────────────────────────┤
│ 📊 Comparison                           │
│ ⭐PLA:     SF=0.42  ₹150  1.8 CO₂      │
│  Aluminum: SF=2.00  ₹300 10.0 CO₂      │
│  Steel:    SF=2.58  ₹80   1.9 CO₂      │
└─────────────────────────────────────────┘
```

## 🔄 State Transitions

### Modal States

```
State 1: CLOSED
├─ Modal: hidden
├─ Trigger: Click "🧠 Smart Material Advisor"
└─ Next: State 2

State 2: FORM INPUT
├─ Modal: visible
├─ Form: shown
├─ Results: hidden
├─ Pre-fill: Load from main form
├─ Trigger: Click "Get Recommendation"
└─ Next: State 3

State 3: LOADING
├─ Form: shown
├─ Loading spinner: visible
├─ Results: hidden
├─ Duration: <100ms
├─ API call: in progress
└─ Next: State 4

State 4: RESULTS DISPLAYED
├─ Form: shown (can modify)
├─ Loading: hidden
├─ Results: visible (6 sections)
├─ Actions: Apply or Modify
└─ Next: State 2 (new rec) or State 1 (close)

State 5: APPLIED
├─ Main form: updated
├─ Modal: closing
├─ Alert: success message
└─ Next: State 1
```

## 🎯 Decision Tree Visualization

```
START: User opens Material Advisor
   │
   ├─ Enter LOAD
   │   ├─ <100N  → Low Load Path
   │   ├─ 100-200N → Medium Load Path
   │   └─ >200N  → High Load Path
   │
   ├─ Select ENVIRONMENT
   │   ├─ Medical    → Biocompatibility Priority
   │   ├─ Industrial → Strength/Cost Balance
   │   ├─ Outdoor    → Weather Resistance
   │   └─ General    → General Purpose
   │
   └─ Select BUDGET
       ├─ Low    → Cost Priority (PLA default)
       ├─ Medium → Balanced
       └─ High   → Performance Priority

PROCESS: Rule Engine
   │
   ├─ Medical + Low Load → PLA
   ├─ Medical + High Load → Steel
   ├─ Outdoor + Low Budget → PLA (with warnings)
   ├─ Outdoor + High Budget → Steel
   ├─ Industrial + Low Load + Low Budget → PLA
   ├─ Industrial + Low Load + High Budget → Aluminum
   ├─ Industrial + High Load → Steel
   └─ Default → Load & Budget based

OUTPUT: Recommendation Package
   │
   ├─ Material Name
   ├─ Manufacturing Method
   ├─ 3-5 Rationale Points
   ├─ 2-4 Design Tips
   ├─ 0-2 Alternatives
   └─ Comparison Table (all materials)

END: User applies or explores more
```

## 📱 Responsive Design

### Desktop (≥1024px)

```
┌────────────────────────────────────────────────┐
│ Modal: 768px wide, centered                    │
│ Table: Full width, all columns visible         │
│ Buttons: Normal size                           │
└────────────────────────────────────────────────┘
```

### Tablet (768-1023px)

```
┌───────────────────────────────────┐
│ Modal: 90% width, centered        │
│ Table: Horizontal scroll if needed│
│ Form: Grid maintains structure    │
└───────────────────────────────────┘
```

### Mobile (<768px)

```
┌──────────────────────────┐
│ Modal: 95% width         │
│ Form: Single column      │
│ Table: Horizontal scroll │
│ Buttons: Full width      │
└──────────────────────────┘
```

## ⌨️ Keyboard Shortcuts

```
Tab          → Navigate form fields
Enter        → Submit (Get Recommendation)
Escape       → Close modal
Space        → Toggle dropdowns
Arrow Keys   → Navigate dropdown options
```

## 🎓 Educational Annotations

### Tooltip Hints (Planned)

```
Hover on "Safety Factor"
  ↓
┌────────────────────────────────────────┐
│ Safety Factor = Yield Strength / Load │
│ Recommended: ≥1.5 for static loads    │
│ Use ≥2.0 for dynamic/fatigue loads   │
└────────────────────────────────────────┘

Hover on "Suitability"
  ↓
┌────────────────────────────────────────┐
│ Excellent:    Safety Factor ≥ 2.0     │
│ Good:         Safety Factor ≥ 1.5     │
│ Acceptable:   Safety Factor ≥ 1.2     │
│ Insufficient: Safety Factor < 1.2     │
└────────────────────────────────────────┘
```

## 🎉 Success Indicators

### Visual Feedback

```
✅ Recommendation Generated
   ├─ Green checkmark in header
   ├─ Material card has green gradient
   └─ ⭐ star marks recommended in table

⚠️ Warning Present
   ├─ Yellow warning icon
   ├─ Yellow background on warning items
   └─ Alternatives section shown

✓ Applied Successfully
   ├─ Success alert dialog
   ├─ Main form values updated
   └─ Modal closes automatically
```

## 🔧 Accessibility Features

```
Screen Reader Support:
├─ ARIA labels on all inputs
├─ Semantic HTML (table headers)
├─ Alt text on icons
└─ Focus indicators

Keyboard Navigation:
├─ Tab order logical
├─ Escape closes modal
├─ Enter submits form
└─ No keyboard traps

Visual Accessibility:
├─ High contrast text
├─ Color + text (not color-only)
├─ Large click targets (44px min)
└─ Clear focus indicators
```

---

**The Smart Material Advisor provides an intuitive, educational, and visually appealing interface for material selection!** 🧠✨
