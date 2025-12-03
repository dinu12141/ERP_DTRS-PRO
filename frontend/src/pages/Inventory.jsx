import React, { useState } from 'react';
import { mockInventory } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Package, Warehouse, Truck, MapPin, AlertTriangle, BarChart3, QrCode } from 'lucide-react';

const Inventory = () => {
  const [inventory] = useState(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      'In Stock': 'bg-green-100 text-green-800',
      'Low Stock': 'bg-yellow-100 text-yellow-800',
      'Out of Stock': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBinStatusColor = (status) => {
    const colors = {
      'Bagged & Tagged': 'bg-blue-100 text-blue-800',
      'In Transit': 'bg-orange-100 text-orange-800',
      'Reinstalled': 'bg-green-100 text-green-800',
      'Ready for Detach': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTotalCustomerBins = (item) => {
    return item.bins.customerBins.reduce((sum, bin) => sum + bin.quantity, 0);
  };

  const getTotalTruckStock = (item) => {
    return item.bins.truckStock.reduce((sum, truck) => sum + truck.quantity, 0);
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
          <Button variant="outline" className="bg-white">
            <QrCode size={20} className="mr-2" />
            Scan QR Code
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={20} className="mr-2" />
            Add Item
          </Button>
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
              <div className="bg-blue-500 p-3 rounded-lg">
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
              <div className="bg-purple-500 p-3 rounded-lg">
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
        {filteredInventory.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">SKU: {item.sku}</span>
                      <span>|</span>
                      <span>{item.brand} - {item.model}</span>
                      <span>|</span>
                      <span>Supplier: {item.supplier}</span>
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
                    <p className="text-2xl font-bold text-purple-600">{getTotalCustomerBins(item)}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.bins.customerBins.length} bins active</p>
                  </div>

                  {/* Truck Stock */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck size={20} className="text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Truck Stock</h4>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{getTotalTruckStock(item)}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.bins.truckStock.length} trucks</p>
                  </div>
                </div>

                {/* Customer Bins Detail */}
                {item.bins.customerBins.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-gray-900 mb-3">Customer Bin Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.bins.customerBins.map((bin) => (
                        <div key={bin.jobId} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-600">{bin.jobId}</span>
                            <Badge className={getBinStatusColor(bin.status)} variant="outline">
                              {bin.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quantity: {bin.quantity}</span>
                            <span className="text-gray-600">Bin: {bin.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Truck Stock Detail */}
                {item.bins.truckStock.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-gray-900 mb-3">Truck Stock Details</h4>
                    <div className="flex gap-3">
                      {item.bins.truckStock.map((truck) => (
                        <div key={truck.vehicleId} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Truck size={16} className="text-orange-600" />
                            <span className="font-medium text-gray-900">{truck.vehicleId}</span>
                          </div>
                          <p className="text-sm text-gray-600">Qty: {truck.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial & Other Info */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Unit Cost</p>
                      <p className="text-lg font-semibold text-gray-900">${item.unitCost}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Retail Price</p>
                      <p className="text-lg font-semibold text-green-600">${item.retailPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lead Time</p>
                      <p className="text-sm font-medium text-gray-900">{item.leadTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Warranty</p>
                      <p className="text-sm font-medium text-gray-900">{item.warranty}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex gap-2">
                  <Button variant="outline" size="sm">
                    Adjust Stock
                  </Button>
                  <Button variant="outline" size="sm">
                    Transfer Bin
                  </Button>
                  <Button variant="outline" size="sm">
                    View History
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
        ))}
      </div>
    </div>
  );
};

export default Inventory;
