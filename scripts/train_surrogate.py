"""
Surrogate Model Trainer
Trains Gradient Boosting models to predict stress and deflection.
These models replace slow beam theory calculations during optimization.
"""

import os
import joblib
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import sys
sys.path.append('../backend')


def load_training_data(filename='training_data.csv'):
    """Load training data from CSV."""
    filepath = os.path.join('../backend/data', filename)
    df = pd.read_csv(filepath)
    print(f"✅ Loaded {len(df)} training samples from {filename}")
    return df


def train_surrogate_models(df):
    """
    Train separate models for stress and deflection prediction.

    Args:
        df (DataFrame): Training data

    Returns:
        tuple: (stress_model, deflection_model, metrics)
    """
    print("\n" + "=" * 70)
    print("TRAINING SURROGATE MODELS")
    print("=" * 70)

    # Define features (design parameters)
    feature_columns = [
        'base_length', 'base_width', 'base_thickness',
        'rib_count', 'rib_thickness', 'fillet_radius', 'hole_diameter'
    ]

    X = df[feature_columns]
    y_stress = df['max_stress']
    y_deflection = df['max_deflection']

    # Split data (80% train, 20% test)
    X_train, X_test, y_stress_train, y_stress_test = train_test_split(
        X, y_stress, test_size=0.2, random_state=42
    )

    _, _, y_defl_train, y_defl_test = train_test_split(
        X, y_deflection, test_size=0.2, random_state=42
    )

    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")

    # Train ensemble of models (10 models for better robustness)
    print("\n1. Training stress prediction ensemble (10 models)...")
    stress_models = []
    deflection_models = []

    for i in range(10):
        print(f"   Training ensemble member {i+1}/10...")

        # Bootstrap sample (sample with replacement)
        indices = np.random.choice(
            len(X_train), size=len(X_train), replace=True)
        X_boot = X_train.iloc[indices]
        y_stress_boot = y_stress_train.iloc[indices]
        y_defl_boot = y_defl_train.iloc[indices]

        # Train stress model
        stress_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            random_state=i,
            verbose=0
        )
        stress_model.fit(X_boot, y_stress_boot)
        stress_models.append(stress_model)

        # Train deflection model
        defl_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            random_state=i,
            verbose=0
        )
        defl_model.fit(X_boot, y_defl_boot)
        deflection_models.append(defl_model)

    # Evaluate stress ensemble (average predictions from all models)
    y_stress_pred_train = np.mean(
        [model.predict(X_train) for model in stress_models], axis=0)
    y_stress_pred_test = np.mean([model.predict(X_test)
                                 for model in stress_models], axis=0)

    stress_r2_train = r2_score(y_stress_train, y_stress_pred_train)
    stress_r2_test = r2_score(y_stress_test, y_stress_pred_test)
    stress_mae_test = mean_absolute_error(y_stress_test, y_stress_pred_test)
    stress_rmse_test = np.sqrt(mean_squared_error(
        y_stress_test, y_stress_pred_test))

    print(f"   Training R²: {stress_r2_train:.4f}")
    print(f"   Test R²: {stress_r2_test:.4f}")
    print(f"   Test MAE: {stress_mae_test:.2f} MPa")
    print(f"   Test RMSE: {stress_rmse_test:.2f} MPa")

    # Evaluate deflection ensemble (predictions already computed during training)
    print("\n2. Evaluating deflection prediction ensemble...")
    y_defl_pred_train = np.mean([model.predict(X_train)
                                for model in deflection_models], axis=0)
    y_defl_pred_test = np.mean([model.predict(X_test)
                               for model in deflection_models], axis=0)

    defl_r2_train = r2_score(y_defl_train, y_defl_pred_train)
    defl_r2_test = r2_score(y_defl_test, y_defl_pred_test)
    defl_mae_test = mean_absolute_error(y_defl_test, y_defl_pred_test)
    defl_rmse_test = np.sqrt(mean_squared_error(y_defl_test, y_defl_pred_test))

    print(f"   Training R²: {defl_r2_train:.4f}")
    print(f"   Test R²: {defl_r2_test:.4f}")
    print(f"   Test MAE: {defl_mae_test:.3f} mm")
    print(f"   Test RMSE: {defl_rmse_test:.3f} mm")

    # Feature importance analysis
    print("\n3. Feature Importance (Stress Ensemble - Average):")
    # Average feature importance across all models in ensemble
    avg_importance = np.mean(
        [model.feature_importances_ for model in stress_models], axis=0)
    feature_importance_stress = sorted(
        zip(feature_columns, avg_importance),
        key=lambda x: x[1],
        reverse=True
    )
    for feature, importance in feature_importance_stress:
        print(f"   {feature:20s}: {importance:.3f}")

    # Collect metrics
    metrics = {
        'stress': {
            'r2_train': stress_r2_train,
            'r2_test': stress_r2_test,
            'mae_test': stress_mae_test,
            'rmse_test': stress_rmse_test
        },
        'deflection': {
            'r2_train': defl_r2_train,
            'r2_test': defl_r2_test,
            'mae_test': defl_mae_test,
            'rmse_test': defl_rmse_test
        }
    }

    return stress_models, deflection_models, metrics


