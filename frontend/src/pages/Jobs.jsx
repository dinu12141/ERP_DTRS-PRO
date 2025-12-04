import React, { useState } from 'react';
import { mockJobs, workflowStages } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, MapPin, Calendar, DollarSign, Battery, Sun, Image as ImageIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const Jobs = () => {
  const [jobs] = useState(mockJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoLabel, setPhotoLabel] = useState('');
  const [photoCategory, setPhotoCategory] = useState('');

  const filteredJobs = jobs.filter(
    (job) =>
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const stage = workflowStages.find((s) => s.key === status);
    return stage ? stage.color : 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Records</h1>
          <p className="text-gray-600 mt-1">Manage solar installation projects and workflows</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                    {jobs.filter((j) => j.stage === stage.key).length} jobs
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
        {filteredJobs.map((job) => (
          <Card
            key={job.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedJob(job)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{job.id}</h3>
                    <Badge className={`${getStatusColor(job.status)} text-white`}>
                      {job.status}
                    </Badge>
                    <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-800">{job.customerName}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      <span>{job.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>Created: {job.createdDate}</span>
                    </div>
                  </div>

                  {/* System Details */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">System Type</p>
                        <div className="flex items-center gap-1 mt-1">
                          {job.systemType.includes('Solar') && <Sun size={16} className="text-yellow-500" />}
                          {job.systemType.includes('Battery') && <Battery size={16} className="text-green-500" />}
                          <p className="text-sm font-medium text-gray-900">{job.systemType}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Panels</p>
                        <p className="text-sm font-medium text-gray-900">
                          {job.panelCount}x {job.panelBrand}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Inverter</p>
                        <p className="text-sm font-medium text-gray-900">{job.inverterBrand}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estimated Value</p>
                        <p className="text-sm font-semibold text-green-600">
                          ${job.estimatedValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Partner Info */}
                  <div className="mt-4">
                    <p className="text-xs text-gray-500">Roofing Partner</p>
                    <p className="text-sm font-medium text-blue-600">{job.partnerName}</p>
                  </div>
                </div>

                {/* Right Section - Timeline */}
                <div className="ml-6 min-w-[200px]">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Project Timeline</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Survey', date: job.surveyDate },
                      { label: 'Permit', date: job.permitDate },
                      { label: 'Detach', date: job.detachDate },
                      { label: 'Roofing', date: job.roofingDate },
                      { label: 'Reset', date: job.resetDate },
                      { label: 'Inspection', date: job.inspectionDate }
                    ].map((milestone) => (
                      <div key={milestone.label} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{milestone.label}:</span>
                        <span className={milestone.date ? 'text-green-600 font-medium' : 'text-gray-400'}>
                          {milestone.date || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Profile Drawer */}
      {selectedJob && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                Job {selectedJob.id} – {selectedJob.customerName}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">{selectedJob.address}</p>
            </div>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Workflow Timeline</h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {workflowStages.map((stage, index) => {
                  const isCurrent = selectedJob.stage === stage.key;
                  const isCompleted =
                    workflowStages.findIndex((s) => s.key === selectedJob.stage) >
                    workflowStages.findIndex((s) => s.key === stage.key);
                  return (
                    <div key={stage.key} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm shadow-md ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? stage.color + ' text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {stage.label}
                        </div>
                      </div>
                      {index < workflowStages.length - 1 && (
                        <div className="text-gray-400 mx-2">→</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">System Specs</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">System Type</p>
                    <p className="font-medium text-gray-900">{selectedJob.systemType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">System Size</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.systemSize} kW
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Panels</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.panelCount}x {selectedJob.panelBrand}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Inverter</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.inverterBrand} {selectedJob.inverterModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Racking</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.rackingType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Battery</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.batterySystem || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Financials</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Estimated Value</p>
                    <p className="font-bold text-green-600">
                      ${selectedJob.estimatedValue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Actual Cost</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.actualCost
                        ? `$${selectedJob.actualCost.toLocaleString()}`
                        : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Profit</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.profitMargin
                        ? `$${selectedJob.profitMargin.toLocaleString()}`
                        : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon size={16} />
                  System Photos
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPhotoDialogOpen(true)}
                >
                  <ImageIcon size={14} className="mr-1" />
                  Upload Photo
                </Button>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                This demo view uses mock data; in production, photos would be stored in cloud
                storage and referenced here.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(selectedJob.documents || []).map((doc) => (
                  <div
                    key={doc.url}
                    className="border rounded-md p-2 flex flex-col gap-1 text-xs"
                  >
                    <p className="font-semibold text-gray-800 truncate">{doc.type}</p>
                    <p className="text-gray-500 truncate">{doc.url}</p>
                    <p className="text-gray-400">{doc.uploadDate}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Photo Dialog (metadata only in this mock) */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload System Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              In a full implementation, you would first upload the file to cloud storage and then
              save the URL and metadata here.
            </p>
            <div>
              <Label>Photo URL</Label>
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Label</Label>
              <Input
                value={photoLabel}
                onChange={(e) => setPhotoLabel(e.target.value)}
                placeholder="Roof - Before"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Textarea
                value={photoCategory}
                onChange={(e) => setPhotoCategory(e.target.value)}
                placeholder="roof_before, electrical, panels, etc."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsPhotoDialogOpen(false);
                  setPhotoUrl('');
                  setPhotoLabel('');
                  setPhotoCategory('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // For now, just close; wiring to backend would call /jobs/{id}/photos
                  setIsPhotoDialogOpen(false);
                  setPhotoUrl('');
                  setPhotoLabel('');
                  setPhotoCategory('');
                }}
              >
                Save Metadata
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
