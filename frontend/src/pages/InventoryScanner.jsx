import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { QrCode, ArrowRightLeft, Scan, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextFirebase';
import { toast } from 'sonner';
import { QrReader } from 'react-qr-reader';
import { collection, query, where, getDocs, runTransaction, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const InventoryScanner = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState('from'); // 'from' or 'to'

  const [fromBinCode, setFromBinCode] = useState('');
  const [toBinCode, setToBinCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleScan = (result, error) => {
    if (!!result) {
      const code = result?.text;
      if (scanMode === 'from') {
        setFromBinCode(code);
        toast.success(`Source: ${code}`);
      } else {
        setToBinCode(code);
        toast.success(`Destination: ${code}`);
      }
      setScanning(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fromBinCode || !toBinCode) {
        toast.error('Both bins are required');
        return;
      }

      await runTransaction(db, async (transaction) => {
        // 1. Find Source Bin
        const fromQuery = query(collection(db, 'inventory_bins'), where('location', '==', fromBinCode));
        const fromSnapshot = await getDocs(fromQuery);

        if (fromSnapshot.empty) throw new Error(`Source bin '${fromBinCode}' not found`);
        const fromDoc = fromSnapshot.docs[0];
        const fromData = fromDoc.data();

        if (fromData.quantity < quantity) throw new Error(`Insufficient stock in source bin (Available: ${fromData.quantity})`);

        // 2. Find or Create Destination Bin
        // For simplicity, we assume destination bin exists or we find a matching one.
        // In a real scenario, we might create a new bin if it doesn't exist but matches a valid location pattern.
        const toQuery = query(
          collection(db, 'inventory_bins'),
          where('location', '==', toBinCode),
          where('itemId', '==', fromData.itemId) // Must match item type
        );
        const toSnapshot = await getDocs(toQuery);

        let toDocRef;
        let newToQuantity;

        if (toSnapshot.empty) {
          // If exact bin doesn't exist for this item, we might need to create it 
          // OR fail if strict bin management is enforced.
          // Let's assume we can create a new bin entry for this item at that location.
          const newBinRef = doc(collection(db, 'inventory_bins'));
          transaction.set(newBinRef, {
            itemId: fromData.itemId,
            location: toBinCode,
            quantity: quantity,
            type: 'warehouse', // Defaulting to warehouse for generic moves
            refId: 'MOVED_STOCK'
          });
        } else {
          const toDoc = toSnapshot.docs[0];
          toDocRef = toDoc.ref;
          newToQuantity = (toDoc.data().quantity || 0) + quantity;
          transaction.update(toDocRef, { quantity: newToQuantity });
        }

        // 3. Deduct from Source
        const newFromQuantity = fromData.quantity - quantity;
        transaction.update(fromDoc.ref, { quantity: newFromQuantity });

        // 4. Log Transaction (Optional but recommended)
        const logRef = doc(collection(db, 'inventory_transactions'));
        transaction.set(logRef, {
          itemId: fromData.itemId,
          fromBin: fromBinCode,
          toBin: toBinCode,
          quantity: quantity,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          type: 'transfer'
        });
      });

      toast.success('Transfer successful');
      setFromBinCode('');
      setToBinCode('');
      setQuantity(1);
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(error.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode size={18} />
            Bin Transfer (QR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="relative h-64 bg-black rounded-lg overflow-hidden mb-4">
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: 'environment' }}
                className="w-full h-full object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute bottom-4 left-1/2 -translate-x-1/2"
                onClick={() => setScanning(false)}
              >
                Cancel Scan
              </Button>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                Scanning {scanMode === 'from' ? 'Source' : 'Destination'} Bin
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleTransfer}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  From Bin
                </label>
                <div className="flex gap-2">
                  <Input
                    value={fromBinCode}
                    onChange={(e) => setFromBinCode(e.target.value)}
                    placeholder="Scan Source"
                  />
                  <Button type="button" variant="outline" onClick={() => { setScanMode('from'); setScanning(true); }}>
                    <Scan size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  To Bin
                </label>
                <div className="flex gap-2">
                  <Input
                    value={toBinCode}
                    onChange={(e) => setToBinCode(e.target.value)}
                    placeholder="Scan Destination"
                  />
                  <Button type="button" variant="outline" onClick={() => { setScanMode('to'); setScanning(true); }}>
                    <Scan size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <ArrowRightLeft size={16} className="mr-2" />
                {loading ? 'Transferring...' : 'Transfer Stock'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryScanner;


