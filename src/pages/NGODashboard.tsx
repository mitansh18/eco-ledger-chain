import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Leaf, Upload, MapPin, Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const NGODashboard = () => {
  const navigate = useNavigate();
  const { currentUser, plantations, logout, addPlantation } = useApp();
  const [formData, setFormData] = useState({
    mangroveCount: '',
    location: '',
    coordinates: { lat: '', lng: '' },
    imageUrl: ''
  });

  if (!currentUser || currentUser.type !== 'ngo') {
    navigate('/');
    return null;
  }

  const userPlantations = plantations.filter(p => p.ngoId === currentUser.id);
  const totalCredits = userPlantations.reduce((sum, p) => sum + p.creditsEarned, 0);
  const verifiedCredits = userPlantations
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.creditsEarned, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.mangroveCount || !formData.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const lat = parseFloat(formData.coordinates.lat) || 0;
    const lng = parseFloat(formData.coordinates.lng) || 0;

    addPlantation({
      ngoId: currentUser.id,
      ngoName: currentUser.name,
      mangroveCount: parseInt(formData.mangroveCount),
      location: formData.location,
      coordinates: { lat, lng },
      imageUrl: formData.imageUrl || '/api/placeholder/400/300'
    });

    setFormData({
      mangroveCount: '',
      location: '',
      coordinates: { lat: '', lng: '' },
      imageUrl: ''
    });

    toast({
      title: "Success!",
      description: "Plantation data submitted for verification",
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
              <Leaf className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl font-bold">NGO Dashboard</h1>
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
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Stats Cards */}
          <div className="lg:col-span-2 grid md:grid-cols-3 gap-6">
            <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totalCredits.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Carbon Credits (CO₂ tons)</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Verified Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{verifiedCredits.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Available for Sale</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Plantations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{userPlantations.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Registered</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Plantation Form */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2 text-primary" />
                Register New Plantation
              </CardTitle>
              <CardDescription>
                Submit your mangrove plantation data for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="count">Number of Mangroves Planted *</Label>
                  <Input
                    id="count"
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.mangroveCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, mangroveCount: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Credit calculation: 100 mangroves = 1 carbon credit
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Sundarbans, Bangladesh"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      placeholder="e.g., 21.9497"
                      value={formData.coordinates.lat}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        coordinates: { ...prev.coordinates, lat: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      placeholder="e.g., 89.1833"
                      value={formData.coordinates.lng}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        coordinates: { ...prev.coordinates, lng: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="image">Proof Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload an image showing the planted mangroves
                  </p>
                </div>

                <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                  Submit for Verification
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Plantations History */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
            <CardHeader>
              <CardTitle>Your Plantations</CardTitle>
              <CardDescription>
                Track the status of your submitted plantations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPlantations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No plantations registered yet. Submit your first plantation!
                  </p>
                ) : (
                  userPlantations.map((plantation) => (
                    <div key={plantation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                          <span className="font-medium">{plantation.location}</span>
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
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;