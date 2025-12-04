import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Zap, Plus, Play, Pause, Settings, Trash2, Clock, CloudRain, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const AutomationLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/automation/logs`);
      setLogs(response.data || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-gray-600">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-600">No execution logs yet.</p>
        ) : (
          <div className="space-y-2">
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
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
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
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/automation/`);
      setAutomations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch automations:', error);
      // Fallback to default automations
      setAutomations([
        {
          id: 'rain-check',
          name: 'Rain Check Automation',
          trigger: 'Daily weather check at 6 AM',
          action: 'Reschedule jobs if rain forecast',
          enabled: true,
          type: 'scheduled',
        },
        {
          id: 'stalled-job',
          name: 'Stalled Job Detection',
          trigger: 'Daily check at 8 AM',
          action: 'Alert if job stalled >7 days',
          enabled: true,
          type: 'scheduled',
        },
        {
          id: 'inventory-alert',
          name: 'Inventory Alert',
          trigger: 'Daily check at 9 AM',
          action: 'Email alert when stock low',
          enabled: true,
          type: 'scheduled',
        },
        {
          id: 'collection-bot',
          name: 'Collection Bot',
          trigger: 'Daily check at 10 AM',
          action: 'Send payment reminders for overdue invoices',
          enabled: true,
          type: 'scheduled',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await axios.post(`${API_URL}/api/automation/${id}/toggle`, { enabled: !enabled });
      setAutomations(automations.map(a => 
        a.id === id ? { ...a, enabled: !enabled } : a
      ));
      toast.success(`Automation ${enabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Failed to update automation:', error);
      toast.error('Failed to update automation');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/automation/`, formData);
      toast.success('Automation created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchAutomations();
    } catch (error) {
      console.error('Failed to create automation:', error);
      toast.error(error.response?.data?.detail || 'Failed to create automation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return;
    try {
      await axios.delete(`${API_URL}/api/automation/${id}`);
      setAutomations(automations.filter(a => a.id !== id));
      toast.success('Automation deleted successfully');
    } catch (error) {
      console.error('Failed to delete automation:', error);
      toast.error('Failed to delete automation');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      trigger: '',
      condition: '',
      action: '',
      enabled: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Engine</h1>
          <p className="text-gray-600 mt-1">Configure automated workflows and triggers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Automation Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="trigger">Trigger Event</Label>
                <select
                  id="trigger"
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select trigger...</option>
                  <option value="job_status_change">Job Status Change</option>
                  <option value="inventory_low">Inventory Low Stock</option>
                  <option value="invoice_created">Invoice Created</option>
                  <option value="lead_created">Lead Created</option>
                  <option value="schedule_created">Schedule Created</option>
                </select>
              </div>
              <div>
                <Label htmlFor="condition">Condition (Optional)</Label>
                <Textarea
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder="e.g., status == 'Permit Approved'"
                />
              </div>
              <div>
                <Label htmlFor="action">Action</Label>
                <select
                  id="action"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select action...</option>
                  <option value="create_invoice">Create Invoice</option>
                  <option value="send_email">Send Email</option>
                  <option value="update_status">Update Status</option>
                  <option value="create_notification">Create Notification</option>
                  <option value="run_script">Run Custom Script</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Enabled</Label>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Automations</TabsTrigger>
          <TabsTrigger value="disabled">Disabled</TabsTrigger>
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
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
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

        <TabsContent value="disabled">
          <div className="space-y-4">
            {automations.filter(a => !a.enabled).map((automation) => (
              <Card key={automation.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-500">{automation.name}</h3>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500 ml-8">
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <AutomationLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Automation;

