from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import numpy as np
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Scoring weights as specified in requirements
SCORING_WEIGHTS = {
    'ai_tree_score': 0.4,      # 40% - Tree count accuracy
    'ndvi_score': 0.3,         # 30% - Vegetation health
    'iot_score': 0.2,          # 20% - Environmental conditions
    'audit_check': 0.1         # 10% - Manual audit verification
}

# Risk factors and adjustments
RISK_FACTORS = {
    'climate_risk': {'low': 1.0, 'medium': 0.9, 'high': 0.8},
    'political_stability': {'stable': 1.0, 'moderate': 0.95, 'unstable': 0.85},
    'project_management': {'excellent': 1.1, 'good': 1.0, 'poor': 0.9},
    'community_engagement': {'high': 1.05, 'medium': 1.0, 'low': 0.95}
}

# Carbon credit market rates (example values)
MARKET_RATES = {
    'voluntary_market': {'price_per_ton': 15.50, 'currency': 'USD'},
    'compliance_market': {'price_per_ton': 25.00, 'currency': 'USD'},
    'premium_rate': {'price_per_ton': 35.00, 'currency': 'USD'}  # For high-quality projects
}

def calculate_ai_tree_score(tree_count_detected, tree_count_claimed):
    """
    Calculate AI Tree Score = Trees_detected / Trees_claimed
    """
    if tree_count_claimed <= 0:
        return 0.0
    
    ratio = tree_count_detected / tree_count_claimed
    # Cap the score at 1.0 (can't score higher than 100% accuracy)
    return min(1.0, ratio)

def calculate_final_score(ai_tree_score, ndvi_score, iot_score, audit_check, 
                         risk_factors=None, apply_bonus=True):
    """
    Calculate the weighted final score using the specified formula:
    Final_Score = 0.4×AI_Tree_Score + 0.3×NDVI_Score + 0.2×IoT_Score + 0.1×Audit_Check
    """
    # Ensure all scores are between 0 and 1
    ai_tree_score = max(0, min(1, ai_tree_score))
    ndvi_score = max(0, min(1, ndvi_score))
    iot_score = max(0, min(1, iot_score))
    audit_check = max(0, min(1, audit_check))
    
    # Calculate weighted score
    weighted_score = (
        SCORING_WEIGHTS['ai_tree_score'] * ai_tree_score +
        SCORING_WEIGHTS['ndvi_score'] * ndvi_score +
        SCORING_WEIGHTS['iot_score'] * iot_score +
        SCORING_WEIGHTS['audit_check'] * audit_check
    )
    
    # Apply risk factor adjustments
    risk_adjustment = 1.0
    if risk_factors:
        for risk_type, risk_level in risk_factors.items():
            if risk_type in RISK_FACTORS:
                risk_adjustment *= RISK_FACTORS[risk_type].get(risk_level, 1.0)
    
    # Apply bonus for exceptional performance
    bonus_factor = 1.0
    if apply_bonus:
        # Bonus for consistently high scores across all metrics
        if all(score >= 0.8 for score in [ai_tree_score, ndvi_score, iot_score, audit_check]):
            bonus_factor = 1.05  # 5% bonus for excellence
        elif all(score >= 0.9 for score in [ai_tree_score, ndvi_score, iot_score]):
            bonus_factor = 1.1   # 10% bonus for exceptional AI/environmental performance
    
    final_score = weighted_score * risk_adjustment * bonus_factor
    
    # Ensure final score doesn't exceed 1.0
    final_score = min(1.0, final_score)
    
    return final_score, risk_adjustment, bonus_factor

def calculate_carbon_credits(co2_absorbed_kg, final_score, market_type='voluntary_market'):
    """
    Calculate carbon credits: (CO2_absorbed / 1000) × Final_Score
    """
    co2_tons = co2_absorbed_kg / 1000
    carbon_credits = co2_tons * final_score
    
    # Calculate market value
    market_rate = MARKET_RATES.get(market_type, MARKET_RATES['voluntary_market'])
    market_value = carbon_credits * market_rate['price_per_ton']
    
    return {
        'carbon_credits': carbon_credits,
        'co2_tons': co2_tons,
        'market_value': market_value,
        'currency': market_rate['currency'],
        'price_per_ton': market_rate['price_per_ton'],
        'market_type': market_type
    }

def get_quality_grade(final_score):
    """Assign quality grade based on final score"""
    if final_score >= 0.9:
        return 'A+', 'Premium Quality'
    elif final_score >= 0.8:
        return 'A', 'High Quality'
    elif final_score >= 0.7:
        return 'B+', 'Good Quality'
    elif final_score >= 0.6:
        return 'B', 'Satisfactory'
    elif final_score >= 0.5:
        return 'C', 'Marginal'
    else:
        return 'D', 'Below Standard'

