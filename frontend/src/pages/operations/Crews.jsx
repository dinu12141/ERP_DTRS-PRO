import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Plus, Users, Truck, MapPin, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFirestore } from '../../hooks/useFirestore';

const Crews = () => {
  const { data: crews, loading: crewsLoading, add: addCrew, update: updateCrew, remove: deleteCrew } = useFirestore('crews');
  const { data: vehicles, loading: vehiclesLoading } = useFirestore('vehicles');

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    lead: '',
    homeBase: '',
    vehicleId: '',
    capabilityTags: [],
    members: [],
    status: 'Available'
  });
  const [newTag, setNewTag] = useState('');
  const availableCapabilities = ['Detach', 'Reset', 'Electrical', 'Roofing', 'Inspection', 'Survey'];

  const loading = crewsLoading || vehiclesLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCrew) {
        await updateCrew(editingCrew.id, formData);
        toast.success('Crew updated successfully');
      } else {
        await addCrew(formData);
        toast.success('Crew created successfully');
      }
      setIsDialogOpen(false);
      setEditingCrew(null);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save crew');
    }
  };

  const handleEdit = (crew) => {
    setEditingCrew(crew);
    setFormData({
      name: crew.name || '',
      lead: crew.lead || '',
      homeBase: crew.homeBase || '',
      vehicleId: crew.vehicleId || '',
      capabilityTags: crew.capabilityTags || [],
      members: crew.members || [],
      status: crew.status || 'Available'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this crew?')) return;
    try {
      await deleteCrew(id);
      toast.success('Crew deleted successfully');
    } catch (error) {
      toast.error('Failed to delete crew');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      lead: '',
      homeBase: '',
      vehicleId: '',
      capabilityTags: [],
      members: [],
      status: 'Available'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Available': 'bg-green-100 text-green-800',
      'On Job': 'bg-blue-100 text-blue-800',
      'Off Duty': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredCrews = crews.filter(crew =>
    crew.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crew.lead.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crews</h1>
          <p className="text-gray-600 mt-1">Manage crew assignments and capabilities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCrew(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Crew
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCrew ? 'Edit Crew' : 'Create New Crew'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Crew Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lead">Crew Lead</Label>
                  <Input
                    id="lead"
                    value={formData.lead}
                    onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="homeBase">Home Base</Label>
                <Input
                  id="homeBase"
                  value={formData.homeBase}
                  onChange={(e) => setFormData({ ...formData, homeBase: e.target.value })}
                  placeholder="e.g., Denver, CO"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleId">Vehicle</Label>
                <select
                  id="vehicleId"
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.maxPanelCapacity} panels)</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Capability Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {formData.capabilityTags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            capabilityTags: formData.capabilityTags.filter((_, i) => i !== idx)
                          });
                        }}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Add capability...</option>
                    {availableCapabilities
                      .filter(cap => !formData.capabilityTags.includes(cap))
                      .map(cap => (
                        <option key={cap} value={cap}>{cap}</option>
                      ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newTag && !formData.capabilityTags.includes(newTag)) {
                        setFormData({
                          ...formData,
                          capabilityTags: [...formData.capabilityTags, newTag]
                        });
                        setNewTag('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search crews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crews Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">Loading...</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrews.map((crew) => {
            const vehicle = vehicles.find(v => v.id === crew.vehicleId);
            return (
              <Card key={crew.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{crew.name}</CardTitle>
                    <Badge className={getStatusColor(crew.status)}>
                      {crew.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Lead: {crew.lead}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{crew.homeBase}</span>
                    </div>
                    {vehicle && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Truck className="w-4 h-4" />
                        <span>{vehicle.name}</span>
                      </div>
                    )}
                    {crew.capabilityTags && crew.capabilityTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {crew.capabilityTags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(crew)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(crew.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Crews;
