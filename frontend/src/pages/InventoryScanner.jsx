import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { QrCode, ArrowRightLeft } from 'lucide-react';

// This is a lightweight QR "scanner" UI that expects the device/browser
// to provide scanned codes (via camera-integrated libraries or OS-level
// QR scanning). For now, we accept manual entry to simulate scans.

const InventoryScanner = () => {
  const [fromBinCode, setFromBinCode] = useState('');
  const [toBinCode, setToBinCode] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleTransfer = (e) => {
    e.preventDefault();
    // In a full implementation, you would:
    // 1. Look up bins by binCode in Firestore (inventoryBins collection)
    // 2. Call the backend /inventory/bins/transfer endpoint with itemId and bin IDs
    alert(
      `Transfer requested:\nFrom bin: ${fromBinCode}\nTo bin: ${toBinCode}\nQuantity: ${quantity}`,
    );
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
          <form className="space-y-4" onSubmit={handleTransfer}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                From Bin (scan or enter code)
              </label>
              <Input
                value={fromBinCode}
                onChange={(e) => setFromBinCode(e.target.value)}
                placeholder="BIN-FROM-QR"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                To Bin (scan or enter code)
              </label>
              <Input
                value={toBinCode}
                onChange={(e) => setToBinCode(e.target.value)}
                placeholder="BIN-TO-QR"
              />
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
            <Button type="submit" className="w-full">
              <ArrowRightLeft size={16} className="mr-2" />
              Transfer
            </Button>
            <p className="text-[10px] text-gray-500 mt-1">
              Integrate a camera-based QR scanner (e.g. using html5-qrcode) to fill these fields
              from scanned codes.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryScanner;


