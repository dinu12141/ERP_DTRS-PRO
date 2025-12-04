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

const damageSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  roofDamagePhotos: z.array(z.string()).min(1, 'At least one roof damage photo is required'),
  equipmentDamagePhotos: z.array(z.string()).min(1, 'At least one equipment damage photo is required'),
  notes: z.string().min(1, 'Notes are required for invoice integration'),
});

const TechDamageScan = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(damageSchema),
    defaultValues: {
      jobId: '',
      roofDamagePhotos: [],
      equipmentDamagePhotos: [],
      notes: '',
    },
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const roofPhotos = watch('roofDamagePhotos') || [];
  const equipmentPhotos = watch('equipmentDamagePhotos') || [];

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
        // Auto-add notes to invoice (Cloud Function will handle this)
        invoiceNote: `Damage scan completed: ${values.notes}`,
      };

      if (isOnline) {
        await addDoc(collection(db, 'damage_scans'), data);
        toast.success('Damage scan submitted! Notes will be added to invoice.');
      } else {
        await saveOffline('damage_scans', data);
        toast.info('Damage scan saved offline. Will sync when online.');
      }

      if (isOnline) {
        await syncPending();
      }
    } catch (error) {
      console.error('Error submitting damage scan:', error);
      toast.error('Failed to submit damage scan. Please try again.');
    }
  };

  return (
    <TechLayout title="Damage Scan">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Damage Scan</CardTitle>
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

            <PhotoCapture
              label="Roof Damage Photos"
              path="tech-photos/damage/roof/"
              maxPhotos={10}
              required
              onPhotoCaptured={(urls) => setValue('roofDamagePhotos', urls, { shouldValidate: true })}
            />
            {errors.roofDamagePhotos && (
              <p className="text-xs text-red-600 mt-1">
                {errors.roofDamagePhotos.message}
              </p>
            )}

            <PhotoCapture
              label="Equipment Damage Photos"
              path="tech-photos/damage/equipment/"
              maxPhotos={10}
              required
              onPhotoCaptured={(urls) => setValue('equipmentDamagePhotos', urls, { shouldValidate: true })}
            />
            {errors.equipmentDamagePhotos && (
              <p className="text-xs text-red-600 mt-1">
                {errors.equipmentDamagePhotos.message}
              </p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Notes (auto-added to invoice / job log)
              </label>
              <Textarea rows={3} {...register('notes')} />
              {errors.notes && (
                <p className="text-xs text-red-600 mt-1">{errors.notes.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : 'Save Damage Scan'}
            </Button>
            <p className="text-[10px] text-gray-500 mt-1">
              Mandatory photos and notes are enforced. Notes will be auto-added to invoice.
            </p>
          </form>
        </CardContent>
      </Card>
    </TechLayout>
  );
};

export default TechDamageScan;


