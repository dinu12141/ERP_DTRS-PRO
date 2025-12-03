import React, { useState } from 'react';
import { mockJobs, workflowStages } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, MapPin, Calendar, DollarSign, Battery, Sun } from 'lucide-react';

const Jobs = () => {
  const [jobs] = useState(mockJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

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
          <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedJob(job)}>
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
    </div>
  );
};

export default Jobs;
