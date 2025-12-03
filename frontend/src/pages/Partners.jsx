import React, { useState } from 'react';
import { mockPartners } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Mail, Phone, MapPin, DollarSign, TrendingUp } from 'lucide-react';

const Partners = () => {
  const [partners] = useState(mockPartners);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPartners = partners.filter(
    (partner) =>
      partner.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      Active: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roofing Partners</h1>
          <p className="text-gray-600 mt-1">Manage your roofing partner accounts and relationships</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={20} className="mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search partners by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPartners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{partner.companyName}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{partner.type}</p>
                </div>
                <Badge className={getStatusColor(partner.status)}>{partner.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Company Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Tax ID / EIN</p>
                    <p className="text-sm font-medium text-gray-900">{partner.taxId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">GL Policy #</p>
                    <p className="text-sm font-medium text-gray-900">{partner.generalLiabilityPolicy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Workers Comp #</p>
                    <p className="text-sm font-medium text-gray-900">{partner.workersCompPolicy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Activity</p>
                    <p className="text-sm font-medium text-gray-900">{partner.lastActivity}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Primary Contacts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-2 border rounded-lg">
                      <p className="text-xs font-semibold text-blue-600">Owner</p>
                      <p className="text-sm font-medium text-gray-900">{partner.contacts.owner.name}</p>
                      <p className="text-xs text-gray-600">{partner.contacts.owner.email}</p>
                    </div>
                    <div className="p-2 border rounded-lg">
                      <p className="text-xs font-semibold text-purple-600">Production Manager</p>
                      <p className="text-sm font-medium text-gray-900">{partner.contacts.productionManager.name}</p>
                      <p className="text-xs text-gray-600">{partner.contacts.productionManager.email}</p>
                    </div>
                    <div className="p-2 border rounded-lg">
                      <p className="text-xs font-semibold text-green-600">Admin</p>
                      <p className="text-sm font-medium text-gray-900">{partner.contacts.admin.name}</p>
                      <p className="text-xs text-gray-600">{partner.contacts.admin.email}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{partner.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{partner.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>{partner.address}</span>
                  </div>
                </div>

                {/* Financial Settings */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Settings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Credit Limit</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${partner.creditLimit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current Balance</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${partner.currentBalance.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Commission Model</p>
                      <p className="text-sm font-medium text-gray-900">{partner.commissionModel}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {partner.commissionModel.includes('Percentage')
                          ? `${partner.commissionRate}% of profit`
                          : `$${partner.commissionRate}/kW`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Billing Method</p>
                      <p className="text-sm font-medium text-gray-900">{partner.billingMethod}</p>
                    </div>
                  </div>
                </div>

                {/* Certifications & Service Areas */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-1">
                        {partner.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Service Areas</p>
                      <div className="flex flex-wrap gap-1">
                        {partner.serviceAreas.map((area, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Total Jobs</p>
                        <p className="text-lg font-semibold text-gray-900">{partner.totalJobs}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Total Revenue</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${(partner.totalRevenue / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex gap-2">
                  <Button variant="outline" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Jobs
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

export default Partners;
