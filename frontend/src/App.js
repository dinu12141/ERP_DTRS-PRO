import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContextFirebase';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import Contacts from './pages/Contacts';
import Leads from './pages/Leads';
import Jobs from './pages/Jobs';
import Dispatch from './pages/operations/Dispatch';
import Crews from './pages/operations/Crews';
import Vehicles from './pages/operations/Vehicles';
import Invoices from './pages/financial/Invoices';
import Inventory from './pages/Inventory';
import InventoryScanner from './pages/InventoryScanner';
import SKUManager from './pages/financial/SKUs';
import EstimateCalculator from './pages/financial/Estimates';
import FieldApp from './pages/field-app/FieldApp';
import TechHome from './pages/TechHome';
import TechJSA from './pages/TechJSA';
import TechDamageScan from './pages/TechDamageScan';
import TechDetach from './pages/TechDetach';
import TechReset from './pages/TechReset';
import HomeownerPortal from './pages/portals/HomeownerPortal';
import RooferPortal from './pages/portals/RooferPortal';
import Reporting from './pages/reporting/Reporting';
import Automation from './pages/automation/Automation';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Portal Routes - No Layout */}
            <Route
              path="/portal/homeowner"
              element={
                <ProtectedRoute allowedRoles={['homeowner']}>
                  <HomeownerPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/roofer"
              element={
                <ProtectedRoute allowedRoles={['partner']}>
                  <RooferPortal />
                </ProtectedRoute>
              }
            />
            
            {/* Technician Mobile App Routes - No Layout (standalone PWA) */}
            <Route
              path="/tech"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'crew_lead', 'technician']}>
                  <TechHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tech/jsa"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'crew_lead', 'technician']}>
                  <TechJSA />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tech/damage-scan"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'crew_lead', 'technician']}>
                  <TechDamageScan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tech/detach"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'crew_lead', 'technician']}>
                  <TechDetach />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tech/reset"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'crew_lead', 'technician']}>
                  <TechReset />
                </ProtectedRoute>
              }
            />
            
            {/* Main App Routes - With Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'crew_lead']}>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/crm/partners" element={<Partners />} />
                      <Route path="/crm/contacts" element={<Contacts />} />
                      <Route path="/crm/leads" element={<Leads />} />
                      <Route path="/jobs" element={<Jobs />} />
                      {/* Operations Routes */}
                      <Route path="/operations/dispatch" element={<Dispatch />} />
                      <Route path="/operations/crews" element={<Crews />} />
                      <Route path="/operations/vehicles" element={<Vehicles />} />
                      {/* Field App */}
                      <Route path="/field-app" element={<FieldApp />} />
                      {/* Inventory */}
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/inventory/scan" element={<InventoryScanner />} />
                      {/* Financial Routes */}
                      <Route path="/financial/invoices" element={<Invoices />} />
                      <Route path="/financial/estimates" element={<EstimateCalculator />} />
                      <Route path="/financial/skus" element={<SKUManager />} />
                      {/* Portal Routes */}
                      <Route path="/portals/homeowner" element={<HomeownerPortal />} />
                      <Route path="/portals/roofer" element={<RooferPortal />} />
                      {/* Reporting */}
                      <Route path="/reporting" element={<Reporting />} />
                      {/* Automation */}
                      <Route path="/automation" element={<Automation />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
