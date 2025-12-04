import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Mail, Phone, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState({
    companyName: '',
    taxId: '',
    generalLiabilityPolicy: '',
    workersCompPolicy: '',
    email: '',
    phone: '',
    address: '',
    commissionModel: 'flat_fee_per_kw',
    commissionRate: 0,
    billingMethod: 'net_deduct',
    creditLimit: 0,
    status: 'Active',
    contacts: {
      owner: { name: '', email: '', phone: '' },
      productionManager: { name: '', email: '', phone: '' },
      admin: { name: '', email: '', phone: '' }
    },
    certifications: '',
    serviceAreas: ''
  });

  const loadPartners = async () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'All') {
      params.append('status', statusFilter);
    }
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const res = await fetch(`${API_BASE}/partners?${params.toString()}`);
    const data = await res.json();
    setPartners(data);
  };

  useEffect(() => {
    loadPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenNew = () => {
    setEditingPartner(null);
    setFormValues({
      companyName: '',
      taxId: '',
      generalLiabilityPolicy: '',
      workersCompPolicy: '',
      email: '',
      phone: '',
      address: '',
      commissionModel: 'flat_fee_per_kw',
      commissionRate: 0,
      billingMethod: 'net_deduct',
      creditLimit: 0,
      status: 'Active',
      contacts: {
        owner: { name: '', email: '', phone: '' },
        productionManager: { name: '', email: '', phone: '' },
        admin: { name: '', email: '', phone: '' }
      },
      certifications: '',
      serviceAreas: ''
    });
    setIsFormOpen(true);
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner);
    setFormValues({
      ...partner,
      certifications: (partner.certifications || []).join(', '),
      serviceAreas: (partner.serviceAreas || []).join(', ')
    });
    setIsFormOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (role, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [role]: {
          ...prev.contacts[role],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formValues,
      commissionRate: Number(formValues.commissionRate),
      creditLimit: Number(formValues.creditLimit),
      currentBalance: editingPartner?.currentBalance || 0,
      certifications: formValues.certifications
        ? formValues.certifications.split(',').map((c) => c.trim())
        : [],
      serviceAreas: formValues.serviceAreas
        ? formValues.serviceAreas.split(',').map((c) => c.trim())
        : []
    };

    const method = editingPartner ? 'PUT' : 'POST';
    const url = editingPartner
      ? `${API_BASE}/partners/${editingPartner.id}`
      : `${API_BASE}/partners`;

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'admin'
      },
      body: JSON.stringify(payload)
    });

    setIsSubmitting(false);
    setIsFormOpen(false);
    await loadPartners();
  };

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenNew}>
          <Plus size={20} className="mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search partners by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['All', 'Active', 'Pending', 'Inactive'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
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
                  <Button variant="outline" className="flex-1" onClick={() => handleEdit(partner)}>
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
      {/* Create / Edit Partner Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 max-h-[70vh] overflow-y-auto" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={formValues.companyName}
                  onChange={(e) => handleFormChange('companyName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Tax ID / EIN</Label>
                <Input
                  value={formValues.taxId}
                  onChange={(e) => handleFormChange('taxId', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>GL Policy #</Label>
                <Input
                  value={formValues.generalLiabilityPolicy}
                  onChange={(e) => handleFormChange('generalLiabilityPolicy', e.target.value)}
                />
              </div>
              <div>
                <Label>Workers Comp Policy #</Label>
                <Input
                  value={formValues.workersCompPolicy}
                  onChange={(e) => handleFormChange('workersCompPolicy', e.target.value)}
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
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={formValues.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                />
              </div>
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['owner', 'productionManager', 'admin'].map((role) => (
                <div key={role} className="space-y-2">
                  <p className="text-sm font-semibold capitalize">
                    {role === 'productionManager' ? 'Production Manager' : role}
                  </p>
                  <Input
                    placeholder="Name"
                    value={formValues.contacts[role].name}
                    onChange={(e) => handleContactChange(role, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={formValues.contacts[role].email}
                    onChange={(e) => handleContactChange(role, 'email', e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={formValues.contacts[role].phone}
                    onChange={(e) => handleContactChange(role, 'phone', e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Financial */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Commission Model</Label>
                <select
                  className="w-full border rounded-md h-9 px-2"
                  value={formValues.commissionModel}
                  onChange={(e) => handleFormChange('commissionModel', e.target.value)}
                >
                  <option value="flat_fee_per_kw">Flat fee per kW</option>
                  <option value="percent_of_profit">% of Profit</option>
                </select>
              </div>
              <div>
                <Label>Commission Rate</Label>
                <Input
                  type="number"
                  min="0"
                  value={formValues.commissionRate}
                  onChange={(e) => handleFormChange('commissionRate', e.target.value)}
                />
              </div>
              <div>
                <Label>Billing Method</Label>
                <select
                  className="w-full border rounded-md h-9 px-2"
                  value={formValues.billingMethod}
                  onChange={(e) => handleFormChange('billingMethod', e.target.value)}
                >
                  <option value="net_deduct">Net-Deduct</option>
                  <option value="referral_payout">Referral Payout</option>
                </select>
              </div>
              <div>
                <Label>Credit Limit</Label>
                <Input
                  type="number"
                  min="0"
                  value={formValues.creditLimit}
                  onChange={(e) => handleFormChange('creditLimit', e.target.value)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full border rounded-md h-9 px-2"
                  value={formValues.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Certifications (comma-separated)</Label>
                <Textarea
                  value={formValues.certifications}
                  onChange={(e) => handleFormChange('certifications', e.target.value)}
                />
              </div>
              <div>
                <Label>Service Areas (comma-separated)</Label>
                <Textarea
                  value={formValues.serviceAreas}
                  onChange={(e) => handleFormChange('serviceAreas', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Partner'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Partners;
