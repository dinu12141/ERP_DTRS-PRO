import React, { useState } from 'react';
import { mockContacts } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Mail, Phone, User, Building } from 'lucide-react';

const Contacts = () => {
  const [contacts] = useState(mockContacts);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage partner contacts and relationships</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
        {filteredContacts.map((contact) => (
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
                  <span className="font-medium text-blue-600">{contact.partnerName}</span>
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
                  {contact.mobile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} />
                      <span>{contact.mobile} (Mobile)</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 flex gap-2">
                  <Button variant="outline" className="flex-1 text-sm">
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm">
                    Message
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

export default Contacts;
