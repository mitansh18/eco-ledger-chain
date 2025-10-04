"""
EcoLedger - CO₂ Absorption Estimator API
Calculates carbon dioxide absorption based on tree count and mangrove characteristics
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime
import math

app = Flask(__name__)
CORS(app)

class CO2EstimatorService:
    def __init__(self):
        # Mangrove CO₂ absorption constants
        # Based on scientific studies of mangrove carbon sequestration
        self.co2_per_tree_kg_year = 12.3  # kg CO₂ per tree per year (as specified)
        
        # Additional factors for more accurate estimation
        self.species_factors = {
            'rhizophora': 1.2,      # Red mangroves (higher sequestration)
            'avicennia': 1.0,       # Black mangroves (baseline)
            'laguncularia': 0.9,    # White mangroves (lower sequestration)
            'conocarpus': 0.8,      # Buttonwood (lowest)
            'mixed': 1.0           # Mixed species (average)
        }
        
        self.age_factors = {
            'seedling': 0.1,        # 0-2 years
            'young': 0.3,          # 2-5 years
            'mature': 1.0,         # 5-15 years (baseline)
            'old_growth': 1.3      # 15+ years
        }
        
        self.health_factors = {
            'excellent': 1.2,
            'good': 1.0,
            'fair': 0.7,
            'poor': 0.4,
            'critical': 0.1
        }
        
        # Carbon conversion factors
        self.co2_to_carbon_ratio = 44/12  # CO₂ molecular weight / Carbon atomic weight
        
    def calculate_co2_absorption(self, tree_count, species='mixed', age_class='mature', 
                               health_status='good', time_period_years=1, 
                               include_soil_carbon=False, area_hectares=None):
        """
        Calculate CO₂ absorption with various factors
        """
        try:
            # Base calculation
            base_absorption = tree_count * self.co2_per_tree_kg_year * time_period_years
            
            # Apply modifying factors
            species_factor = self.species_factors.get(species, 1.0)
            age_factor = self.age_factors.get(age_class, 1.0) 
            health_factor = self.health_factors.get(health_status, 1.0)
            
            # Calculate adjusted absorption
            adjusted_absorption = base_absorption * species_factor * age_factor * health_factor
            
            # Additional carbon sequestration from soil and biomass
            soil_carbon = 0
            if include_soil_carbon and area_hectares:
                # Mangrove soils can sequester 2-5 tonnes C/hectare/year
                soil_carbon_tonnes_c = area_hectares * 3.5 * time_period_years
                soil_carbon = soil_carbon_tonnes_c * 1000 * self.co2_to_carbon_ratio  # Convert to kg CO₂
            
            total_co2_absorption = adjusted_absorption + soil_carbon
            
            # Calculate carbon credits (1 credit = 1 tonne CO₂)
            carbon_credits = total_co2_absorption / 1000
            
            # Calculate per-tree statistics
            per_tree_annual = adjusted_absorption / (tree_count * time_period_years) if tree_count > 0 else 0
            
            return {
                "CO2_absorbed_kg": round(total_co2_absorption, 2),
                "CO2_absorbed_tonnes": round(total_co2_absorption / 1000, 3),
                "Carbon_Credits_Potential": round(carbon_credits, 3),
                "Base_Calculation": {
                    "tree_count": tree_count,
                    "co2_per_tree_kg_year": self.co2_per_tree_kg_year,
                    "time_period_years": time_period_years,
                    "base_absorption_kg": round(base_absorption, 2)
                },
                "Applied_Factors": {
                    "species": species,
                    "species_factor": species_factor,
                    "age_class": age_class,
                    "age_factor": age_factor,
                    "health_status": health_status,
                    "health_factor": health_factor,
                    "total_multiplier": round(species_factor * age_factor * health_factor, 3)
                },
                "Soil_Carbon": {
                    "included": include_soil_carbon,
                    "area_hectares": area_hectares,
                    "soil_co2_kg": round(soil_carbon, 2) if include_soil_carbon else 0
                },
                "Per_Tree_Statistics": {
                    "annual_co2_kg_per_tree": round(per_tree_annual, 2),
                    "lifetime_co2_kg_per_tree_20_years": round(per_tree_annual * 20, 2)
                },
                "Environmental_Impact": self._calculate_environmental_equivalents(total_co2_absorption)
            }
            
        except Exception as e:
            raise Exception(f"Error calculating CO₂ absorption: {str(e)}")
    
    def _calculate_environmental_equivalents(self, co2_kg):
        """Calculate environmental impact equivalents"""
        # Various equivalents for perspective
        return {
            "equivalent_car_miles": round(co2_kg / 0.404, 0),  # kg CO₂ per mile
            "equivalent_tree_seedlings_10_years": round(co2_kg / 60, 1),  # 60kg CO₂ per seedling over 10 years
            "equivalent_home_energy_days": round(co2_kg / 16, 1),  # 16kg CO₂ per day average home
            "equivalent_flights_domestic": round(co2_kg / 180, 2),  # 180kg CO₂ per domestic flight
            "gallons_gasoline_saved": round(co2_kg / 8.9, 1)  # 8.9kg CO₂ per gallon gasoline
        }
    
    def estimate_project_potential(self, project_area_hectares, trees_per_hectare=500, 
                                 project_duration_years=20, species='mixed'):
        """Estimate CO₂ absorption potential for entire project"""
        try:
            total_trees = project_area_hectares * trees_per_hectare
            
            # Project phases with different tree maturity
            phases = []
            trees_per_phase = total_trees // 4  # 4 phases
            
            # Phase 1: Seedlings (Years 0-2)
            phase1 = self.calculate_co2_absorption(
                trees_per_phase, species, 'seedling', 'good', 2, True, project_area_hectares/4
            )
            phases.append({"phase": "Establishment", "years": "0-2", **phase1})
            
            # Phase 2: Young trees (Years 2-5) 
            phase2 = self.calculate_co2_absorption(
                trees_per_phase, species, 'young', 'good', 3, True, project_area_hectares/4
            )
            phases.append({"phase": "Growth", "years": "2-5", **phase2})
            
            # Phase 3: Mature trees (Years 5-15)
            phase3 = self.calculate_co2_absorption(
                trees_per_phase, species, 'mature', 'good', 10, True, project_area_hectares/4
            )
            phases.append({"phase": "Maturity", "years": "5-15", **phase3})
            
            # Phase 4: Old growth (Years 15-20)
            phase4 = self.calculate_co2_absorption(
                trees_per_phase, species, 'old_growth', 'good', 5, True, project_area_hectares/4
            )
            phases.append({"phase": "Old Growth", "years": "15-20", **phase4})
            
            # Total project impact
            total_co2 = sum(phase['CO2_absorbed_kg'] for phase in phases)
            total_credits = total_co2 / 1000
            
            return {
                "Project_Summary": {
                    "area_hectares": project_area_hectares,
                    "total_trees": total_trees,
                    "trees_per_hectare": trees_per_hectare,
                    "project_duration_years": project_duration_years,
                    "species": species
                },
                "Total_Impact": {
                    "total_co2_kg": round(total_co2, 2),
                    "total_co2_tonnes": round(total_co2 / 1000, 2),
                    "total_carbon_credits": round(total_credits, 2),
                    "annual_average_co2_kg": round(total_co2 / project_duration_years, 2)
                },
                "Phase_Breakdown": phases,
                "Economic_Potential": {
                    "carbon_credits": round(total_credits, 2),
                    "estimated_revenue_usd_10_per_credit": round(total_credits * 10, 2),
                    "estimated_revenue_usd_25_per_credit": round(total_credits * 25, 2),
                    "estimated_revenue_usd_50_per_credit": round(total_credits * 50, 2)
                }
            }
            
        except Exception as e:
            raise Exception(f"Error estimating project potential: {str(e)}")

# Initialize the CO₂ estimator service
co2_service = CO2EstimatorService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "CO₂ Absorption Estimator API",
        "version": "1.0.0",
        "base_rate_kg_per_tree_per_year": co2_service.co2_per_tree_kg_year
    }), 200

@app.route('/co2', methods=['POST'])
def calculate_co2():
    """
    Main endpoint for CO₂ absorption calculation
    Accepts tree count and optional parameters for detailed estimation
    """
    try:
        data = request.get_json()
        
        # Validate required parameter
        if not data or 'Tree_Count' not in data:
            return jsonify({
                "error": "Missing required parameter",
                "message": "Tree_Count is required"
            }), 400
        
        tree_count = data['Tree_Count']
        
        # Validate tree count
        if not isinstance(tree_count, (int, float)) or tree_count < 0:
            return jsonify({
                "error": "Invalid tree count",
                "message": "Tree_Count must be a non-negative number"
            }), 400
        
        # Optional parameters with defaults
        species = data.get('species', 'mixed')
        age_class = data.get('age_class', 'mature')
        health_status = data.get('health_status', 'good')
        time_period_years = data.get('time_period_years', 1)
        include_soil_carbon = data.get('include_soil_carbon', False)
        area_hectares = data.get('area_hectares', None)
        
        # Calculate CO₂ absorption
        result = co2_service.calculate_co2_absorption(
            tree_count, species, age_class, health_status, 
            time_period_years, include_soil_carbon, area_hectares
        )
        
        # Add metadata
        result.update({
            "timestamp": datetime.now().isoformat(),
            "calculation_method": "Scientific_Mangrove_Model",
            "status": "success"
        })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "CO₂ calculation failed",
            "message": str(e),
            "status": "error"
        }), 500

@app.route('/co2/simple', methods=['POST'])
def simple_co2_calculation():
    """
    Simplified endpoint matching the specification exactly
    CO₂_absorbed_kg = Tree_Count × 12.3
    """
    try:
        data = request.get_json()
        
        if not data or 'Tree_Count' not in data:
            return jsonify({
                "error": "Tree_Count is required"
            }), 400
        
        tree_count = data['Tree_Count']
        
        if not isinstance(tree_count, (int, float)) or tree_count < 0:
            return jsonify({
                "error": "Invalid tree count"
            }), 400
        
        # Simple calculation as specified
        co2_absorbed_kg = tree_count * 12.3
        
        return jsonify({
            "CO2_absorbed_kg": round(co2_absorbed_kg, 2),
            "Tree_Count": tree_count,
            "Rate_kg_per_tree": 12.3,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "CO₂ calculation failed",
            "message": str(e)
        }), 500

@app.route('/co2/project', methods=['POST'])
def estimate_project():
    """
    Estimate CO₂ absorption for entire mangrove project
    """
    try:
        data = request.get_json()
        
        required_fields = ['project_area_hectares']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}"
                }), 400
        
        project_area = data['project_area_hectares']
        trees_per_hectare = data.get('trees_per_hectare', 500)
        project_duration = data.get('project_duration_years', 20)
        species = data.get('species', 'mixed')
        
        result = co2_service.estimate_project_potential(
            project_area, trees_per_hectare, project_duration, species
        )
        
        result.update({
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "Project estimation failed", 
            "message": str(e)
        }), 500

@app.route('/co2/factors', methods=['GET'])
def get_factors():
    """Get information about CO₂ calculation factors"""
    return jsonify({
        "base_rate": f"{co2_service.co2_per_tree_kg_year} kg CO₂ per tree per year",
        "species_factors": co2_service.species_factors,
        "age_factors": co2_service.age_factors,
        "health_factors": co2_service.health_factors,
        "notes": {
            "soil_carbon": "Mangrove soils sequester 2-5 tonnes C/hectare/year",
            "carbon_credits": "1 carbon credit = 1 tonne CO₂",
            "methodology": "Based on scientific studies of mangrove carbon sequestration"
        }
    }), 200

if __name__ == '__main__':
    print("Starting EcoLedger CO₂ Absorption API...")
    print(f"Base rate: {co2_service.co2_per_tree_kg_year} kg CO₂ per tree per year")
    app.run(host='0.0.0.0', port=5004, debug=True)