import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFirebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { BarChart3, TrendingUp, DollarSign, Calendar, Download, FileCheck, AlertCircle, CheckCircle, Truck, AlertTriangle } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';
import moment from 'moment';

const Reporting = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD'),
  });

  const [kpis, setKpis] = useState({
    avgDaysInStorage: 0,
    goBackRate: 0,
    revenuePerTruckDay: 0,
    leakLiabilityRatio: 0,
    totalRevenue: 0,
    activeJobs: 0
  });

  const [complianceData, setComplianceData] = useState({
    permitStuckJobs: [],
    warrantyExpiringJobs: []
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Data
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
      const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));

      const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Calculate Operational Efficiency KPIs
      // Avg Days in Storage: (roofingCompletedAt - detachCompletedAt)
      let totalStorageDays = 0;
      let storageJobCount = 0;
      let goBackCount = 0;

      jobs.forEach(job => {
        if (job.detachCompletedAt && job.roofingCompletedAt) {
          const start = moment(job.detachCompletedAt);
          const end = moment(job.roofingCompletedAt);
          const days = end.diff(start, 'days');
          if (days >= 0) {
            totalStorageDays += days;
            storageJobCount++;
          }
        }
        if (job.isGoBack) { // Assuming isGoBack flag exists
          goBackCount++;
        }
      });

      const avgDaysInStorage = storageJobCount > 0 ? (totalStorageDays / storageJobCount).toFixed(1) : 0;
      const goBackRate = jobs.length > 0 ? ((goBackCount / jobs.length) * 100).toFixed(1) : 0;

      // 3. Calculate Financial Health KPIs
      // Filter invoices by date range
      const periodInvoices = invoices.filter(inv => {
        const date = moment(inv.createdAt || inv.date);
        return date.isBetween(dateRange.start, dateRange.end, 'day', '[]');
      });

      const totalRevenue = periodInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

      // Revenue per Truck Day: Total Revenue / (Active Trucks * 20 days)
      // Assuming 20 working days in a month approx, or calculate based on range
      const daysInPeriod = moment(dateRange.end).diff(moment(dateRange.start), 'days') + 1;
      // Exclude weekends roughly? Let's just use raw days for simplicity or a factor
      // Let's use a standard "Truck Day" calculation: Vehicles * Days in Period
      const totalTruckDays = vehicles.length * daysInPeriod;
      const revenuePerTruckDay = totalTruckDays > 0 ? (totalRevenue / totalTruckDays).toFixed(2) : 0;

      // Leak Liability Ratio: Cost of roof leak repairs / Total Revenue
      // Identify leak repairs by job type or invoice tag. Let's assume job.systemType === 'Leak Repair'
      // Find invoices linked to Leak Repair jobs
      const leakRepairJobIds = jobs.filter(j => j.systemType === 'Leak Repair').map(j => j.id);
      const leakRevenue = periodInvoices
        .filter(inv => leakRepairJobIds.includes(inv.jobId)) // Assuming invoice has jobId
        .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

      const leakLiabilityRatio = totalRevenue > 0 ? ((leakRevenue / totalRevenue) * 100).toFixed(2) : 0;


      // 4. Compliance Reports
      // AHJ Permit Report: "Permit Submitted" > 14 days
      const permitStuckJobs = jobs.filter(job => {
        if (job.workflowState !== 'permit_submitted' || !job.permitSubmittedAt) return false;
        const daysStuck = moment().diff(moment(job.permitSubmittedAt), 'days');
        return daysStuck > 14;
      });

      // Warranty Report: Reset > 1 year ago
      const warrantyExpiringJobs = jobs.filter(job => {
        if (!job.resetCompletedAt) return false;
        const yearsSinceReset = moment().diff(moment(job.resetCompletedAt), 'years', true);
        return yearsSinceReset > 1;
      });

      setKpis({
        avgDaysInStorage,
        goBackRate,
        revenuePerTruckDay,
        leakLiabilityRatio,
        totalRevenue,
        activeJobs: jobs.filter(j => j.workflowState !== 'closed').length
      });

      setComplianceData({
        permitStuckJobs,
        warrantyExpiringJobs
      });

    } catch (error) {
      console.error("Error loading reporting data:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (data, filename) => {
    // Simple CSV export
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting & Analytics</h1>
          <p className="text-gray-600 mt-1">Operational efficiency and financial health metrics</p>
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

      {/* KPI Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Operational Efficiency */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Days in Storage</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.avgDaysInStorage}</p>
                <p className="text-xs text-gray-500 mt-1">Target: &lt; 3 days</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Go-Back Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.goBackRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Jobs requiring 3rd visit</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* Financial Health */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rev per Truck Day</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">${kpis.revenuePerTruckDay}</p>
                <p className="text-xs text-gray-500 mt-1">Based on active fleet</p>
              </div>
              <Truck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leak Liability Ratio</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.leakLiabilityRatio}%</p>
                <p className="text-xs text-gray-500 mt-1">Leak repair cost / Revenue</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compliance" className="w-full">
        <TabsList>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
          <TabsTrigger value="financial">Financial Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-6">
          {/* AHJ Permit Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-orange-500" />
                  AHJ Permit Report (Stuck &gt; 14 Days)
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportReport(complianceData.permitStuckJobs, 'ahj_permit_report.csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {complianceData.permitStuckJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No jobs stuck in permit stage.</div>
              ) : (
                <div className="space-y-4">
                  {complianceData.permitStuckJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                      <div>
                        <p className="font-semibold text-gray-900">Job {job.jobId || job.id}</p>
                        <p className="text-sm text-gray-600">{job.address?.city}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-white text-orange-700 border-orange-200">
                          {moment().diff(moment(job.permitSubmittedAt), 'days')} Days Stuck
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Submitted: {moment(job.permitSubmittedAt).format('MM/DD/YYYY')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warranty Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  Warranty Expiration Report (Reset &gt; 1 Year)
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportReport(complianceData.warrantyExpiringJobs, 'warranty_report.csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {complianceData.warrantyExpiringJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No jobs with expired warranties found.</div>
              ) : (
                <div className="space-y-4">
                  {complianceData.warrantyExpiringJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Job {job.jobId || job.id}</p>
                        <p className="text-sm text-gray-600">{job.address?.city}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Warranty Expired</Badge>
                        <p className="text-xs text-gray-500 mt-1">Reset: {moment(job.resetCompletedAt).format('MM/DD/YYYY')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Financial Overview charts would go here (Revenue trends, etc.)
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reporting;
