import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextFirebase';
import { toast } from 'sonner';

const SKUManager = () => {
  const [skus, setSkus] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSku, setEditingSku] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    type: 'product',
    unitPrice: 0,
    unit: 'each',
    category: '',
    isActive: true
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'skus'), orderBy('sku'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const skuData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSkus(skuData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const skuData = {
        ...formData,
        unitPrice: Number(formData.unitPrice),
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      };

      if (editingSku) {
        await updateDoc(doc(db, 'skus', editingSku.id), skuData);
        toast.success('SKU updated successfully');
      } else {
        await addDoc(collection(db, 'skus'), {
          ...skuData,
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        });
        toast.success('SKU created successfully');
      }
      setIsDialogOpen(false);
      setEditingSku(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save SKU:', error);
      toast.error('Failed to save SKU');
    }
  };

  const handleEdit = (sku) => {
    setEditingSku(sku);
    setFormData({
      sku: sku.sku,
      name: sku.name,
      description: sku.description || '',
      type: sku.type,
      unitPrice: sku.unitPrice,
      unit: sku.unit || 'each',
      category: sku.category || '',
      isActive: sku.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (skuId) => {
    if (!window.confirm('Are you sure you want to delete this SKU?')) return;
    try {
      await deleteDoc(doc(db, 'skus', skuId));
      toast.success('SKU deleted');
    } catch (error) {
      console.error('Failed to delete SKU:', error);
      toast.error('Failed to delete SKU');
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      type: 'product',
      unitPrice: 0,
      unit: 'each',
      category: '',
      isActive: true
    });
    setEditingSku(null);
  };

  const filteredSKUs = skus.filter((sku) => {
    const matchesSearch =
      sku.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sku.description && sku.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'All' || sku.type === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SKU Manager</h1>
          <p className="text-gray-600 mt-1">Manage products and services for estimating and invoicing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus size={20} className="mr-2" />
              Add SKU
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSku ? 'Edit SKU' : 'Create New SKU'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU Code *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    disabled={!!editingSku}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unitPrice">Unit Price *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="each, hour, kW, sqft"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingSku ? 'Update' : 'Create'} SKU
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search SKUs by code, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['All', 'Product', 'Service'].map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  onClick={() => setFilterType(type)}
                  className={filterType === type ? 'bg-blue-600' : ''}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SKU List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSKUs.map((sku) => (
          <Card key={sku.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{sku.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">SKU: {sku.sku}</p>
                </div>
                <Badge variant={sku.type === 'product' ? 'default' : 'secondary'}>
                  {sku.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sku.description && (
                  <p className="text-sm text-gray-600">{sku.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  <span className="text-lg font-bold text-gray-900">
                    ${Number(sku.unitPrice).toFixed(2)} / {sku.unit}
                  </span>
                </div>
                {sku.category && (
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {sku.category}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge className={sku.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {sku.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(sku)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(sku.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SKUManager;
