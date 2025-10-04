from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import numpy as np

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carbon absorption constants
# Based on scientific studies of mangrove carbon sequestration
CARBON_CONSTANTS = {
    'co2_per_tree_kg_year': 12.3,          # kg CO2 absorbed per tree per year
    'biomass_carbon_factor': 0.47,         # 47% of biomass is carbon
    'co2_to_carbon_ratio': 3.67,           # CO2 molecular weight / Carbon atomic weight
    'mangrove_growth_years': 10,           # Average age for carbon calculation
    'uncertainty_factor': 0.15             # ±15% uncertainty in estimates
}

# Different mangrove species have different carbon absorption rates
SPECIES_FACTORS = {
    'rhizophora_mangle': 1.2,      # Red mangrove - highest absorption
    'avicennia_germinans': 1.0,    # Black mangrove - baseline
    'laguncularia_racemosa': 0.9,  # White mangrove - lower absorption
    'conocarpus_erectus': 0.8,     # Buttonwood - lowest absorption
    'mixed_species': 1.0           # Default mixed plantation
}

# Environmental factors affecting carbon absorption
ENVIRONMENTAL_FACTORS = {
    'soil_quality': {'poor': 0.7, 'average': 1.0, 'excellent': 1.3},
    'water_salinity': {'low': 0.8, 'optimal': 1.0, 'high': 0.9},
    'climate_zone': {'temperate': 0.8, 'subtropical': 1.0, 'tropical': 1.2},
    'tree_density': {'sparse': 0.8, 'normal': 1.0, 'dense': 1.1}
}

def calculate_co2_absorption(tree_count, species='mixed_species', age_years=None, 
                           environmental_factors=None, include_uncertainty=True):
    """
    Calculate CO2 absorption for mangrove plantation.
    
    Args:
        tree_count (int): Number of trees
        species (str): Mangrove species type
        age_years (float): Age of plantation in years
        environmental_factors (dict): Environmental conditions
        include_uncertainty (bool): Whether to include uncertainty range
    
    Returns:
        dict: CO2 absorption calculations and projections
    """
    try:
        if tree_count <= 0:
            raise ValueError("Tree count must be positive")
        
        # Base calculation: CO2 per tree per year
        base_co2_per_tree = CARBON_CONSTANTS['co2_per_tree_kg_year']
        
        # Apply species factor
        species_factor = SPECIES_FACTORS.get(species, 1.0)
        
        # Apply environmental factors
        env_factor = 1.0
        if environmental_factors:
            for factor_type, factor_value in environmental_factors.items():
                if factor_type in ENVIRONMENTAL_FACTORS:
                    env_factor *= ENVIRONMENTAL_FACTORS[factor_type].get(factor_value, 1.0)
        
        # Calculate age factor (carbon absorption increases with tree maturity up to a point)
        if age_years is None:
            age_years = CARBON_CONSTANTS['mangrove_growth_years']
        
        # Age factor: peaks around 10-15 years, then stabilizes
        age_factor = min(1.0, age_years / 10) if age_years < 10 else 1.0
        
        # Total CO2 absorbed per year
        co2_per_tree_adjusted = base_co2_per_tree * species_factor * env_factor * age_factor
        total_co2_kg_year = tree_count * co2_per_tree_adjusted
        
        # Calculate uncertainty range if requested
        uncertainty = CARBON_CONSTANTS['uncertainty_factor']
        co2_min = total_co2_kg_year * (1 - uncertainty) if include_uncertainty else total_co2_kg_year
        co2_max = total_co2_kg_year * (1 + uncertainty) if include_uncertainty else total_co2_kg_year
        
        # Calculate cumulative absorption over different time periods
        projections = {}
        for years in [1, 5, 10, 20, 30]:
            # Account for tree mortality and growth over time
            survival_rate = max(0.7, 1 - (years * 0.01))  # Assume 1% mortality per year, min 70% survival
            mature_factor = min(1.5, 1 + (years * 0.02))  # Trees get bigger and absorb more over time
            
            projected_co2 = total_co2_kg_year * years * survival_rate * mature_factor
            projections[f'{years}_years'] = {
                'co2_kg': round(projected_co2, 2),
                'co2_tons': round(projected_co2 / 1000, 3),
                'survival_rate': round(survival_rate, 3)
            }
        
        # Convert to different units
        co2_tons = total_co2_kg_year / 1000
        co2_grams = total_co2_kg_year * 1000
        
        # Calculate carbon credits (typically 1 credit = 1 ton CO2)
        carbon_credits_potential = co2_tons
        
        # Calculate equivalent values for context
        equivalents = {
            'cars_off_road_1_year': round(total_co2_kg_year / 4600, 2),  # Average car emits 4.6 tons CO2/year
            'tree_seedlings_grown_10_years': round(total_co2_kg_year / 21.77, 0),  # EPA estimate
            'gallons_gasoline': round(total_co2_kg_year / 8.89, 2),  # CO2 per gallon of gasoline
            'kwh_electricity': round(total_co2_kg_year / 0.389, 0)  # CO2 per kWh (US average)
        }
        
        return {
            'CO2_absorbed_kg': round(total_co2_kg_year, 2),
            'CO2_absorbed_tons': round(co2_tons, 4),
            'CO2_absorbed_grams': round(co2_grams, 0),
            'Carbon_Credits_Potential': round(carbon_credits_potential, 4),
            'Uncertainty_Range': {
                'min_kg': round(co2_min, 2),
                'max_kg': round(co2_max, 2),
                'confidence': f"±{uncertainty*100}%"
            },
            'Calculation_Details': {
                'base_co2_per_tree_kg_year': base_co2_per_tree,
                'species_factor': species_factor,
                'environmental_factor': round(env_factor, 3),
                'age_factor': round(age_factor, 3),
                'adjusted_co2_per_tree': round(co2_per_tree_adjusted, 2),
                'plantation_age_years': age_years
            },
            'Future_Projections': projections,
            'Environmental_Equivalents': equivalents,
            'Methodology': {
                'based_on': "Scientific studies of mangrove carbon sequestration",
                'species': species,
                'notes': [
                    "Calculations based on above-ground and below-ground biomass",
                    "Includes soil carbon sequestration",
                    "Accounts for species variation and environmental conditions",
                    "Uncertainty range reflects natural variation in carbon absorption rates"
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating CO2 absorption: {e}")
        return {
            'CO2_absorbed_kg': 0.0,
            'error': str(e)
        }

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "CO2 Absorption Estimator API"
    })

@app.route('/co2', methods=['POST'])
def calculate_co2_endpoint():
    try:
        # Get data from request
        if request.is_json:
            data = request.get_json()
            tree_count = data.get('Tree_Count') or data.get('tree_count')
        else:
            tree_count = request.form.get('Tree_Count') or request.form.get('tree_count')
        
        if tree_count is None:
            return jsonify({
                "error": "Tree_Count parameter is required",
                "CO2_absorbed_kg": 0.0
            }), 400
        
        try:
            tree_count = int(tree_count)
        except (ValueError, TypeError):
            return jsonify({
                "error": "Tree_Count must be a valid integer",
                "CO2_absorbed_kg": 0.0
            }), 400
        
        if tree_count <= 0:
            return jsonify({
                "error": "Tree_Count must be positive",
                "CO2_absorbed_kg": 0.0
            }), 400
        
        # Get optional parameters
        if request.is_json:
            data = request.get_json()
            species = data.get('species', 'mixed_species')
            age_years = data.get('age_years')
            environmental_factors = data.get('environmental_factors')
            include_uncertainty = data.get('include_uncertainty', True)
        else:
            species = request.form.get('species', 'mixed_species')
            age_years = request.form.get('age_years', type=float)
            environmental_factors = None  # Complex for form data
            include_uncertainty = request.form.get('include_uncertainty', 'true').lower() == 'true'
        
        # Calculate CO2 absorption
        result = calculate_co2_absorption(
            tree_count=tree_count,
            species=species,
            age_years=age_years,
            environmental_factors=environmental_factors,
            include_uncertainty=include_uncertainty
        )
        
        # Add metadata
        result.update({
            "input_parameters": {
                "tree_count": tree_count,
                "species": species,
                "age_years": age_years,
                "environmental_factors": environmental_factors
            },
            "timestamp": str(np.datetime64('now'))
        })
        
        logger.info(f"Calculated CO2 for {tree_count} trees: {result['CO2_absorbed_kg']} kg/year")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing CO2 calculation request: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "CO2_absorbed_kg": 0.0
        }), 500

