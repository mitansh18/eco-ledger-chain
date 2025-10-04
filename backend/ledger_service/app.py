from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import hashlib
import uuid
import logging
from datetime import datetime, timezone
import sqlite3
import os
from typing import Dict, List, Optional
import threading

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_PATH = 'ecoledger.db'
db_lock = threading.Lock()

# Initialize database
def init_database():
    """Initialize SQLite database to simulate blockchain ledger"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # Create blocks table (blockchain simulation)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                block_number INTEGER UNIQUE,
                previous_hash TEXT,
                block_hash TEXT UNIQUE,
                timestamp TEXT,
                merkle_root TEXT,
                transactions_count INTEGER,
                created_at TEXT
            )
        ''')
        
        # Create transactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tx_hash TEXT UNIQUE,
                block_number INTEGER,
                tx_type TEXT,
                from_entity TEXT,
                to_entity TEXT,
                data TEXT,
                signature TEXT,
                timestamp TEXT,
                status TEXT,
                created_at TEXT,
                FOREIGN KEY (block_number) REFERENCES blocks (block_number)
            )
        ''')
        
        # Create carbon_credits table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS carbon_credits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                credit_id TEXT UNIQUE,
                ngo_id TEXT,
                project_id TEXT,
                credits_amount REAL,
                verification_score REAL,
                co2_absorbed REAL,
                tree_count INTEGER,
                project_location TEXT,
                issuance_date TEXT,
                status TEXT,
                owner_id TEXT,
                price_per_credit REAL,
                market_value REAL,
                verification_data TEXT,
                tx_hash TEXT,
                created_at TEXT
            )
        ''')
        
        # Create credit_transfers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS credit_transfers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transfer_id TEXT UNIQUE,
                credit_id TEXT,
                from_owner TEXT,
                to_owner TEXT,
                credits_transferred REAL,
                transfer_price REAL,
                transfer_date TEXT,
                tx_hash TEXT,
                status TEXT,
                created_at TEXT,
                FOREIGN KEY (credit_id) REFERENCES carbon_credits (credit_id)
            )
        ''')
        
        # Create entities table (NGOs, Companies, etc.)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS entities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_id TEXT UNIQUE,
                entity_type TEXT,
                name TEXT,
                contact_info TEXT,
                wallet_address TEXT,
                verification_status TEXT,
                created_at TEXT
            )
        ''')
        
        conn.commit()
        logger.info("Database initialized successfully")
        
        # Create genesis block if doesn't exist
        cursor.execute('SELECT COUNT(*) FROM blocks')
        if cursor.fetchone()[0] == 0:
            create_genesis_block()

def create_genesis_block():
    """Create the first block in the blockchain"""
    genesis_data = {
        'type': 'genesis',
        'message': 'EcoLedger Genesis Block - Carbon Credit Verification System',
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    genesis_hash = calculate_hash("0", json.dumps(genesis_data, sort_keys=True))
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO blocks (block_number, previous_hash, block_hash, timestamp, merkle_root, transactions_count)
            VALUES (0, '0', ?, ?, 'genesis', 0)
        ''', (genesis_hash, datetime.now(timezone.utc).isoformat()))
        conn.commit()
    
    logger.info(f"Genesis block created with hash: {genesis_hash}")

def calculate_hash(*data):
    """Calculate SHA-256 hash of given data"""
    combined_data = ''.join(str(d) for d in data)
    return hashlib.sha256(combined_data.encode()).hexdigest()

def get_last_block():
    """Get the last block in the chain"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM blocks ORDER BY block_number DESC LIMIT 1')
        row = cursor.fetchone()
        if row:
            return {
                'block_number': row[1],
                'previous_hash': row[2],
                'block_hash': row[3],
                'timestamp': row[4],
                'merkle_root': row[5],
                'transactions_count': row[6]
            }
        return None

def create_new_block(transactions: List[Dict]) -> Dict:
    """Create a new block with given transactions"""
    last_block = get_last_block()
    if not last_block:
        raise Exception("No genesis block found")
    
    new_block_number = last_block['block_number'] + 1
    previous_hash = last_block['block_hash']
    
    # Calculate merkle root (simplified - just hash of all transaction hashes)
    tx_hashes = [tx.get('tx_hash', '') for tx in transactions]
    merkle_root = calculate_hash(*tx_hashes) if tx_hashes else 'empty'
    
    # Create block data
    block_data = {
        'block_number': new_block_number,
        'previous_hash': previous_hash,
        'transactions': transactions,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'merkle_root': merkle_root
    }
    
    # Calculate block hash
    block_hash = calculate_hash(
        new_block_number,
        previous_hash,
        merkle_root,
        block_data['timestamp']
    )
    
    # Store block in database
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO blocks (block_number, previous_hash, block_hash, timestamp, merkle_root, transactions_count)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (new_block_number, previous_hash, block_hash, block_data['timestamp'], merkle_root, len(transactions)))
        conn.commit()
    
    block_data['block_hash'] = block_hash
    logger.info(f"Created new block #{new_block_number} with hash: {block_hash}")
    
    return block_data

