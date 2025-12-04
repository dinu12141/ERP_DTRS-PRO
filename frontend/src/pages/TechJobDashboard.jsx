import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import TechLayout from '../components/TechLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ClipboardList, Camera, Wrench, RefreshCcw, MapPin, User, AlertTriangle, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContextFirebase';

const TechJobDashboard = () => {
    const { jobId } = useParams();
    const { user } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportData, setReportData] = useState({
        type: '',
        description: ''
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const docRef = doc(db, 'jobs', jobId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setJob({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error('No such job!');
                }
            } catch (error) {
                console.error('Error fetching job:', error);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Notification/Task
            await addDoc(collection(db, 'notifications'), {
                title: `Issue Reported: ${reportData.type}`,
                message: `Technician reported ${reportData.type} at Job ${job.jobId || job.id}. ${reportData.description}`,
                type: 'issue',
                jobId: job.id,
                createdAt: new Date().toISOString(),
                read: false,
                recipientId: 'admin' // Or specific role/user
            });

            // 2. Automation Rule: Inventory Alert
            if (reportData.type === 'Microinverter Failed') {
                await addDoc(collection(db, 'automation_logs'), {
                    automationName: 'The Inventory Alert',
                    message: `Microinverter Failed reported at Job ${job.jobId || job.id}. Created "Warranty Claim" task for Warehouse Manager.`,
                    success: true,
                    executedAt: new Date().toISOString(),
                    triggeredBy: user.uid
                });

                // Create the actual Warranty Task (mocked as a notification for now, or a separate tasks collection)
                await addDoc(collection(db, 'notifications'), {
                    title: `Warranty Claim Required`,
                    message: `Microinverter Failed at Job ${job.jobId || job.id}. Please process warranty claim.`,
                    type: 'task',
                    jobId: job.id,
                    createdAt: new Date().toISOString(),
                    read: false,
                    recipientId: 'warehouse_manager' // Target role
                });
                toast.success("Warranty Claim task created automatically");
            }

            toast.success("Issue reported successfully");
            setIsReportOpen(false);
            setReportData({ type: '', description: '' });
        } catch (error) {
            console.error("Failed to report issue:", error);
            toast.error("Failed to report issue");
        }
    };

    if (loading) {
        return (
            <TechLayout title="Job Details">
                <div className="flex justify-center py-8">Loading job details...</div>
            </TechLayout>
        );
    }

    if (!job) {
        return (
            <TechLayout title="Job Details">
                <div className="text-center py-8 text-red-600">Job not found</div>
            </TechLayout>
        );
    }

    return (
        <TechLayout title={`Job ${job.id}`}>
            <div className="space-y-4">
                {/* Job Info Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{job.customer?.name || 'Customer'}</CardTitle>
                            <Badge variant={job.status === 'Completed' ? 'success' : 'secondary'}>
                                {job.status || 'Scheduled'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                {job.address?.street}<br />
                                {job.address?.city}, {job.address?.state} {job.address?.zip}
                            </span>
                        </div>
                        {job.customer?.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <User className="w-4 h-4" />
                                <span>{job.customer.phone}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Report Issue Button */}
                <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Report Issue / Defect
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Report Issue</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleReportSubmit} className="space-y-4">
                            <div>
                                <Label>Issue Type</Label>
                                <Select
                                    value={reportData.type}
                                    onValueChange={(val) => setReportData({ ...reportData, type: val })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select issue type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Microinverter Failed">Microinverter Failed</SelectItem>
                                        <SelectItem value="Panel Broken">Panel Broken</SelectItem>
                                        <SelectItem value="Roof Damage">Roof Damage</SelectItem>
                                        <SelectItem value="Missing Parts">Missing Parts</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={reportData.description}
                                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                                    placeholder="Describe the issue..."
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">Submit Report</Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Workflows */}
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        asChild
                        variant={job.jsaCompleted ? "outline" : "default"}
                        className={`h-auto py-4 flex flex-col gap-2 ${!job.jsaCompleted ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-green-200 bg-green-50'}`}
                    >
                        <Link to={`/tech/job/${jobId}/jsa`}>
                            <ClipboardList className={`w-6 h-6 ${job.jsaCompleted ? 'text-green-600' : 'text-white'}`} />
                            <div className="flex flex-col items-center">
                                <span>JSA</span>
                                {job.jsaCompleted && <span className="text-[10px] text-green-600 font-medium">✓ Completed</span>}
                            </div>
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                        <Link to={`/tech/job/${jobId}/damage-scan`}>
                            <Camera className="w-6 h-6 text-indigo-600" />
                            <span>Photos</span>
                        </Link>
                    </Button>

                    <Button
                        asChild={job.jsaCompleted}
                        disabled={!job.jsaCompleted}
                        variant="outline"
                        className={`h-auto py-4 flex flex-col gap-2 ${!job.jsaCompleted ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                    >
                        {job.jsaCompleted ? (
                            <Link to={`/tech/job/${jobId}/detach`}>
                                <Wrench className="w-6 h-6 text-orange-600" />
                                <span>Detach</span>
                            </Link>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Wrench className="w-6 h-6 text-gray-400" />
                                <span>Detach</span>
                                <span className="text-[10px] text-red-500 font-medium">Locked (Do JSA)</span>
                            </div>
                        )}
                    </Button>

                    <Button
                        asChild={job.jsaCompleted}
                        disabled={!job.jsaCompleted}
                        variant="outline"
                        className={`h-auto py-4 flex flex-col gap-2 ${!job.jsaCompleted ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                    >
                        {job.jsaCompleted ? (
                            <Link to={`/tech/job/${jobId}/reset`}>
                                <RefreshCcw className="w-6 h-6 text-green-600" />
                                <span>Reset</span>
                            </Link>
                        ) : (
                            <div className="flex flex-col items-center">
                                <RefreshCcw className="w-6 h-6 text-gray-400" />
                                <span>Reset</span>
                                <span className="text-[10px] text-red-500 font-medium">Locked (Do JSA)</span>
                            </div>
                        )}
                    </Button>
                </div>

                {/* Job Notes or Extra Info */}
                {job.notes && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">{job.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </TechLayout>
    );
};

export default TechJobDashboard;
