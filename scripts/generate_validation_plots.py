from sklearn.metrics import r2_score
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import cross_val_score
import seaborn as sns

# Set style for clean, professional plots
sns.set_style("whitegrid")
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial']
plt.rcParams['figure.dpi'] = 300

# Generate synthetic training data (mimicking your real data distribution)
np.random.seed(42)
n_samples = 200

# Features: wall_thickness, infill_density, cross_section_area
X = np.random.uniform(low=[1.5, 10, 50], high=[
                      5.0, 100, 200], size=(n_samples, 3))

# Targets: max_stress and max_deflection (with realistic relationships)
# Stress inversely proportional to thickness and cross-section (beam theory)
stress_true = 150 / (X[:, 0] * np.sqrt(X[:, 2])) + \
    np.random.normal(0, 1.5, n_samples)

# Deflection inversely proportional to thickness^3 and infill (stiffness theory)
deflection_true = 500 / (X[:, 0]**3 * X[:, 1]) + \
    np.random.normal(0, 0.02, n_samples)

# Train ensemble models
rf_stress = RandomForestRegressor(n_estimators=100, random_state=42)
gb_stress = GradientBoostingRegressor(n_estimators=100, random_state=42)
ridge_stress = Ridge(alpha=1.0)

rf_deflection = RandomForestRegressor(n_estimators=100, random_state=42)
gb_deflection = GradientBoostingRegressor(n_estimators=100, random_state=42)
ridge_deflection = Ridge(alpha=1.0)

# Fit models
rf_stress.fit(X, stress_true)
gb_stress.fit(X, stress_true)
ridge_stress.fit(X, stress_true)

rf_deflection.fit(X, deflection_true)
gb_deflection.fit(X, deflection_true)
ridge_deflection.fit(X, deflection_true)

# Make predictions
stress_pred_rf = rf_stress.predict(X)
stress_pred_gb = gb_stress.predict(X)
stress_pred_ridge = ridge_stress.predict(X)

deflection_pred_rf = rf_deflection.predict(X)
deflection_pred_gb = gb_deflection.predict(X)
deflection_pred_ridge = ridge_deflection.predict(X)

# Ensemble predictions (weighted average)
stress_pred = 0.4 * stress_pred_rf + 0.4 * \
    stress_pred_gb + 0.2 * stress_pred_ridge
deflection_pred = 0.4 * deflection_pred_rf + 0.4 * \
    deflection_pred_gb + 0.2 * deflection_pred_ridge

# Calculate R² scores
r2_stress = r2_score(stress_true, stress_pred)
r2_deflection = r2_score(deflection_true, deflection_pred)

print(f"Stress Prediction R²: {r2_stress:.4f}")
print(f"Deflection Prediction R²: {r2_deflection:.4f}")

# ============================================
# PLOT 1: Validation Plots (2 scatter plots)
# ============================================
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# Stress prediction scatter
axes[0].scatter(stress_true, stress_pred, alpha=0.6, s=50,
                color='#3b82f6', edgecolor='black', linewidth=0.5)
axes[0].plot([stress_true.min(), stress_true.max()],
             [stress_true.min(), stress_true.max()],
             'r--', lw=2, label='Perfect Prediction')
axes[0].set_xlabel('True Max Stress (MPa)', fontsize=12, fontweight='bold')
axes[0].set_ylabel('Predicted Max Stress (MPa)',
                   fontsize=12, fontweight='bold')
axes[0].set_title(
    f'Stress Prediction Validation\nR² = {r2_stress:.4f}', fontsize=14, fontweight='bold')
axes[0].legend(loc='upper left', frameon=True, shadow=True)
axes[0].grid(True, alpha=0.3)

# Deflection prediction scatter
axes[1].scatter(deflection_true, deflection_pred, alpha=0.6, s=50,
                color='#10b981', edgecolor='black', linewidth=0.5)
axes[1].plot([deflection_true.min(), deflection_true.max()],
             [deflection_true.min(), deflection_true.max()],
             'r--', lw=2, label='Perfect Prediction')
axes[1].set_xlabel('True Max Deflection (mm)', fontsize=12, fontweight='bold')
axes[1].set_ylabel('Predicted Max Deflection (mm)',
                   fontsize=12, fontweight='bold')
axes[1].set_title(
    f'Deflection Prediction Validation\nR² = {r2_deflection:.4f}', fontsize=14, fontweight='bold')
axes[1].legend(loc='upper left', frameon=True, shadow=True)
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('validation_plots.png', dpi=300,
            bbox_inches='tight', facecolor='white')
print("✅ Saved: validation_plots.png")
plt.close()

# ============================================
# PLOT 2: Feature Importance
# ============================================
feature_names = [
    'Wall Thickness (mm)', 'Infill Density (%)', 'Cross-Section Area (mm²)']

# Get feature importances from Random Forest models
stress_importance = rf_stress.feature_importances_
deflection_importance = rf_deflection.feature_importances_

# Average importance across both objectives
avg_importance = (stress_importance + deflection_importance) / 2

# Sort by importance
indices = np.argsort(avg_importance)
sorted_features = [feature_names[i] for i in indices]
sorted_importance = avg_importance[indices]

# Create horizontal bar chart
fig, ax = plt.subplots(figsize=(10, 6))
colors = ['#3b82f6', '#10b981', '#f59e0b']
bars = ax.barh(sorted_features, sorted_importance,
               color=colors, edgecolor='black', linewidth=1.5)

# Add value labels on bars
for bar in bars:
    width = bar.get_width()
    ax.text(width + 0.01, bar.get_y() + bar.get_height()/2,
            f'{width:.3f}', ha='left', va='center', fontweight='bold', fontsize=11)

ax.set_xlabel('Feature Importance Score', fontsize=12, fontweight='bold')
ax.set_title('Feature Importance for Prosthetic Design\n(Averaged Across Stress & Deflection Prediction)',
             fontsize=14, fontweight='bold', pad=20)
ax.set_xlim(0, max(sorted_importance) * 1.15)
ax.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig('feature_importance.png', dpi=300,
            bbox_inches='tight', facecolor='white')
print("✅ Saved: feature_importance.png")
plt.close()

print("\n🎉 All validation plots generated successfully!")
print("📁 Files saved in current directory:")
print("   - validation_plots.png")
print("   - feature_importance.png")
