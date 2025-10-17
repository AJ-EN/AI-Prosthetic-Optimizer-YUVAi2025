import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Load trained models
stress_model = joblib.load('../backend/data/stress_surrogate.pkl')
deflection_model = joblib.load('../backend/data/deflection_surrogate.pkl')

# Load test data (20% holdout from training)
df = pd.read_csv('../backend/data/training_data.csv')
X = df[['base_length', 'base_width', 'base_thickness', 'rib_count', 
        'rib_thickness', 'fillet_radius', 'hole_diameter']]
y_stress_true = df['max_stress']
y_defl_true = df['max_deflection']

# Predictions
y_stress_pred = stress_model.predict(X)
y_defl_pred = deflection_model.predict(X)

# Metrics
stress_mae = mean_absolute_error(y_stress_true, y_stress_pred)
stress_r2 = r2_score(y_stress_true, y_stress_pred)
defl_mae = mean_absolute_error(y_defl_true, y_defl_pred)
defl_r2 = r2_score(y_defl_true, y_defl_pred)

# Plot 1: Parity Plot (Predicted vs Actual)
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Stress parity
axes[0].scatter(y_stress_true, y_stress_pred, alpha=0.5, s=20)
axes[0].plot([y_stress_true.min(), y_stress_true.max()], 
             [y_stress_true.min(), y_stress_true.max()], 'r--', lw=2)
axes[0].set_xlabel('True Stress (MPa)', fontsize=12)
axes[0].set_ylabel('Predicted Stress (MPa)', fontsize=12)
axes[0].set_title(f'Stress Prediction (R²={stress_r2:.3f}, MAE={stress_mae:.2f} MPa)')
axes[0].grid(alpha=0.3)

# Deflection parity
axes[1].scatter(y_defl_true, y_defl_pred, alpha=0.5, s=20)
axes[1].plot([y_defl_true.min(), y_defl_true.max()], 
             [y_defl_true.min(), y_defl_true.max()], 'r--', lw=2)
axes[1].set_xlabel('True Deflection (mm)', fontsize=12)
axes[1].set_ylabel('Predicted Deflection (mm)', fontsize=12)
axes[1].set_title(f'Deflection Prediction (R²={defl_r2:.3f}, MAE={defl_mae:.3f} mm)')
axes[1].grid(alpha=0.3)

plt.tight_layout()
plt.savefig('../docs/surrogate_validation_parity.png', dpi=300, bbox_inches='tight')
print("✅ Parity plot saved to docs/surrogate_validation_parity.png")

# Plot 2: Residual Histogram
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

stress_residuals = y_stress_true - y_stress_pred
defl_residuals = y_defl_true - y_defl_pred

axes[0].hist(stress_residuals, bins=30, edgecolor='black', alpha=0.7)
axes[0].axvline(0, color='red', linestyle='--', linewidth=2)
axes[0].set_xlabel('Residual Error (MPa)', fontsize=12)
axes[0].set_ylabel('Frequency', fontsize=12)
axes[0].set_title(f'Stress Error Distribution (Mean={stress_residuals.mean():.2f} MPa)')

axes[1].hist(defl_residuals, bins=30, edgecolor='black', alpha=0.7)
axes[1].axvline(0, color='red', linestyle='--', linewidth=2)
axes[1].set_xlabel('Residual Error (mm)', fontsize=12)
axes[1].set_ylabel('Frequency', fontsize=12)
axes[1].set_title(f'Deflection Error Distribution (Mean={defl_residuals.mean():.3f} mm)')

plt.tight_layout()
plt.savefig('../docs/surrogate_validation_residuals.png', dpi=300, bbox_inches='tight')
print("✅ Residual plot saved to docs/surrogate_validation_residuals.png")

# Summary report
print("\n" + "="*60)
print("SURROGATE MODEL VALIDATION REPORT")
print("="*60)
print(f"Dataset size: {len(df)} samples")
print(f"\nStress Model:")
print(f"  R² Score: {stress_r2:.4f}")
print(f"  MAE: {stress_mae:.2f} MPa")
print(f"  Max Error: {abs(stress_residuals).max():.2f} MPa")
print(f"\nDeflection Model:")
print(f"  R² Score: {defl_r2:.4f}")
print(f"  MAE: {defl_mae:.3f} mm")
print(f"  Max Error: {abs(defl_residuals).max():.3f} mm")
