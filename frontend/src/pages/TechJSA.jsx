import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { saveOffline, syncPending } from '../utils/offlineSync';
import TechLayout from '../components/TechLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const jsaSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  location: z.string().min(1, 'Location is required'),
  hazardsReviewed: z.boolean().refine((val) => val, 'You must confirm hazards review'),
  ppeChecked: z.boolean().refine((val) => val, 'You must confirm PPE check'),
  lockoutTagout: z.boolean(),
  notes: z.string().optional(),
  signatureName: z.string().min(2, 'Signature is required'),
});

const TechJSA = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(jsaSchema),
    defaultValues: {
      jobId: '',
      location: '',
      hazardsReviewed: false,
      ppeChecked: false,
      lockoutTagout: false,
      notes: '',
      signatureName: '',
    },
  });

  const hazardsReviewed = watch('hazardsReviewed');
  const ppeChecked = watch('ppeChecked');
  const lockoutTagout = watch('lockoutTagout');

  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
        technicianId: 'current_user', // Replace with actual user ID from auth context
      };

      if (isOnline) {
        // Save to Firestore directly
        await addDoc(collection(db, 'tech_jsa'), data);
        toast.success('JSA submitted successfully!');
      } else {
        // Save offline for later sync
        await saveOffline('tech_jsa', data);
        toast.info('JSA saved offline. Will sync when online.');
      }

      // Try to sync any pending items
      if (isOnline) {
        await syncPending();
      }
    } catch (error) {
      console.error('Error submitting JSA:', error);
      toast.error('Failed to submit JSA. Please try again.');
    }
  };

  return (
    <TechLayout title="Pre-Work JSA">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pre-Work JSA</CardTitle>
          {!isOnline && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Offline mode - will sync when online</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Job ID</label>
              <Input placeholder="JOB-123" {...register('jobId')} />
              {errors.jobId && (
                <p className="text-xs text-red-600 mt-1">{errors.jobId.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Location</label>
              <Input placeholder="Site address" {...register('location')} />
              {errors.location && (
                <p className="text-xs text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Checklist</p>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={hazardsReviewed}
                  onCheckedChange={(v) => setValue('hazardsReviewed', Boolean(v))}
                />
                <span>All site hazards reviewed with crew</span>
              </label>
              {errors.hazardsReviewed && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.hazardsReviewed.message}
                </p>
              )}
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={ppeChecked}
                  onCheckedChange={(v) => setValue('ppeChecked', Boolean(v))}
                />
                <span>PPE inspected and in use</span>
              </label>
              {errors.ppeChecked && (
                <p className="text-xs text-red-600 mt-1">{errors.ppeChecked.message}</p>
              )}
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={lockoutTagout}
                  onCheckedChange={(v) => setValue('lockoutTagout', Boolean(v))}
                />
                <span>Lockout/Tagout in place (if applicable)</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Notes</label>
              <Textarea rows={3} placeholder="Additional hazards, mitigations..." {...register('notes')} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Technician Signature (type full name)
              </label>
              <Input placeholder="John Smith" {...register('signatureName')} />
              {errors.signatureName && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.signatureName.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : 'Complete JSA'}
            </Button>
            <p className="text-[10px] text-gray-500">
              This form works offline. Submissions are cached on-device and should be synced when
              online.
            </p>
          </form>
        </CardContent>
      </Card>
    </TechLayout>
  );
};

export default TechJSA;