def generate_recommendations(scores_breakdown, final_score):
    """Generate recommendations for improving the project score"""
    recommendations = []
    
    ai_tree_score = scores_breakdown['ai_tree_score']
    ndvi_score = scores_breakdown['ndvi_score']
    iot_score = scores_breakdown['iot_score']
    audit_check = scores_breakdown['audit_check']
    
    # Check each component and provide specific recommendations
    if ai_tree_score < 0.7:
        recommendations.append({
            'category': 'Tree Detection',
            'priority': 'High',
            'issue': f'AI tree detection accuracy is {ai_tree_score:.1%}',
            'recommendation': 'Review planting claims vs. actual plantation. Consider replanting or adjusting claimed tree counts.'
        })
    
    if ndvi_score < 0.6:
        recommendations.append({
            'category': 'Vegetation Health',
            'priority': 'High',
            'issue': f'NDVI vegetation health score is {ndvi_score:.1%}',
            'recommendation': 'Improve vegetation health through better irrigation, fertilization, or pest management.'
        })
    
    if iot_score < 0.6:
        recommendations.append({
            'category': 'Environmental Conditions',
            'priority': 'Medium',
            'issue': f'IoT environmental score is {iot_score:.1%}',
            'recommendation': 'Optimize soil conditions, salinity levels, and water management based on IoT sensor data.'
        })
    
    if audit_check < 0.7:
        recommendations.append({
            'category': 'Documentation & Compliance',
            'priority': 'Medium',
            'issue': f'Audit verification score is {audit_check:.1%}',
            'recommendation': 'Improve project documentation, monitoring protocols, and compliance with standards.'
        })
    
    # Overall recommendations
    if final_score < 0.6:
        recommendations.append({
            'category': 'Overall Project',
            'priority': 'Critical',
            'issue': f'Overall project score is {final_score:.1%}',
            'recommendation': 'Comprehensive project review needed. Focus on highest-impact improvements first.'
        })
    elif final_score < 0.8:
        recommendations.append({
            'category': 'Overall Project',
            'priority': 'Low',
            'issue': f'Good project score of {final_score:.1%}',
            'recommendation': 'Focus on incremental improvements to reach premium grade (90%+).'
        })
    
    if not recommendations:
        recommendations.append({
            'category': 'Overall Project',
            'priority': 'Low',
            'issue': 'Excellent project performance',
            'recommendation': 'Maintain current standards and continue monitoring for consistency.'
        })
    
    return recommendations

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Final Score & Carbon Credits API"
    })

@app.route('/finalscore', methods=['POST'])
def calculate_final_score_endpoint():
    try:
        # Get data from request
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
            # Convert string values to appropriate types
            for key in ['Tree_Count', 'Claimed_Trees', 'CO2_absorbed_kg']:
                if key in data:
                    data[key] = float(data[key])
            for key in ['NDVI_Score', 'IoT_Score', 'Audit_Check']:
                if key in data:
                    data[key] = float(data[key])
        
        # Required parameters
        required_fields = ['Tree_Count', 'Claimed_Trees', 'NDVI_Score', 'IoT_Score']
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "Final_Score": 0.0,
                "Carbon_Credits": 0.0
            }), 400
        
        # Extract parameters
        tree_count = data['Tree_Count']
        claimed_trees = data['Claimed_Trees']
        ndvi_score = data['NDVI_Score']
        iot_score = data['IoT_Score']
        audit_check = data.get('Audit_Check', 0.8)  # Default audit score
        co2_absorbed_kg = data.get('CO2_absorbed_kg')
        risk_factors = data.get('risk_factors')
        market_type = data.get('market_type', 'voluntary_market')
        
        # Validate parameters
        if claimed_trees <= 0:
            return jsonify({
                "error": "Claimed_Trees must be positive",
                "Final_Score": 0.0,
                "Carbon_Credits": 0.0
            }), 400
        
        # Calculate AI Tree Score
        ai_tree_score = calculate_ai_tree_score(tree_count, claimed_trees)
        
        # Calculate Final Score
        final_score, risk_adjustment, bonus_factor = calculate_final_score(
            ai_tree_score, ndvi_score, iot_score, audit_check, risk_factors
        )
        
        # If CO2 data not provided, calculate it using the tree count
        if co2_absorbed_kg is None:
            # Use the standard 12.3 kg per tree per year
            co2_absorbed_kg = tree_count * 12.3
        
        # Calculate Carbon Credits
        credits_info = calculate_carbon_credits(co2_absorbed_kg, final_score, market_type)
        
        # Get quality grade
        grade, grade_description = get_quality_grade(final_score)
        
        # Score breakdown for transparency
        scores_breakdown = {
            'ai_tree_score': round(ai_tree_score, 4),
            'ndvi_score': round(ndvi_score, 4),
            'iot_score': round(iot_score, 4),
            'audit_check': round(audit_check, 4)
        }
        
        # Weighted contributions
        weighted_contributions = {
            'ai_tree_contribution': round(ai_tree_score * SCORING_WEIGHTS['ai_tree_score'], 4),
            'ndvi_contribution': round(ndvi_score * SCORING_WEIGHTS['ndvi_score'], 4),
            'iot_contribution': round(iot_score * SCORING_WEIGHTS['iot_score'], 4),
            'audit_contribution': round(audit_check * SCORING_WEIGHTS['audit_check'], 4)
        }
        
        # Generate recommendations
        recommendations = generate_recommendations(scores_breakdown, final_score)
        
        # Prepare response
        result = {
            'Final_Score': round(final_score, 4),
            'Grade': grade,
            'Grade_Description': grade_description,
            'Carbon_Credits': round(credits_info['carbon_credits'], 4),
            'CO2_absorbed_kg': co2_absorbed_kg,
            'CO2_absorbed_tons': round(credits_info['co2_tons'], 4),
            'Market_Value': round(credits_info['market_value'], 2),
            'Currency': credits_info['currency'],
            'Scores_Breakdown': scores_breakdown,
            'Weighted_Contributions': weighted_contributions,
            'Calculation_Details': {
                'weights': SCORING_WEIGHTS,
                'risk_adjustment': round(risk_adjustment, 4),
                'bonus_factor': round(bonus_factor, 4),
                'base_score_before_adjustments': round(final_score / (risk_adjustment * bonus_factor), 4)
            },
            'Input_Parameters': {
                'tree_count_detected': tree_count,
                'tree_count_claimed': claimed_trees,
                'detection_accuracy': f"{ai_tree_score:.1%}",
                'ndvi_score': ndvi_score,
                'iot_score': iot_score,
                'audit_check': audit_check,
                'risk_factors': risk_factors,
                'market_type': market_type
            },
            'Market_Information': {
                'market_type': market_type,
                'price_per_ton': credits_info['price_per_ton'],
                'total_credits': round(credits_info['carbon_credits'], 4),
                'revenue_potential': round(credits_info['market_value'], 2)
            },
            'Recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Calculated final score: {final_score:.3f} for {tree_count}/{claimed_trees} trees")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error calculating final score: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "Final_Score": 0.0,
            "Carbon_Credits": 0.0
        }), 500

