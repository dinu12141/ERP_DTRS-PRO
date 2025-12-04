import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFirebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { BarChart3, TrendingUp, DollarSign, Calendar, Download, Filter, FileCheck, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const Reporting = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [jobsData, setJobsData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadKPIs();
    loadReports();
  }, [dateRange]);

  const loadKPIs = async () => {
    try {
      const token = user ? await user.getIdToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/reporting/kpis`, { headers });
      setKpis(response.data);
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const token = user ? await user.getIdToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      const [revenueRes, jobsRes, perfRes, complianceRes] = await Promise.all([
        axios.get(`${API_URL}/api/reporting/revenue?${params}`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/reporting/jobs?${params}`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/reporting/performance?${params}`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/reporting/compliance?${params}`, { headers }).catch(() => ({ data: null })),
      ]);

      setRevenueData(revenueRes.data);
      setJobsData(jobsRes.data);
      setPerformanceData(perfRes.data);
      setComplianceData(complianceRes.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type) => {
    setLoading(true);
    try {
      await loadReports();
      toast.success(`${type} report generated successfully`);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type) => {
    try {
      const token = user ? await user.getIdToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
        format: 'csv',
      });

      const response = await axios.get(`${API_URL}/api/reporting/${type}/export?${params}`, {
        headers,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${dateRange.start}_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`${type} report exported successfully`);
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    }
  };

  // Simple chart component using CSS
  const SimpleBarChart = ({ data, labelKey, valueKey, title }) => {
    const maxValue = Math.max(...data.map(d => d[valueKey]), 1);
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{item[labelKey]}</span>
                <span className="font-semibold">${item[valueKey].toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const reportTypes = [
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'Monthly revenue breakdown by job type and partner',
      icon: DollarSign,
      color: 'bg-green-500',
      roles: ['admin', 'manager'],
    },
    {
      id: 'jobs',
      title: 'Jobs Report',
      description: 'Job completion rates and workflow statistics',
      icon: Calendar,
      color: 'bg-blue-500',
      roles: ['admin', 'manager', 'crew_lead'],
    },
    {
      id: 'performance',
      title: 'Performance Report',
      description: 'Crew utilization and efficiency metrics',
      icon: TrendingUp,
      color: 'bg-purple-500',
      roles: ['admin', 'manager'],
    },
    {
      id: 'compliance',
      title: 'Compliance Report',
      description: 'JSA completion, safety compliance, and audit trails',
      icon: FileCheck,
      color: 'bg-orange-500',
      roles: ['admin', 'manager'],
    },
  ];

  const canViewReport = (report) => {
    if (!report.roles) return true;
    return report.roles.includes(user?.role || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
          <p className="text-gray-600 mt-1">Generate and export business reports</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ${(kpis.totalRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Period: {dateRange.start} to {dateRange.end}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.activeJobs || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpis.completedJobs || 0} completed</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Crew Utilization</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.crewUtilization || 0}%</p>
                  <p className="text-xs text-gray-500 mt-1">Average across all crews</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.complianceRate || 0}%</p>
                  <p className="text-xs text-gray-500 mt-1">JSA completion rate</p>
                </div>
                <FileCheck className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="standard" className="w-full">
        <TabsList>
          <TabsTrigger value="standard">Standard Reports</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-6">
          {/* Revenue Report */}
          {canViewReport(reportTypes[0]) && revenueData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Revenue Report
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('revenue')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-bold">${(revenueData.summary?.totalRevenue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid:</span>
                        <span className="font-bold text-green-600">${(revenueData.summary?.totalPaid || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-bold text-yellow-600">${(revenueData.summary?.totalPending || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Invoice Count:</span>
                        <span className="font-bold">{revenueData.summary?.invoiceCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">By Invoice Type</h4>
                    {revenueData.byType && Object.entries(revenueData.byType).length > 0 ? (
                      <SimpleBarChart
                        data={Object.entries(revenueData.byType).map(([type, data]) => ({
                          type,
                          total: data.total || 0,
                        }))}
                        labelKey="type"
                        valueKey="total"
                        title="Revenue by Type"
                      />
                    ) : (
                      <p className="text-gray-500 text-sm">No data available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Jobs Report */}
          {canViewReport(reportTypes[1]) && jobsData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Jobs Report
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('jobs')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Jobs:</span>
                        <span className="font-bold">{jobsData.summary?.totalJobs || 0}</span>
                      </div>
                      {jobsData.summary?.byStatus && (
                        <div className="mt-4">
                          <h5 className="text-sm font-semibold mb-2">By Status</h5>
                          {Object.entries(jobsData.summary.byStatus).map(([status, count]) => (
                            <div key={status} className="flex justify-between text-sm">
                              <span className="text-gray-600">{status}:</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">By Job Type</h4>
                    {jobsData.summary?.byType && Object.entries(jobsData.summary.byType).length > 0 ? (
                      <SimpleBarChart
                        data={Object.entries(jobsData.summary.byType).map(([type, count]) => ({
                          type,
                          total: count || 0,
                        }))}
                        labelKey="type"
                        valueKey="total"
                        title="Jobs by Type"
                      />
                    ) : (
                      <p className="text-gray-500 text-sm">No data available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Report */}
          {canViewReport(reportTypes[2]) && performanceData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Report
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('performance')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-semibold">Crew Utilization</h4>
                  {performanceData.crewUtilization && Object.entries(performanceData.crewUtilization).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(performanceData.crewUtilization).map(([crewId, data]) => (
                        <div key={crewId} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{data.name || crewId}</span>
                            <Badge>{data.utilization}%</Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${data.utilization}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {data.scheduledDays} scheduled days out of {data.totalDays} total days
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No performance data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {canViewReport(reportTypes[3]) && complianceData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    Compliance Report
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('compliance')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold">JSA Completion</span>
                    </div>
                    <p className="text-2xl font-bold">{complianceData.jsaCompletionRate || 0}%</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {complianceData.jsasCompleted || 0} of {complianceData.totalJobs || 0} jobs
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold">Missing JSAs</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{complianceData.missingJSAs || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Jobs without JSA</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">Document Compliance</span>
                    </div>
                    <p className="text-2xl font-bold">{complianceData.documentCompliance || 0}%</p>
                    <p className="text-sm text-gray-500 mt-1">Required documents uploaded</p>
                  </div>
                </div>
                {complianceData.nonCompliantJobs && complianceData.nonCompliantJobs.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Non-Compliant Jobs</h4>
                    <div className="space-y-2">
                      {complianceData.nonCompliantJobs.map((job) => (
                        <div key={job.id} className="p-3 border rounded-lg bg-red-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Job {job.id}</p>
                              <p className="text-sm text-gray-600">{job.reason}</p>
                            </div>
                            <Badge variant="destructive">Non-Compliant</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                {canViewReport(reportTypes[3]) ? 'No compliance data available' : 'You do not have permission to view this report'}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {revenueData && (
                  <div>
                    <h4 className="font-semibold mb-4">Revenue Trend</h4>
                    <p className="text-sm text-gray-600">
                      Total Revenue: ${(revenueData.summary?.totalRevenue || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Period: {dateRange.start} to {dateRange.end}
                    </p>
                  </div>
                )}
                {jobsData && (
                  <div>
                    <h4 className="font-semibold mb-4">Job Status Distribution</h4>
                    {jobsData.summary?.byStatus && (
                      <div className="space-y-2">
                        {Object.entries(jobsData.summary.byStatus).map(([status, count]) => (
                          <div key={status} className="flex justify-between">
                            <span className="text-sm text-gray-600">{status}:</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Reporting;