def save_models(stress_models, deflection_models):
    """Save trained ensemble models to disk."""
    stress_path = '../backend/data/stress_ensemble.pkl'
    deflection_path = '../backend/data/deflection_ensemble.pkl'

    joblib.dump(stress_models, stress_path)
    joblib.dump(deflection_models, deflection_path)

    print(f"\n✅ Ensemble models saved:")
    print(f"   Stress ensemble (10 models): {stress_path}")
    print(f"   Deflection ensemble (10 models): {deflection_path}")


def test_prediction_speed(stress_models, deflection_models):
    """Test prediction speed vs. original physics calculator."""
    print("\n" + "=" * 70)
    print("PREDICTION SPEED TEST")
    print("=" * 70)

    # Create test sample
    test_params = {
        'base_length': 50.0,
        'base_width': 30.0,
        'base_thickness': 3.0,
        'rib_count': 3,
        'rib_thickness': 2.5,
        'fillet_radius': 2.0,
        'hole_diameter': 5.0
    }

    # Test surrogate prediction (ensemble average)
    import time
    X_test = pd.DataFrame([test_params])

    start = time.time()
    for _ in range(1000):
        stress_pred = np.mean([model.predict(X_test)[0]
                              for model in stress_models])
        defl_pred = np.mean([model.predict(X_test)[0]
                            for model in deflection_models])
    surrogate_time = (time.time() - start) / 1000

    print(
        f"\nSurrogate ensemble prediction time: {surrogate_time*1000:.4f} ms")
    print(f"Predicted stress: {stress_pred:.2f} MPa")
    print(f"Predicted deflection: {defl_pred:.3f} mm")

    # Test original physics calculator
    from physics_calculator import calculate_stress_and_deflection

    start = time.time()
    for _ in range(1000):
        result = calculate_stress_and_deflection(test_params, 50.0, 'PLA')
    physics_time = (time.time() - start) / 1000

    print(f"\nPhysics calculator time: {physics_time*1000:.4f} ms")
    print(f"Actual stress: {result['max_stress']:.2f} MPa")
    print(f"Actual deflection: {result['max_deflection']:.3f} mm")

    speedup = physics_time / surrogate_time
    print(f"\n⚡ Speedup: {speedup:.1f}x faster")

    # Calculate accuracy
    stress_error = abs(
        stress_pred - result['max_stress']) / result['max_stress'] * 100
    defl_error = abs(
        defl_pred - result['max_deflection']) / result['max_deflection'] * 100

    print(f"\nPrediction accuracy:")
    print(f"   Stress error: {stress_error:.1f}%")
    print(f"   Deflection error: {defl_error:.1f}%")


def plot_feature_importance(stress_models):
    """
    Plot and save feature importance visualization.

    Args:
        stress_models: List of trained stress prediction models (ensemble)
    """
    print("\n" + "=" * 70)
    print("GENERATING FEATURE IMPORTANCE PLOT")
    print("=" * 70)

    # Get average feature importances across ensemble
    avg_importances = np.mean(
        [model.feature_importances_ for model in stress_models], axis=0)

    feature_names = ['Length', 'Width', 'Thickness',
                     'Ribs', 'Rib Thick', 'Fillet', 'Hole']

    # Sort by importance
    indices = np.argsort(avg_importances)[::-1]

    # Create plot
    plt.figure(figsize=(10, 6))
    plt.bar(range(len(avg_importances)),
            avg_importances[indices], color='steelblue')
    plt.xticks(range(len(avg_importances)), [
               feature_names[i] for i in indices], rotation=45)
    plt.xlabel('Design Parameter', fontsize=12)
    plt.ylabel('Importance (Gini)', fontsize=12)
    plt.title('Feature Importance for Stress Prediction (Ensemble Average)',
              fontsize=14, fontweight='bold')
    plt.grid(axis='y', alpha=0.3)
    plt.tight_layout()

    # Save plot
    output_path = '../docs/feature_importance.png'
    plt.savefig(output_path, dpi=300)
    print(f"✅ Feature importance plot saved to: {output_path}")
    plt.close()


if __name__ == '__main__':
    print("=" * 70)
    print("SURROGATE MODEL TRAINING PIPELINE")
    print("=" * 70)

    # Load data
    df = load_training_data('training_data.csv')

    # Train ensemble models
    stress_models, deflection_models, metrics = train_surrogate_models(df)

    # Save ensemble models
    save_models(stress_models, deflection_models)

    # Test speed
    test_prediction_speed(stress_models, deflection_models)

    # Plot feature importance
    plot_feature_importance(stress_models)

    # Final summary
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE!")
    print("=" * 70)
    print(f"✅ Stress Model R²: {metrics['stress']['r2_test']:.4f}")
    print(f"✅ Deflection Model R²: {metrics['deflection']['r2_test']:.4f}")

    if metrics['stress']['r2_test'] >= 0.90 and metrics['deflection']['r2_test'] >= 0.90:
        print("\n🎉 EXCELLENT! Both models have R² > 0.90")
        print("   Models are ready for optimization!")
    elif metrics['stress']['r2_test'] >= 0.85 and metrics['deflection']['r2_test'] >= 0.85:
        print("\n✅ GOOD! Both models have R² > 0.85")
        print("   Models are acceptable for optimization")
    else:
        print("\n⚠️  WARNING: Model accuracy below 0.85")
        print("   Consider generating more training data")

    print("\n🚀 Next step: Build the optimizer using these models!")
