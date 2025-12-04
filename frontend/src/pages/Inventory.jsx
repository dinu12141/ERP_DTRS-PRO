import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, Package, Warehouse, Truck, MapPin, AlertTriangle, BarChart3, QrCode, Edit, Trash2, ClipboardEdit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextFirebase';
import { toast } from 'sonner';
import PhotoCapture from '../components/PhotoCapture';

const Inventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add/Edit Item State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'General',
    brand: '',
    model: '',
    supplier: '',
    unitCost: 0,
    retailPrice: 0,
    reorderPoint: 5,
    initialStock: 0,
    warehouse: 'Main Warehouse',
    image: []
  });

  // Stock Adjustment State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustData, setAdjustData] = useState({ newQuantity: 0, reason: '' });

  // Real-time Listeners
  useEffect(() => {
    if (!user) return;

    const unsubItems = onSnapshot(collection(db, 'inventory_items'), (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
    });

    const unsubBins = onSnapshot(collection(db, 'inventory_bins'), (snapshot) => {
      const binsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBins(binsData);
      setLoading(false);
    });

    return () => {
      unsubItems();
      unsubBins();
    };
  }, [user]);

  // Aggregation Logic
  const inventory = items.map(item => {
    const itemBins = bins.filter(b => b.itemId === item.id);

    // Calculate total stock from bins
    const totalStock = itemBins.reduce((sum, bin) => sum + (Number(bin.quantity) || 0), 0);

    const warehouseBin = itemBins.find(b => b.type === 'warehouse') || { quantity: 0, location: 'Unassigned' };

    const customerBins = itemBins
      .filter(b => b.type === 'job')
      .map(b => ({
        id: b.id,
        jobId: b.refId,
        quantity: b.quantity,
        status: 'Allocated',
        location: b.location
      }));

    const truckStock = itemBins
      .filter(b => b.type === 'truck')
      .map(b => ({
        id: b.id,
        vehicleId: b.refId,
        quantity: b.quantity
      }));

    // Low Stock Logic: < 20% of initial stock (if initial stock is set, otherwise use reorder point fallback)
    const initialStock = item.initialStock || 100; // Default to 100 if not set to avoid div by zero issues in logic
    const lowStockThreshold = Math.max(item.reorderPoint || 5, initialStock * 0.2);

    let status = 'In Stock';
    if (totalStock <= 0) status = 'Out of Stock';
    else if (totalStock < lowStockThreshold) status = 'Low Stock';

    return {
      ...item,
      totalStock,
      status,
      bins: {
        warehouse: {
          quantity: warehouseBin.quantity,
          location: warehouseBin.location
        },
        customerBins,
        truckStock
      }
    };
  });

  const filteredInventory = inventory.filter(
    (item) =>
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveItem = async () => {
    try {
      const itemData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        supplier: formData.supplier,
        unitCost: Number(formData.unitCost),
        retailPrice: Number(formData.retailPrice),
        reorderPoint: Number(formData.reorderPoint),
        initialStock: Number(formData.initialStock),
        imageUrl: formData.image[0] || null,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      };

      if (editingItem) {
        await updateDoc(doc(db, 'inventory_items', editingItem.id), itemData);
        toast.success('Item updated');
      } else {
        const docRef = await addDoc(collection(db, 'inventory_items'), {
          ...itemData,
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        });

        // Create initial warehouse bin
        await addDoc(collection(db, 'inventory_bins'), {
          itemId: docRef.id,
          type: 'warehouse',
          location: formData.warehouse,
          quantity: Number(formData.initialStock),
          refId: 'MAIN_WAREHOUSE'
        });

        toast.success('Item created with initial stock');
      }
      setIsAddOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure? This will delete the item and all associated bins.')) return;
    try {
      await deleteDoc(doc(db, 'inventory_items', itemId));
      const itemBins = bins.filter(b => b.itemId === itemId);
      itemBins.forEach(async (bin) => {
        await deleteDoc(doc(db, 'inventory_bins', bin.id));
      });
      toast.success('Item deleted');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const handleRequestAdjustment = async () => {
    if (!adjustItem) return;
    try {
      await addDoc(collection(db, 'stock_adjustments'), {
        itemId: adjustItem.id,
        itemName: adjustItem.name,
        currentQuantity: adjustItem.totalStock,
        requestedQuantity: Number(adjustData.newQuantity),
        reason: adjustData.reason,
        status: 'pending',
        requestedBy: user.uid,
        requestedAt: new Date().toISOString()
      });
      toast.success('Stock adjustment requested. Pending approval.');
      setIsAdjustOpen(false);
      setAdjustItem(null);
      setAdjustData({ newQuantity: 0, reason: '' });
    } catch (error) {
      console.error('Error requesting adjustment:', error);
      toast.error('Failed to request adjustment');
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      brand: item.brand,
      model: item.model,
      supplier: item.supplier,
      unitCost: item.unitCost,
      retailPrice: item.retailPrice,
      reorderPoint: item.reorderPoint,
      initialStock: item.initialStock || 0,
      warehouse: 'Main Warehouse', // Default, could be fetched from bin if needed
      image: item.imageUrl ? [item.imageUrl] : []
    });
    setIsAddOpen(true);
  };

  const openAdjust = (item) => {
    setAdjustItem(item);
    setAdjustData({ newQuantity: item.totalStock, reason: '' });
    setIsAdjustOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: 'General',
      brand: '',
      model: '',
      supplier: '',
      unitCost: 0,
      retailPrice: 0,
      reorderPoint: 5,
      initialStock: 0,
      warehouse: 'Main Warehouse',
      image: []
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'In Stock': 'bg-green-100 text-green-800',
      'Low Stock': 'bg-yellow-100 text-yellow-800',
      'Out of Stock': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track stock across warehouse, customer bins, and trucks</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventory/scan">
            <Button variant="outline" className="bg-white">
              <QrCode size={20} className="mr-2" />
              Scan QR Code
            </Button>
          </Link>
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setEditingItem(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus size={20} className="mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Solar Panels">Solar Panels</SelectItem>
                      <SelectItem value="Inverters">Inverters</SelectItem>
                      <SelectItem value="Racking">Racking</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Unit Cost ($)</Label>
                  <Input type="number" value={formData.unitCost} onChange={e => setFormData({ ...formData, unitCost: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Retail Price ($)</Label>
                  <Input type="number" value={formData.retailPrice} onChange={e => setFormData({ ...formData, retailPrice: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Point</Label>
                  <Input type="number" value={formData.reorderPoint} onChange={e => setFormData({ ...formData, reorderPoint: e.target.value })} />
                </div>
                {!editingItem && (
                  <>
                    <div className="space-y-2">
                      <Label>Initial Stock</Label>
                      <Input type="number" value={formData.initialStock} onChange={e => setFormData({ ...formData, initialStock: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Warehouse</Label>
                      <Select value={formData.warehouse} onValueChange={v => setFormData({ ...formData, warehouse: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                          <SelectItem value="Warehouse B">Warehouse B</SelectItem>
                          <SelectItem value="Overflow Storage">Overflow Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="col-span-2 space-y-2">
                  <Label>Image</Label>
                  <PhotoCapture
                    label="Item Image"
                    maxPhotos={1}
                    onPhotoCaptured={urls => setFormData({ ...formData, image: urls })}
                  />
                  {formData.image.length > 0 && (
                    <img src={formData.image[0]} alt="Preview" className="h-20 w-20 object-cover rounded mt-2 border" />
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveItem}>{editingItem ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total SKUs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inventory.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {inventory.filter((i) => i.status === 'Low Stock').length}
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <AlertTriangle size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Bins</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {inventory.reduce((sum, item) => sum + item.bins.customerBins.length, 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <MapPin size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ${(inventory.reduce((sum, item) => sum + item.totalStock * item.unitCost, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <BarChart3 size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search inventory by name, SKU, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">Loading inventory...</div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No inventory items found.</div>
        ) : (
          filteredInventory.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded border" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="font-medium">SKU: {item.sku}</span>
                            <span>|</span>
                            <span>{item.brand} - {item.model}</span>
                            <span>|</span>
                            <span>Supplier: {item.supplier}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Stock</p>
                      <p className="text-3xl font-bold text-gray-900">{item.totalStock}</p>
                      {item.totalStock < item.reorderPoint && (
                        <p className="text-xs text-red-600 mt-1">Below reorder point ({item.reorderPoint})</p>
                      )}
                    </div>
                  </div>

                  {/* Stock Distribution */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    {/* Warehouse */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Warehouse size={20} className="text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Warehouse</h4>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{item.bins.warehouse.quantity}</p>
                      <p className="text-xs text-gray-600 mt-1">Location: {item.bins.warehouse.location}</p>
                    </div>

                    {/* Customer Bins */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={20} className="text-purple-600" />
                        <h4 className="font-semibold text-gray-900">Customer Bins</h4>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {item.bins.customerBins.reduce((sum, b) => sum + b.quantity, 0)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{item.bins.customerBins.length} bins active</p>
                    </div>

                    {/* Truck Stock */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck size={20} className="text-orange-600" />
                        <h4 className="font-semibold text-gray-900">Truck Stock</h4>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {item.bins.truckStock.reduce((sum, b) => sum + b.quantity, 0)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{item.bins.truckStock.length} trucks</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Edit size={16} className="mr-2" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openAdjust(item)}>
                      <ClipboardEdit size={16} className="mr-2" /> Adjust Stock
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 size={16} className="mr-2" /> Delete
                    </Button>
                    <Button variant="outline" size="sm">
                      <QrCode size={16} className="mr-1" />
                      Print QR
                    </Button>
                    {item.status === 'Low Stock' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white ml-auto">
                        Reorder Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Stock Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <Input value={adjustItem?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Current Quantity</Label>
              <Input value={adjustItem?.totalStock || 0} disabled />
            </div>
            <div className="space-y-2">
              <Label>New Quantity</Label>
              <Input type="number" value={adjustData.newQuantity} onChange={e => setAdjustData({ ...adjustData, newQuantity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={adjustData.reason} onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })} placeholder="e.g. Broken items, Count correction" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestAdjustment}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