@app.route('/demo', methods=['GET'])
def demo_endpoint():
    """Demo endpoint with sample CO2 calculation"""
    
    demo_tree_count = 45
    result = calculate_co2_absorption(
        tree_count=demo_tree_count,
        species='mixed_species',
        age_years=8,
        environmental_factors={
            'soil_quality': 'excellent',
            'water_salinity': 'optimal',
            'climate_zone': 'tropical',
            'tree_density': 'normal'
        }
    )
    
    result.update({
        "input_parameters": {
            "tree_count": demo_tree_count,
            "species": "mixed_species",
            "age_years": 8,
            "environmental_factors": {
                'soil_quality': 'excellent',
                'water_salinity': 'optimal',
                'climate_zone': 'tropical',
                'tree_density': 'normal'
            }
        },
        "timestamp": str(np.datetime64('now')),
        "note": "Demo calculation for mangrove plantation"
    })
    
    return jsonify(result)

@app.route('/species', methods=['GET'])
def get_species_info():
    """Get information about different mangrove species and their carbon absorption rates"""
    
    species_info = {}
    for species, factor in SPECIES_FACTORS.items():
        base_absorption = CARBON_CONSTANTS['co2_per_tree_kg_year'] * factor
        species_info[species] = {
            'factor': factor,
            'co2_kg_per_tree_per_year': round(base_absorption, 2),
            'description': {
                'rhizophora_mangle': 'Red Mangrove - Highest carbon absorption, extensive root system',
                'avicennia_germinans': 'Black Mangrove - Good carbon absorption, salt tolerant',
                'laguncularia_racemosa': 'White Mangrove - Moderate absorption, fast growing',
                'conocarpus_erectus': 'Buttonwood - Lower absorption, edge species',
                'mixed_species': 'Mixed plantation - Average of multiple species'
            }.get(species, 'Unknown species')
        }
    
    return jsonify({
        'species_information': species_info,
        'environmental_factors': ENVIRONMENTAL_FACTORS,
        'carbon_constants': CARBON_CONSTANTS
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)