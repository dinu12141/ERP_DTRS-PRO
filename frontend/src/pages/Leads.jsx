import React, { useState } from 'react';
import { mockLeads } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, MapPin, Phone, Mail, Target, Calendar, DollarSign } from 'lucide-react';

const Leads = () => {
  const [leads] = useState(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                    <Target size={16} className={getScoreColor(lead.score)} />
                    <span className={`text-lg font-bold ${getScoreColor(lead.score)}`}>
                      {lead.score}
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
                      <p className="text-sm font-medium text-gray-900">{lead.source}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="text-sm font-medium text-gray-900">{lead.distance} miles</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Roof Pitch</p>
                      <p className="text-sm font-medium text-gray-900">{lead.roofPitch}</p>
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

                {/* Dates */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} />
                    <span>Created: {lead.createdDate}</span>
                  </div>
                </div>

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
    </div>
  );
};

export default Leads;
