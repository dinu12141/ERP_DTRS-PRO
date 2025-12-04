import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, MapPin, Calendar, Sun, Battery, Image as ImageIcon, X, Upload, Activity, FileText, Maximize2, Link as LinkIcon, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContextFirebase';
import { generateNextJobId } from '../utils/jobUtils';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useNotifications } from '../contexts/NotificationContext';

const workflowStages = [
  { key: 'intake_quoting', label: 'Intake', color: 'bg-blue-500' },
  { key: 'site_survey', label: 'Survey', color: 'bg-purple-500', match: ['site_survey_pending', 'site_survey_complete'] },
  { key: 'permit', label: 'Permit', color: 'bg-yellow-500', match: ['permit_submitted', 'permit_approved'] },
  { key: 'detach', label: 'Detach', color: 'bg-orange-500', match: ['scheduled_detach', 'detach_complete_hold'] },
  { key: 'roofing', label: 'Roofing', color: 'bg-pink-500', match: ['roofing_complete'] },
  { key: 'reset', label: 'Reset', color: 'bg-green-500', match: ['ready_for_reset', 'scheduled_reset', 'reset_complete'] },
  { key: 'inspection', label: 'Inspection', color: 'bg-indigo-500', match: ['inspection_pto_passed'] },
  { key: 'closed', label: 'Closed', color: 'bg-gray-500', match: ['closed'] }
];

