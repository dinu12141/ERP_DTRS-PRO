import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

// Schema for Pre-Work Photos
const preWorkSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  roofAngle1: z.array(z.string()).min(1, 'Required'),
  roofAngle2: z.array(z.string()).min(1, 'Required'),
  roofAngle3: z.array(z.string()).min(1, 'Required'),
  roofAngle4: z.array(z.string()).min(1, 'Required'),
  arrayCloseup: z.array(z.string()).min(1, 'Required'),
  mspCloseup: z.array(z.string()).min(1, 'Required'),
});

const TechDamageScan = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('prework');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Photo Viewer State
  const [viewingPhoto, setViewingPhoto] = useState(null);

  // Damage Report State
  const [damageItems, setDamageItems] = useState([]);
  const [damageType, setDamageType] = useState('');
  const [damagePhoto, setDamagePhoto] = useState([]);
  const [damageNote, setDamageNote] = useState('');

  // Pre-Work Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(preWorkSchema),
    defaultValues: {
      jobId: jobId || '',
      roofAngle1: [],
      roofAngle2: [],
      roofAngle3: [],
      roofAngle4: [],
      arrayCloseup: [],
      mspCloseup: [],
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

  const onPreWorkSubmit = async (values) => {
    try {
      const data = {
        ...values,
        createdAt: new Date().toISOString(),
        technicianId: user?.uid || 'offline_user',
        type: 'pre_work_photos'
      };

      if (isOnline) {
        // Save to subcollection
        await addDoc(collection(db, `jobs/${values.jobId}/site_photos`), data);
        toast.success('Pre-work photos saved!');
        setActiveTab('damage'); // Move to next tab
      } else {
        await saveOffline('pre_work_photos', data);
        toast.info('Saved offline.');
        setActiveTab('damage');
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      toast.error('Failed to save photos');
    }
  };

  const addDamageItem = async () => {
    if (!damageType || damagePhoto.length === 0) {
      toast.error('Type and Photo are required');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      type: damageType,
      photos: damagePhoto,
      note: damageNote,
      createdAt: new Date().toISOString(),
      technicianId: user?.uid || 'offline_user',
    };

    setDamageItems([...damageItems, newItem]);

    // Reset inputs
    setDamageType('');
    setDamagePhoto([]);
    setDamageNote('');

    // Save immediately to Firestore
    try {
      if (isOnline) {
        await addDoc(collection(db, 'job_activities'), {
          jobId: jobId,
          ...newItem,
          activityType: 'damage_report'
        });

        // Update job with invoice note
        const noteText = `[DAMAGE] ${newItem.type}: ${newItem.note || 'No details'}`;
        await updateDoc(doc(db, 'jobs', jobId), {
          damageReported: true,
          invoiceNotes: arrayUnion(noteText)
        });

        toast.success('Damage reported');
      } else {
        await saveOffline('damage_reports', { jobId, ...newItem });
        toast.info('Damage reported (offline)');
      }
    } catch (error) {
      console.error('Error saving damage:', error);
      toast.error('Failed to save damage report');
    }
  };

  return (
    <TechLayout title="Site Scan">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prework">Pre-Work Photos</TabsTrigger>
          <TabsTrigger value="damage">Damage Scan</TabsTrigger>
        </TabsList>

        {/* PRE-WORK PHOTOS TAB */}
        <TabsContent value="prework">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mandatory Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onPreWorkSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <PhotoCapture
                    label="Roof Angle 1"
                    maxPhotos={1}
                    required
                    onPhotoCaptured={(urls) => setValue('roofAngle1', urls, { shouldValidate: true })}
                    onView={setViewingPhoto}
                  />
                  <PhotoCapture
                    label="Roof Angle 2"
                    maxPhotos={1}
                    required
                    onPhotoCaptured={(urls) => setValue('roofAngle2', urls, { shouldValidate: true })}
                    onView={setViewingPhoto}
                  />
                  <PhotoCapture
                    label="Roof Angle 3"
                    maxPhotos={1}
                    required
                    onPhotoCaptured={(urls) => setValue('roofAngle3', urls, { shouldValidate: true })}
                    onView={setViewingPhoto}
                  />
                  <PhotoCapture
                    label="Roof Angle 4"
                    maxPhotos={1}
                    required
                    onPhotoCaptured={(urls) => setValue('roofAngle4', urls, { shouldValidate: true })}
                    onView={setViewingPhoto}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PhotoCapture
                    label="Array Close-up"
                    maxPhotos={1}
                    required
                    onPhotoCaptured={(urls) => setValue('arrayCloseup', urls, { shouldValidate: true })}
                    onView={setViewingPhoto}
                  />
                  <PhotoCapture
                    label="MSP Close-up"
                    maxPhotos={1}
                    required
                    onPhotoCaptured={(urls) => setValue('mspCloseup', urls, { shouldValidate: true })}
                    onView={setViewingPhoto}
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Saving...' : 'Save & Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DAMAGE SCAN TAB */}
        <TabsContent value="damage">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Report Damage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Damage Type</label>
                <Select value={damageType} onValueChange={setDamageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Broken Tile">Broken Tile</SelectItem>
                    <SelectItem value="Wiring Issue">Wiring Issue</SelectItem>
                    <SelectItem value="Panel Damage">Panel Damage</SelectItem>
                    <SelectItem value="Roof Leak">Roof Leak</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <PhotoCapture
                label="Damage Photo"
                maxPhotos={3}
                onPhotoCaptured={setDamagePhoto}
                onView={setViewingPhoto}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={damageNote}
                  onChange={(e) => setDamageNote(e.target.value)}
                  placeholder="Describe the damage..."
                  rows={2}
                />
              </div>

              <Button type="button" onClick={addDamageItem} className="w-full" variant="destructive">
                Log Damage
              </Button>
            </CardContent>
          </Card>

          {/* Damage List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Reported Items</h3>
            {damageItems.length === 0 && (
              <p className="text-sm text-gray-500 italic">No damage reported yet.</p>
            )}
            {damageItems.map((item) => (
              <Card key={item.id} className="bg-red-50 border-red-100">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-red-800 text-sm">{item.type}</p>
                      <p className="text-xs text-red-600">{item.note}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {item.photos && item.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {item.photos.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Damage"
                          className="w-12 h-12 rounded object-cover cursor-pointer border border-red-200"
                          onClick={() => setViewingPhoto(url)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Photo Viewer Modal */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-none overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center bg-black/90">
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-4 right-4 text-white z-50 bg-black/50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            {viewingPhoto && (
              <img
                src={viewingPhoto}
                alt="Full view"
                className="max-h-[85vh] max-w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TechLayout>
  );
};

export default TechDamageScan;


