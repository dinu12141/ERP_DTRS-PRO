import React from 'react';
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
import { mockKPIs, mockJobs, mockLeads, mockInvoices } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const Dashboard = () => {
  const kpis = mockKPIs;

  const statCards = [
    {
      title: 'Monthly Revenue',
      value: `$${kpis.monthlyRevenue.toLocaleString()}`,
      change: '+12.5%',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Active Jobs',
      value: kpis.totalActiveJobs,
      change: `${kpis.jobsThisMonth} this month`,
      icon: Briefcase,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Invoices',
      value: kpis.pendingInvoices,
      change: `$${kpis.pendingInvoiceAmount.toLocaleString()}`,
      icon: AlertTriangle,
      color: 'bg-orange-500'
    },
    {
      title: 'Crew Utilization',
      value: `${kpis.crewUtilization}%`,
      change: '+5% from last week',
      icon: Users,
      color: 'bg-purple-500'
    }
  ];

  const recentJobs = mockJobs.slice(0, 3);
  const recentLeads = mockLeads.slice(0, 3);
  const pendingInvoices = mockInvoices.filter((inv) => inv.status === 'Pending');

  const getStatusColor = (status) => {
    const colors = {
      Survey: 'bg-purple-100 text-purple-800',
      Detach: 'bg-orange-100 text-orange-800',
      Reset: 'bg-green-100 text-green-800',
      Closed: 'bg-gray-100 text-gray-800',
      New: 'bg-blue-100 text-blue-800',
      Qualified: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

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
                <p className="text-sm font-medium text-gray-600">Avg Days in Storage</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {kpis.averageDaysInStorage} days
                </p>
              </div>
              <Clock size={32} className="text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Go-Back Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.goBackRate}%</p>
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
                  ${kpis.revenuePerTruckDay}
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
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{job.id}</p>
                    <p className="text-sm text-gray-600">{job.customerName}</p>
                    <p className="text-xs text-gray-500 mt-1">{job.address}</p>
                  </div>
                  <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                </div>
              ))}
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
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{lead.customerName}</p>
                    <p className="text-sm text-gray-600">Score: {lead.score}/100</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ${lead.estimatedValue.toLocaleString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                </div>
              ))}
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{invoice.id}</td>
                    <td className="py-3 px-4">{invoice.customerName}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{invoice.type}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      ${invoice.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{invoice.dueDate}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
