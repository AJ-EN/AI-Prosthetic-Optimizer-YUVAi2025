"""
Smart Material Advisor
Rule-based system for material recommendations based on application requirements.
"""

from material_library import load_materials


class MaterialAdvisor:
    """
    Rule-based material recommendation system.
    """

    def __init__(self):
        self.materials = load_materials()

    def get_recommendation(self, load, environment, budget):
        """
        Get material recommendation based on application requirements.

        Args:
            load (float): Applied load in Newtons
            environment (str): Application environment ("medical", "industrial", "outdoor")
            budget (str): Budget level ("low", "medium", "high")

        Returns:
            dict: Recommendation with material, rationale, and design tips
        """
        # Normalize inputs
        environment = environment.lower()
        budget = budget.lower()

        # Initialize recommendation
        recommended_material = None
        rationale = []
        design_tips = []
        alternatives = []

        # Rule 1: Medical applications
        if environment == "medical":
            if load < 150:
                # Low load medical - PLA is biocompatible and sufficient
                recommended_material = "PLA"
                rationale.append(
                    "PLA is biocompatible and suitable for low-load medical applications")
                rationale.append(
                    "Easy to 3D print with good surface finish for patient comfort")
            else:
                # Higher load medical - need stronger material
                recommended_material = "Steel1045"
                rationale.append(
                    "Steel provides high strength and reliability for medical-grade applications")
                rationale.append(
                    "Excellent fatigue resistance for long-term use")
                design_tips.append(
                    "Consider polishing for smooth patient contact surfaces")

        # Rule 2: Outdoor applications
        elif environment == "outdoor":
            if budget == "low":
                # Outdoor + low budget - PETG alternative (we'll recommend PLA with caveats)
                recommended_material = "PLA"
                rationale.append(
                    "PLA is cost-effective for outdoor use with limitations")
                rationale.append(
                    "⚠️ Warning: PLA degrades under UV exposure and heat (>50°C)")
                design_tips.append(
                    "Apply UV-resistant coating or paint for extended outdoor life")
                design_tips.append(
                    "Avoid direct sunlight exposure if possible")
                alternatives.append(
                    ("Steel1045", "Better outdoor durability but higher cost"))
            else:
                # Outdoor + adequate budget - Steel is best
                recommended_material = "Steel1045"
                rationale.append(
                    "Steel offers excellent weather resistance and temperature stability")
                rationale.append(
                    "Will not degrade under UV, rain, or temperature extremes (-40°C to 200°C)")
                design_tips.append(
                    "Apply corrosion-resistant coating (powder coat or galvanizing)")

        # Rule 3: Industrial applications
        elif environment == "industrial":
            # Industrial - strength and mass considerations
            if load < 100:
                # Low load industrial
                if budget == "low":
                    recommended_material = "PLA"
                    rationale.append(
                        "PLA is sufficient for low-load industrial fixtures")
                    rationale.append("Cost-effective for prototypes and jigs")
                    design_tips.append(
                        "Increase wall thickness to 4-5mm for safety factor")
                else:
                    recommended_material = "Aluminum6061"
                    rationale.append(
                        "Aluminum provides excellent strength-to-weight ratio")
                    rationale.append(
                        "Ideal for weight-critical industrial applications")
                    rationale.append(
                        "Good machinability for tight tolerances")
            elif load < 200:
                # Medium load industrial
                if budget == "low":
                    recommended_material = "PLA"
                    rationale.append(
                        "PLA can handle moderate loads with robust design")
                    rationale.append(
                        "⚠️ Warning: Consider higher safety factors (2.0+)")
                    design_tips.append(
                        "Use minimum 5mm wall thickness for this load")
                    alternatives.append(
                        ("Aluminum6061", "Better strength-to-weight for medium loads"))
                else:
                    recommended_material = "Aluminum6061"
                    rationale.append(
                        "Aluminum balances strength and weight for medium industrial loads")
                    rationale.append(
                        "Excellent fatigue resistance for repeated loading")
            else:
                # High load industrial - need strongest material
                recommended_material = "Steel1045"
                rationale.append(
                    "Steel is required for high-load industrial applications")
                rationale.append(
                    "Superior yield strength (310 MPa) handles heavy loads safely")
                design_tips.append(
                    "Ensure proper heat treatment for maximum strength")

        # Rule 4: General/unspecified environment
        else:
            # Default recommendations based on load and budget
            if budget == "low":
                recommended_material = "PLA"
                rationale.append("PLA is the most cost-effective material")
                rationale.append("Wide availability and easy 3D printing")
            elif load < 150:
                recommended_material = "PLA"
                rationale.append(
                    "PLA provides adequate strength for moderate loads")
                rationale.append(
                    "Good balance of cost and performance")
            else:
                recommended_material = "Steel1045"
                rationale.append(
                    "Steel recommended for higher loads and reliability")
                rationale.append("Best long-term performance and durability")

        # Get material properties
        material_props = self.materials.get(recommended_material, {})

        # Load-specific design tips
        if load < 100:
            min_thickness = 3.0
            design_tips.append(
                f"Maintain wall thickness ≥ {min_thickness}mm for {load}N load")
        elif load < 200:
            min_thickness = 4.0
            design_tips.append(
                f"Use wall thickness ≥ {min_thickness}mm for {load}N load")
            design_tips.append(
                "Consider adding reinforcement ribs for stress distribution")
        else:
            min_thickness = 5.0
            design_tips.append(
                f"Critical: Wall thickness must be ≥ {min_thickness}mm for {load}N load")
            design_tips.append(
                "Add substantial reinforcement ribs (≥3mm thick)")
            design_tips.append(
                "Increase safety factor to 2.0 or higher")

        # Budget-specific tips
        if budget == "low" and recommended_material == "PLA":
            design_tips.append(
                "3D print with 100% infill or use thick walls (no infill)")
            design_tips.append(
                "Orient print direction parallel to load for maximum strength")

        # Add manufacturing method
        if recommended_material == "PLA":
            manufacturing = "3D Printing (FDM)"
        elif recommended_material == "Aluminum6061":
            manufacturing = "CNC Machining"
        else:  # Steel
            manufacturing = "CNC Machining or Casting"

        # Compile recommendation
        recommendation = {
            "material": recommended_material,
            "material_name": self._get_material_display_name(recommended_material),
            "rationale": rationale,
            "design_tips": design_tips,
            "alternatives": alternatives,
            "manufacturing_method": manufacturing,
            "estimated_cost_per_kg": material_props.get("cost_per_kg", 0),
            "yield_strength": material_props.get("yield_strength", 0),
            "density": material_props.get("density", 0),
            "co2_per_kg": material_props.get("co2_per_kg", 0),
            "properties": {
                "strength": material_props.get("yield_strength", 0),
                "density": material_props.get("density", 0),
                "cost": material_props.get("cost_per_kg", 0),
                "co2": material_props.get("co2_per_kg", 0)
            }
        }

        return recommendation

    def _get_material_display_name(self, material_key):
        """Get display name for material."""
        display_names = {
            "PLA": "PLA (Polylactic Acid)",
            "Aluminum6061": "Aluminum 6061-T6",
            "Steel1045": "Steel 1045"
        }
        return display_names.get(material_key, material_key)

    def compare_materials(self, load):
        """
        Compare all available materials for a given load.

        Args:
            load (float): Applied load in Newtons

        Returns:
            list: List of material comparisons
        """
        comparisons = []

        for material_name, props in self.materials.items():
            # Calculate safety factor for this material
            # Assume simple stress calculation: stress = load / cross_sectional_area
            # For comparison, use arbitrary 100 mm² area
            area_mm2 = 100
            stress_mpa = load / area_mm2
            yield_strength = props.get("yield_strength", 0)
            safety_factor = yield_strength / \
                stress_mpa if stress_mpa > 0 else float('inf')

            comparisons.append({
                "material": material_name,
                "material_name": self._get_material_display_name(material_name),
                "safety_factor": round(safety_factor, 2),
                "cost_per_kg": props.get("cost_per_kg", 0),
                "co2_per_kg": props.get("co2_per_kg", 0),
                "density": props.get("density", 0),
                "yield_strength": yield_strength,
                "suitability": self._assess_suitability(safety_factor, material_name)
            })

        # Sort by safety factor descending
        comparisons.sort(key=lambda x: x["safety_factor"], reverse=True)

        return comparisons

    def _assess_suitability(self, safety_factor, material_name):
        """Assess material suitability based on safety factor."""
        if safety_factor >= 2.0:
            return "Excellent"
        elif safety_factor >= 1.5:
            return "Good"
        elif safety_factor >= 1.2:
            return "Acceptable"
        else:
            return "Insufficient"


# Singleton instance
_advisor_instance = None


def get_material_advisor():
    """Get singleton material advisor instance."""
    global _advisor_instance
    if _advisor_instance is None:
        _advisor_instance = MaterialAdvisor()
    return _advisor_instance
