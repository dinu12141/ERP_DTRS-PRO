import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFirebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { FileText, Clock, CreditCard, Bell, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';

const HomeownerPortal = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    setLoading(true);

    // 1. Listen for Jobs (where customerEmail matches)
    // Note: In a real app, we should ensure email matching is case-insensitive or use IDs.
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('email', '==', user.email), // Assuming 'email' field in job matches user email
      orderBy('createdAt', 'desc')
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsData);

      // If we have jobs, we could fetch related docs/invoices. 
      // For simplicity in this demo, we'll fetch ALL invoices/docs for this email 
      // OR we can query by jobIds if we want to be strict.
      // Let's assume documents and invoices also have 'customerEmail' or 'jobId'.
    });

    // 2. Listen for Invoices
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('customerEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(invoicesData);
    });

    // 3. Listen for Notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifsData.filter(n => !n.read));
      setLoading(false);
    });

    // 4. Listen for Documents (Mocking a 'documents' collection or using subcollections)
    // For now, let's assume a root 'documents' collection linked to jobs
    // In reality, you might query this based on the job IDs we found.
    // For this implementation, I'll skip complex dependent queries and assume 
    // documents are stored with a 'customerEmail' or we just show job attachments.
    // Let's use job.media as documents for now.

    return () => {
      unsubscribeJobs();
      unsubscribeInvoices();
      unsubscribeNotifications();
    };
  }, [user]);

  // Aggregate media from jobs as "Documents"
  useEffect(() => {
    if (jobs.length > 0) {
      const allDocs = jobs.flatMap(job =>
        (job.media || []).map(media => ({
          ...media,
          jobId: job.id,
          uploadedAt: media.uploadedAt || job.createdAt // Fallback
        }))
      );
      setDocuments(allDocs);
    }
  }, [jobs]);

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

  const handleMockPayment = async (invoice) => {
    try {
      // Simulate payment processing
      await updateDoc(doc(db, 'invoices', invoice.id), {
        status: 'Paid',
        paidAmount: invoice.total,
        balanceDue: 0,
        lastPaymentDate: new Date().toISOString()
      });

      // Record payment transaction
      await addDoc(collection(db, 'payments'), {
        invoiceId: invoice.id,
        amount: invoice.balanceDue,
        method: 'Credit Card (Portal)',
        recordedBy: user.uid,
        recordedAt: new Date().toISOString()
      });

      toast.success('Payment processed successfully!');
    } catch (error) {
      console.error("Payment error:", error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const ProgressBar = ({ value }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );

  const getProgressValue = (status) => {
    const progressMap = {
      'intake_quoting': 10,
      'site_survey_pending': 20,
      'site_survey_complete': 30,
      'permit_submitted': 40,
      'permit_approved': 50,
      'detach_complete_hold': 60,
      'roofing_complete': 80,
      'reset_complete': 90,
      'inspection_pto_passed': 95,
      'closed': 100
    };
    return progressMap[status] || 5;
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
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No active jobs found.
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => {
            const steps = getTimelineSteps(job);
            const progress = getProgressValue(job.workflowState);

            return (
              <Card key={job.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Job {job.jobId || job.id}</span>
                    <Badge className={getStatusColor(job.workflowState)}>
                      {job.workflowState?.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Project Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <ProgressBar value={progress} />

                      <p className="text-sm text-gray-600 mt-4">Address</p>
                      <p className="font-medium">
                        {job.address || `${job.street || ''}, ${job.city || ''}`}
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
          })
        )}
      </div>
    );
  };

  const DocumentCenterTab = () => {
    return (
      <div className="space-y-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <p>No documents available.</p>
              <p className="text-sm mt-2">Signed Contracts, Warranties, and Photos will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.name || 'Untitled Document'}</p>
                      <p className="text-sm text-gray-500">
                        {doc.type || 'Document'} • {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(doc.url, '_blank')}
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
                    <p className="text-lg font-semibold">${(invoice.total || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Balance Due</p>
                    <p className="text-lg font-semibold">${(invoice.balanceDue || 0).toFixed(2)}</p>
                  </div>
                </div>
                {invoice.balanceDue > 0 && invoice.status !== 'Paid' && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleMockPayment(invoice)}
                  >
                    Pay Now (Secure)
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Homeowner Portal</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.displayName || user?.email}</p>
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
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
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
        <TabsContent value="timeline" className="mt-6">
          <TimelineTab />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <DocumentCenterTab />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          <PaymentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomeownerPortal;
