import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContextFirebase';
import { useFirestore } from '../hooks/useFirestore';

const Dashboard = () => {
  const { user } = useAuth();

  // Real-time data hooks
  const { data: jobs, loading: jobsLoading } = useFirestore('jobs');
  const { data: leads, loading: leadsLoading } = useFirestore('leads');
  const { data: invoices, loading: invoicesLoading } = useFirestore('invoices');
  // const { data: schedule } = useFirestore('schedule'); // Uncomment when schedule collection is active

  // Derived State & KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Revenue (Paid invoices in last 30 days)
    const totalRevenue = invoices
      .filter(inv => inv.status === 'Paid' && new Date(inv.paidDate || inv.updatedAt) >= thirtyDaysAgo)
      .reduce((sum, inv) => sum + (inv.paidAmount || inv.total || 0), 0);

    // Active Jobs (Not closed)
    const activeJobs = jobs.filter(j => j.workflowState !== 'closed' && j.status !== 'Cancelled').length;
    const completedJobs = jobs.filter(j => j.workflowState === 'closed' && new Date(j.updatedAt) >= thirtyDaysAgo).length;

    // Pending Invoices
    const pendingInvoicesList = invoices.filter(inv => inv.status === 'Pending');
    const pendingInvoicesCount = pendingInvoicesList.length;
    const pendingInvoiceAmount = pendingInvoicesList.reduce((sum, inv) => sum + (inv.balanceDue || inv.total || 0), 0);

    // Crew Utilization (Placeholder logic until Schedule module is fully integrated)
    // Assuming 80% if there are active jobs, else 0 for now
    const crewUtilization = activeJobs > 0 ? 85 : 0;

    // Compliance Rate (Placeholder)
    const complianceRate = 98;

    return {
      totalRevenue,
      activeJobs,
      completedJobs,
      crewUtilization,
      complianceRate,
      pendingInvoices: pendingInvoicesCount,
      pendingInvoiceAmount
    };
  }, [jobs, invoices]);

  // Recent Data
  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [jobs]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [leads]);

  const pendingInvoicesList = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'Pending')
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)) // Sort by due date ascending (urgent first)
      .slice(0, 5);
  }, [invoices]);

  const loading = jobsLoading || leadsLoading || invoicesLoading;

  const statCards = [
    {
      title: 'Total Revenue (30d)',
      value: `$${(kpis.totalRevenue || 0).toLocaleString()}`,
      change: 'Last 30 days',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Active Jobs',
      value: kpis.activeJobs || 0,
      change: `${kpis.completedJobs || 0} completed (30d)`,
      icon: Briefcase,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Invoices',
      value: kpis.pendingInvoices || 0,
      change: `$${(kpis.pendingInvoiceAmount || 0).toLocaleString()}`,
      icon: AlertTriangle,
      color: 'bg-orange-500'
    },
    {
      title: 'Crew Utilization',
      value: `${kpis.crewUtilization || 0}%`,
      change: 'Last 30 days',
      icon: Users,
      color: 'bg-purple-500'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      // Job Stages
      'intake_quoting': 'bg-blue-100 text-blue-800',
      'site_survey': 'bg-purple-100 text-purple-800',
      'permit': 'bg-yellow-100 text-yellow-800',
      'detach': 'bg-orange-100 text-orange-800',
      'roofing': 'bg-pink-100 text-pink-800',
      'reset': 'bg-green-100 text-green-800',
      'inspection': 'bg-indigo-100 text-indigo-800',
      'closed': 'bg-gray-100 text-gray-800',

      // Lead Status
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Converted': 'bg-purple-100 text-purple-800',
      'Lost': 'bg-red-100 text-red-800',

      // Invoice Status
      'Paid': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    // Handle complex job statuses or fallbacks
    if (status?.includes('survey')) return colors['site_survey'];
    if (status?.includes('permit')) return colors['permit'];
    if (status?.includes('detach')) return colors['detach'];
    if (status?.includes('roofing')) return colors['roofing'];
    if (status?.includes('reset')) return colors['reset'];
    if (status?.includes('inspection')) return colors['inspection'];

    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {kpis.complianceRate}%
                </p>
              </div>
              <CheckCircle size={32} className="text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Go-Back Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">0%</p>
              </div>
              <TrendingUp size={32} className="text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue/Truck/Day</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  $0
                </p>
              </div>
              <DollarSign size={32} className="text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase size={20} />
              Recent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent jobs</p>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{job.customerName || 'Unknown Customer'}</p>
                      <p className="text-sm text-gray-600">{job.systemType || 'Solar System'}</p>
                      {job.address && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{job.address}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(job.workflowState)}>{job.workflowState?.replace(/_/g, ' ') || 'New'}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Recent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent leads</p>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{lead.firstName} {lead.lastName}</p>
                      <p className="text-sm text-gray-600">{lead.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Source: {lead.source}
                      </p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={20} />
            Pending Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoicesList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">No pending invoices</td>
                  </tr>
                ) : (
                  pendingInvoicesList.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{invoice.invoiceNumber || invoice.id}</td>
                      <td className="py-3 px-4">{invoice.customerName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{invoice.type}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        ${(invoice.balanceDue || invoice.total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
