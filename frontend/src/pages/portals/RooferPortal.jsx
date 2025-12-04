import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFirebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Briefcase, CheckCircle, Clock, TrendingUp, Bell } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const RooferPortal = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRoofComplete, setProcessingRoofComplete] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [dashboardRes, jobsRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/portals/roofer/dashboard`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/portals/roofer/jobs`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/portals/notifications`, { headers }).catch(() => ({ data: [] })),
      ]);

      setDashboard(dashboardRes.data);
      setJobs(jobsRes.data || []);
      setNotifications((notifRes.data || []).filter(n => !n.isRead));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoofComplete = async (jobId) => {
    setProcessingRoofComplete({ ...processingRoofComplete, [jobId]: true });

    try {
      const token = await user?.getIdToken();
      await axios.post(
        `${API_URL}/api/portals/roofer/jobs/${jobId}/roof-complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Roof marked as complete!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark roof complete');
    } finally {
      setProcessingRoofComplete({ ...processingRoofComplete, [jobId]: false });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'detach_complete_hold': 'bg-orange-100 text-orange-800',
      'roofing_complete': 'bg-green-100 text-green-800',
      'ready_for_reset': 'bg-blue-100 text-blue-800',
      'reset_complete': 'bg-purple-100 text-purple-800',
      'closed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const canMarkRoofComplete = (job) => {
    return job.workflowState === 'detach_complete_hold';
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roofer Portal</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.firstName || user?.email}</p>
        </div>
        {notifications.length > 0 && (
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {notifications.length}
            </span>
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.totalJobs}</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.activeJobs}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Roof Complete</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboard.roofingCompleteJobs}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ready for Reset</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboard.readyForReset}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Your Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No jobs assigned</div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900">Job {job.id}</p>
                      <Badge className={getStatusColor(job.workflowState)}>
                        {job.workflowState.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {job.address?.street}, {job.address?.city}, {job.address?.state}
                    </p>
                    {job.roofingCompletedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Roof completed: {formatDate(job.roofingCompletedAt)}
                      </p>
                    )}
                  </div>
                  {canMarkRoofComplete(job) && (
                    <Button
                      onClick={() => handleRoofComplete(job.id)}
                      disabled={processingRoofComplete[job.id]}
                      className="ml-4"
                    >
                      {processingRoofComplete[job.id] ? (
                        'Processing...'
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Roof Complete
                        </>
                      )}
                    </Button>
                  )}
                  {job.workflowState === 'roofing_complete' && (
                    <div className="ml-4 flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Roof Complete</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <Alert key={notif.id}>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{notif.title}</p>
                        <p className="text-sm text-gray-600">{notif.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RooferPortal;

