import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, MapPin, CheckCircle, LogOut, Leaf, DollarSign, TrendingUp, Filter, Search, Calendar, Award, TreePine, Activity, Zap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

// API Configuration
const API_CONFIG = {
  LEDGER_API: 'http://localhost:5006'
};

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

interface Purchase {
  id: string;
  credit_id: string;
  credits_purchased: number;
  total_cost: number;
  purchase_date: string;
  project_location: string;
  verification_score: number;
}

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();
  const [availableCredits, setAvailableCredits] = useState<CarbonCredit[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedCredit, setSelectedCredit] = useState<CarbonCredit | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  if (!currentUser || currentUser.type !== 'buyer') {
    navigate('/');
    return null;
  }

  useEffect(() => {
    loadAvailableCredits();
    loadMyPurchases();
  }, []);

  const loadAvailableCredits = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.LEDGER_API}/ledger/credits?status=active`);
      const credits = response.data.credits.filter((credit: CarbonCredit) => 
        credit.owner_id !== currentUser.id && // Don't show user's own credits
        credit.credits_amount > 0 // Only show credits with available amount
      );
      setAvailableCredits(credits);
    } catch (error) {
      console.error('Error loading available credits:', error);
      toast({
        title: "Error",
        description: "Failed to load available credits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMyPurchases = () => {
    // Load purchases from localStorage (in a real app, this would be from a backend)
    const purchases = JSON.parse(localStorage.getItem(`purchases_${currentUser.id}`) || '[]');
    setMyPurchases(purchases);
  };

  const filteredCredits = availableCredits.filter(credit => {
    const matchesSearch = credit.project_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credit.ngo_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScore = credit.verification_score >= minScore / 100;
    const matchesPrice = credit.price_per_credit <= maxPrice;
    
    return matchesSearch && matchesScore && matchesPrice;
  });

  const handlePurchase = async () => {
    if (!selectedCredit || !purchaseAmount) return;

    const amount = parseFloat(purchaseAmount);
    if (amount <= 0 || amount > selectedCredit.credits_amount) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid purchase amount",
        variant: "destructive"
      });
      return;
    }

    setIsPurchasing(true);

    try {
      // Transfer credits via ledger API
      const transferResponse = await axios.post(`${API_CONFIG.LEDGER_API}/ledger/transfer`, {
        credit_id: selectedCredit.credit_id,
        from_owner: selectedCredit.owner_id,
        to_owner: currentUser.id,
        credits_amount: amount,
        transfer_price: selectedCredit.price_per_credit
      });

      if (transferResponse.data.transferred) {
        // Record purchase locally
        const newPurchase: Purchase = {
          id: transferResponse.data.transfer_id,
          credit_id: selectedCredit.credit_id,
          credits_purchased: amount,
          total_cost: amount * selectedCredit.price_per_credit,
          purchase_date: new Date().toISOString(),
          project_location: selectedCredit.project_location,
          verification_score: selectedCredit.verification_score
        };

        const updatedPurchases = [...myPurchases, newPurchase];
        setMyPurchases(updatedPurchases);
        localStorage.setItem(`purchases_${currentUser.id}`, JSON.stringify(updatedPurchases));

        // Refresh available credits
        loadAvailableCredits();

        toast({
          title: "Purchase Successful!",
          description: `Purchased ${amount} carbon credits for $${(amount * selectedCredit.price_per_credit).toFixed(2)}`,
        });

        // Reset form
        setSelectedCredit(null);
        setPurchaseAmount('');
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      const errorMessage = error.response?.data?.error || 'Purchase failed';
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const totalCreditsOwned = myPurchases.reduce((sum, purchase) => sum + purchase.credits_purchased, 0);
  const totalSpent = myPurchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
  const averageScore = myPurchases.length > 0 
    ? myPurchases.reduce((sum, purchase) => sum + purchase.verification_score, 0) / myPurchases.length 
    : 0;

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return <Badge className="bg-green-600 text-white">A+ Premium</Badge>;
    if (score >= 0.8) return <Badge className="bg-green-500 text-white">A High Quality</Badge>;
    if (score >= 0.7) return <Badge className="bg-blue-500 text-white">B+ Good</Badge>;
    if (score >= 0.6) return <Badge className="bg-blue-400 text-white">B Satisfactory</Badge>;
    return <Badge className="bg-yellow-500 text-white">C Marginal</Badge>;
  };

  const getImpactStats = (credit: CarbonCredit) => {
    const co2InTons = credit.co2_absorbed / 1000;
    const carsOffRoad = Math.round(co2InTons / 4.6); // Average car emits 4.6 tons CO2/year
    const treesEquivalent = Math.round(co2InTons / 0.02177); // Tree absorbs ~21.77 kg CO2/year
    
    return { co2InTons, carsOffRoad, treesEquivalent };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading marketplace...</p>
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
              <ShoppingCart className="h-8 w-8 text-secondary mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Carbon Credit Marketplace</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {currentUser.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/blockchain-ledger')}
              >
                View Ledger
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/ngo-dashboard')}
              >
                NGO Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { logout(); navigate('/'); }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Portfolio Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{totalCreditsOwned.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Carbon credits owned</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">${totalSpent.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total purchases</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{(averageScore * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Portfolio quality</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{availableCredits.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Credits for purchase</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="search">Search Projects</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Location, NGO name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="minScore">Min. Quality Score</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="minScore"
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{minScore}%</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="maxPrice">Max Price per Credit</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="maxPrice"
                    type="range"
                    min="5"
                    max="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">${maxPrice}</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Results</Label>
                <div className="text-2xl font-bold text-primary">{filteredCredits.length}</div>
                <p className="text-xs text-muted-foreground">Credits match filters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Grid */}
        <div className="grid gap-6">
          {filteredCredits.length === 0 ? (
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
              <CardContent className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {availableCredits.length === 0 ? 'No Credits Available' : 'No Credits Match Your Filters'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {availableCredits.length === 0 
                    ? 'Check back later for new verified carbon credits from our NGO partners.'
                    : 'Try adjusting your search criteria to see more results.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCredits.map((credit) => {
              const impactStats = getImpactStats(credit);
              
              return (
                <Card key={credit.credit_id} className="bg-card/80 backdrop-blur-sm border-0 shadow-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Project Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">Project {credit.project_id}</h3>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {credit.project_location}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              Issued: {new Date(credit.issuance_date).toLocaleDateString()}
                            </div>
                          </div>
                          {getScoreBadge(credit.verification_score)}
                        </div>

                        {/* Verification Metrics */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                          <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                            <Award className="w-4 h-4 mr-2" />
                            AI Verification Results
                          </h4>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <TreePine className="w-6 h-6 text-green-600 mx-auto mb-1" />
                              <div className="text-lg font-bold text-green-600">{credit.tree_count}</div>
                              <div className="text-xs text-muted-foreground">Trees Verified</div>
                            </div>
                            <div className="text-center">
                              <Activity className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                              <div className="text-lg font-bold text-blue-600">{(credit.verification_score * 100).toFixed(0)}%</div>
                              <div className="text-xs text-muted-foreground">Quality Score</div>
                            </div>
                            <div className="text-center">
                              <Leaf className="w-6 h-6 text-green-700 mx-auto mb-1" />
                              <div className="text-lg font-bold text-green-700">{impactStats.co2InTons.toFixed(1)}t</div>
                              <div className="text-xs text-muted-foreground">CO₂ Absorbed</div>
                            </div>
                          </div>

                          {/* Environmental Impact */}
                          <div className="pt-2 border-t border-muted-foreground/20">
                            <p className="text-xs text-muted-foreground mb-2">Environmental Impact Equivalent:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>🚗 {impactStats.carsOffRoad} cars off road for 1 year</div>
                              <div>🌱 {impactStats.treesEquivalent} tree seedlings grown for 10 years</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Purchase Section */}
                      <div className="space-y-4">
                        <div className="bg-primary/5 rounded-lg p-4 text-center">
                          <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
                          <div className="text-3xl font-bold text-primary mb-2">{credit.credits_amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">tons CO₂</div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-sm text-green-700 mb-1">Price per Credit</div>
                          <div className="text-2xl font-bold text-green-700 mb-2">${credit.price_per_credit}</div>
                          <div className="text-xs text-green-600">Total Value: ${credit.market_value.toFixed(0)}</div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full gradient-primary text-primary-foreground"
                              onClick={() => {
                                setSelectedCredit(credit);
                                setPurchaseAmount('');
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Purchase Credits
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Purchase Carbon Credits</DialogTitle>
                              <DialogDescription>
                                Purchase verified carbon credits from project {selectedCredit?.project_id}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedCredit && (
                              <div className="space-y-4">
                                <div className="bg-muted/30 rounded-lg p-4">
                                  <h4 className="font-medium mb-2">Project Details</h4>
                                  <div className="text-sm space-y-1">
                                    <div>Location: {selectedCredit.project_location}</div>
                                    <div>Quality Score: {(selectedCredit.verification_score * 100).toFixed(0)}%</div>
                                    <div>Available: {selectedCredit.credits_amount.toFixed(2)} credits</div>
                                    <div>Price: ${selectedCredit.price_per_credit} per credit</div>
                                  </div>
                                </div>

                                <div className="grid gap-2">
                                  <Label htmlFor="purchaseAmount">Credits to Purchase</Label>
                                  <Input
                                    id="purchaseAmount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={selectedCredit.credits_amount}
                                    placeholder="Enter amount"
                                    value={purchaseAmount}
                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Maximum: {selectedCredit.credits_amount.toFixed(2)} credits
                                  </p>
                                </div>

                                {purchaseAmount && (
                                  <div className="bg-green-50 rounded-lg p-4">
                                    <h4 className="font-medium text-green-800 mb-2">Purchase Summary</h4>
                                    <div className="text-sm space-y-1">
                                      <div className="flex justify-between">
                                        <span>Credits:</span>
                                        <span>{parseFloat(purchaseAmount || '0').toFixed(2)} tons</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Price per credit:</span>
                                        <span>${selectedCredit.price_per_credit}</span>
                                      </div>
                                      <div className="flex justify-between font-medium text-green-800 border-t pt-1">
                                        <span>Total Cost:</span>
                                        <span>${(parseFloat(purchaseAmount || '0') * selectedCredit.price_per_credit).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <Button 
                                  onClick={handlePurchase}
                                  disabled={!purchaseAmount || isPurchasing || parseFloat(purchaseAmount || '0') <= 0}
                                  className="w-full"
                                >
                                  {isPurchasing ? (
                                    <>
                                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <DollarSign className="w-4 h-4 mr-2" />
                                      Confirm Purchase
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <div className="text-xs text-muted-foreground text-center">
                          <p>✓ Blockchain verified</p>
                          <p>✓ AI quality assured</p>
                          <p>✓ Instant transfer</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* My Purchases */}
        {myPurchases.length > 0 && (
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card mt-8">
            <CardHeader>
              <CardTitle>My Carbon Credit Portfolio</CardTitle>
              <CardDescription>
                Your purchased carbon credits and environmental impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myPurchases.map((purchase) => (
                  <div key={purchase.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{purchase.project_location}</h4>
                      <div className="text-sm text-muted-foreground">
                        Purchased: {new Date(purchase.purchase_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{purchase.credits_purchased.toFixed(2)} credits</div>
                      <div className="text-sm text-muted-foreground">${purchase.total_cost.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;