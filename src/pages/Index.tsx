import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, ShieldCheck, TrendingUp, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import heroImage from '@/assets/hero-mangroves.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleLogin = (userType: 'ngo' | 'buyer' | 'admin') => {
    if (!formData.name || !formData.email) return;
    
    const user = {
      id: userType + '-' + Date.now(),
      name: formData.name,
      email: formData.email,
      type: userType
    };

    login(user);

    if (userType === 'admin') {
      navigate('/admin');
    } else if (userType === 'ngo') {
      navigate('/ngo-dashboard');
    } else {
      navigate('/buyer-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-secondary/80 to-primary/80" />
        <div className="absolute inset-0 opacity-20 bg-repeat bg-center" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
             }}>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-8">
            <Leaf className="h-16 w-16 text-white mr-4" />
            <div>
              <h1 className="text-6xl font-bold text-white tracking-tight">
                EcoLedger
              </h1>
              <p className="text-xl text-white/90 mt-2">
                Trustworthy Carbon, Transparent Future
              </p>
            </div>
          </div>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing carbon credit verification through blockchain technology. 
            Connect NGOs with buyers in a transparent, trustworthy marketplace.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center shadow-card border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Verified Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Every carbon credit is verified through our transparent blockchain system
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-card border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <MapPin className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>Location Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                GPS-verified plantation locations with satellite imagery proof
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-card border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-accent mx-auto mb-4" />
              <CardTitle>Impact Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Real-time tracking of environmental impact and carbon sequestration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Section */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Join EcoLedger</CardTitle>
              <CardDescription>
                Choose your role to get started with carbon credit trading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <Tabs defaultValue="ngo" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ngo">NGO</TabsTrigger>
                  <TabsTrigger value="buyer">Buyer</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ngo" className="mt-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Register plantation activities and earn verified carbon credits
                    </p>
                    <Button 
                      className="w-full gradient-primary text-primary-foreground"
                      onClick={() => handleLogin('ngo')}
                      disabled={!formData.name || !formData.email}
                    >
                      Continue as NGO
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="buyer" className="mt-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Purchase verified carbon credits from trusted NGO partners
                    </p>
                    <Button 
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleLogin('buyer')}
                      disabled={!formData.name || !formData.email}
                    >
                      Continue as Buyer
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="admin" className="mt-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Verify plantation activities and manage the platform
                    </p>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => handleLogin('admin')}
                      disabled={!formData.name || !formData.email}
                    >
                      Continue as Admin
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/blockchain-ledger')}
                  className="text-sm"
                >
                  View Blockchain Ledger →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;