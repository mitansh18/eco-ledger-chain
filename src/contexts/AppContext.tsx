import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AIModelScores {
  yolov8_score: number; // 0-100 (environmental impact detection)
  ndvi_score: number; // 0-100 (vegetation health)
  co2_score: number; // 0-100 (CO₂ estimation)
}

export interface EcoLedgerScore {
  model_scores: AIModelScores;
  combined_score: number; // 0-100 weighted average
  classification: 'High' | 'Medium' | 'Low'; // environmental impact
  recommendation: string;
}

export interface PlantationData {
  id: string;
  ngoId: string;
  ngoName: string;
  mangroveCount: number;
  location: string;
  coordinates: { lat: number; lng: number };
  imageUrl: string;
  timestamp: Date;
  creditsEarned: number;
  status: 'pending' | 'verified' | 'rejected';
  ecoScore?: EcoLedgerScore; // AI-generated scoring
}

export interface Transaction {
  id: string;
  type: 'earned' | 'purchased' | 'verified';
  ngoId: string;
  buyerId?: string;
  credits: number;
  timestamp: Date;
  blockchainHash: string;
}

export interface User {
  id: string;
  name: string;
  type: 'ngo' | 'buyer' | 'admin';
  email: string;
}

interface AppContextType {
  currentUser: User | null;
  plantations: PlantationData[];
  transactions: Transaction[];
  availableCredits: PlantationData[];
  login: (user: User) => void;
  logout: () => void;
  addPlantation: (data: Omit<PlantationData, 'id' | 'timestamp' | 'creditsEarned' | 'status'>) => void;
  verifyPlantation: (id: string) => void;
  purchaseCredits: (plantationId: string, buyerId: string, buyerName: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const mockPlantations: PlantationData[] = [
  {
    id: '1',
    ngoId: 'ngo-1',
    ngoName: 'Green Earth Foundation',
    mangroveCount: 150,
    location: 'Sundarbans, Bangladesh',
    coordinates: { lat: 21.9497, lng: 89.1833 },
    imageUrl: '/api/placeholder/400/300',
    timestamp: new Date('2024-01-15'),
    creditsEarned: 1.3,
    status: 'verified',
    ecoScore: {
      model_scores: {
        yolov8_score: 82.5,
        ndvi_score: 78.9,
        co2_score: 85.2
      },
      combined_score: 82.1,
      classification: 'High',
      recommendation: 'Excellent environmental impact! This plantation shows strong CO₂ absorption potential and healthy vegetation growth.'
    }
  },
  {
    id: '2',
    ngoId: 'ngo-2',
    ngoName: 'Ocean Guardians',
    mangroveCount: 200,
    location: 'Florida Everglades, USA',
    coordinates: { lat: 25.3518, lng: -80.6767 },
    imageUrl: '/api/placeholder/400/300',
    timestamp: new Date('2024-01-20'),
    creditsEarned: 1.7,
    status: 'verified',
    ecoScore: {
      model_scores: {
        yolov8_score: 87.1,
        ndvi_score: 84.3,
        co2_score: 79.8
      },
      combined_score: 84.2,
      classification: 'High',
      recommendation: 'Excellent environmental impact! This plantation shows strong CO₂ absorption potential and healthy vegetation growth.'
    }
  },
  {
    id: '3',
    ngoId: 'ngo-1',
    ngoName: 'Green Earth Foundation',
    mangroveCount: 100,
    location: 'Mangrove Bay, Philippines',
    coordinates: { lat: 14.5995, lng: 120.9842 },
    imageUrl: '/api/placeholder/400/300',
    timestamp: new Date('2024-01-25'),
    creditsEarned: 0.7,
    status: 'pending',
    ecoScore: {
      model_scores: {
        yolov8_score: 72.4,
        ndvi_score: 68.7,
        co2_score: 71.9
      },
      combined_score: 71.0,
      classification: 'Medium',
      recommendation: 'Good environmental impact. Consider expanding plantation area for maximum carbon credit potential.'
    }
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'earned',
    ngoId: 'ngo-1',
    credits: 1.5,
    timestamp: new Date('2024-01-15'),
    blockchainHash: '0xA23F9B8C7D6E5F4A3B2C1D0E9F8A7B6C5D4E3F2A1B0C9D8E'
  },
  {
    id: '2',
    type: 'verified',
    ngoId: 'ngo-1',
    credits: 1.5,
    timestamp: new Date('2024-01-16'),
    blockchainHash: '0xB34A0C9D8E7F6A5B4C3D2E1F0A9B8C7D6E5F4A3B2C1D0E9F'
  },
  {
    id: '3',
    type: 'purchased',
    ngoId: 'ngo-1',
    buyerId: 'buyer-1',
    credits: 1.5,
    timestamp: new Date('2024-01-17'),
    blockchainHash: '0xC45B1D0E9F8A7B6C5D4E3F2A1B0C9D8E7F6A5B4C3D2E1F0A'
  }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [plantations, setPlantations] = useState<PlantationData[]>(mockPlantations);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const availableCredits = plantations.filter(p => p.status === 'verified');

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // AI Scoring simulation function
  const generateAIScore = (mangroveCount: number, location: string, coordinates: { lat: number; lng: number }): EcoLedgerScore => {
    // Simulate AI model scores based on plantation data
    const yolov8_score = Math.min(100, Math.max(20, 60 + (mangroveCount / 10) + Math.random() * 20)); // Environmental impact detection
    const ndvi_score = Math.min(100, Math.max(30, 70 + (mangroveCount / 15) + Math.random() * 15)); // Vegetation health
    const co2_score = Math.min(100, Math.max(25, 65 + (mangroveCount / 12) + Math.random() * 18)); // CO₂ estimation
    
    // Weighted average: YOLOv8 35%, NDVI 35%, CO₂ 30%
    const combined_score = Math.round((yolov8_score * 0.35 + ndvi_score * 0.35 + co2_score * 0.30) * 10) / 10;
    
    let classification: 'High' | 'Medium' | 'Low';
    let recommendation: string;
    
    if (combined_score >= 80) {
      classification = 'High';
      recommendation = 'Excellent environmental impact! This plantation shows strong CO₂ absorption potential and healthy vegetation growth.';
    } else if (combined_score >= 60) {
      classification = 'Medium';
      recommendation = 'Good environmental impact. Consider expanding plantation area for maximum carbon credit potential.';
    } else {
      classification = 'Low';
      recommendation = 'Moderate environmental impact. Additional verification may be needed to assess long-term sustainability.';
    }
    
    return {
      model_scores: {
        yolov8_score: Math.round(yolov8_score * 10) / 10,
        ndvi_score: Math.round(ndvi_score * 10) / 10,
        co2_score: Math.round(co2_score * 10) / 10
      },
      combined_score,
      classification,
      recommendation
    };
  };

  const addPlantation = (data: Omit<PlantationData, 'id' | 'timestamp' | 'creditsEarned' | 'status' | 'ecoScore'>) => {
    // Generate AI scoring for the plantation
    const ecoScore = generateAIScore(data.mangroveCount, data.location, data.coordinates);
    
    // Calculate credits based on AI score instead of simple count
    const baseCredits = data.mangroveCount / 100; // Base calculation
    const scoreMultiplier = ecoScore.combined_score / 100; // AI score multiplier
    const finalCredits = Math.round(baseCredits * scoreMultiplier * 10) / 10;
    
    const newPlantation: PlantationData = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date(),
      creditsEarned: finalCredits,
      status: 'pending',
      ecoScore
    };

    setPlantations(prev => [...prev, newPlantation]);

    // Add transaction for earned credits
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'earned',
      ngoId: data.ngoId,
      credits: newPlantation.creditsEarned,
      timestamp: new Date(),
      blockchainHash: '0x' + Math.random().toString(16).substr(2, 40).toUpperCase()
    };

    setTransactions(prev => [...prev, newTransaction]);
  };

