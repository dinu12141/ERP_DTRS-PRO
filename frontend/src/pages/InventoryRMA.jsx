import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextFirebase';
import { toast } from 'sonner';
import PhotoCapture from '../components/PhotoCapture';

const InventoryRMA = () => {
    const { user } = useAuth();
    const [rmas, setRmas] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        itemName: '',
        serialNumber: '',
        reason: '',
        status: 'Pending',
        photos: []
    });

    useEffect(() => {
        if (!user) return;
        const unsubscribe = onSnapshot(collection(db, 'inventory_rma'), (snapshot) => {
            setRmas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const handleAdd = async () => {
        try {
            await addDoc(collection(db, 'inventory_rma'), {
                ...formData,
                createdAt: new Date().toISOString(),
                createdBy: user.uid
            });
            toast.success('RMA Created');
            setIsAddOpen(false);
            setFormData({ itemName: '', serialNumber: '', reason: '', status: 'Pending', photos: [] });
        } catch (error) {
            toast.error('Failed to create RMA');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, 'inventory_rma', id), { status });
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        const map = { 'Pending': 'bg-yellow-100 text-yellow-800', 'Approved': 'bg-blue-100 text-blue-800', 'Completed': 'bg-green-100 text-green-800', 'Rejected': 'bg-red-100 text-red-800' };
        return map[status] || 'bg-gray-100';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">RMA Management</h1>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 text-white hover:bg-red-700"><Plus className="mr-2 h-4 w-4" /> Create RMA</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Return Authorization</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Item Name</Label><Input value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Serial Number</Label><Input value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Reason for Return</Label><Textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} /></div>
                            <div className="space-y-2">
                                <Label>Photos</Label>
                                <PhotoCapture label="Damage Photos" maxPhotos={3} onPhotoCaptured={urls => setFormData({ ...formData, photos: urls })} />
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleAdd}>Submit RMA</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {rmas.map(rma => (
                    <Card key={rma.id}>
                        <CardContent className="pt-6 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg">{rma.itemName}</h3>
                                    <Badge className={getStatusColor(rma.status)}>{rma.status}</Badge>
                                </div>
                                <p className="text-sm text-gray-600">Serial: {rma.serialNumber}</p>
                                <p className="text-sm text-gray-600 mt-1">Reason: {rma.reason}</p>
                                {rma.photos && rma.photos.length > 0 && (
                                    <div className="flex gap-2 mt-2">
                                        {rma.photos.map((url, i) => (
                                            <img key={i} src={url} alt="RMA" className="w-16 h-16 object-cover rounded border" />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Select value={rma.status} onValueChange={v => updateStatus(rma.id, v)}>
                                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default InventoryRMA;
