import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { saveOffline, syncPending } from '../utils/offlineSync';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContextFirebase';
import TechLayout from '../components/TechLayout';
import PhotoCapture from '../components/PhotoCapture';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const resetSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  stringVoltage: z.number().min(0, 'String voltage must be non-negative'),
  inverterMpptWindowMin: z.number().min(0),
  inverterMpptWindowMax: z.number().min(0),
  commissioningChecklistComplete: z.boolean().refine((v) => v, 'Commissioning checklist must be complete'),
  commissioningPhotos: z.array(z.string()).min(1, 'At least one commissioning photo is required'),
  notes: z.string().optional(),
});

const TechReset = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [voltageWarning, setVoltageWarning] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      jobId: '',
      stringVoltage: 0,
      inverterMpptWindowMin: 0,
      inverterMpptWindowMax: 0,
      commissioningChecklistComplete: false,
      commissioningPhotos: [],
      notes: '',
    },
  });

  const checklistComplete = watch('commissioningChecklistComplete');
  const stringVoltage = watch('stringVoltage');
  const inverterMpptWindowMin = watch('inverterMpptWindowMin');
  const inverterMpptWindowMax = watch('inverterMpptWindowMax');

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

  // Validate string voltage against MPPT window
  React.useEffect(() => {
    if (stringVoltage > 0 && inverterMpptWindowMin > 0 && inverterMpptWindowMax > 0) {
      if (stringVoltage < inverterMpptWindowMin || stringVoltage > inverterMpptWindowMax) {
        setVoltageWarning(
          `Warning: String voltage (${stringVoltage}V) is outside inverter MPPT window (${inverterMpptWindowMin}V - ${inverterMpptWindowMax}V)`
        );
      } else {
        setVoltageWarning(null);
      }
    }
  }, [stringVoltage, inverterMpptWindowMin, inverterMpptWindowMax]);

  const { user } = useAuth();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

  const onSubmit = async (values) => {
    try {
      const data = {
        ...values,
        createdAt: new Date().toISOString(),
        technicianId: user?.uid || 'offline_user',
        stringSizingValid: !voltageWarning,
      };

      if (isOnline) {
        const token = await user.getIdToken();
        await axios.post(`${API_BASE}/tech/reset`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Reset workflow submitted successfully!');
      } else {
        await saveOffline('reset_workflows', data);
        toast.info('Reset workflow saved offline. Will sync when online.');
      }

      if (isOnline) {
        await syncPending();
      }
    } catch (error) {
      console.error('Error submitting reset workflow:', error);
      if (!isOnline || error.message === 'Network Error') {
        await saveOffline('reset_workflows', data);
        toast.info('Network error. Reset workflow saved offline.');
      } else {
        toast.error('Failed to submit reset workflow. Please try again.');
      }
    }
  };

  return (
    <TechLayout title="Reset Workflow">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Reset Workflow</CardTitle>
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

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">String Sizing Calculator</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700">
                    String Voltage (V)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    {...register('stringVoltage', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700">
                    MPPT Min (V)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    {...register('inverterMpptWindowMin', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700">
                    MPPT Max (V)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    {...register('inverterMpptWindowMax', { valueAsNumber: true })}
                  />
                </div>
              </div>
              {voltageWarning && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{voltageWarning}</AlertDescription>
                </Alert>
              )}
              {errors.stringVoltage && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.stringVoltage.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <Checkbox
                  checked={checklistComplete}
                  onCheckedChange={(v) =>
                    setValue('commissioningChecklistComplete', Boolean(v), {
                      shouldValidate: true,
                    })
                  }
                />
                Commissioning checklist complete
              </label>
              {errors.commissioningChecklistComplete && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.commissioningChecklistComplete.message}
                </p>
              )}
            </div>

            <PhotoCapture
              label="Commissioning Photos"
              path="tech-photos/reset/commissioning/"
              maxPhotos={10}
              required
              onPhotoCaptured={(urls) => setValue('commissioningPhotos', urls, { shouldValidate: true })}
            />
            {errors.commissioningPhotos && (
              <p className="text-xs text-red-600 mt-1">{errors.commissioningPhotos.message}</p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Notes</label>
              <Textarea rows={3} placeholder="Additional commissioning notes..." {...register('notes')} />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : 'Save Reset Workflow'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TechLayout>
  );
};

export default TechReset;