def create_transaction(tx_type: str, from_entity: str, to_entity: str, data: Dict) -> str:
    """Create a new transaction and return its hash"""
    tx_id = str(uuid.uuid4())
    tx_data = {
        'tx_id': tx_id,
        'type': tx_type,
        'from': from_entity,
        'to': to_entity,
        'data': data,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    # Create transaction hash
    tx_hash = calculate_hash(json.dumps(tx_data, sort_keys=True))
    
    # Store transaction (will be included in next block)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO transactions (tx_hash, tx_type, from_entity, to_entity, data, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        ''', (tx_hash, tx_type, from_entity, to_entity, json.dumps(data), tx_data['timestamp']))
        conn.commit()
    
    return tx_hash

# Initialize database on startup
init_database()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "EcoLedger Blockchain Simulation API",
        "database": "connected"
    })

@app.route('/ledger/submit', methods=['POST'])
def submit_verification_report():
    """Submit a verified mangrove project report to the ledger"""
    try:
        data = request.get_json()
        
        required_fields = ['ngo_id', 'project_id', 'verification_data']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "submitted": False
            }), 400
        
        # Extract verification data
        verification_data = data['verification_data']
        ngo_id = data['ngo_id']
        project_id = data['project_id']
        
        # Create transaction for verification report submission
        tx_hash = create_transaction(
            tx_type='verification_submission',
            from_entity=ngo_id,
            to_entity='ecoledger_system',
            data={
                'project_id': project_id,
                'verification_data': verification_data,
                'action': 'submit_verification_report'
            }
        )
        
        # Store verification report hash for immutability
        report_hash = calculate_hash(json.dumps(verification_data, sort_keys=True))
        
        # Create a new block with this transaction
        transactions = [{
            'tx_hash': tx_hash,
            'type': 'verification_submission',
            'project_id': project_id,
            'ngo_id': ngo_id
        }]
        
        block = create_new_block(transactions)
        
        # Update transaction with block number
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE transactions 
                SET block_number = ?, status = 'confirmed' 
                WHERE tx_hash = ?
            ''', (block['block_number'], tx_hash))
            conn.commit()
        
        response = {
            "submitted": True,
            "tx_hash": tx_hash,
            "report_hash": report_hash,
            "block_number": block['block_number'],
            "block_hash": block['block_hash'],
            "timestamp": block['timestamp'],
            "verification_summary": {
                "project_id": project_id,
                "ngo_id": ngo_id,
                "tree_count": verification_data.get('tree_count', 0),
                "final_score": verification_data.get('final_score', 0),
                "co2_absorbed": verification_data.get('co2_absorbed', 0),
                "carbon_credits": verification_data.get('carbon_credits', 0)
            }
        }
        
        logger.info(f"Verification report submitted: {project_id} by {ngo_id}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error submitting verification report: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "submitted": False
        }), 500

@app.route('/ledger/query', methods=['GET'])
def query_verification_report():
    """Query a verification report from the ledger"""
    try:
        # Get query parameters
        tx_hash = request.args.get('tx_hash')
        project_id = request.args.get('project_id')
        ngo_id = request.args.get('ngo_id')
        
        if not any([tx_hash, project_id, ngo_id]):
            return jsonify({
                "error": "Provide at least one query parameter: tx_hash, project_id, or ngo_id",
                "found": False
            }), 400
        
        # Build query
        query = 'SELECT * FROM transactions WHERE status = "confirmed"'
        params = []
        
        if tx_hash:
            query += ' AND tx_hash = ?'
            params.append(tx_hash)
        elif project_id:
            query += ' AND data LIKE ?'
            params.append(f'%"project_id": "{project_id}"%')
        elif ngo_id:
            query += ' AND from_entity = ?'
            params.append(ngo_id)
        
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
        
        if not rows:
            return jsonify({
                "error": "No verification reports found",
                "found": False
            }), 404
        
        # Format results
        reports = []
        for row in rows:
            tx_data = json.loads(row[6])  # data column
            reports.append({
                "tx_hash": row[1],
                "block_number": row[2],
                "from_entity": row[4],
                "timestamp": row[7],
                "status": row[8],
                "verification_data": tx_data.get('verification_data', {}),
                "project_id": tx_data.get('project_id'),
            })
        
        return jsonify({
            "found": True,
            "count": len(reports),
            "reports": reports
        })
        
    except Exception as e:
        logger.error(f"Error querying verification report: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "found": False
        }), 500

@app.route('/ledger/issue', methods=['POST'])
def issue_carbon_credits():
    """Issue carbon credits to an NGO based on verified report"""
    try:
        data = request.get_json()
        
        required_fields = ['ngo_id', 'project_id', 'credits_amount', 'verification_score']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "issued": False
            }), 400
        
        ngo_id = data['ngo_id']
        project_id = data['project_id']
        credits_amount = data['credits_amount']
        verification_score = data['verification_score']
        
        # Generate unique credit ID
        credit_id = f"ECC-{project_id}-{str(uuid.uuid4())[:8]}"
        
        # Create transaction for credit issuance
        tx_hash = create_transaction(
            tx_type='credit_issuance',
            from_entity='ecoledger_system',
            to_entity=ngo_id,
            data={
                'credit_id': credit_id,
                'project_id': project_id,
                'credits_amount': credits_amount,
                'verification_score': verification_score,
                'action': 'issue_carbon_credits'
            }
        )
        
        # Store carbon credits in database
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO carbon_credits 
                (credit_id, ngo_id, project_id, credits_amount, verification_score, 
                 co2_absorbed, tree_count, project_location, issuance_date, status, 
                 owner_id, price_per_credit, market_value, verification_data, tx_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                credit_id, ngo_id, project_id, credits_amount, verification_score,
                data.get('co2_absorbed', 0), data.get('tree_count', 0),
                data.get('project_location', ''), datetime.now(timezone.utc).isoformat(),
                'active', ngo_id, data.get('price_per_credit', 15.50),
                credits_amount * data.get('price_per_credit', 15.50),
                json.dumps(data.get('verification_data', {})), tx_hash
            ))
            conn.commit()
        
        # Create block with issuance transaction
        transactions = [{
            'tx_hash': tx_hash,
            'type': 'credit_issuance',
            'credit_id': credit_id,
            'ngo_id': ngo_id,
            'credits_amount': credits_amount
        }]
        
        block = create_new_block(transactions)
        
        # Update transaction status
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE transactions 
                SET block_number = ?, status = 'confirmed' 
                WHERE tx_hash = ?
            ''', (block['block_number'], tx_hash))
            conn.commit()
        
        response = {
            "issued": True,
            "credit_id": credit_id,
            "tx_hash": tx_hash,
            "block_number": block['block_number'],
            "block_hash": block['block_hash'],
            "credits_issued": credits_amount,
            "owner": ngo_id,
            "verification_score": verification_score,
            "issuance_date": block['timestamp']
        }
        
        logger.info(f"Carbon credits issued: {credits_amount} credits to {ngo_id}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error issuing carbon credits: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "issued": False
        }), 500

