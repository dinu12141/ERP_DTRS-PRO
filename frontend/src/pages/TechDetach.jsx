import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { saveOffline, syncPending } from '../utils/offlineSync';
import { useAuth } from '../contexts/AuthContextFirebase';
import TechLayout from '../components/TechLayout';
import PhotoCapture from '../components/PhotoCapture';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { QrReader } from 'react-qr-reader';
import { Scan, CheckCircle2, Circle, ArrowRight, ArrowLeft } from 'lucide-react';

// Schema for each step
const productionSchema = z.object({
  productionBaselineKw: z.number().min(0, 'Required'),
  inverterSerialPhotos: z.array(z.string()).min(1, 'Required'),
});

const baggingSchema = z.object({
  panelsBagged: z.boolean().refine(val => val === true, 'Must confirm bagging'),
  baggingPhotos: z.array(z.string()).optional(),
});

const locationSchema = z.object({
  equipmentLocation: z.string().min(1, 'Required'),
  locationNotes: z.string().optional(),
});

const TechDetach = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Asset Tagging State
  const [scanning, setScanning] = useState(false);
  const [scannedAssets, setScannedAssets] = useState([]);
  const [manualTag, setManualTag] = useState('');
  const [palletPhoto, setPalletPhoto] = useState([]);

  // Form Hooks
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger
  } = useForm({
    defaultValues: {
      productionBaselineKw: 0,
      inverterSerialPhotos: [],
      panelsBagged: false,
      baggingPhotos: [],
      equipmentLocation: '',
      locationNotes: '',
    },
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Step Navigation
  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) isValid = await trigger(['productionBaselineKw', 'inverterSerialPhotos']);
    if (currentStep === 2) isValid = await trigger(['panelsBagged']);
    if (currentStep === 3) isValid = scannedAssets.length > 0; // Custom validation for assets

    if (isValid) setCurrentStep(prev => prev + 1);
    else if (currentStep === 3) toast.error('Scan at least one asset');
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  // Asset Scanning
  const handleScan = (result, error) => {
    if (!!result) {
      const code = result?.text;
      if (!scannedAssets.some(a => a.code === code)) {
        setScannedAssets(prev => [...prev, { code, type: 'scanned', timestamp: new Date().toISOString() }]);
        toast.success(`Scanned: ${code}`);
        setScanning(false);
      }
    }
  };

  const addManualTag = () => {
    if (!manualTag) return;
    setScannedAssets(prev => [...prev, { code: manualTag, type: 'manual', timestamp: new Date().toISOString() }]);
    setManualTag('');
  };

  const removeAsset = (index) => {
    setScannedAssets(prev => prev.filter((_, i) => i !== index));
  };

  // Final Submission
  const onSubmit = async (values) => {
    try {
      const detachData = {
        jobId,
        technicianId: user?.uid || 'offline_user',
        completedAt: new Date().toISOString(),
        steps: {
          production: {
            baseline: values.productionBaselineKw,
            photos: values.inverterSerialPhotos
          },
          bagging: {
            completed: values.panelsBagged,
            photos: values.baggingPhotos
          },
          tagging: {
            assets: scannedAssets,
            palletPhoto: palletPhoto
          },
          location: {
            area: values.equipmentLocation,
            notes: values.locationNotes
          }
        }
      };

      if (isOnline) {
        // 1. Save Detach Record
        await addDoc(collection(db, `jobs/${jobId}/detach`), detachData);

        // 2. Save Assets to Collection
        const batchPromises = scannedAssets.map(asset =>
          addDoc(collection(db, `jobs/${jobId}/assets`), {
            ...asset,
            status: 'detached',
            location: values.equipmentLocation
          })
        );
        await Promise.all(batchPromises);

        // 3. Update Job Status
        await updateDoc(doc(db, 'jobs', jobId), {
          status: 'Detached',
          detachCompleted: true,
          detachCompletedAt: serverTimestamp()
        });

        toast.success('Detach workflow completed!');
        navigate(`/tech/job/${jobId}`);
      } else {
        await saveOffline('detach_workflow', detachData);
        toast.info('Saved offline.');
        navigate(`/tech/job/${jobId}`);
      }
    } catch (error) {
      console.error('Error saving detach:', error);
      toast.error('Failed to save workflow');
    }
  };

  // Render Steps
  const renderStepIndicator = () => (
    <div className="flex justify-between mb-6 px-2">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === currentStep ? 'bg-blue-600 text-white' :
              step < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
            {step < currentStep ? <CheckCircle2 size={16} /> : step}
          </div>
          <span className="text-[10px] text-gray-500 font-medium">
            {step === 1 ? 'Prod' : step === 2 ? 'Bag' : step === 3 ? 'Tag' : 'Loc'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <TechLayout title="Detach Workflow">
      {renderStepIndicator()}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* STEP 1: PRODUCTION */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">System Production</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Production (kW)</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('productionBaselineKw', { valueAsNumber: true })}
                  />
                </div>
                <PhotoCapture
                  label="Inverter Screen Photo"
                  maxPhotos={2}
                  required
                  onPhotoCaptured={(urls) => setValue('inverterSerialPhotos', urls)}
                />
              </div>
            )}

            {/* STEP 2: BAGGING */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Panel Protection</h3>
                <div className="flex items-center space-x-2 border p-4 rounded-lg bg-gray-50">
                  <Checkbox
                    id="bagged"
                    checked={watch('panelsBagged')}
                    onCheckedChange={(v) => setValue('panelsBagged', Boolean(v))}
                  />
                  <label htmlFor="bagged" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    All panels have been bagged/protected
                  </label>
                </div>
                <PhotoCapture
                  label="Bagged Panels (Optional)"
                  maxPhotos={2}
                  onPhotoCaptured={(urls) => setValue('baggingPhotos', urls)}
                />
              </div>
            )}

            {/* STEP 3: TAGGING */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Asset Tagging</h3>

                {scanning ? (
                  <div className="relative h-64 bg-black rounded-lg overflow-hidden">
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
                      Stop Scanning
                    </Button>
                  </div>
                ) : (
                  <Button type="button" onClick={() => setScanning(true)} className="w-full" variant="outline">
                    <Scan className="mr-2 h-4 w-4" /> Scan Barcode/QR
                  </Button>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Manual Serial #"
                    value={manualTag}
                    onChange={(e) => setManualTag(e.target.value)}
                  />
                  <Button type="button" onClick={addManualTag} variant="secondary">Add</Button>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg min-h-[100px]">
                  <p className="text-xs text-gray-500 mb-2">Scanned Assets ({scannedAssets.length})</p>
                  <div className="space-y-1">
                    {scannedAssets.map((asset, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                        <span className="font-mono">{asset.code}</span>
                        <button type="button" onClick={() => removeAsset(i)} className="text-red-500 hover:text-red-700">
                          &times;
                        </button>
                      </div>
                    ))}
                    {scannedAssets.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No assets scanned</p>}
                  </div>
                </div>

                <PhotoCapture
                  label="Pallet Tag Photo"
                  maxPhotos={1}
                  onPhotoCaptured={setPalletPhoto}
                />
              </div>
            )}

            {/* STEP 4: LOCATION */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Equipment Location</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Storage Area</label>
                  <Input placeholder="e.g. Garage, Side Yard" {...register('equipmentLocation', { required: true })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea placeholder="Access details, stack height..." {...register('locationNotes')} />
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            <div className="flex gap-3 mt-8 pt-4 border-t">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}

              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700">
                  {isSubmitting ? 'Saving...' : 'Complete Detach'}
                </Button>
              )}
            </div>

          </form>
        </CardContent>
      </Card>
    </TechLayout>
  );
};

export default TechDetach;


