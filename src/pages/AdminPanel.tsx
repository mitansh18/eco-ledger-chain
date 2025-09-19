import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, CheckCircle, XCircle, Clock, LogOut, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { currentUser, plantations, verifyPlantation, logout } = useApp();

  if (!currentUser || currentUser.type !== 'admin') {
    navigate('/');
    return null;
  }

  const pendingPlantations = plantations.filter(p => p.status === 'pending');
  const verifiedPlantations = plantations.filter(p => p.status === 'verified');
  const totalCredits = plantations.reduce((sum, p) => sum + p.creditsEarned, 0);

  const handleVerify = (id: string) => {
    verifyPlantation(id);
    toast({
      title: "Plantation Verified",
      description: "Credits are now available in the marketplace",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{pendingPlantations.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting Review</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{verifiedPlantations.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Approved Plantations</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalCredits.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">CO₂ Tons Earned</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total NGOs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {new Set(plantations.map(p => p.ngoId)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active Partners</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pending Verifications */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-warning" />
                Pending Verifications
              </CardTitle>
              <CardDescription>
                Review and approve plantation submissions from NGOs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPlantations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">All Caught Up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending verifications at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPlantations.map((plantation) => (
                    <div key={plantation.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{plantation.ngoName}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {plantation.location}
                          </div>
                        </div>
                        {getStatusBadge(plantation.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Mangroves:</span>
                          <span className="ml-2 font-medium">{plantation.mangroveCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Credits:</span>
                          <span className="ml-2 font-medium text-primary">{plantation.creditsEarned}</span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Submitted: {plantation.timestamp.toLocaleDateString()}
                      </div>

                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-sm text-muted-foreground">
                          GPS: {plantation.coordinates.lat.toFixed(4)}, {plantation.coordinates.lng.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Image verification available in full version
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleVerify(plantation.id)}
                          className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify & Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Request Changes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verified Plantations */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-success" />
                Verified Plantations
              </CardTitle>
              <CardDescription>
                Successfully verified and approved carbon credit projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedPlantations.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Verified Projects</h3>
                  <p className="text-sm text-muted-foreground">
                    Verified plantations will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {verifiedPlantations.map((plantation) => (
                    <div key={plantation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{plantation.ngoName}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {plantation.location}
                          </div>
                        </div>
                        {getStatusBadge(plantation.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Mangroves:</span>
                          <span className="ml-2 font-medium">{plantation.mangroveCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Credits:</span>
                          <span className="ml-2 font-medium text-primary">{plantation.creditsEarned}</span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Verified: {plantation.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;