  const verifyPlantation = (id: string) => {
    setPlantations(prev => 
      prev.map(p => p.id === id ? { ...p, status: 'verified' as const } : p)
    );

    const plantation = plantations.find(p => p.id === id);
    if (plantation) {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'verified',
        ngoId: plantation.ngoId,
        credits: plantation.creditsEarned,
        timestamp: new Date(),
        blockchainHash: '0x' + Math.random().toString(16).substr(2, 40).toUpperCase()
      };

      setTransactions(prev => [...prev, newTransaction]);
    }
  };

  const purchaseCredits = (plantationId: string, buyerId: string, buyerName: string) => {
    const plantation = plantations.find(p => p.id === plantationId);
    if (plantation) {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'purchased',
        ngoId: plantation.ngoId,
        buyerId,
        credits: plantation.creditsEarned,
        timestamp: new Date(),
        blockchainHash: '0x' + Math.random().toString(16).substr(2, 40).toUpperCase()
      };

      setTransactions(prev => [...prev, newTransaction]);

      // Remove from available credits (simulate purchase)
      setPlantations(prev => prev.filter(p => p.id !== plantationId));
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      plantations,
      transactions,
      availableCredits,
      login,
      logout,
      addPlantation,
      verifyPlantation,
      purchaseCredits
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};