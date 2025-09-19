import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    creditsEarned: 1.5,
    status: 'verified'
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
    creditsEarned: 2.0,
    status: 'verified'
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
    creditsEarned: 1.0,
    status: 'pending'
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

  const addPlantation = (data: Omit<PlantationData, 'id' | 'timestamp' | 'creditsEarned' | 'status'>) => {
    const newPlantation: PlantationData = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date(),
      creditsEarned: Math.round((data.mangroveCount / 100) * 10) / 10, // 100 mangroves = 1 credit
      status: 'pending'
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