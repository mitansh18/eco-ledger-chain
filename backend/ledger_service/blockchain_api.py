"""
EcoLedger - Hyperledger Fabric Simulation Service
Simulates blockchain ledger operations for carbon credit verification and trading
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import hashlib
import uuid
from datetime import datetime
import sqlite3
import os
from threading import Lock

app = Flask(__name__)
CORS(app)

class BlockchainSimulator:
    def __init__(self, db_path='ledger.db'):
        self.db_path = db_path
        self.lock = Lock()
        self._init_database()
        
    def _init_database(self):
        """Initialize SQLite database to simulate blockchain storage"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create blocks table (simulates blockchain)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS blocks (
                    block_number INTEGER PRIMARY KEY AUTOINCREMENT,
                    block_hash TEXT UNIQUE NOT NULL,
                    previous_hash TEXT,
                    timestamp TEXT NOT NULL,
                    merkle_root TEXT,
                    transaction_count INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create transactions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    transaction_id TEXT PRIMARY KEY,
                    block_number INTEGER,
                    transaction_type TEXT NOT NULL,
                    from_org TEXT,
                    to_org TEXT,
                    data TEXT NOT NULL,
                    data_hash TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    status TEXT DEFAULT 'confirmed',
                    FOREIGN KEY (block_number) REFERENCES blocks (block_number)
                )
            ''')
            
            # Create verification_reports table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS verification_reports (
                    report_id TEXT PRIMARY KEY,
                    ngo_id TEXT NOT NULL,
                    project_id TEXT NOT NULL,
                    verification_data TEXT NOT NULL,
                    data_hash TEXT NOT NULL,
                    final_score REAL,
                    carbon_credits REAL,
                    transaction_id TEXT,
                    status TEXT DEFAULT 'submitted',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id)
                )
            ''')
            
            # Create carbon_credits table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS carbon_credits (
                    credit_id TEXT PRIMARY KEY,
                    ngo_id TEXT NOT NULL,
                    company_id TEXT,
                    amount REAL NOT NULL,
                    price_per_credit REAL,
                    total_value REAL,
                    report_id TEXT,
                    status TEXT DEFAULT 'available',
                    issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    transferred_at TEXT,
                    FOREIGN KEY (report_id) REFERENCES verification_reports (report_id)
                )
            ''')
            
            # Create organizations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS organizations (
                    org_id TEXT PRIMARY KEY,
                    org_name TEXT NOT NULL,
                    org_type TEXT NOT NULL,
                    wallet_address TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
    
    def _calculate_hash(self, data):
        """Calculate SHA-256 hash of data"""
        if isinstance(data, dict):
            data = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _get_latest_block(self):
        """Get the latest block from the chain"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM blocks ORDER BY block_number DESC LIMIT 1')
            row = cursor.fetchone()
            
            if row:
                columns = [description[0] for description in cursor.description]
                return dict(zip(columns, row))
            return None
    
    def _create_genesis_block(self):
        """Create the genesis block if none exists"""
        latest_block = self._get_latest_block()
        
        if not latest_block:
            genesis_data = {
                'type': 'genesis',
                'message': 'EcoLedger Genesis Block',
                'timestamp': datetime.now().isoformat()
            }
            
            genesis_hash = self._calculate_hash(genesis_data)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO blocks (block_hash, previous_hash, timestamp, merkle_root)
                    VALUES (?, ?, ?, ?)
                ''', (genesis_hash, '0', datetime.now().isoformat(), genesis_hash))
                conn.commit()
    
    def submit_verification_report(self, ngo_id, project_id, verification_data):
        """Submit a verification report to the blockchain"""
        try:
            with self.lock:
                self._create_genesis_block()
                
                # Generate IDs
                report_id = str(uuid.uuid4())
                transaction_id = str(uuid.uuid4())
                
                # Create data hash
                data_hash = self._calculate_hash(verification_data)
                
                # Create transaction
                transaction_data = {
                    'type': 'verification_report',
                    'report_id': report_id,
                    'ngo_id': ngo_id,
                    'project_id': project_id,
                    'data_hash': data_hash,
                    'timestamp': datetime.now().isoformat()
                }
                
                # Add to new block
                latest_block = self._get_latest_block()
                new_block_number = (latest_block['block_number'] + 1) if latest_block else 1
                
                # Create block hash
                block_data = {
                    'block_number': new_block_number,
                    'previous_hash': latest_block['block_hash'] if latest_block else '0',
                    'transactions': [transaction_data],
                    'timestamp': datetime.now().isoformat()
                }
                block_hash = self._calculate_hash(block_data)
                
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    
                    # Insert new block
                    cursor.execute('''
                        INSERT INTO blocks (block_hash, previous_hash, timestamp, merkle_root, transaction_count)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (block_hash, block_data['previous_hash'], block_data['timestamp'], data_hash, 1))
                    
                    # Insert transaction
                    cursor.execute('''
                        INSERT INTO transactions (transaction_id, block_number, transaction_type, from_org, data, data_hash, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (transaction_id, new_block_number, 'verification_report', ngo_id, 
                          json.dumps(verification_data), data_hash, datetime.now().isoformat()))
                    
                    # Insert verification report
                    cursor.execute('''
                        INSERT INTO verification_reports (report_id, ngo_id, project_id, verification_data, data_hash, 
                                                        final_score, carbon_credits, transaction_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (report_id, ngo_id, project_id, json.dumps(verification_data), data_hash,
                          verification_data.get('Final_Score'), verification_data.get('Carbon_Credits'), transaction_id))
                    
                    conn.commit()
                
                return {
                    'report_id': report_id,
                    'transaction_id': transaction_id,
                    'block_number': new_block_number,
                    'block_hash': block_hash,
                    'data_hash': data_hash,
                    'timestamp': datetime.now().isoformat(),
                    'status': 'submitted'
                }
                
        except Exception as e:
            raise Exception(f"Failed to submit verification report: {str(e)}")
    
    def query_report(self, report_id):
        """Query a verification report from the blockchain"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT vr.*, t.block_number, t.transaction_id, b.block_hash
                    FROM verification_reports vr
                    JOIN transactions t ON vr.transaction_id = t.transaction_id
                    JOIN blocks b ON t.block_number = b.block_number
                    WHERE vr.report_id = ?
                ''', (report_id,))
                
                row = cursor.fetchone()
                if row:
                    columns = [description[0] for description in cursor.description]
                    result = dict(zip(columns, row))
                    
                    # Parse JSON data
                    result['verification_data'] = json.loads(result['verification_data'])
                    
                    return result
                
                return None
                
        except Exception as e:
            raise Exception(f"Failed to query report: {str(e)}")
    
    def issue_carbon_credits(self, ngo_id, report_id, amount, price_per_credit=None):
        """Issue carbon credits based on verification report"""
        try:
            with self.lock:
                credit_id = str(uuid.uuid4())
                transaction_id = str(uuid.uuid4())
                
                total_value = (amount * price_per_credit) if price_per_credit else None
                
                # Create transaction
                transaction_data = {
                    'type': 'issue_credits',
                    'credit_id': credit_id,
                    'ngo_id': ngo_id,
                    'amount': amount,
                    'report_id': report_id,
                    'timestamp': datetime.now().isoformat()
                }
                
                # Add to blockchain
                latest_block = self._get_latest_block()
                new_block_number = latest_block['block_number'] + 1
                
                block_data = {
                    'block_number': new_block_number,
                    'previous_hash': latest_block['block_hash'],
                    'transactions': [transaction_data],
                    'timestamp': datetime.now().isoformat()
                }
                block_hash = self._calculate_hash(block_data)
                data_hash = self._calculate_hash(transaction_data)
                
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    
                    # Insert block
                    cursor.execute('''
                        INSERT INTO blocks (block_hash, previous_hash, timestamp, merkle_root, transaction_count)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (block_hash, block_data['previous_hash'], block_data['timestamp'], data_hash, 1))
                    
                    # Insert transaction
                    cursor.execute('''
                        INSERT INTO transactions (transaction_id, block_number, transaction_type, from_org, data, data_hash, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (transaction_id, new_block_number, 'issue_credits', ngo_id,
                          json.dumps(transaction_data), data_hash, datetime.now().isoformat()))
                    
                    # Insert carbon credits
                    cursor.execute('''
                        INSERT INTO carbon_credits (credit_id, ngo_id, amount, price_per_credit, total_value, report_id, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (credit_id, ngo_id, amount, price_per_credit, total_value, report_id, 'available'))
                    
                    conn.commit()
                
                return {
                    'credit_id': credit_id,
                    'transaction_id': transaction_id,
                    'block_number': new_block_number,
                    'block_hash': block_hash,
                    'amount': amount,
                    'status': 'issued'
                }
                
        except Exception as e:
            raise Exception(f"Failed to issue carbon credits: {str(e)}")
    
    def transfer_credits(self, credit_id, from_ngo, to_company, amount=None):
        """Transfer carbon credits from NGO to company"""
        try:
            with self.lock:
                transaction_id = str(uuid.uuid4())
                
                # Get credit details
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM carbon_credits WHERE credit_id = ? AND status = "available"', (credit_id,))
                    credit = cursor.fetchone()
                    
                    if not credit:
                        raise ValueError("Credit not found or not available")
                    
                    credit_columns = [description[0] for description in cursor.description]
                    credit_dict = dict(zip(credit_columns, credit))
                    
                    transfer_amount = amount or credit_dict['amount']
                    
                    if transfer_amount > credit_dict['amount']:
                        raise ValueError("Transfer amount exceeds available credits")
                
                # Create transaction
                transaction_data = {
                    'type': 'transfer_credits',
                    'credit_id': credit_id,
                    'from_ngo': from_ngo,
                    'to_company': to_company,
                    'amount': transfer_amount,
                    'timestamp': datetime.now().isoformat()
                }
                
                # Add to blockchain
                latest_block = self._get_latest_block()
                new_block_number = latest_block['block_number'] + 1
                
                block_data = {
                    'block_number': new_block_number,
                    'previous_hash': latest_block['block_hash'],
                    'transactions': [transaction_data],
                    'timestamp': datetime.now().isoformat()
                }
                block_hash = self._calculate_hash(block_data)
                data_hash = self._calculate_hash(transaction_data)
                
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    
                    # Insert block
                    cursor.execute('''
                        INSERT INTO blocks (block_hash, previous_hash, timestamp, merkle_root, transaction_count)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (block_hash, block_data['previous_hash'], block_data['timestamp'], data_hash, 1))
                    
                    # Insert transaction
                    cursor.execute('''
                        INSERT INTO transactions (transaction_id, block_number, transaction_type, from_org, to_org, data, data_hash, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (transaction_id, new_block_number, 'transfer_credits', from_ngo, to_company,
                          json.dumps(transaction_data), data_hash, datetime.now().isoformat()))
                    
                    # Update carbon credits
                    cursor.execute('''
                        UPDATE carbon_credits SET company_id = ?, status = 'transferred', transferred_at = ?
                        WHERE credit_id = ?
                    ''', (to_company, datetime.now().isoformat(), credit_id))
                    
                    conn.commit()
                
                return {
                    'transaction_id': transaction_id,
                    'block_number': new_block_number,
                    'block_hash': block_hash,
                    'credit_id': credit_id,
                    'amount': transfer_amount,
                    'from_ngo': from_ngo,
                    'to_company': to_company,
                    'status': 'transferred'
                }
                
        except Exception as e:
            raise Exception(f"Failed to transfer credits: {str(e)}")
    
    def get_blockchain_stats(self):
        """Get blockchain statistics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get block count
                cursor.execute('SELECT COUNT(*) FROM blocks')
                block_count = cursor.fetchone()[0]
                
                # Get transaction count
                cursor.execute('SELECT COUNT(*) FROM transactions')
                transaction_count = cursor.fetchone()[0]
                
                # Get reports count
                cursor.execute('SELECT COUNT(*) FROM verification_reports')
                reports_count = cursor.fetchone()[0]
                
                # Get credits stats
                cursor.execute('SELECT COUNT(*), SUM(amount) FROM carbon_credits WHERE status = "available"')
                available_credits = cursor.fetchone()
                
                cursor.execute('SELECT COUNT(*), SUM(amount) FROM carbon_credits WHERE status = "transferred"')
                transferred_credits = cursor.fetchone()
                
                return {
                    'blocks': block_count,
                    'transactions': transaction_count,
                    'verification_reports': reports_count,
                    'available_credits': {
                        'count': available_credits[0] or 0,
                        'total_amount': available_credits[1] or 0
                    },
                    'transferred_credits': {
                        'count': transferred_credits[0] or 0,
                        'total_amount': transferred_credits[1] or 0
                    }
                }
                
        except Exception as e:
            raise Exception(f"Failed to get blockchain stats: {str(e)}")

# Initialize blockchain simulator
blockchain = BlockchainSimulator()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        stats = blockchain.get_blockchain_stats()
        return jsonify({
            "status": "healthy",
            "service": "Hyperledger Fabric Simulation",
            "version": "1.0.0",
            "blockchain_stats": stats
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@app.route('/ledger/submit', methods=['POST'])
def submit_report():
    """Submit verification report to blockchain"""
    try:
        data = request.get_json()
        
        required_fields = ['ngo_id', 'project_id', 'verification_data']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}"
                }), 400
        
        result = blockchain.submit_verification_report(
            data['ngo_id'], 
            data['project_id'], 
            data['verification_data']
        )
        
        result['status'] = 'success'
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to submit report",
            "message": str(e)
        }), 500

@app.route('/ledger/query/<report_id>', methods=['GET'])
def query_report(report_id):
    """Query verification report from blockchain"""
    try:
        result = blockchain.query_report(report_id)
        
        if result:
            return jsonify({
                "status": "success",
                "report": result
            }), 200
        else:
            return jsonify({
                "error": "Report not found"
            }), 404
            
    except Exception as e:
        return jsonify({
            "error": "Failed to query report",
            "message": str(e)
        }), 500

@app.route('/ledger/issue', methods=['POST'])
def issue_credits():
    """Issue carbon credits to NGO"""
    try:
        data = request.get_json()
        
        required_fields = ['ngo_id', 'report_id', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}"
                }), 400
        
        result = blockchain.issue_carbon_credits(
            data['ngo_id'],
            data['report_id'],
            data['amount'],
            data.get('price_per_credit')
        )
        
        result['status'] = 'success'
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to issue credits",
            "message": str(e)
        }), 500

@app.route('/ledger/transfer', methods=['POST'])
def transfer_credits():
    """Transfer carbon credits from NGO to company"""
    try:
        data = request.get_json()
        
        required_fields = ['credit_id', 'from_ngo', 'to_company']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}"
                }), 400
        
        result = blockchain.transfer_credits(
            data['credit_id'],
            data['from_ngo'],
            data['to_company'],
            data.get('amount')
        )
        
        result['status'] = 'success'
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to transfer credits",
            "message": str(e)
        }), 500

@app.route('/ledger/credits/available', methods=['GET'])
def get_available_credits():
    """Get available carbon credits for purchase"""
    try:
        with sqlite3.connect(blockchain.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT cc.*, vr.project_id, vr.final_score
                FROM carbon_credits cc
                JOIN verification_reports vr ON cc.report_id = vr.report_id
                WHERE cc.status = 'available'
                ORDER BY cc.issued_at DESC
            ''')
            
            columns = [description[0] for description in cursor.description]
            credits = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return jsonify({
            "status": "success",
            "available_credits": credits,
            "total_credits": sum(credit['amount'] for credit in credits)
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to get available credits",
            "message": str(e)
        }), 500

@app.route('/ledger/stats', methods=['GET'])
def get_stats():
    """Get blockchain and trading statistics"""
    try:
        stats = blockchain.get_blockchain_stats()
        return jsonify({
            "status": "success",
            "blockchain_stats": stats
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to get stats",
            "message": str(e)
        }), 500

@app.route('/ledger/history/<org_id>', methods=['GET'])
def get_organization_history(org_id):
    """Get transaction history for an organization"""
    try:
        with sqlite3.connect(blockchain.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT t.*, b.block_hash, b.timestamp as block_timestamp
                FROM transactions t
                JOIN blocks b ON t.block_number = b.block_number
                WHERE t.from_org = ? OR t.to_org = ?
                ORDER BY t.timestamp DESC
            ''', (org_id, org_id))
            
            columns = [description[0] for description in cursor.description]
            transactions = []
            
            for row in cursor.fetchall():
                tx = dict(zip(columns, row))
                tx['data'] = json.loads(tx['data'])
                transactions.append(tx)
        
        return jsonify({
            "status": "success",
            "organization_id": org_id,
            "transaction_history": transactions
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to get organization history",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting EcoLedger Blockchain Simulation Service...")
    print(f"Database: {blockchain.db_path}")
    
    # Initialize with genesis block
    blockchain._create_genesis_block()
    
    app.run(host='0.0.0.0', port=5006, debug=True)