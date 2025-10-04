"""
EcoLedger - Final Score & Carbon Credits API
Combines all verification metrics to calculate final verification score and carbon credits
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

class FinalScoreService:
    def __init__(self):
        # Scoring weights as specified
        self.weights = {
            'ai_tree_score': 0.4,      # 40% - Tree detection accuracy
            'ndvi_score': 0.3,         # 30% - Vegetation health
            'iot_score': 0.2,          # 20% - Environmental conditions
            'audit_check': 0.1         # 10% - Manual audit verification
        }
        
        # Minimum thresholds for carbon credit issuance
        self.min_thresholds = {
            'final_score': 0.6,        # Minimum 60% overall score
            'ai_tree_score': 0.5,      # Minimum 50% tree detection accuracy
            'ndvi_score': 0.4,         # Minimum 40% vegetation health
            'iot_score': 0.3           # Minimum 30% environmental conditions
        }
        
        # Carbon credit conversion rate (kg CO₂ per tree)
        self.co2_per_tree = 12.3
    
    def calculate_final_score(self, tree_count, claimed_trees, ndvi_score, 
                            iot_score, audit_check, additional_metrics=None):
        """
        Calculate final verification score and carbon credits
        According to the specification:
        - AI_Tree_Score = Tree_Count / Claimed_Trees
        - Final_Score = 0.4×AI_Tree_Score + 0.3×NDVI_Score + 0.2×IoT_Score + 0.1×Audit_Check
        - Carbon_Credits = (CO2_absorbed / 1000) × Final_Score
        """
        try:
            # Input validation
            if claimed_trees <= 0:
                raise ValueError("Claimed_Trees must be greater than 0")
            
            # Calculate AI Tree Score
            ai_tree_score = min(1.0, tree_count / claimed_trees)  # Cap at 1.0 (100%)
            
            # Validate score ranges (0-1)
            scores = {
                'ai_tree_score': ai_tree_score,
                'ndvi_score': max(0, min(1, ndvi_score)),
                'iot_score': max(0, min(1, iot_score)),
                'audit_check': max(0, min(1, audit_check))
            }
            
            # Calculate weighted final score
            final_score = (
                self.weights['ai_tree_score'] * scores['ai_tree_score'] +
                self.weights['ndvi_score'] * scores['ndvi_score'] +
                self.weights['iot_score'] * scores['iot_score'] +
                self.weights['audit_check'] * scores['audit_check']
            )
            
            # Calculate CO₂ absorption
            co2_absorbed_kg = tree_count * self.co2_per_tree
            co2_absorbed_tonnes = co2_absorbed_kg / 1000
            
            # Calculate carbon credits (with final score adjustment)
            carbon_credits = co2_absorbed_tonnes * final_score
            
            # Determine verification status
            verification_status = self._determine_verification_status(scores, final_score)
            
            # Generate compliance report
            compliance = self._check_compliance(scores, final_score)
            
            # Risk assessment
            risk_factors = self._assess_risks(scores, tree_count, claimed_trees)
            
            # Additional calculations
            calculations = self._additional_calculations(
                tree_count, claimed_trees, final_score, carbon_credits
            )
            
            # Process additional metrics if provided
            enhanced_metrics = {}
            if additional_metrics:
                enhanced_metrics = self._process_additional_metrics(additional_metrics)
            
            return {
                "Final_Score": round(final_score, 4),
                "Carbon_Credits": round(carbon_credits, 4),
                "CO2_absorbed_kg": round(co2_absorbed_kg, 2),
                "CO2_absorbed_tonnes": round(co2_absorbed_tonnes, 4),
                "Individual_Scores": {
                    "AI_Tree_Score": round(scores['ai_tree_score'], 4),
                    "NDVI_Score": round(scores['ndvi_score'], 4),
                    "IoT_Score": round(scores['iot_score'], 4),
                    "Audit_Check": round(scores['audit_check'], 4)
                },
                "Score_Weights": self.weights,
                "Input_Data": {
                    "Tree_Count": tree_count,
                    "Claimed_Trees": claimed_trees,
                    "Tree_Detection_Accuracy": round((tree_count / claimed_trees) * 100, 2)
                },
                "Verification_Status": verification_status,
                "Compliance_Check": compliance,
                "Risk_Assessment": risk_factors,
                "Additional_Calculations": calculations,
                "Enhanced_Metrics": enhanced_metrics,
                "Report_ID": str(uuid.uuid4()),
                "Timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Error calculating final score: {str(e)}")
    
    def _determine_verification_status(self, scores, final_score):
        """Determine overall verification status"""
        if final_score >= 0.9:
            status = "Excellent"
            level = "AAA"
        elif final_score >= 0.8:
            status = "Very Good"
            level = "AA"
        elif final_score >= 0.7:
            status = "Good"
            level = "A"
        elif final_score >= 0.6:
            status = "Acceptable"
            level = "B"
        elif final_score >= 0.5:
            status = "Marginal"
            level = "C"
        else:
            status = "Insufficient"
            level = "F"
        
        # Check if meets minimum thresholds for carbon credit issuance
        credits_eligible = all([
            final_score >= self.min_thresholds['final_score'],
            scores['ai_tree_score'] >= self.min_thresholds['ai_tree_score'],
            scores['ndvi_score'] >= self.min_thresholds['ndvi_score'],
            scores['iot_score'] >= self.min_thresholds['iot_score']
        ])
        
        return {
            "status": status,
            "level": level,
            "credits_eligible": credits_eligible,
            "confidence": final_score,
            "quality_grade": self._get_quality_grade(final_score)
        }
    
    def _check_compliance(self, scores, final_score):
        """Check compliance with verification thresholds"""
        issues = []
        warnings = []
        
        # Check minimum thresholds
        if final_score < self.min_thresholds['final_score']:
            issues.append(f"Final score {final_score:.3f} below minimum threshold {self.min_thresholds['final_score']}")
        
        if scores['ai_tree_score'] < self.min_thresholds['ai_tree_score']:
            issues.append(f"Tree detection accuracy below minimum threshold")
        
        if scores['ndvi_score'] < self.min_thresholds['ndvi_score']:
            issues.append(f"Vegetation health below minimum threshold")
        
        if scores['iot_score'] < self.min_thresholds['iot_score']:
            issues.append(f"Environmental conditions below minimum threshold")
        
        # Generate warnings
        if scores['ai_tree_score'] < 0.7:
            warnings.append("Tree count significantly differs from claimed count")
        
        if scores['ndvi_score'] < 0.6:
            warnings.append("Vegetation health indicators show stress")
        
        if scores['iot_score'] < 0.5:
            warnings.append("Environmental conditions are suboptimal")
        
        return {
            "compliant": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "recommendations": self._generate_recommendations(scores)
        }
    
    def _assess_risks(self, scores, tree_count, claimed_trees):
        """Assess risks in the verification"""
        risks = []
        risk_level = "Low"
        
        # Tree count discrepancy risk
        tree_accuracy = tree_count / claimed_trees if claimed_trees > 0 else 0
        if tree_accuracy < 0.6:
            risks.append({
                "type": "High Tree Count Discrepancy",
                "severity": "High",
                "description": f"Detected trees ({tree_count}) significantly below claimed ({claimed_trees})"
            })
            risk_level = "High"
        elif tree_accuracy < 0.8:
            risks.append({
                "type": "Moderate Tree Count Discrepancy", 
                "severity": "Medium",
                "description": f"Detected trees moderately below claimed count"
            })
            if risk_level != "High":
                risk_level = "Medium"
        
        # Vegetation health risk
        if scores['ndvi_score'] < 0.4:
            risks.append({
                "type": "Poor Vegetation Health",
                "severity": "High", 
                "description": "NDVI indicates stressed or unhealthy vegetation"
            })
            risk_level = "High"
        
        # Environmental risk
        if scores['iot_score'] < 0.3:
            risks.append({
                "type": "Adverse Environmental Conditions",
                "severity": "Medium",
                "description": "IoT sensors indicate suboptimal growing conditions"
            })
            if risk_level == "Low":
                risk_level = "Medium"
        
        return {
            "overall_risk_level": risk_level,
            "risks": risks,
            "risk_score": 1 - min(scores.values()),  # Inverse of lowest score
            "mitigation_required": len(risks) > 0
        }
    
    def _additional_calculations(self, tree_count, claimed_trees, final_score, carbon_credits):
        """Additional useful calculations"""
        return {
            "verification_efficiency": round(final_score * 100, 2),
            "tree_detection_rate": round((tree_count / claimed_trees) * 100, 2),
            "carbon_credit_yield": round(carbon_credits / tree_count if tree_count > 0 else 0, 4),
            "potential_max_credits": round((claimed_trees * self.co2_per_tree) / 1000, 4),
            "credit_realization_rate": round((carbon_credits / ((claimed_trees * self.co2_per_tree) / 1000)) * 100 if claimed_trees > 0 else 0, 2),
            "co2_per_credit": round(1000 / self.co2_per_tree, 2) if carbon_credits > 0 else 0
        }
    
    def _process_additional_metrics(self, additional_metrics):
        """Process any additional verification metrics"""
        enhanced = {}
        
        # Biodiversity metrics
        if 'biodiversity_index' in additional_metrics:
            enhanced['biodiversity_score'] = min(1.0, additional_metrics['biodiversity_index'] / 100)
        
        # Soil quality metrics
        if 'soil_quality' in additional_metrics:
            enhanced['soil_quality_score'] = additional_metrics['soil_quality']
        
        # Water quality metrics
        if 'water_quality' in additional_metrics:
            enhanced['water_quality_score'] = additional_metrics['water_quality']
        
        # Social impact metrics
        if 'community_impact' in additional_metrics:
            enhanced['social_impact_score'] = additional_metrics['community_impact']
        
        return enhanced
    
    def _get_quality_grade(self, score):
        """Get quality grade based on score"""
        if score >= 0.95:
            return "Premium"
        elif score >= 0.85:
            return "High Quality"
        elif score >= 0.75:
            return "Standard"
        elif score >= 0.60:
            return "Basic"
        else:
            return "Below Standard"
    
    def _generate_recommendations(self, scores):
        """Generate improvement recommendations"""
        recommendations = []
        
        if scores['ai_tree_score'] < 0.8:
            recommendations.append("Improve tree planting density or survival rates")
        
        if scores['ndvi_score'] < 0.6:
            recommendations.append("Enhance vegetation health monitoring and care")
        
        if scores['iot_score'] < 0.5:
            recommendations.append("Optimize environmental conditions (soil, water, nutrients)")
        
        if scores['audit_check'] < 0.8:
            recommendations.append("Strengthen manual verification and documentation processes")
        
        return recommendations

# Initialize the final score service
score_service = FinalScoreService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Final Score & Carbon Credits API",
        "version": "1.0.0",
        "weights": score_service.weights,
        "min_thresholds": score_service.min_thresholds
    }), 200

@app.route('/finalscore', methods=['POST'])
def calculate_final_score():
    """
    Main endpoint for final score calculation
    Calculates final verification score and carbon credits based on all metrics
    """
    try:
        data = request.get_json()
        
        # Validate required parameters
        required_params = ['Tree_Count', 'Claimed_Trees', 'NDVI_Score', 'IoT_Score', 'Audit_Check']
        for param in required_params:
            if param not in data:
                return jsonify({
                    "error": f"Missing required parameter: {param}",
                    "required_parameters": required_params
                }), 400
        
        # Extract and validate parameters
        tree_count = data['Tree_Count']
        claimed_trees = data['Claimed_Trees']
        ndvi_score = data['NDVI_Score']
        iot_score = data['IoT_Score']
        audit_check = data['Audit_Check']
        
        # Type and range validation
        if not isinstance(tree_count, (int, float)) or tree_count < 0:
            return jsonify({"error": "Tree_Count must be a non-negative number"}), 400
        
        if not isinstance(claimed_trees, (int, float)) or claimed_trees <= 0:
            return jsonify({"error": "Claimed_Trees must be a positive number"}), 400
        
        for score_name, score_value in [('NDVI_Score', ndvi_score), ('IoT_Score', iot_score), ('Audit_Check', audit_check)]:
            if not isinstance(score_value, (int, float)) or not 0 <= score_value <= 1:
                return jsonify({"error": f"{score_name} must be between 0 and 1"}), 400
        
        # Optional additional metrics
        additional_metrics = data.get('additional_metrics', {})
        
        # Calculate final score
        result = score_service.calculate_final_score(
            tree_count, claimed_trees, ndvi_score, iot_score, 
            audit_check, additional_metrics
        )
        
        # Add success status
        result["status"] = "success"
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "Final score calculation failed",
            "message": str(e),
            "status": "error"
        }), 500

@app.route('/finalscore/batch', methods=['POST'])
def calculate_batch_scores():
    """
    Batch processing for multiple verification records
    """
    try:
        data = request.get_json()
        
        if 'records' not in data or not isinstance(data['records'], list):
            return jsonify({
                "error": "Records array is required"
            }), 400
        
        results = []
        summary = {
            "total_records": len(data['records']),
            "successful": 0,
            "failed": 0,
            "total_carbon_credits": 0,
            "average_final_score": 0
        }
        
        for i, record in enumerate(data['records']):
            try:
                result = score_service.calculate_final_score(
                    record['Tree_Count'],
                    record['Claimed_Trees'],
                    record['NDVI_Score'],
                    record['IoT_Score'],
                    record['Audit_Check'],
                    record.get('additional_metrics', {})
                )
                
                result['record_index'] = i
                results.append(result)
                
                summary['successful'] += 1
                summary['total_carbon_credits'] += result['Carbon_Credits']
                summary['average_final_score'] += result['Final_Score']
                
            except Exception as e:
                results.append({
                    "record_index": i,
                    "error": str(e),
                    "status": "failed"
                })
                summary['failed'] += 1
        
        if summary['successful'] > 0:
            summary['average_final_score'] /= summary['successful']
            summary['average_final_score'] = round(summary['average_final_score'], 4)
        
        return jsonify({
            "summary": summary,
            "results": results,
            "status": "completed"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Batch processing failed",
            "message": str(e)
        }), 500

@app.route('/finalscore/weights', methods=['GET'])
def get_weights():
    """Get current scoring weights and thresholds"""
    return jsonify({
        "scoring_weights": score_service.weights,
        "minimum_thresholds": score_service.min_thresholds,
        "formula": "Final_Score = 0.4×AI_Tree_Score + 0.3×NDVI_Score + 0.2×IoT_Score + 0.1×Audit_Check",
        "carbon_credits_formula": "Carbon_Credits = (CO2_absorbed / 1000) × Final_Score",
        "co2_per_tree_kg": score_service.co2_per_tree
    }), 200

@app.route('/finalscore/simulate', methods=['POST'])
def simulate_scenarios():
    """
    Simulate different scenarios for verification planning
    """
    try:
        data = request.get_json()
        
        base_params = {
            'Tree_Count': data.get('Tree_Count', 100),
            'Claimed_Trees': data.get('Claimed_Trees', 100),
            'NDVI_Score': data.get('NDVI_Score', 0.7),
            'IoT_Score': data.get('IoT_Score', 0.6),
            'Audit_Check': data.get('Audit_Check', 0.8)
        }
        
        scenarios = []
        
        # Best case scenario
        best_case = score_service.calculate_final_score(
            base_params['Tree_Count'], base_params['Claimed_Trees'],
            min(1.0, base_params['NDVI_Score'] * 1.2),
            min(1.0, base_params['IoT_Score'] * 1.3),
            min(1.0, base_params['Audit_Check'] * 1.1)
        )
        scenarios.append({"scenario": "Best Case", **best_case})
        
        # Current scenario
        current = score_service.calculate_final_score(**base_params)
        scenarios.append({"scenario": "Current", **current})
        
        # Worst case scenario
        worst_case = score_service.calculate_final_score(
            int(base_params['Tree_Count'] * 0.7), base_params['Claimed_Trees'],
            max(0.0, base_params['NDVI_Score'] * 0.6),
            max(0.0, base_params['IoT_Score'] * 0.5),
            max(0.0, base_params['Audit_Check'] * 0.7)
        )
        scenarios.append({"scenario": "Worst Case", **worst_case})
        
        return jsonify({
            "scenarios": scenarios,
            "base_parameters": base_params,
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Scenario simulation failed",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting EcoLedger Final Score API...")
    print(f"Scoring weights: {score_service.weights}")
    print(f"Minimum thresholds: {score_service.min_thresholds}")
    app.run(host='0.0.0.0', port=5005, debug=True)