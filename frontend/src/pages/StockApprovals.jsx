import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextFirebase';
import { toast } from 'sonner';

const StockApprovals = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'stock_adjustments'), where('status', '==', 'pending'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const handleApprove = async (request) => {
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Update the adjustment request status
                const requestRef = doc(db, 'stock_adjustments', request.id);
                transaction.update(requestRef, {
                    status: 'approved',
                    approvedBy: user.uid,
                    approvedAt: new Date().toISOString()
                });

                // 2. Update the actual inventory bin/item
                // Note: This logic assumes we are updating the 'Main Warehouse' bin for simplicity.
                // In a complex system, the request should specify WHICH bin is being adjusted.
                // Here we'll find the warehouse bin for the item and update it.
                const binsQuery = query(
                    collection(db, 'inventory_bins'),
                    where('itemId', '==', request.itemId),
                    where('type', '==', 'warehouse')
                );
                const binsSnapshot = await getDocs(binsQuery);

                if (!binsSnapshot.empty) {
                    const binDoc = binsSnapshot.docs[0];
                    transaction.update(binDoc.ref, { quantity: request.requestedQuantity });
                } else {
                    // If no bin exists (rare), create one or handle error
                    throw new Error('No warehouse bin found for item');
                }
            });
            toast.success('Request Approved');
        } catch (error) {
            console.error(error);
            toast.error('Failed to approve request');
        }
    };

    const handleReject = async (id) => {
        try {
            await updateDoc(doc(db, 'stock_adjustments', id), {
                status: 'rejected',
                rejectedBy: user.uid,
                rejectedAt: new Date().toISOString()
            });
            toast.success('Request Rejected');
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Stock Approvals</h1>

            {requests.length === 0 ? (
                <p className="text-gray-500">No pending stock adjustments.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map(req => (
                        <Card key={req.id}>
                            <CardContent className="pt-6 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">{req.itemName}</h3>
                                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                        <span>Current: {req.currentQuantity}</span>
                                        <span className="font-bold text-blue-600">Requested: {req.requestedQuantity}</span>
                                        <span>Reason: {req.reason}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Requested by: {req.requestedBy}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(req.id)}>
                                        <X className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(req)}>
                                        <Check className="mr-2 h-4 w-4" /> Approve
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StockApprovals;
