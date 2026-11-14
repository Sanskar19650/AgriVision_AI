import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AgriProvider, useAgri } from './context/AgriContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { LandMappingPage } from './pages/LandMappingPage';
import { SoilMonitoringPage } from './pages/SoilMonitoringPage';
import { CropsPage } from './pages/CropsPage';
import {
  CropRecommendationPage,
  DamageDetectionPage,
  DiseaseDetectionPage,
} from './pages/AiToolsPages';
import {
  FertilizerPage,
  IrrigationPage,
  WeatherPage,
} from './pages/OperationsPages';
import {
  AdminPage,
  BlockchainPage,
  NotificationsPage,
  ProfilePage,
  ReportsPage,
} from './pages/GovernancePages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authReady, firebaseUser, isDemoMode } = useAgri();
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F5] text-sm text-[#546E7A]">
        Initializing AgriVision AI workspace...
      </div>
    );
  }
  if (!firebaseUser && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RootRoute() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (params.get('autostart') === '1') {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
}

export default function App() {
  return (
    <AgriProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/farms" element={<ProtectedRoute><FarmsPage /></ProtectedRoute>} />
          <Route path="/land-mapping" element={<ProtectedRoute><LandMappingPage /></ProtectedRoute>} />
          <Route path="/soil" element={<ProtectedRoute><SoilMonitoringPage /></ProtectedRoute>} />
          <Route path="/crops" element={<ProtectedRoute><CropsPage /></ProtectedRoute>} />
          <Route path="/disease-detection" element={<ProtectedRoute><DiseaseDetectionPage /></ProtectedRoute>} />
          <Route path="/damage-detection" element={<ProtectedRoute><DamageDetectionPage /></ProtectedRoute>} />
          <Route path="/crop-recommendation" element={<ProtectedRoute><CropRecommendationPage /></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><WeatherPage /></ProtectedRoute>} />
          <Route path="/irrigation" element={<ProtectedRoute><IrrigationPage /></ProtectedRoute>} />
          <Route path="/fertilizer" element={<ProtectedRoute><FertilizerPage /></ProtectedRoute>} />
          <Route path="/blockchain" element={<ProtectedRoute><BlockchainPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AgriProvider>
  );
}