@app.route('/demo', methods=['GET'])
def demo_endpoint():
    """Demo endpoint with sample final score calculation"""
    
    # Sample data for demonstration
    demo_data = {
        'Tree_Count': 45,
        'Claimed_Trees': 50,
        'NDVI_Score': 0.742,
        'IoT_Score': 0.658,
        'Audit_Check': 0.85,
        'CO2_absorbed_kg': 553.5,  # 45 trees × 12.3 kg
        'risk_factors': {
            'climate_risk': 'low',
            'political_stability': 'stable',
            'project_management': 'good',
            'community_engagement': 'high'
        },
        'market_type': 'voluntary_market'
    }
    
    # Calculate using the same logic as the main endpoint
    ai_tree_score = calculate_ai_tree_score(demo_data['Tree_Count'], demo_data['Claimed_Trees'])
    final_score, risk_adjustment, bonus_factor = calculate_final_score(
        ai_tree_score, demo_data['NDVI_Score'], demo_data['IoT_Score'], 
        demo_data['Audit_Check'], demo_data['risk_factors']
    )
    
    credits_info = calculate_carbon_credits(
        demo_data['CO2_absorbed_kg'], final_score, demo_data['market_type']
    )
    
    grade, grade_description = get_quality_grade(final_score)
    
    scores_breakdown = {
        'ai_tree_score': round(ai_tree_score, 4),
        'ndvi_score': round(demo_data['NDVI_Score'], 4),
        'iot_score': round(demo_data['IoT_Score'], 4),
        'audit_check': round(demo_data['Audit_Check'], 4)
    }
    
    result = {
        'Final_Score': round(final_score, 4),
        'Grade': grade,
        'Grade_Description': grade_description,
        'Carbon_Credits': round(credits_info['carbon_credits'], 4),
        'CO2_absorbed_kg': demo_data['CO2_absorbed_kg'],
        'CO2_absorbed_tons': round(credits_info['co2_tons'], 4),
        'Market_Value': round(credits_info['market_value'], 2),
        'Currency': credits_info['currency'],
        'Scores_Breakdown': scores_breakdown,
        'Demo_Note': 'This is a demonstration calculation using sample data',
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(result)

@app.route('/weights', methods=['GET'])
def get_scoring_weights():
    """Get the scoring weights and methodology"""
    return jsonify({
        'scoring_weights': SCORING_WEIGHTS,
        'formula': 'Final_Score = 0.4×AI_Tree_Score + 0.3×NDVI_Score + 0.2×IoT_Score + 0.1×Audit_Check',
        'risk_factors': RISK_FACTORS,
        'market_rates': MARKET_RATES,
        'grading_scale': {
            'A+ (0.9+)': 'Premium Quality',
            'A (0.8-0.89)': 'High Quality',
            'B+ (0.7-0.79)': 'Good Quality',
            'B (0.6-0.69)': 'Satisfactory',
            'C (0.5-0.59)': 'Marginal',
            'D (<0.5)': 'Below Standard'
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)