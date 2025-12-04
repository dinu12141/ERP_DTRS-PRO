import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { saveOffline, syncPending } from '../utils/offlineSync';
import TechLayout from '../components/TechLayout';
import PhotoCapture from '../components/PhotoCapture';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const detachSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  productionBaselineKw: z.number().min(0, 'Baseline must be non-negative'),
  inverterSerialPhotos: z.array(z.string()).min(1, 'At least one inverter photo is required'),
  assetTags: z.string().min(1, 'Asset tags are required'),
  equipmentLocationNotes: z.string().min(1, 'Location notes are required'),
});

const TechDetach = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm({
    resolver: zodResolver(detachSchema),
    defaultValues: {
      jobId: '',
      productionBaselineKw: 0,
      inverterSerialPhotos: [],
      assetTags: '',
      equipmentLocationNotes: '',
    },
  });

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onSubmit = async (values) => {
    try {
      const data = {
        ...values,
        createdAt: new Date().toISOString(),
        technicianId: 'current_user',
      };

      if (isOnline) {
        await addDoc(collection(db, 'detach_workflows'), data);
        toast.success('Detach workflow submitted successfully!');
      } else {
        await saveOffline('detach_workflows', data);
        toast.info('Detach workflow saved offline. Will sync when online.');
      }

      if (isOnline) {
        await syncPending();
      }
    } catch (error) {
      console.error('Error submitting detach workflow:', error);
      toast.error('Failed to submit detach workflow. Please try again.');
    }
  };

  return (
    <TechLayout title="Detach Workflow">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Detach Workflow</CardTitle>
          {!isOnline && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Offline mode - will sync when online</p>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Job ID</label>
              <Input placeholder="JOB-123" {...register('jobId')} />
              {errors.jobId && (
                <p className="text-xs text-red-600 mt-1">{errors.jobId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Production Baseline (kW)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                {...register('productionBaselineKw', {
                  valueAsNumber: true,
                })}
              />
              {errors.productionBaselineKw && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.productionBaselineKw.message}
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Record current production before detach
              </p>
            </div>

            <PhotoCapture
              label="Inverter Serial Photos"
              path="tech-photos/detach/inverter/"
              maxPhotos={5}
              required
              onPhotoCaptured={(urls) => setValue('inverterSerialPhotos', urls, { shouldValidate: true })}
            />
            {errors.inverterSerialPhotos && (
              <p className="text-xs text-red-600 mt-1">
                {errors.inverterSerialPhotos.message}
              </p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Asset Tagging (panel/inverter tags)
              </label>
              <Textarea
                rows={3}
                placeholder="List asset tags or QR references (e.g., Panel-001, Inverter-ABC123)..."
                {...register('assetTags')}
              />
              {errors.assetTags && (
                <p className="text-xs text-red-600 mt-1">{errors.assetTags.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Equipment Location Notes
              </label>
              <Textarea
                rows={3}
                placeholder="Describe where equipment is stored during roofing (e.g., 'Equipment stored in garage, panels stacked on pallets')..."
                {...register('equipmentLocationNotes')}
              />
              {errors.equipmentLocationNotes && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.equipmentLocationNotes.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : 'Save Detach Workflow'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TechLayout>
  );
};

export default TechDetach;


