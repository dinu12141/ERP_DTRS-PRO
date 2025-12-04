import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Mail, Phone, User, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { useFirestore } from '../hooks/useFirestore';

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // Real-time listeners
  const { data: contacts, loading: contactsLoading, add: addContact, update: updateContact } = useFirestore('contacts');
  const { data: partners, loading: partnersLoading } = useFirestore('roofingPartners');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Admin',
    partnerId: '',
    isPrimary: false
  });

  const handleOpenNew = () => {
    setEditingContact(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Admin',
      partnerId: '',
      isPrimary: false
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      role: contact.role || 'Admin',
      partnerId: contact.partnerId || '',
      isPrimary: contact.isPrimary || false
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const selectedPartner = partners.find(p => p.id === formData.partnerId);
      const payload = {
        ...formData,
        partnerName: selectedPartner ? selectedPartner.companyName : ''
      };

      if (editingContact) {
        await updateContact(editingContact.id, payload);
      } else {
        await addContact(payload);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      (contact.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loading = contactsLoading || partnersLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage partner contacts and relationships</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleOpenNew}
        >
          <Plus size={20} className="mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search contacts by name, email, or partner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">No contacts found.</div>
        ) : (
          filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                      <User size={24} className="text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {contact.firstName} {contact.lastName}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{contact.role}</p>
                    </div>
                  </div>
                  {contact.isPrimary && (
                    <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Partner Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building size={16} />
                    <span className="font-medium text-blue-600">{contact.partnerName || 'No Partner'}</span>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600 transition-colors">
                        {contact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} />
                      <span>{contact.phone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex gap-2">
                    <Button variant="outline" className="flex-1 text-sm" onClick={() => handleEdit(contact)}>
                      Edit
                    </Button>
                    <Button variant="outline" className="flex-1 text-sm" onClick={() => window.location.href = `mailto:${contact.email}`}>
                      Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Owner, Manager"
              />
            </div>
            <div>
              <Label>Partner</Label>
              <select
                className="w-full border rounded-md h-9 px-2"
                value={formData.partnerId}
                onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
              >
                <option value="">Select Partner</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              />
              <Label htmlFor="isPrimary">Primary Contact</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingContact ? 'Save Changes' : 'Create Contact'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
