import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, MapPin, CheckCircle, LogOut, Leaf } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, availableCredits, purchaseCredits, logout } = useApp();

  if (!currentUser || currentUser.type !== 'buyer') {
    navigate('/');
    return null;
  }

  const handlePurchase = (plantationId: string) => {
    purchaseCredits(plantationId, currentUser.id, currentUser.name);
    toast({
      title: "Purchase Successful!",
      description: "Carbon credits have been added to your portfolio",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-secondary mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Buyer Dashboard</h1>
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
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {availableCredits.reduce((sum, credit) => sum + credit.creditsEarned, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Carbon Credits (CO₂ tons)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified NGOs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {new Set(availableCredits.map(c => c.ngoId)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Trusted Partners</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Plantations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{availableCredits.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for Purchase</p>
            </CardContent>
          </Card>
        </div>

        {/* Marketplace */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Leaf className="w-5 h-5 mr-2 text-primary" />
              Carbon Credit Marketplace
            </CardTitle>
            <CardDescription>
              Purchase verified carbon credits from trusted NGO partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableCredits.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Credits Available</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for new verified carbon credits from our NGO partners.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {availableCredits.map((credit) => (
                  <div key={credit.id} className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{credit.ngoName}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {credit.location}
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Mangroves Planted</div>
                        <div className="text-2xl font-bold text-primary">{credit.mangroveCount}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Carbon Credits</div>
                        <div className="text-2xl font-bold text-secondary">{credit.creditsEarned} tons</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Price Estimate</div>
                        <div className="text-2xl font-bold text-accent">${(credit.creditsEarned * 15).toFixed(0)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                        Registered: {credit.timestamp.toLocaleDateString()}
                      </div>
                      <Button 
                        onClick={() => handlePurchase(credit.id)}
                        className="gradient-primary text-primary-foreground"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Purchase Credits
                      </Button>
                    </div>

                    {/* Simulated Map Preview */}
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        GPS Location: {credit.coordinates.lat.toFixed(4)}, {credit.coordinates.lng.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        (Map integration available in full version)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyerDashboard;