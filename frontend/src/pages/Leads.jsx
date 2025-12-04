import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, MapPin, Phone, Mail, Target, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    source: 'web_form',
    distance: 0,
    roofPitch: 6,
    systemAge: 0,
    estimatedValue: 0,
    status: 'New',
    notes: '',
    assignedTo: ''
  });

  const loadLeads = async () => {
    const params = new URLSearchParams();
    if (filterStatus !== 'All') {
      params.append('status', filterStatus);
    }
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const res = await fetch(`${API_BASE}/leads?${params.toString()}`);
    const data = await res.json();
    setLeads(data);
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenNew = () => {
    setEditingLead(null);
    setFormValues({
      customerName: '',
      email: '',
      phone: '',
      address: '',
      source: 'web_form',
      distance: 0,
      roofPitch: 6,
      systemAge: 0,
      estimatedValue: 0,
      status: 'New',
      notes: '',
      assignedTo: ''
    });
    setIsFormOpen(true);
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormValues({
      customerName: lead.customerName,
      email: lead.email,
      phone: lead.phone || '',
      address: lead.address,
      source: lead.source,
      distance: lead.distance,
      roofPitch: lead.roofPitch,
      systemAge: lead.systemAge,
      estimatedValue: lead.estimatedValue,
      status: lead.status,
      notes: lead.notes || '',
      assignedTo: lead.assignedTo || ''
    });
    setIsFormOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formValues,
      distance: Number(formValues.distance),
      roofPitch: Number(formValues.roofPitch),
      systemAge: Number(formValues.systemAge),
      estimatedValue: Number(formValues.estimatedValue)
    };

    const method = editingLead ? 'PUT' : 'POST';
    const url = editingLead ? `${API_BASE}/leads/${editingLead.id}` : `${API_BASE}/leads`;

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'sales'
      },
      body: JSON.stringify(payload)
    });

    setIsSubmitting(false);
    setIsFormOpen(false);
    await loadLeads();
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      New: 'bg-blue-100 text-blue-800',
      Contacted: 'bg-purple-100 text-purple-800',
      Qualified: 'bg-green-100 text-green-800',
      Lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600 mt-1">Track and qualify potential customers</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenNew}>
          <Plus size={20} className="mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search leads by name, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['All', 'New', 'Contacted', 'Qualified'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? 'bg-blue-600' : ''}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{lead.customerName}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Lead ID: {lead.id}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                  <div className="flex items-center gap-1">
                    <Target size={16} className={getScoreColor(lead.score || 0)} />
                    <span className={`text-lg font-bold ${getScoreColor(lead.score || 0)}`}>
                      {lead.score ?? '—'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>{lead.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{lead.email}</span>
                  </div>
                </div>

                {/* Lead Details */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Source</p>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.source.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="text-sm font-medium text-gray-900">{lead.distance} miles</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Roof Pitch</p>
                      <p className="text-sm font-medium text-gray-900">{lead.roofPitch}/12</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">System Age</p>
                      <p className="text-sm font-medium text-gray-900">{lead.systemAge} years</p>
                    </div>
                  </div>
                </div>

                {/* Financial */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Estimated Value</p>
                      <p className="text-xl font-bold text-green-600">
                        ${lead.estimatedValue.toLocaleString()}
                      </p>
                    </div>
                    {lead.assignedTo && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Assigned To</p>
                        <p className="text-sm font-medium text-blue-600">{lead.assignedTo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {lead.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 italic">{lead.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex gap-2">
                  <Button className="flex-1" variant="outline">
                    Contact
                  </Button>
                  <Button className="flex-1" variant="outline">
                    Convert to Job
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / Edit Lead Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Edit Lead' : 'Add Lead'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 max-h-[70vh] overflow-y-auto" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={formValues.customerName}
                  onChange={(e) => handleFormChange('customerName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formValues.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formValues.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label>Source</Label>
                <select
                  className="w-full border rounded-md h-9 px-2"
                  value={formValues.source}
                  onChange={(e) => handleFormChange('source', e.target.value)}
                >
                  <option value="web_form">Web Form</option>
                  <option value="phone">Phone</option>
                  <option value="partner_referral">Partner Referral</option>
                  <option value="field_rep">Field Rep</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={formValues.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Scoring inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Distance (miles)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formValues.distance}
                  onChange={(e) => handleFormChange('distance', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Roof Pitch (rise over 12)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formValues.roofPitch}
                  onChange={(e) => handleFormChange('roofPitch', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>System Age (years)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formValues.systemAge}
                  onChange={(e) => handleFormChange('systemAge', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Status & value */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <select
                  className="w-full border rounded-md h-9 px-2"
                  value={formValues.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Qualified</option>
                  <option>Lost</option>
                </select>
              </div>
              <div>
                <Label>Estimated Value ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formValues.estimatedValue}
                  onChange={(e) => handleFormChange('estimatedValue', e.target.value)}
                />
              </div>
              <div>
                <Label>Assigned To</Label>
                <Input
                  value={formValues.assignedTo}
                  onChange={(e) => handleFormChange('assignedTo', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formValues.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
