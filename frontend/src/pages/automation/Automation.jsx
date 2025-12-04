import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Zap, Plus, Play, Pause, Settings, Trash2, Clock, CloudRain, AlertTriangle, Package, DollarSign, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContextFirebase';
import moment from 'moment';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const AutomationLogsTab = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadLogs = async () => {
    try {
      // Fetch logs from Firestore for real-time updates
      const q = query(collection(db, 'automation_logs'), orderBy('executedAt', 'desc'));
      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Execution Logs</span>
          <Button variant="outline" size="sm" onClick={loadLogs}>Refresh</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-gray-600">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-600">No execution logs yet.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-3 border rounded-lg text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{log.automationName || 'Unknown Automation'}</p>
                    <p className="text-gray-600">{log.message || 'Executed'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.executedAt ? new Date(log.executedAt).toLocaleString() : 'Unknown time'}
                    </p>
                  </div>
                  <Badge className={log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {log.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Automation = () => {
  const { user } = useAuth();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningChecks, setRunningChecks] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trigger: '',
    condition: '',
    action: '',
    enabled: true,
  });

  const getAutomationIcon = (name) => {
    if (name.toLowerCase().includes('rain')) return CloudRain;
    if (name.toLowerCase().includes('stalled')) return AlertTriangle;
    if (name.toLowerCase().includes('inventory')) return Package;
    if (name.toLowerCase().includes('collection')) return DollarSign;
    return Zap;
  };

  useEffect(() => {
    if (user) {
      fetchAutomations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      // Mock automations for now, or fetch from DB if we had an endpoint
      setAutomations([
        {
          id: 'rain-check',
          name: 'The Rain Check',
          trigger: 'Daily weather check (Tomorrow 8:00 AM)',
          action: 'SMS alert if >50% rain forecast',
          enabled: true,
          type: 'scheduled',
        },
        {
          id: 'stalled-job',
          name: 'The Stalled Job',
          trigger: 'Job in "Detach Complete (Hold)" > 21 days',
          action: 'Email to Roofing Partner',
          enabled: true,
          type: 'scheduled',
        },
        {
          id: 'inventory-alert',
          name: 'The Inventory Alert',
          trigger: 'Technician marks "Microinverter Failed"',
          action: 'Create "Warranty Claim" task',
          enabled: true,
          type: 'event',
        },
        {
          id: 'collection-bot',
          name: 'The Collection Bot',
          trigger: 'Invoice Overdue by 3 days',
          action: 'SMS payment link',
          enabled: true,
          type: 'scheduled',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const logExecution = async (name, message, success = true) => {
    try {
      await addDoc(collection(db, 'automation_logs'), {
        automationName: name,
        message,
        success,
        executedAt: new Date().toISOString(),
        triggeredBy: user.uid
      });
    } catch (error) {
      console.error("Failed to log automation:", error);
    }
  };

  const runAutomationChecks = async () => {
    setRunningChecks(true);
    toast.info("Running automation checks...");

    try {
      // 1. The Rain Check
      // Mock: Check jobs for tomorrow. If address contains "Rain", trigger alert.
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Simulate checking weather for each job
      let rainAlerts = 0;
      for (const job of jobs) {
        // Mock Logic: Randomly decide if it's going to rain for demo purposes
        // Or check if address has 'Seattle' :D
        const isRainy = Math.random() > 0.8; // 20% chance of rain for demo

        if (isRainy && job.workflowState !== 'closed') {
          // Trigger Alert
          await logExecution('The Rain Check', `Potential Rain Out at Job ${job.jobId || job.id} (${job.address?.city}). SMS sent to Dispatcher.`);
          rainAlerts++;
        }
      }
      if (rainAlerts > 0) toast.warning(`Generated ${rainAlerts} Rain Alerts`);


      // 2. The Stalled Job
      // Trigger: Status has been "Detach Complete (Hold)" for >21 days.
      let stalledAlerts = 0;
      for (const job of jobs) {
        if (job.workflowState === 'detach_complete_hold' && job.detachCompletedAt) {
          const daysStuck = moment().diff(moment(job.detachCompletedAt), 'days');
          if (daysStuck > 21) {
            await logExecution('The Stalled Job', `Job ${job.jobId || job.id} stalled for ${daysStuck} days. Email sent to Partner.`);
            stalledAlerts++;
          }
        }
      }
      if (stalledAlerts > 0) toast.warning(`Generated ${stalledAlerts} Stalled Job Alerts`);


      // 3. The Collection Bot
      // Trigger: Invoice is "Overdue" by 3 days.
      const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let collectionAlerts = 0;
      for (const invoice of invoices) {
        if (invoice.status === 'Overdue' || (invoice.dueDate && moment().diff(moment(invoice.dueDate), 'days') > 3 && invoice.status !== 'Paid')) {
          await logExecution('The Collection Bot', `Invoice ${invoice.invoiceNumber} is overdue. SMS payment link sent to customer.`);
          collectionAlerts++;
        }
      }
      if (collectionAlerts > 0) toast.info(`Sent ${collectionAlerts} Payment Reminders`);

      toast.success("Automation checks completed successfully");

    } catch (error) {
      console.error("Automation run failed:", error);
      toast.error("Failed to run automation checks");
    } finally {
      setRunningChecks(false);
    }
  };

  const handleToggle = (id, enabled) => {
    setAutomations(automations.map(a =>
      a.id === id ? { ...a, enabled: !enabled } : a
    ));
    toast.success(`Automation ${enabled ? 'disabled' : 'enabled'}`);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return;
    setAutomations(automations.filter(a => a.id !== id));
    toast.success('Automation deleted successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Engine</h1>
          <p className="text-gray-600 mt-1">Configure automated workflows and triggers</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAutomationChecks}
            disabled={runningChecks}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {runningChecks ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Checks...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Checks Now
              </>
            )}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setFormData({ name: '', trigger: '', condition: '', action: '', enabled: true })}>
                <Plus className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
              </DialogHeader>
              {/* Form placeholder - functionality mocked for custom rules */}
              <div className="p-4 text-center text-gray-500">
                Custom rule creation is disabled in this demo.
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Rules</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">Loading...</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {automations.filter(a => a.enabled).map((automation) => {
                const Icon = getAutomationIcon(automation.name);
                return (
                  <Card key={automation.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="w-5 h-5 text-yellow-500" />
                            <h3 className="text-lg font-semibold">{automation.name}</h3>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                            {automation.type === 'scheduled' && (
                              <Badge variant="outline" className="ml-2">
                                <Clock className="w-3 h-3 mr-1" />
                                Scheduled
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 ml-8">
                            <p><span className="font-medium">Trigger:</span> {automation.trigger}</p>
                            <p><span className="font-medium">Action:</span> {automation.action}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={automation.enabled}
                            onCheckedChange={() => handleToggle(automation.id, automation.enabled)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(automation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <AutomationLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Automation;
