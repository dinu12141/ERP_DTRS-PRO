import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Mail, Phone, MapPin, DollarSign, TrendingUp, Eye, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useFirestore } from '../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';

const Partners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Real-time listeners
  const { data: partners, add: addPartner, update: updatePartner } = useFirestore('roofingPartners');

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

  const handleViewDetails = (partner) => {
    setSelectedPartner(partner);
    setIsDetailsOpen(true);
  };

  const handleViewJobs = (partnerId) => {
    navigate(`/jobs?partnerId=${partnerId}`);
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
        ? (typeof formValues.certifications === 'string' ? formValues.certifications.split(',') : formValues.certifications).map((c) => c.trim())
        : [],
      serviceAreas: formValues.serviceAreas
        ? (typeof formValues.serviceAreas === 'string' ? formValues.serviceAreas.split(',') : formValues.serviceAreas).map((c) => c.trim())
        : []
    };

    try {
      if (editingPartner) {
        await updatePartner(editingPartner.id, payload);
      } else {
        await addPartner(payload);
      }
      setIsSubmitting(false);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving partner:', error);
      setIsSubmitting(false);
    }
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

      {/* Partners Grid - More Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPartners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{partner.companyName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Mail size={14} />
                    <span>{partner.email}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(partner.status)}>{partner.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-700">{partner.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-gray-700 truncate">{partner.address}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Credit Limit:</span>
                  <span className="ml-2 font-medium">${partner.creditLimit?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Balance:</span>
                  <span className="ml-2 font-medium">${partner.currentBalance?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewDetails(partner)}>
                  <Eye size={14} className="mr-1" /> Details
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleEdit(partner)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleViewJobs(partner.id)}>
                  <Briefcase size={14} className="mr-1" /> View Jobs
                </Button>
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

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPartner?.companyName} - Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Tax ID</Label>
                <p>{selectedPartner?.taxId}</p>
              </div>
              <div>
                <Label className="text-gray-500">Status</Label>
                <Badge className={getStatusColor(selectedPartner?.status || 'Active')}>{selectedPartner?.status}</Badge>
              </div>
              <div>
                <Label className="text-gray-500">Email</Label>
                <p>{selectedPartner?.email}</p>
              </div>
              <div>
                <Label className="text-gray-500">Phone</Label>
                <p>{selectedPartner?.phone}</p>
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Address</Label>
              <p>{selectedPartner?.address}</p>
            </div>

            <div className="border-t pt-2">
              <Label className="text-gray-500 mb-2 block">Contacts</Label>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {Object.entries(selectedPartner?.contacts || {}).map(([role, contact]) => (
                  <div key={role} className="bg-gray-50 p-2 rounded">
                    <p className="font-semibold capitalize text-xs text-gray-500">{role === 'productionManager' ? 'Prod. Manager' : role}</p>
                    <p className="font-medium">{contact.name || '-'}</p>
                    <p className="text-xs text-gray-500">{contact.email}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-2">
              <Label className="text-gray-500 mb-2 block">Financials</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Commission: </span>
                  <span>{selectedPartner?.commissionModel === 'flat_fee_per_kw' ? `$${selectedPartner?.commissionRate}/kW` : `${selectedPartner?.commissionRate}%`}</span>
                </div>
                <div>
                  <span className="text-gray-500">Billing: </span>
                  <span>{selectedPartner?.billingMethod}</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-gray-500">Notes/Certifications</Label>
              <p>{(selectedPartner?.certifications || []).join(', ')}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Partners;
