import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Trash2, Calculator, DollarSign, Save, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const EstimateCalculator = () => {
  const navigate = useNavigate();
  const [skus, setSkus] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [taxRate, setTaxRate] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [jobId, setJobId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [estimateId, setEstimateId] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  useEffect(() => {
    loadSKUs();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [lineItems, taxRate]);

  const loadSKUs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/skus?isActive=true`);
      setSkus(response.data);
    } catch (error) {
      console.error('Failed to load SKUs:', error);
    }
  };

  const calculateTotals = () => {
    const sub = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax = sub * (taxRate / 100);
    const tot = sub + tax;
    setSubtotal(sub);
    setTaxAmount(tax);
    setTotal(tot);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        skuId: '',
        sku: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        unit: 'each',
        total: 0
      }
    ]);
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // If SKU selected, populate description and unit price
    if (field === 'skuId' && value) {
      const selectedSku = skus.find(s => s.id === value);
      if (selectedSku) {
        updated[index].sku = selectedSku.sku;
        updated[index].description = selectedSku.name;
        updated[index].unitPrice = selectedSku.unitPrice;
        updated[index].unit = selectedSku.unit;
      }
    }
    
    // Recalculate total for this line item
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].total = (updated[index].quantity || 0) * (updated[index].unitPrice || 0);
    }
    
    setLineItems(updated);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const estimateData = {
        jobId: jobId || null,
        customerName: customerName || null,
        customerId: customerId || null,
        lineItems: lineItems.map(item => ({
          skuId: item.skuId,
          sku: item.sku,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          total: item.total
        })),
        subtotal,
        taxRate: taxRate / 100,
        taxAmount,
        total,
        notes: notes || null,
        status: 'draft'
      };

      if (estimateId) {
        await axios.put(`${API_BASE}/api/estimates/${estimateId}`, estimateData);
        toast.success('Estimate updated successfully!');
      } else {
        const response = await axios.post(`${API_BASE}/api/estimates`, estimateData);
        setEstimateId(response.data.id);
        toast.success('Estimate saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save estimate:', error);
      toast.error(error.response?.data?.detail || 'Failed to save estimate');
    }
  };

  const handleCreateInvoice = async (invoiceType) => {
    if (!estimateId) {
      toast.error('Please save the estimate first');
      return;
    }

    try {
      setCreatingInvoice(true);
      const response = await axios.post(
        `${API_BASE}/api/estimates/${estimateId}/create-invoice?invoice_type=${invoiceType}`
      );
      toast.success(`Invoice created successfully! Invoice: ${response.data.invoice.invoiceNumber}`);
      navigate('/financial/invoices');
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estimate Calculator</h1>
          <p className="text-gray-600 mt-1">Dynamic estimating engine with SKU-based pricing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save size={20} className="mr-2" />
            Save Estimate
          </Button>
          {estimateId && (
            <Button 
              onClick={() => handleCreateInvoice('Deposit')} 
              variant="outline"
              disabled={creatingInvoice}
            >
              <FileText size={20} className="mr-2" />
              Create Deposit Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Job & Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Job & Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button onClick={addLineItem} variant="outline" size="sm">
              <Plus size={16} className="mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No line items added yet. Click "Add Item" to start building your estimate.</p>
              </div>
            ) : (
              lineItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <Label>SKU</Label>
                      <Select
                        value={item.skuId}
                        onValueChange={(value) => updateLineItem(index, 'skuId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select SKU" />
                        </SelectTrigger>
                        <SelectContent>
                          {skus.map((sku) => (
                            <SelectItem key={sku.id} value={sku.id}>
                              {sku.sku} - {sku.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        className="w-full"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                        placeholder="each"
                      />
                    </div>
                    <div>
                      <Label>Total</Label>
                      <Input
                        value={`$${item.total.toFixed(2)}`}
                        disabled
                        className="bg-gray-50 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tax Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({taxRate}%):</span>
              <span className="font-semibold">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t text-lg font-bold">
              <span>Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes for this estimate..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EstimateCalculator;

