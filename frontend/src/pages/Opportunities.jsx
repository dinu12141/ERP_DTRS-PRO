import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, DollarSign, Calendar, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useFirestore } from '../hooks/useFirestore';

const Opportunities = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOpp, setEditingOpp] = useState(null);

    // Real-time listeners
    const { data: opportunities, loading, add: addOpp, update: updateOpp } = useFirestore('opportunities');

    const [formData, setFormData] = useState({
        title: '',
        value: 0,
        stage: 'Prospecting',
        closeDate: '',
        contactName: '',
        notes: ''
    });

    const handleOpenNew = () => {
        setEditingOpp(null);
        setFormData({
            title: '',
            value: 0,
            stage: 'Prospecting',
            closeDate: '',
            contactName: '',
            notes: ''
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (opp) => {
        setEditingOpp(opp);
        setFormData({
            title: opp.title,
            value: opp.value,
            stage: opp.stage,
            closeDate: opp.closeDate,
            contactName: opp.contactName,
            notes: opp.notes || ''
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                value: Number(formData.value)
            };

            if (editingOpp) {
                await updateOpp(editingOpp.id, payload);
            } else {
                await addOpp(payload);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error saving opportunity:', error);
        }
    };

    const filteredOpps = opportunities.filter(
        (opp) =>
            (opp.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (opp.contactName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStageColor = (stage) => {
        const colors = {
            'Prospecting': 'bg-blue-100 text-blue-800',
            'Qualification': 'bg-purple-100 text-purple-800',
            'Proposal': 'bg-yellow-100 text-yellow-800',
            'Negotiation': 'bg-orange-100 text-orange-800',
            'Closed Won': 'bg-green-100 text-green-800',
            'Closed Lost': 'bg-red-100 text-red-800'
        };
        return colors[stage] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
                    <p className="text-gray-600 mt-1">Manage sales pipeline and deals</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenNew}>
                    <Plus size={20} className="mr-2" />
                    Add Opportunity
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            placeholder="Search opportunities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Opportunities List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Loading opportunities...</div>
                ) : filteredOpps.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No opportunities found.</div>
                ) : (
                    filteredOpps.map((opp) => (
                        <Card key={opp.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">{opp.title}</h3>
                                            <Badge className={getStageColor(opp.stage)}>{opp.stage}</Badge>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <User size={16} />
                                                <span>{opp.contactName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} />
                                                <span className="font-semibold text-green-600">${(opp.value || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                <span>Close: {opp.closeDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => handleEdit(opp)}>Edit</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingOpp ? 'Edit Opportunity' : 'New Opportunity'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Opportunity Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Value ($)</Label>
                                <Input
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Close Date</Label>
                                <Input
                                    type="date"
                                    value={formData.closeDate}
                                    onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Stage</Label>
                            <select
                                className="w-full border rounded-md h-9 px-2"
                                value={formData.stage}
                                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                            >
                                <option>Prospecting</option>
                                <option>Qualification</option>
                                <option>Proposal</option>
                                <option>Negotiation</option>
                                <option>Closed Won</option>
                                <option>Closed Lost</option>
                            </select>
                        </div>
                        <div>
                            <Label>Contact Name</Label>
                            <Input
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Opportunities;
