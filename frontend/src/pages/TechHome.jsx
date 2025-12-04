import React from 'react';
import { Link } from 'react-router-dom';
import TechLayout from '../components/TechLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ClipboardList, Camera, Wrench, RefreshCcw, Smartphone } from 'lucide-react';

const TechHome = () => {
  return (
    <TechLayout title="Technician Portal" showBack={false}>
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">DTRS PRO Field App</h1>
          <p className="text-sm text-gray-600">
            Mobile-friendly workflows for field technicians
          </p>
        </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pre-Work & Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full justify-start">
            <Link to="/tech/jsa">
              <ClipboardList className="mr-2" size={18} />
              Pre-Work JSA Checklist
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to="/tech/damage-scan">
              <Camera className="mr-2" size={18} />
              Damage Scan & Photos
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Job Workflows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to="/tech/detach">
              <Wrench className="mr-2" size={18} />
              Detach Workflow
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to="/tech/reset">
              <RefreshCcw className="mr-2" size={18} />
              Reset Workflow
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone size={18} />
            PWA Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Works offline - data syncs when online</li>
            <li>✓ Install as app on your device</li>
            <li>✓ Camera integration for photos</li>
            <li>✓ Auto-sync to cloud</li>
          </ul>
        </CardContent>
      </Card>
      </div>
    </TechLayout>
  );
};

export default TechHome;


