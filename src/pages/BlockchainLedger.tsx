import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Search, Block, Hash, Clock, CheckCircle, Users, TrendingUp, Database, Eye, Copy } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

// API Configuration
const API_CONFIG = {
  LEDGER_API: 'http://localhost:5006'
};

interface BlockchainStats {
  total_blocks: number;
  total_transactions: number;
  total_credits_issued: number;
  active_credits: number;
  last_block?: {
    block_number: number;
    block_hash: string;
    timestamp: string;
    transactions_count: number;
  };
}

interface RecentBlock {
  block_number: number;
  block_hash: string;
  timestamp: string;
  transactions_count: number;
}

interface Transaction {
  tx_hash: string;
  block_number: number;
  from_entity: string;
  timestamp: string;
  status: string;
  verification_data?: any;
  project_id?: string;
}

interface CarbonCredit {
  credit_id: string;
  ngo_id: string;
  project_id: string;
  credits_amount: number;
  verification_score: number;
  co2_absorbed: number;
  tree_count: number;
  project_location: string;
  issuance_date: string;
  status: string;
  owner_id: string;
  price_per_credit: number;
  market_value: number;
}

const BlockchainLedger = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<RecentBlock[]>([]);
  const [carbonCredits, setCarbonCredits] = useState<CarbonCredit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      setLoading(true);
      
      // Load blockchain statistics and recent blocks
      const blockchainResponse = await axios.get(`${API_CONFIG.LEDGER_API}/ledger/blockchain`);
      setBlockchainStats(blockchainResponse.data.blockchain_stats);
      setRecentBlocks(blockchainResponse.data.recent_blocks || []);
      
      // Load carbon credits
      const creditsResponse = await axios.get(`${API_CONFIG.LEDGER_API}/ledger/credits?status=active&limit=20`);
      setCarbonCredits(creditsResponse.data.credits || []);
      
    } catch (error) {
      console.error('Error loading blockchain data:', error);
      toast({
        title: "Error",
        description: "Failed to load blockchain data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Try searching by different parameters
      const searchParams = new URLSearchParams();
      
      // Check if it looks like a transaction hash
      if (searchTerm.match(/^[a-f0-9]{64}$/i)) {
        searchParams.set('tx_hash', searchTerm);
      } 
      // Check if it looks like a project ID
      else if (searchTerm.startsWith('PRJ-')) {
        searchParams.set('project_id', searchTerm);
      }
      // Otherwise search by NGO ID
      else {
        searchParams.set('ngo_id', searchTerm);
      }

      const response = await axios.get(`${API_CONFIG.LEDGER_API}/ledger/query?${searchParams.toString()}`);
      
      if (response.data.found) {
        setSearchResults(response.data.reports || []);
        toast({
          title: "Search Complete",
          description: `Found ${response.data.count} result(s)`,
        });
      } else {
        setSearchResults([]);
        toast({
          title: "No Results",
          description: "No verification reports found for your search",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Failed",
        description: "Error occurred while searching",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatHash = (hash: string, length: number = 12) => {
    return `${hash.substring(0, length)}...${hash.substring(hash.length - 6)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return <Badge className="bg-green-600 text-white">A+ Premium</Badge>;
    if (score >= 0.8) return <Badge className="bg-green-500 text-white">A High Quality</Badge>;
    if (score >= 0.7) return <Badge className="bg-blue-500 text-white">B+ Good</Badge>;
    if (score >= 0.6) return <Badge className="bg-blue-400 text-white">B Satisfactory</Badge>;
    return <Badge className="bg-yellow-500 text-white">C Marginal</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading blockchain data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center">
                <Database className="h-8 w-8 text-primary mr-3" />
                <div>
                  <h1 className="text-2xl font-bold">EcoLedger Blockchain</h1>
                  <p className="text-sm text-muted-foreground">Immutable carbon credit verification records</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <Badge variant="outline">
                  Logged in as {currentUser.name} ({currentUser.type})
                </Badge>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Blockchain Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Block className="w-4 h-4 mr-2" />
                Total Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{blockchainStats?.total_blocks || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">In the chain</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Hash className="w-4 h-4 mr-2" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{blockchainStats?.total_transactions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Verified records</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Credits Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{blockchainStats?.total_credits_issued || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total carbon credits</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Active Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{blockchainStats?.active_credits?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground mt-1">Available for purchase</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Latest Block Info */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Search */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Search Blockchain Records
              </CardTitle>
              <CardDescription>
                Search by transaction hash, project ID, or NGO ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter tx hash, project ID, or NGO ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Search Results:</h4>
                  {searchResults.map((tx, index) => (
                    <div key={index} className="border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm">{formatHash(tx.tx_hash)}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(tx.tx_hash, 'Transaction hash')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        {getStatusBadge(tx.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Block #{tx.block_number} • {new Date(tx.timestamp).toLocaleString()}
                      </div>
                      {tx.project_id && (
                        <div className="text-sm">
                          <span className="font-medium">Project:</span> {tx.project_id}
                        </div>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTransaction(tx)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Transaction Details</DialogTitle>
                            <DialogDescription>
                              Verification record from the EcoLedger blockchain
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedTransaction && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Transaction Hash</Label>
                                  <div className="font-mono text-sm bg-muted p-2 rounded">
                                    {selectedTransaction.tx_hash}
                                  </div>
                                </div>
                                <div>
                                  <Label>Block Number</Label>
                                  <div className="text-lg font-bold">#{selectedTransaction.block_number}</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>From Entity</Label>
                                  <div className="font-medium">{selectedTransaction.from_entity}</div>
                                </div>
                                <div>
                                  <Label>Timestamp</Label>
                                  <div>{new Date(selectedTransaction.timestamp).toLocaleString()}</div>
                                </div>
                              </div>

                              {selectedTransaction.verification_data && (
                                <div>
                                  <Label>Verification Data</Label>
                                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                                    {JSON.stringify(selectedTransaction.verification_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Block */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Block className="w-5 h-5 mr-2" />
                Latest Block
              </CardTitle>
              <CardDescription>
                Most recent block added to the chain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blockchainStats?.last_block ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Block #{blockchainStats.last_block.block_number}</span>
                    <Badge className="bg-green-500 text-white">Latest</Badge>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Block Hash</Label>
                    <div className="font-mono text-sm bg-muted p-2 rounded flex items-center justify-between">
                      {formatHash(blockchainStats.last_block.block_hash, 16)}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(blockchainStats.last_block.block_hash, 'Block hash')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Transactions</Label>
                      <div className="text-lg font-bold">{blockchainStats.last_block.transactions_count}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Timestamp</Label>
                      <div className="text-sm">{new Date(blockchainStats.last_block.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No blocks found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Blocks */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card mb-8">
          <CardHeader>
            <CardTitle>Recent Blocks</CardTitle>
            <CardDescription>
              Latest blocks in the EcoLedger blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBlocks.length > 0 ? (
                recentBlocks.map((block) => (
                  <div key={block.block_number} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Block className="w-4 h-4 text-primary" />
                        <span className="font-medium">Block #{block.block_number}</span>
                      </div>
                      <div className="font-mono text-sm text-muted-foreground">
                        {formatHash(block.block_hash)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{block.transactions_count} transactions</span>
                      <span>{new Date(block.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No recent blocks found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carbon Credits */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
          <CardHeader>
            <CardTitle>Active Carbon Credits</CardTitle>
            <CardDescription>
              Carbon credits currently available on the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {carbonCredits.length > 0 ? (
                carbonCredits.map((credit) => (
                  <div key={credit.credit_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{credit.credit_id}</h4>
                        <p className="text-sm text-muted-foreground">{credit.project_location}</p>
                      </div>
                      {getScoreBadge(credit.verification_score)}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Credits:</span>
                        <div className="font-medium">{credit.credits_amount.toFixed(2)} tons</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trees:</span>
                        <div className="font-medium">{credit.tree_count}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CO₂ Absorbed:</span>
                        <div className="font-medium">{credit.co2_absorbed.toFixed(0)} kg/yr</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <div className="font-medium">${credit.price_per_credit}/credit</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        Issued: {new Date(credit.issuance_date).toLocaleDateString()} • 
                        Owner: {credit.owner_id}
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Total Value: ${credit.market_value.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No carbon credits found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlockchainLedger;