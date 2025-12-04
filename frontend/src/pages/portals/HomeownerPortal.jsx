import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFirebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { FileText, Clock, CreditCard, Bell, CheckCircle, Circle } from 'lucide-react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

const HomeownerPortal = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = user ? await user.getIdToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes, docsRes, invRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/portals/homeowner/jobs`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/portals/homeowner/documents`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/portals/homeowner/invoices`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/portals/notifications`, { headers }).catch(() => ({ data: [] })),
      ]);

      setJobs(jobsRes.data || []);
      setDocuments(docsRes.data || []);
      setInvoices(invRes.data || []);
      setNotifications((notifRes.data || []).filter(n => !n.isRead));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'intake_quoting': 'bg-blue-100 text-blue-800',
      'site_survey_pending': 'bg-yellow-100 text-yellow-800',
      'site_survey_complete': 'bg-green-100 text-green-800',
      'roofing_complete': 'bg-purple-100 text-purple-800',
      'reset_complete': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const TimelineTab = () => {
    const getTimelineSteps = (job) => {
      const steps = [
        { key: 'siteSurveyCompletedAt', label: 'Site Survey', state: 'site_survey_complete' },
        { key: 'permitSubmittedAt', label: 'Permit Submitted', state: 'permit_submitted' },
        { key: 'permitApprovedAt', label: 'Permit Approved', state: 'permit_approved' },
        { key: 'detachCompletedAt', label: 'Detach Complete', state: 'detach_complete_hold' },
        { key: 'roofingCompletedAt', label: 'Roofing Complete', state: 'roofing_complete' },
        { key: 'resetCompletedAt', label: 'Reset Complete', state: 'reset_complete' },
        { key: 'inspectionPtoPassedAt', label: 'Inspection Passed', state: 'inspection_pto_passed' },
        { key: 'closedAt', label: 'Closed', state: 'closed' },
      ];

      return steps.map((step) => ({
        ...step,
        completed: !!job[step.key],
        date: job[step.key],
        isCurrent: job.workflowState === step.state,
      }));
    };

    return (
      <div className="space-y-6">
        {jobs.map((job) => {
          const steps = getTimelineSteps(job);
          return (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Job {job.id}</span>
                  <Badge className={getStatusColor(job.workflowState)}>
                    {job.workflowState.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">
                      {job.address?.street}, {job.address?.city}, {job.address?.state} {job.address?.zip}
                    </p>
                  </div>
                  <div className="border-l-2 border-gray-200 pl-4 space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.key} className="relative">
                        <div className="flex items-start gap-3">
                          {step.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          ) : step.isCurrent ? (
                            <Circle className="w-5 h-5 text-blue-500 mt-0.5 fill-blue-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${step.completed || step.isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                            {step.date && (
                              <p className="text-sm text-gray-500">{formatDate(step.date)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const DocumentCenterTab = () => {
    return (
      <div className="space-y-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No documents available
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {doc.documentType} • {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  const PaymentForm = ({ invoice, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setProcessing(true);
      setError('');

      try {
        // Create payment intent
        const formData = new URLSearchParams();
        formData.append('invoice_id', invoice.id);
        const token = user ? await user.getIdToken() : null;
        const intentRes = await axios.post(`${API_URL}/api/payments/create-intent`, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        const { clientSecret } = intentRes.data;

        // Confirm payment
        const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });

        if (stripeError) {
          setError(stripeError.message);
        } else {
          onSuccess();
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Payment failed');
      } finally {
        setProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border rounded-lg">
          <CardElement />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" disabled={!stripe || processing} className="w-full">
          {processing ? 'Processing...' : `Pay $${invoice.balanceDue.toFixed(2)}`}
        </Button>
      </form>
    );
  };

  const PaymentsTab = () => {
    return (
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No invoices available
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Invoice {invoice.invoiceNumber}</span>
                  <Badge>{invoice.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-lg font-semibold">${invoice.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Balance Due</p>
                    <p className="text-lg font-semibold">${invoice.balanceDue.toFixed(2)}</p>
                  </div>
                </div>
                {invoice.balanceDue > 0 && (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      invoice={invoice}
                      onSuccess={() => {
                        fetchData();
                      }}
                    />
                  </Elements>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homeowner Portal</h1>
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

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <TimelineTab />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentCenterTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomeownerPortal;

