import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Search, DollarSign, Calendar, FileText, Download, Eye, CreditCard, Mail, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContextFirebase';
import { useNotifications } from '../../contexts/NotificationContext';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoiceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(invoiceData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRecordPayment = async () => {
    if (!selectedInvoice || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      const newPaidAmount = (selectedInvoice.paidAmount || 0) + paymentAmount;
      const newBalance = selectedInvoice.total - newPaidAmount;
      const newStatus = newBalance <= 0.01 ? 'Paid' : 'Pending'; // Tolerance for float errors

      // 1. Record Payment Transaction
      await addDoc(collection(db, 'payments'), {
        invoiceId: selectedInvoice.id,
        amount: paymentAmount,
        method: paymentMethod || 'Other',
        recordedBy: user.uid,
        recordedAt: new Date().toISOString()
      });

      // 2. Update Invoice
      await updateDoc(doc(db, 'invoices', selectedInvoice.id), {
        paidAmount: newPaidAmount,
        balanceDue: newBalance,
        status: newStatus,
        lastPaymentDate: new Date().toISOString()
      });

      addNotification({
        type: 'success',
        title: 'Payment Received',
        message: `Payment of $${paymentAmount} received for Invoice ${selectedInvoice.invoiceNumber}.`,
        link: `/financial/invoices`
      });

      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      setPaymentAmount(0);
      setPaymentMethod('');

      // Close view dialog if open to refresh data visually (though real-time will handle it)
      setIsViewDialogOpen(false);
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleEmailInvoice = (invoice) => {
    const subject = `Invoice ${invoice.invoiceNumber} from DTRS PRO`;
    const body = `Dear ${invoice.customerName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)}.\n\nView and Pay online: https://dtrs-pro.web.app/pay/${invoice.id}\n\nThank you,\nDTRS PRO Team`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handlePayOnline = (invoice) => {
    // Mock Stripe Link
    const mockStripeLink = `https://buy.stripe.com/test_mock_payment?client_reference_id=${invoice.id}&amount=${invoice.balanceDue}`;
    window.open(mockStripeLink, '_blank');
  };

  const handlePrint = () => {
    if (!selectedInvoice) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Invoice ${selectedInvoice.invoiceNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .invoice-title { font-size: 32px; font-weight: bold; text-align: right; color: #333; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #666; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-final { font-size: 20px; font-weight: bold; border-top: 2px solid #333; margin-top: 8px; padding-top: 8px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef9c3; color: #854d0e; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">DTRS PRO</div>
              <div style="margin-top: 8px; color: #666;">Field Service Management</div>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="text-right" style="color: #666;">#${selectedInvoice.invoiceNumber}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="label">Bill To</div>
              <div class="value">${selectedInvoice.customerName}</div>
              <div style="margin-top: 4px; color: #666;">Job ID: ${selectedInvoice.jobId || 'N/A'}</div>
            </div>
            <div class="text-right">
              <div class="label">Dates</div>
              <div class="value">Issued: ${new Date(selectedInvoice.createdAt).toLocaleDateString()}</div>
              <div class="value">Due: ${new Date(selectedInvoice.dueDate).toLocaleDateString()}</div>
              <div style="margin-top: 8px;">
                <span class="status-badge ${selectedInvoice.status === 'Paid' ? 'status-paid' : 'status-pending'}">
                  ${selectedInvoice.status}
                </span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%">Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedInvoice.lineItems.map(item => `
                <tr>
                  <td>
                    <div style="font-weight: 500;">${item.description}</div>
                    <div style="font-size: 12px; color: #666;">${item.sku || ''}</div>
                  </td>
                  <td class="text-right">${item.quantity} ${item.unit}</td>
                  <td class="text-right">$${Number(item.unitPrice).toFixed(2)}</td>
                  <td class="text-right" style="font-weight: 500;">$${Number(item.total).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span style="color: #666;">Subtotal</span>
              <span>$${(selectedInvoice.subtotal || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span style="color: #666;">Tax (${((selectedInvoice.taxRate || 0) * 100).toFixed(1)}%)</span>
              <span>$${(selectedInvoice.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div class="total-row total-final">
              <span>Total</span>
              <span>$${(selectedInvoice.total || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span style="color: #666;">Amount Paid</span>
              <span>$${(selectedInvoice.paidAmount || 0).toFixed(2)}</span>
            </div>
            <div class="total-row" style="color: ${selectedInvoice.balanceDue > 0.01 ? '#dc2626' : '#166534'}; font-weight: bold;">
              <span>Balance Due</span>
              <span>$${(selectedInvoice.balanceDue || 0).toFixed(2)}</span>
            </div>
          </div>

          ${selectedInvoice.notes ? `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <div class="label">Notes</div>
              <div style="color: #666;">${selectedInvoice.notes}</div>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStatusColor = (status) => {
    const colors = {
      Paid: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Overdue: 'bg-red-100 text-red-800',
      Draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      (invoice.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.jobId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPending = filteredInvoices
    .filter((inv) => inv.status === 'Pending')
    .reduce((sum, inv) => sum + (inv.balanceDue || inv.total), 0);

  const totalPaid = filteredInvoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoicing</h1>
          <p className="text-gray-600 mt-1">Manage invoices and payment tracking</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => toast.info('Use Estimate Calculator to create invoices from estimates')}
        >
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
                    <td className="py-3 px-4 font-medium text-blue-600">{invoice.invoiceNumber || invoice.id}</td>
                    <td className="py-3 px-4">{invoice.customerName}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{invoice.jobId || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{invoice.type}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      ${(invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      {(invoice.paidAmount || 0) > 0 ? (
                        <span className="text-green-600 font-semibold">
                          ${(invoice.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-gray-400">$0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmailInvoice(invoice)}
                        >
                          <Mail size={14} />
                        </Button>
                        {invoice.status !== 'Paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setPaymentAmount(invoice.balanceDue || invoice.total);
                              setIsPaymentDialogOpen(true);
                            }}
                          >
                            <CreditCard size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <p className="font-semibold">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedInvoice.status)}>{selectedInvoice.status}</Badge>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p>{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <Label>Job ID</Label>
                  <p>{selectedInvoice.jobId || 'N/A'}</p>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline">{selectedInvoice.type}</Badge>
                </div>
              </div>

              <div>
                <Label>Line Items</Label>
                <div className="mt-2 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Description</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Qty</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Unit Price</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.lineItems?.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-semibold">${Number(item.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(selectedInvoice.taxRate || 0) * 100}%):</span>
                    <span className="font-semibold">${(selectedInvoice.taxAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600">${(selectedInvoice.total || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="font-semibold text-green-600">${(selectedInvoice.paidAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Balance Due:</span>
                    <span className="text-red-600">${(selectedInvoice.balanceDue || selectedInvoice.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handlePrint} variant="outline" className="flex-1">
                  <Download size={16} className="mr-2" />
                  Print
                </Button>
                <Button onClick={() => handlePayOnline(selectedInvoice)} variant="secondary" className="flex-1">
                  <ExternalLink size={16} className="mr-2" />
                  Pay Online Link
                </Button>
                {selectedInvoice.status !== 'Paid' && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setPaymentAmount(selectedInvoice.balanceDue || selectedInvoice.total);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    <CreditCard size={16} className="mr-2" />
                    Record Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div>
                <Label>Invoice Number</Label>
                <p className="font-semibold">{selectedInvoice.invoiceNumber}</p>
              </div>
              <div>
                <Label>Balance Due</Label>
                <p className="text-lg font-bold text-red-600">${(selectedInvoice.balanceDue || selectedInvoice.total).toFixed(2)}</p>
              </div>
              <div>
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedInvoice.balanceDue || selectedInvoice.total}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleRecordPayment} className="flex-1 bg-green-600 hover:bg-green-700">
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
