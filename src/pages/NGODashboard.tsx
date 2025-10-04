import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, Upload, MapPin, Clock, CheckCircle, XCircle, LogOut, FileImage, Zap, Activity, TreePine, DollarSign, Eye, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

// API Configuration
const API_CONFIG = {
  YOLOV8_API: 'http://localhost:5001',
  NDVI_API: 'http://localhost:5002',
  IOT_API: 'http://localhost:5003',
  CO2_API: 'http://localhost:5004',
  FINALSCORE_API: 'http://localhost:5005',
  LEDGER_API: 'http://localhost:5006'
};

interface VerificationResult {
  tree_count?: number;
  ndvi_score?: number;
  iot_score?: number;
  co2_absorbed?: number;
  final_score?: number;
  carbon_credits?: number;
  grade?: string;
  tx_hash?: string;
  credit_id?: string;
}

interface ProjectData {
  id: string;
  project_name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  claimed_trees: number;
  timestamp: string;
  status: 'processing' | 'verified' | 'failed';
  verification_result?: VerificationResult;
  files: {
    tree_image?: File;
    ndvi_image?: File;
    iot_data?: string;
  };
}

const NGODashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  
  const [formData, setFormData] = useState({
    project_name: '',
    location: '',
    coordinates: { lat: '', lng: '' },
    claimed_trees: '',
    tree_image: null as File | null,
    ndvi_image: null as File | null,
    iot_data: ''
  });

  const treeImageRef = useRef<HTMLInputElement>(null);
  const ndviImageRef = useRef<HTMLInputElement>(null);

  if (!currentUser || currentUser.type !== 'ngo') {
    navigate('/');
    return null;
  }

  const processingSteps = [
    { name: 'Tree Detection (YOLOv8)', icon: TreePine },
    { name: 'Vegetation Health (NDVI)', icon: Activity },
    { name: 'Environmental Data (IoT)', icon: Zap },
    { name: 'CO₂ Calculation', icon: Leaf },
    { name: 'Final Scoring', icon: CheckCircle },
    { name: 'Blockchain Storage', icon: DollarSign }
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'tree' | 'ndvi') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'tree') {
        setFormData(prev => ({ ...prev, tree_image: file }));
      } else {
        setFormData(prev => ({ ...prev, ndvi_image: file }));
      }
    }
  };

  const processVerification = async (projectData: ProjectData): Promise<VerificationResult> => {
    const results: any = {};
    
    try {
      // Step 1: YOLOv8 Tree Detection
      setProcessingStep(1);
      if (projectData.files.tree_image) {
        const treeFormData = new FormData();
        treeFormData.append('image', projectData.files.tree_image);
        treeFormData.append('claimed_trees', projectData.claimed_trees.toString());
        
        const treeResponse = await axios.post(`${API_CONFIG.YOLOV8_API}/treecount`, treeFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        results.tree_count = treeResponse.data.Tree_Count;
        results.tree_detection_data = treeResponse.data;
      } else {
        // Use demo data if no image
        const demoResponse = await axios.get(`${API_CONFIG.YOLOV8_API}/demo`);
        results.tree_count = demoResponse.data.Tree_Count;
        results.tree_detection_data = demoResponse.data;
      }

      // Step 2: NDVI Vegetation Health
      setProcessingStep(2);
      if (projectData.files.ndvi_image) {
        const ndviFormData = new FormData();
        ndviFormData.append('image', projectData.files.ndvi_image);
        
        const ndviResponse = await axios.post(`${API_CONFIG.NDVI_API}/ndvi`, ndviFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        results.ndvi_score = ndviResponse.data.NDVI_Score;
        results.ndvi_data = ndviResponse.data;
      } else {
        const demoResponse = await axios.get(`${API_CONFIG.NDVI_API}/demo`);
        results.ndvi_score = demoResponse.data.NDVI_Score;
        results.ndvi_data = demoResponse.data;
      }

      // Step 3: IoT Environmental Data
      setProcessingStep(3);
      if (projectData.files.iot_data) {
        const iotResponse = await axios.post(`${API_CONFIG.IOT_API}/iot`, {
          data: projectData.files.iot_data
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        results.iot_score = iotResponse.data.IoT_Score;
        results.iot_data = iotResponse.data;
      } else {
        const demoResponse = await axios.get(`${API_CONFIG.IOT_API}/demo`);
        results.iot_score = demoResponse.data.IoT_Score;
        results.iot_data = demoResponse.data;
      }

      // Step 4: CO₂ Calculation
      setProcessingStep(4);
      const co2Response = await axios.post(`${API_CONFIG.CO2_API}/co2`, {
        Tree_Count: results.tree_count
      });
      
      results.co2_absorbed = co2Response.data.CO2_absorbed_kg;
      results.co2_data = co2Response.data;

      // Step 5: Final Score Calculation
      setProcessingStep(5);
      const finalScoreResponse = await axios.post(`${API_CONFIG.FINALSCORE_API}/finalscore`, {
        Tree_Count: results.tree_count,
        Claimed_Trees: projectData.claimed_trees,
        NDVI_Score: results.ndvi_score,
        IoT_Score: results.iot_score,
        Audit_Check: 0.85, // Default audit score
        CO2_absorbed_kg: results.co2_absorbed
      });
      
      results.final_score = finalScoreResponse.data.Final_Score;
      results.carbon_credits = finalScoreResponse.data.Carbon_Credits;
      results.grade = finalScoreResponse.data.Grade;
      results.finalscore_data = finalScoreResponse.data;

      // Step 6: Store on Blockchain
      setProcessingStep(6);
      const ledgerResponse = await axios.post(`${API_CONFIG.LEDGER_API}/ledger/submit`, {
        ngo_id: currentUser.id,
        project_id: projectData.id,
        verification_data: {
          project_name: projectData.project_name,
          location: projectData.location,
          coordinates: projectData.coordinates,
          claimed_trees: projectData.claimed_trees,
          tree_count: results.tree_count,
          ndvi_score: results.ndvi_score,
          iot_score: results.iot_score,
          co2_absorbed: results.co2_absorbed,
          final_score: results.final_score,
          carbon_credits: results.carbon_credits,
          grade: results.grade,
          timestamp: projectData.timestamp
        }
      });

      results.tx_hash = ledgerResponse.data.tx_hash;
      results.report_hash = ledgerResponse.data.report_hash;
      results.block_number = ledgerResponse.data.block_number;

      // Issue carbon credits
      if (results.carbon_credits > 0) {
        const creditResponse = await axios.post(`${API_CONFIG.LEDGER_API}/ledger/issue`, {
          ngo_id: currentUser.id,
          project_id: projectData.id,
          credits_amount: results.carbon_credits,
          verification_score: results.final_score,
          co2_absorbed: results.co2_absorbed,
          tree_count: results.tree_count,
          project_location: projectData.location,
          verification_data: results.finalscore_data
        });

        results.credit_id = creditResponse.data.credit_id;
        results.credits_issued = creditResponse.data.credits_issued;
      }

      return results;

    } catch (error) {
      console.error('Verification process failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_name || !formData.location || !formData.claimed_trees) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep(0);

    const projectId = `PRJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newProject: ProjectData = {
      id: projectId,
      project_name: formData.project_name,
      location: formData.location,
      coordinates: {
        lat: parseFloat(formData.coordinates.lat) || 0,
        lng: parseFloat(formData.coordinates.lng) || 0
      },
      claimed_trees: parseInt(formData.claimed_trees),
      timestamp: new Date().toISOString(),
      status: 'processing',
      files: {
        tree_image: formData.tree_image,
        ndvi_image: formData.ndvi_image,
        iot_data: formData.iot_data || undefined
      }
    };

    // Add project to state
    setProjects(prev => [newProject, ...prev]);

    try {
      const verificationResult = await processVerification(newProject);
      
      // Update project with results
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, status: 'verified' as const, verification_result: verificationResult }
          : p
      ));

      toast({
        title: "Verification Complete!",
        description: `Project verified successfully. ${verificationResult.carbon_credits?.toFixed(2)} carbon credits earned.`,
      });

      // Reset form
      setFormData({
        project_name: '',
        location: '',
        coordinates: { lat: '', lng: '' },
        claimed_trees: '',
        tree_image: null,
        ndvi_image: null,
        iot_data: ''
      });

      if (treeImageRef.current) treeImageRef.current.value = '';
      if (ndviImageRef.current) ndviImageRef.current.value = '';

    } catch (error) {
      console.error('Verification failed:', error);
      
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, status: 'failed' as const }
          : p
      ));

      toast({
        title: "Verification Failed",
        description: "There was an error processing your project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep(0);
    }
  };

  const totalCreditsEarned = projects
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + (p.verification_result?.carbon_credits || 0), 0);

  const totalTreesVerified = projects
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + (p.verification_result?.tree_count || 0), 0);

  const getStatusBadge = (status: ProjectData['status']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
  };

  const getGradeBadge = (grade: string) => {
    const gradeColors = {
      'A+': 'bg-green-600 text-white',
      'A': 'bg-green-500 text-white',
      'B+': 'bg-blue-500 text-white',
      'B': 'bg-blue-400 text-white',
      'C': 'bg-yellow-500 text-white',
      'D': 'bg-red-500 text-white'
    };
    
    return (
      <Badge className={gradeColors[grade as keyof typeof gradeColors] || 'bg-gray-500 text-white'}>
        Grade {grade}
      </Badge>
    );
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
                <h1 className="text-2xl font-bold">EcoLedger NGO Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {currentUser.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/blockchain-ledger')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Ledger
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/buyer-dashboard')}
              >
                Marketplace
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{projects.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Submitted for verification</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Trees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{totalTreesVerified}</div>
              <p className="text-xs text-muted-foreground mt-1">AI-verified mangroves</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carbon Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalCreditsEarned.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Available for sale</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Market Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${(totalCreditsEarned * 15.5).toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Estimated revenue</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Project Submission Form */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2 text-primary" />
                Submit New Mangrove Project
              </CardTitle>
              <CardDescription>
                Upload your project data for AI verification and carbon credit issuance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    placeholder="e.g., Sundarbans Restoration Phase 1"
                    value={formData.project_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Project Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Sundarbans, Bangladesh"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      placeholder="21.9497"
                      value={formData.coordinates.lat}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        coordinates: { ...prev.coordinates, lat: e.target.value }
                      }))}
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      placeholder="89.1833"
                      value={formData.coordinates.lng}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        coordinates: { ...prev.coordinates, lng: e.target.value }
                      }))}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="claimed_trees">Claimed Trees Planted *</Label>
                  <Input
                    id="claimed_trees"
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.claimed_trees}
                    onChange={(e) => setFormData(prev => ({ ...prev, claimed_trees: e.target.value }))}
                    required
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of mangrove trees you claim to have planted
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tree_image">Tree Image (for YOLOv8 Detection)</Label>
                  <Input
                    id="tree_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'tree')}
                    ref={treeImageRef}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload drone/satellite image for AI tree counting (optional - demo data used if not provided)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ndvi_image">NDVI/Satellite Image</Label>
                  <Input
                    id="ndvi_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'ndvi')}
                    ref={ndviImageRef}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload multispectral imagery for vegetation health analysis (optional)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="iot_data">IoT Sensor Data (JSON/CSV)</Label>
                  <Textarea
                    id="iot_data"
                    placeholder='{"soil_moisture": 75, "temperature": 28, "salinity": 20, "ph": 7.2}'
                    value={formData.iot_data}
                    onChange={(e) => setFormData(prev => ({ ...prev, iot_data: e.target.value }))}
                    disabled={isProcessing}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Environmental sensor data in JSON or CSV format (optional - demo data used if not provided)
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Submit for AI Verification'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Processing Status / Project History */}
          <div className="space-y-6">
            {/* Processing Status */}
            {isProcessing && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">AI Verification in Progress</CardTitle>
                  <CardDescription className="text-blue-600">
                    Processing your mangrove project through our AI pipeline...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={(processingStep / 6) * 100} className="w-full" />
                    <div className="space-y-2">
                      {processingSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index + 1 === processingStep;
                        const isComplete = index + 1 < processingStep;
                        
                        return (
                          <div 
                            key={index}
                            className={`flex items-center p-2 rounded ${
                              isActive ? 'bg-blue-100 text-blue-800' : 
                              isComplete ? 'bg-green-100 text-green-800' : 
                              'text-gray-500'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mr-2 ${
                              isActive ? 'animate-pulse' : ''
                            }`} />
                            <span className="text-sm font-medium">{step.name}</span>
                            {isComplete && <CheckCircle className="w-4 h-4 ml-auto text-green-600" />}
                            {isActive && <Clock className="w-4 h-4 ml-auto animate-spin" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project History */}
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
              <CardHeader>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>
                  Track verification status and earned carbon credits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <TreePine className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No projects submitted yet.</p>
                      <p className="text-sm">Submit your first mangrove project to get started!</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{project.project_name}</h4>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              {project.location}
                            </div>
                          </div>
                          {getStatusBadge(project.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Claimed Trees:</span>
                            <span className="ml-2 font-medium">{project.claimed_trees}</span>
                          </div>
                          {project.verification_result && (
                            <div>
                              <span className="text-muted-foreground">Verified Trees:</span>
                              <span className="ml-2 font-medium text-green-600">
                                {project.verification_result.tree_count}
                              </span>
                            </div>
                          )}
                        </div>

                        {project.verification_result && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Verification Results:</span>
                              {project.verification_result.grade && getGradeBadge(project.verification_result.grade)}
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-muted-foreground">Trees</div>
                                <div className="font-medium">{project.verification_result.tree_count}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-muted-foreground">NDVI</div>
                                <div className="font-medium">{project.verification_result.ndvi_score?.toFixed(3)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-muted-foreground">IoT</div>
                                <div className="font-medium">{project.verification_result.iot_score?.toFixed(3)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-muted-foreground">Score</div>
                                <div className="font-medium">{project.verification_result.final_score?.toFixed(3)}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <span className="text-muted-foreground">Carbon Credits:</span>
                                <span className="ml-2 font-medium text-green-600">
                                  {project.verification_result.carbon_credits?.toFixed(2)} tons
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">CO₂ Absorbed:</span>
                                <span className="ml-2 font-medium">
                                  {project.verification_result.co2_absorbed?.toFixed(0)} kg/yr
                                </span>
                              </div>
                            </div>

                            {project.verification_result.tx_hash && (
                              <div className="text-xs text-muted-foreground">
                                <span>Blockchain TX: </span>
                                <span className="font-mono">{project.verification_result.tx_hash.substring(0, 20)}...</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          Submitted: {new Date(project.timestamp).toLocaleDateString()}
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
    </div>
  );
};

export default NGODashboard;