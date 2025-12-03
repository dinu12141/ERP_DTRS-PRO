import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import Contacts from './pages/Contacts';
import Leads from './pages/Leads';
import Jobs from './pages/Jobs';
import Dispatch from './pages/Dispatch';
import Invoices from './pages/Invoices';
import Inventory from './pages/Inventory';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crm/partners" element={<Partners />} />
            <Route path="/crm/contacts" element={<Contacts />} />
            <Route path="/crm/leads" element={<Leads />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/dispatch" element={<Dispatch />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
