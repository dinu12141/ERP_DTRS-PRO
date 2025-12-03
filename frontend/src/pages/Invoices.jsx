import React, { useState } from 'react';
import { mockInvoices } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, DollarSign, Calendar, FileText, Download } from 'lucide-react';

const Invoices = () => {
  const [invoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      Paid: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Overdue: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      Deposit: 'bg-blue-100 text-blue-800',
      Progress: 'bg-purple-100 text-purple-800',
      Final: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const totalPending = filteredInvoices
    .filter((inv) => inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = filteredInvoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoicing</h1>
          <p className="text-gray-600 mt-1">Manage invoices and payment tracking</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={20} className="mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  ${totalPending.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredInvoices.filter((inv) => inv.status === 'Pending').length} invoices
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <DollarSign size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ${totalPaid.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredInvoices.filter((inv) => inv.status === 'Paid').length} invoices
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{filteredInvoices.length}</p>
                <p className="text-sm text-gray-500 mt-1">All time</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <FileText size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search invoices by ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['All', 'Pending', 'Paid'].map((status) => (
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

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Job ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Paid</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-blue-600">{invoice.id}</td>
                    <td className="py-3 px-4">{invoice.customerName}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{invoice.jobId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getTypeColor(invoice.type)}>{invoice.type}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      ${invoice.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {invoice.paidAmount > 0 ? (
                        <span className="text-green-600 font-semibold">
                          ${invoice.paidAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">$0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>{invoice.dueDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
