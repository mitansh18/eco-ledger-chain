'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Leaf, 
  BarChart3, 
  Upload, 
  ShoppingCart, 
  Database,
  Menu,
  X,
  TreePine,
  FileText
} from 'lucide-react'
import UploadPage from '@/components/UploadPage'
import DynamicUploadPage from '@/components/DynamicUploadPage'
import Dashboard from '@/components/Dashboard'
import Marketplace from '@/components/Marketplace'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dynamic')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'dynamic', name: 'Smart Dataset Upload', icon: Upload, description: 'Upload any dataset for intelligent verification' },
    { id: 'upload', name: 'Standard Upload', icon: FileText, description: 'Traditional mangrove project submission' },
    { id: 'dashboard', name: 'Verification Dashboard', icon: BarChart3, description: 'View verification results and scores' },
    { id: 'marketplace', name: 'Carbon Credits Marketplace', icon: ShoppingCart, description: 'Trade verified carbon credits' },
  ]

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dynamic':
        return <DynamicUploadPage />
      case 'upload':
        return <UploadPage />
      case 'dashboard':
        return <Dashboard />
      case 'marketplace':
        return <Marketplace />
      default:
        return <DynamicUploadPage />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EcoLedger</h1>
                <p className="text-sm text-gray-600">Carbon Credit Verification Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-left text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              AI-Powered Dynamic Dataset Verification
            </h2>
            <p className="text-xl text-primary-100 mb-6 max-w-3xl mx-auto">
              Upload ANY environmental dataset and let our intelligent AI system automatically detect, 
              analyze, and verify it using the most appropriate strategy - from tree detection to carbon estimation.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center space-x-2 bg-primary-500 bg-opacity-50 px-3 py-1 rounded-full">
                <TreePine className="w-4 h-4" />
                <span>Smart Detection</span>
              </div>
              <div className="flex items-center space-x-2 bg-primary-500 bg-opacity-50 px-3 py-1 rounded-full">
                <Leaf className="w-4 h-4" />
                <span>Dynamic Analysis</span>
              </div>
              <div className="flex items-center space-x-2 bg-primary-500 bg-opacity-50 px-3 py-1 rounded-full">
                <Database className="w-4 h-4" />
                <span>Any Dataset Type</span>
              </div>
              <div className="flex items-center space-x-2 bg-primary-500 bg-opacity-50 px-3 py-1 rounded-full">
                <FileText className="w-4 h-4" />
                <span>Intelligent Verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {renderActiveComponent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 EcoLedger. AI-powered carbon credit verification platform.</p>
            <p className="mt-2 text-sm">Built with Next.js, Flask, YOLOv8, and Hyperledger Fabric simulation.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}