@app.route('/ledger/transfer', methods=['POST'])
def transfer_carbon_credits():
    """Transfer carbon credits from NGO to company"""
    try:
        data = request.get_json()
        
        required_fields = ['credit_id', 'from_owner', 'to_owner', 'credits_amount', 'transfer_price']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "transferred": False
            }), 400
        
        credit_id = data['credit_id']
        from_owner = data['from_owner']
        to_owner = data['to_owner']
        credits_amount = data['credits_amount']
        transfer_price = data['transfer_price']
        
        # Verify credit ownership and availability
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT credits_amount, owner_id, status FROM carbon_credits 
                WHERE credit_id = ? AND status = 'active'
            ''', (credit_id,))
            
            credit_info = cursor.fetchone()
            
            if not credit_info:
                return jsonify({
                    "error": "Credit not found or inactive",
                    "transferred": False
                }), 404
            
            available_credits, current_owner, status = credit_info
            
            if current_owner != from_owner:
                return jsonify({
                    "error": f"Credits owned by {current_owner}, not {from_owner}",
                    "transferred": False
                }), 403
            
            if available_credits < credits_amount:
                return jsonify({
                    "error": f"Insufficient credits. Available: {available_credits}, Requested: {credits_amount}",
                    "transferred": False
                }), 400
        
        # Generate transfer ID
        transfer_id = f"TXF-{str(uuid.uuid4())[:8]}"
        
        # Create transaction for credit transfer
        tx_hash = create_transaction(
            tx_type='credit_transfer',
            from_entity=from_owner,
            to_entity=to_owner,
            data={
                'transfer_id': transfer_id,
                'credit_id': credit_id,
                'credits_amount': credits_amount,
                'transfer_price': transfer_price,
                'total_value': credits_amount * transfer_price,
                'action': 'transfer_carbon_credits'
            }
        )
        
        # Update credit ownership and record transfer
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Record transfer
            cursor.execute('''
                INSERT INTO credit_transfers 
                (transfer_id, credit_id, from_owner, to_owner, credits_transferred, 
                 transfer_price, transfer_date, tx_hash, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                transfer_id, credit_id, from_owner, to_owner, credits_amount,
                transfer_price, datetime.now(timezone.utc).isoformat(), tx_hash, 'completed'
            ))
            
            # Update credit ownership (simplified - in production might split credits)
            cursor.execute('''
                UPDATE carbon_credits 
                SET owner_id = ?, credits_amount = credits_amount - ?
                WHERE credit_id = ?
            ''', (to_owner, credits_amount, credit_id))
            
            # If all credits transferred, mark as transferred
            cursor.execute('''
                UPDATE carbon_credits 
                SET status = 'transferred' 
                WHERE credit_id = ? AND credits_amount = 0
            ''', (credit_id,))
            
            conn.commit()
        
        # Create block with transfer transaction
        transactions = [{
            'tx_hash': tx_hash,
            'type': 'credit_transfer',
            'transfer_id': transfer_id,
            'credit_id': credit_id,
            'from_owner': from_owner,
            'to_owner': to_owner,
            'credits_amount': credits_amount
        }]
        
        block = create_new_block(transactions)
        
        # Update transaction status
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE transactions 
                SET block_number = ?, status = 'confirmed' 
                WHERE tx_hash = ?
            ''', (block['block_number'], tx_hash))
            conn.commit()
        
        response = {
            "transferred": True,
            "transfer_id": transfer_id,
            "tx_hash": tx_hash,
            "block_number": block['block_number'],
            "block_hash": block['block_hash'],
            "credit_id": credit_id,
            "from_owner": from_owner,
            "to_owner": to_owner,
            "credits_transferred": credits_amount,
            "transfer_price": transfer_price,
            "total_value": credits_amount * transfer_price,
            "transfer_date": block['timestamp']
        }
        
        logger.info(f"Carbon credits transferred: {credits_amount} from {from_owner} to {to_owner}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error transferring carbon credits: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "transferred": False
        }), 500

@app.route('/ledger/credits', methods=['GET'])
def list_carbon_credits():
    """List available carbon credits for purchase"""
    try:
        # Get query parameters
        owner_id = request.args.get('owner')
        status = request.args.get('status', 'active')
        limit = request.args.get('limit', 50, type=int)
        
        # Build query
        query = 'SELECT * FROM carbon_credits WHERE status = ?'
        params = [status]
        
        if owner_id:
            query += ' AND owner_id = ?'
            params.append(owner_id)
        
        query += ' ORDER BY issuance_date DESC LIMIT ?'
        params.append(limit)
        
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
        
        # Format results
        credits = []
        for row in rows:
            credits.append({
                "credit_id": row[1],
                "ngo_id": row[2],
                "project_id": row[3],
                "credits_amount": row[4],
                "verification_score": row[5],
                "co2_absorbed": row[6],
                "tree_count": row[7],
                "project_location": row[8],
                "issuance_date": row[9],
                "status": row[10],
                "owner_id": row[11],
                "price_per_credit": row[12],
                "market_value": row[13]
            })
        
        return jsonify({
            "credits": credits,
            "total_count": len(credits),
            "filter_applied": {
                "owner": owner_id,
                "status": status,
                "limit": limit
            }
        })
        
    except Exception as e:
        logger.error(f"Error listing carbon credits: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "credits": []
        }), 500

@app.route('/ledger/blockchain', methods=['GET'])
def get_blockchain_info():
    """Get blockchain information and recent blocks"""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Get blockchain stats
            cursor.execute('SELECT COUNT(*) FROM blocks')
            total_blocks = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE status = "confirmed"')
            total_transactions = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM carbon_credits')
            total_credits = cursor.fetchone()[0]
            
            cursor.execute('SELECT SUM(credits_amount) FROM carbon_credits WHERE status = "active"')
            active_credits = cursor.fetchone()[0] or 0
            
            # Get recent blocks
            cursor.execute('SELECT * FROM blocks ORDER BY block_number DESC LIMIT 10')
            recent_blocks = []
            for row in cursor.fetchall():
                recent_blocks.append({
                    "block_number": row[1],
                    "block_hash": row[3],
                    "timestamp": row[4],
                    "transactions_count": row[6]
                })
        
        return jsonify({
            "blockchain_stats": {
                "total_blocks": total_blocks,
                "total_transactions": total_transactions,
                "total_credits_issued": total_credits,
                "active_credits": active_credits,
                "last_block": recent_blocks[0] if recent_blocks else None
            },
            "recent_blocks": recent_blocks,
            "system_info": {
                "network": "EcoLedger Simulation",
                "consensus": "Simulated Proof of Authority",
                "version": "1.0.0"
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting blockchain info: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006, debug=True)