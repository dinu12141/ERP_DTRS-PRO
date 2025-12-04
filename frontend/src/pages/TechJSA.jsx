import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { saveOffline, syncPending } from '../utils/offlineSync';
import { useAuth } from '../contexts/AuthContextFirebase';
import TechLayout from '../components/TechLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';

const jsaSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  location: z.string().min(1, 'Location is required'),
  hazardsReviewed: z.boolean().refine((val) => val, 'Required'),
  ppeChecked: z.boolean().refine((val) => val, 'Required'),
  ladderSafety: z.boolean().refine((val) => val, 'Required'),
  harnessCheck: z.boolean().refine((val) => val, 'Required'),
  roofCondition: z.boolean().refine((val) => val, 'Required'),
  powerOff: z.boolean().refine((val) => val, 'Required'),
  lockoutTagout: z.boolean(),
  notes: z.string().optional(),
  signatureName: z.string().min(2, 'Signature is required'),
});

const TechJSA = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(jsaSchema),
    defaultValues: {
      jobId: jobId || '',
      location: '',
      hazardsReviewed: false,
      ppeChecked: false,
      ladderSafety: false,
      harnessCheck: false,
      roofCondition: false,
      powerOff: false,
      lockoutTagout: false,
      notes: '',
      signatureName: '',
    },
  });

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

  const { user } = useAuth();

  const onSubmit = async (values) => {
    try {
      const data = {
        ...values,
        createdAt: new Date().toISOString(),
        technicianId: user?.uid || 'offline_user',
        technicianName: user?.name || values.signatureName,
      };

      if (isOnline) {
        // 1. Save JSA report to subcollection
        await addDoc(collection(db, `jobs/${values.jobId}/jsa`), {
          ...data,
          synced: true
        });

        // 2. Update Job status
        await updateDoc(doc(db, 'jobs', values.jobId), {
          jsaCompleted: true,
          jsaCompletedAt: serverTimestamp(),
          jsaCompletedBy: user?.uid
        });

        toast.success('JSA submitted successfully!');

        // Redirect back to job dashboard if we have a jobId
        if (jobId) {
          navigate(`/tech/job/${jobId}`);
        }
      } else {
        // Save offline
        await saveOffline('tech_jsa', data);
        toast.info('JSA saved offline. Will sync when online.');
        if (jobId) {
          navigate(`/tech/job/${jobId}`);
        }
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
          <CardTitle className="text-base">Safety Checklist</CardTitle>
          {!isOnline && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Offline mode</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Job ID</label>
                <Input placeholder="JOB-123" {...register('jobId')} readOnly={!!jobId} className={jobId ? "bg-gray-100" : ""} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Location</label>
                <Input placeholder="Site address" {...register('location')} />
                {errors.location && <p className="text-xs text-red-600">{errors.location.message}</p>}
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Mandatory Checks</p>

              {[
                { id: 'hazardsReviewed', label: 'Hazards reviewed with crew' },
                { id: 'ppeChecked', label: 'PPE inspected & worn' },
                { id: 'ladderSafety', label: 'Ladder secured (4:1 ratio)' },
                { id: 'harnessCheck', label: 'Harness/Anchor points verified' },
                { id: 'roofCondition', label: 'Roof walkability verified' },
                { id: 'powerOff', label: 'Power lines identified/avoided' },
              ].map((item) => (
                <div key={item.id}>
                  <label className="flex items-center gap-3 text-sm p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors cursor-pointer">
                    <Checkbox
                      checked={watch(item.id)}
                      onCheckedChange={(v) => setValue(item.id, Boolean(v))}
                    />
                    <span className="flex-1">{item.label}</span>
                  </label>
                  {errors[item.id] && (
                    <p className="text-xs text-red-600 ml-8 mt-0.5">Required</p>
                  )}
                </div>
              ))}

              <label className="flex items-center gap-3 text-sm p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors cursor-pointer">
                <Checkbox
                  checked={watch('lockoutTagout')}
                  onCheckedChange={(v) => setValue('lockoutTagout', Boolean(v))}
                />
                <span>Lockout/Tagout (if applicable)</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Notes</label>
              <Textarea rows={2} placeholder="Any additional hazards..." {...register('notes')} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Technician Signature
              </label>
              <Input placeholder="Type full name to sign" {...register('signatureName')} />
              {errors.signatureName && (
                <p className="text-xs text-red-600">{errors.signatureName.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Submitting...' : 'Sign & Complete JSA'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TechLayout>
  );
};

export default TechJSA;