const Jobs = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    systemType: 'Solar',
    systemSize: 0,
    panelCount: 0,
    panelBrand: '',
    inverterBrand: '',
    inverterModel: '',
    estimatedValue: 0,
    priority: 'Medium',
    notes: ''
  });

  // Photo upload states
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoLabel, setPhotoLabel] = useState('');
  const [photoCategory, setPhotoCategory] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Real-time listeners
  const { data: jobs, loading, add: addJob, update: updateJob } = useFirestore('jobs');

  // Update selectedJob when real-time data changes
  useEffect(() => {
    if (selectedJob) {
      const updated = jobs.find(j => j.id === selectedJob.id);
      if (updated) {
        setSelectedJob(updated);
      }
    }
  }, [jobs, selectedJob]);

  const filteredJobs = jobs.filter(
    (job) =>
      (job.jobId || job.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStageConfig = (status) => {
    return workflowStages.find(s => s.key === status || (s.match && s.match.includes(status))) ||
      { label: status, color: 'bg-gray-500' };
  };

  const getStatusColor = (status) => {
    return getStageConfig(status).color;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateChange = (field, value) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newJobId = await generateNextJobId();

      const newJob = {
        jobId: newJobId,
        ...createForm,
        systemSize: Number(createForm.systemSize),
        panelCount: Number(createForm.panelCount),
        estimatedValue: Number(createForm.estimatedValue),
        workflowState: 'intake_quoting',
        createdAt: new Date().toISOString(),
        createdBy: user.email,
        media: [], // Using 'media' instead of 'photos'
        activityLog: [
          {
            action: 'Job Created',
            user: user.email,
            timestamp: new Date().toISOString(),
            details: 'Initial job creation'
          }
        ]
      };

      await addJob(newJob);

      addNotification({
        type: 'success',
        title: 'New Job Created',
        message: `Job ${newJobId} for ${createForm.customerName} has been created.`,
        link: `/jobs`
      });

      setIsCreateDialogOpen(false);
      setCreateForm({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        systemType: 'Solar',
        systemSize: 0,
        panelCount: 0,
        panelBrand: '',
        inverterBrand: '',
        inverterModel: '',
        estimatedValue: 0,
        priority: 'Medium',
        notes: ''
      });
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedJob) return;
    if (uploadMode === 'file' && !photoFile) return;
    if (uploadMode === 'url' && !photoUrlInput) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload = photoFile;
      let fileName = photoFile ? photoFile.name : 'image_from_url';
      let fileType = photoFile ? photoFile.name.split('.').pop().toLowerCase() : 'jpg';

      // If URL mode, try to fetch the blob
      if (uploadMode === 'url') {
        try {
          const response = await fetch(photoUrlInput);
          const blob = await response.blob();
          fileToUpload = blob;
          fileName = photoUrlInput.split('/').pop().split('?')[0] || `url_upload_${Date.now()}.jpg`;
          fileType = blob.type.split('/')[1] || 'jpg';
        } catch (err) {
          console.warn("CORS or fetch error, saving URL directly", err);
          // Fallback: Save URL directly
          const newMedia = {
            url: photoUrlInput,
            label: photoLabel || 'External Image',
            category: photoCategory,
            type: 'url',
            uploadDate: new Date().toISOString(),
            uploadedBy: user.email
          };
          await saveMediaToJob(newMedia);
          setIsUploading(false);
          resetUploadState();
          return;
        }
      }

      const storageRef = ref(storage, `job_media/${selectedJob.jobId || selectedJob.id}/${Date.now()}_${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          alert("Upload failed.");
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          const newMedia = {
            url: downloadURL,
            label: photoLabel || fileName,
            category: photoCategory,
            type: fileType,
            uploadDate: new Date().toISOString(),
            uploadedBy: user.email
          };

          await saveMediaToJob(newMedia);
          setIsUploading(false);
          resetUploadState();
        }
      );

    } catch (error) {
      console.error("Error in upload flow:", error);
      alert("An unexpected error occurred.");
      setIsUploading(false);
    }
  };

  const saveMediaToJob = async (newMediaItem) => {
    const currentMedia = selectedJob.media || selectedJob.photos || [];
    const updatedMedia = [...currentMedia, newMediaItem];

    const updatedActivity = [
      {
        action: 'Media Added',
        user: user.email,
        timestamp: new Date().toISOString(),
        details: `Added ${newMediaItem.label}`
      },
      ...(selectedJob.activityLog || [])
    ];

    await updateJob(selectedJob.id, {
      media: updatedMedia,
      // Keep photos synced for backward compatibility if needed, or just migrate to media
      photos: updatedMedia,
      activityLog: updatedActivity
    });
  };

  const resetUploadState = () => {
    setIsPhotoDialogOpen(false);
    setPhotoFile(null);
    setPhotoUrlInput('');
    setPhotoLabel('');
    setPhotoCategory('');
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Records</h1>
          <p className="text-gray-600 mt-1">Manage solar installation projects and workflows</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus size={20} className="mr-2" />
          Create Job
        </Button>
      </div>

      {/* Workflow Stages Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {workflowStages.map((stage, index) => (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`${stage.color} text-white px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm shadow-md`}
                  >
                    {stage.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {jobs.filter((j) => {
                      const config = getStageConfig(j.workflowState);
                      return config.label === stage.label;
                    }).length} jobs
                  </div>
                </div>
                {index < workflowStages.length - 1 && (
                  <div className="text-gray-400 mx-2">→</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search jobs by ID, customer name, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No jobs found. Create one to get started.</div>
        ) : (
          filteredJobs.map((job) => (
            <Card
              key={job.id}
              className={`hover:shadow-lg transition-all cursor-pointer ${selectedJob?.id === job.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedJob(job)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{job.jobId || job.id}</h3>
                      <Badge className={`${getStatusColor(job.workflowState)} text-white`}>
                        {getStageConfig(job.workflowState).label}
                      </Badge>
                      {job.priority && (
                        <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-800">{job.customerName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span>{job.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Right Drawer Job Details Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${selectedJob ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedJob && (
          <>
            {/* Drawer Header */}
            <div className="p-6 border-b flex justify-between items-start bg-gray-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Job {selectedJob.jobId || selectedJob.id}
                  </h2>
                  <Badge className={getStatusColor(selectedJob.workflowState)}>
                    {getStageConfig(selectedJob.workflowState).label}
                  </Badge>
                </div>
                <p className="text-lg font-medium text-gray-800">{selectedJob.customerName}</p>
                <p className="text-sm text-gray-500">{selectedJob.address}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedJob(null)}>
                <X size={24} />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Workflow Status</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-4">
                  {workflowStages.map((stage, index) => {
                    const currentConfig = getStageConfig(selectedJob.workflowState);
                    const isCurrent = currentConfig.label === stage.label;
                    const currentIndex = workflowStages.findIndex(s => s.label === currentConfig.label);
                    const isCompleted = index < currentIndex;

                    return (
                      <div key={stage.key} className="flex items-center flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-green-500 text-white' :
                            isCurrent ? stage.color + ' text-white ring-2 ring-offset-2 ring-blue-500' :
                              'bg-gray-200 text-gray-500'
                            }`}
                          title={stage.label}
                        >
                          {stage.label.substring(0, 2)}
                        </div>
                        {index < workflowStages.length - 1 && (
                          <div className={`h-1 w-4 mx-1 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specs & Financials */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">System Specs</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">Type:</span> {selectedJob.systemType}</p>
                    <p><span className="text-gray-500">Size:</span> {selectedJob.systemSize} kW</p>
                    <p><span className="text-gray-500">Panels:</span> {selectedJob.panelCount}x {selectedJob.panelBrand}</p>
                    <p><span className="text-gray-500">Inverter:</span> {selectedJob.inverterBrand}</p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-center">
                  <h3 className="text-sm font-semibold text-green-900 mb-1">Project Value</h3>
                  <p className="text-2xl font-bold text-green-700">
                    ${(selectedJob.estimatedValue || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Media Gallery */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <ImageIcon size={16} />
                    Media Gallery
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setIsPhotoDialogOpen(true)}>
                    <Upload size={14} className="mr-1" />
                    Add Media
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Add Button */}
                  <div
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors bg-gray-50"
                    onClick={() => setIsPhotoDialogOpen(true)}
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">Add</span>
                  </div>

                  {/* Media Items */}
                  {(selectedJob.media || selectedJob.photos || []).map((doc, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => {
                        if (doc.type === 'pdf') {
                          window.open(doc.url, '_blank');
                        } else {
                          setPreviewMedia(doc);
                        }
                      }}
                    >
                      {doc.type === 'pdf' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-red-50">
                          <FileText size={32} />
                          <span className="text-[10px] mt-1 font-medium text-red-700">PDF</span>
                        </div>
                      ) : (
                        <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-white" size={20} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                        <p className="text-[10px] text-white truncate text-center">{doc.label || 'File'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Activity size={16} />
                  Recent Activity
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-gray-200">
                  {(selectedJob.activityLog || []).map((log, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500" />
                      <p className="font-medium text-sm text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-500">{log.details}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleString()} • {log.user}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Job Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Input required value={createForm.customerName} onChange={e => handleCreateChange('customerName', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" required value={createForm.email} onChange={e => handleCreateChange('email', e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={createForm.phone} onChange={e => handleCreateChange('phone', e.target.value)} />
              </div>
              <div>
                <Label>Priority</Label>
                <select className="w-full border rounded-md h-9 px-2" value={createForm.priority} onChange={e => handleCreateChange('priority', e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Textarea required value={createForm.address} onChange={e => handleCreateChange('address', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              <div>
                <Label>System Type</Label>
                <select className="w-full border rounded-md h-9 px-2" value={createForm.systemType} onChange={e => handleCreateChange('systemType', e.target.value)}>
                  <option>Solar</option>
                  <option>Battery</option>
                  <option>Solar + Battery</option>
                  <option>Roofing</option>
                </select>
              </div>
              <div>
                <Label>System Size (kW)</Label>
                <Input type="number" step="0.1" value={createForm.systemSize} onChange={e => handleCreateChange('systemSize', e.target.value)} />
              </div>
              <div>
                <Label>Estimated Value ($)</Label>
                <Input type="number" value={createForm.estimatedValue} onChange={e => handleCreateChange('estimatedValue', e.target.value)} />
              </div>
              <div>
                <Label>Panel Count</Label>
                <Input type="number" value={createForm.panelCount} onChange={e => handleCreateChange('panelCount', e.target.value)} />
              </div>
              <div>
                <Label>Panel Brand</Label>
                <Input value={createForm.panelBrand} onChange={e => handleCreateChange('panelBrand', e.target.value)} />
              </div>
              <div>
                <Label>Inverter Brand</Label>
                <Input value={createForm.inverterBrand} onChange={e => handleCreateChange('inverterBrand', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Job'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Media Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            {/* Toggle Upload Type */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadMode('file')}
                className="flex-1"
              >
                <Upload size={16} className="mr-2" /> Upload File
              </Button>
              <Button
                variant={uploadMode === 'url' ? 'default' : 'outline'}
                onClick={() => setUploadMode('url')}
                className="flex-1"
              >
                <LinkIcon size={16} className="mr-2" /> From URL
              </Button>
            </div>

            {uploadMode === 'file' ? (
              <div>
                <Label>Select File (JPG, PNG, HEIC, PDF)</Label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.heic,.pdf"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div>
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>Label</Label>
              <Input
                value={photoLabel}
                onChange={(e) => setPhotoLabel(e.target.value)}
                placeholder="e.g., Roof Plan"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Textarea
                value={photoCategory}
                onChange={(e) => setPhotoCategory(e.target.value)}
                placeholder="roof_before, electrical, permits, etc."
              />
            </div>

            {isUploading && (
              <div className="space-y-1">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-500">{Math.round(uploadProgress)}% uploaded</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={resetUploadState}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || (uploadMode === 'file' && !photoFile) || (uploadMode === 'url' && !photoUrlInput)}
              >
                {isUploading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                {isUploading ? 'Uploading...' : 'Add Media'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Preview */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-black/95 border-none">
          <div className="absolute top-4 right-4 z-50">
            <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0" onClick={() => setPreviewMedia(null)}>
              <X size={24} />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {previewMedia && (
              <img
                src={previewMedia.url}
                alt={previewMedia.label}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          {previewMedia && (
            <div className="bg-black/80 p-6 text-white backdrop-blur-sm">
              <h3 className="font-bold text-xl">{previewMedia.label}</h3>
              <div className="flex gap-4 mt-2 text-sm text-gray-300">
                <p>Uploaded: {new Date(previewMedia.uploadDate).toLocaleString()}</p>
                <p>By: {previewMedia.uploadedBy}</p>
                {previewMedia.category && <Badge variant="outline" className="text-white border-white/30">{previewMedia.category}</Badge>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
