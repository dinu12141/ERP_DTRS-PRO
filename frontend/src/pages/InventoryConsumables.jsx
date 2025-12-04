import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextFirebase';
import { toast } from 'sonner';

const InventoryConsumables = () => {
    const { user } = useAuth();
    const [consumables, setConsumables] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', quantity: 0, unit: 'pcs', minLevel: 10 });

    useEffect(() => {
        if (!user) return;
        const unsubscribe = onSnapshot(collection(db, 'inventory_consumables'), (snapshot) => {
            setConsumables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const handleAdd = async () => {
        try {
            await addDoc(collection(db, 'inventory_consumables'), {
                ...formData,
                quantity: Number(formData.quantity),
                minLevel: Number(formData.minLevel),
                updatedAt: new Date().toISOString()
            });
            toast.success('Consumable added');
            setIsAddOpen(false);
            setFormData({ name: '', quantity: 0, unit: 'pcs', minLevel: 10 });
        } catch (error) {
            toast.error('Failed to add consumable');
        }
    };

    const updateQuantity = async (id, current, change) => {
        try {
            const newQty = Math.max(0, current + change);
            await updateDoc(doc(db, 'inventory_consumables', id), { quantity: newQty });
        } catch (error) {
            toast.error('Failed to update quantity');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this consumable?')) return;
        try {
            await deleteDoc(doc(db, 'inventory_consumables', id));
            toast.success('Deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Consumables</h1>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 text-white"><Plus className="mr-2 h-4 w-4" /> Add Consumable</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Consumable</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Unit</Label><Input value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="pcs, box, kg" /></div>
                            <div className="space-y-2"><Label>Min Level</Label><Input type="number" value={formData.minLevel} onChange={e => setFormData({ ...formData, minLevel: e.target.value })} /></div>
                        </div>
                        <DialogFooter><Button onClick={handleAdd}>Save</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {consumables.map(item => (
                    <Card key={item.id}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{item.name}</h3>
                                    <p className="text-sm text-gray-500">Min: {item.minLevel} {item.unit}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 size={16} /></Button>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity, -1)}><Minus size={16} /></Button>
                                <span className={`text-xl font-bold ${item.quantity < item.minLevel ? 'text-red-600' : 'text-gray-900'}`}>
                                    {item.quantity} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
                                </span>
                                <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity, 1)}><Plus size={16} /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default InventoryConsumables;
