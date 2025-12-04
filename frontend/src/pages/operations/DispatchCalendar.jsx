import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Cloud, CloudRain, Sun, CloudSnow, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const localizer = momentLocalizer(moment);
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const DispatchCalendar = ({ schedule, crews, vehicles, jobs, onScheduleUpdate }) => {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    jobId: '',
    crewId: '',
    vehicleId: '',
    type: 'survey',
    startTime: '08:00',
    endTime: '16:00',
  });

  useEffect(() => {
    // Convert schedule entries to calendar events
    const calendarEvents = schedule.map((entry) => {
      const job = jobs.find(j => j.id === entry.jobId);
      const crew = crews.find(c => c.id === entry.crewId);
      const start = moment(`${entry.date} ${entry.startTime}`, 'YYYY-MM-DD HH:mm').toDate();
      const end = moment(`${entry.date} ${entry.endTime}`, 'YYYY-MM-DD HH:mm').toDate();

      return {
        id: entry.id,
        title: `${entry.type.toUpperCase()} - ${job?.id || 'Unknown'}`,
        start,
        end,
        resource: {
          entry,
          job,
          crew,
          weather: entry.weather,
        },
      };
    });
    setEvents(calendarEvents);
  }, [schedule, crews, vehicles, jobs]);

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedSlot({ start, end });
    setFormData({
      ...formData,
      startTime: moment(start).format('HH:mm'),
      endTime: moment(end).format('HH:mm'),
    });
    setIsDialogOpen(true);
  }, [formData]);

  // Note: Full drag-and-drop requires react-big-calendar dragAndDrop addon
  // Current implementation supports click-to-create and click-to-view
  // Events can be edited via the edit button in the list view

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedDate = moment(selectedSlot.start).format('YYYY-MM-DD');
      
      // Validate constraints
      const job = jobs.find(j => j.id === formData.jobId);
      if (formData.type === 'reset') {
        if (!job.detachCompletedAt || !job.roofingCompletedAt) {
          toast.error('Cannot schedule reset: Detach and roofing must be complete');
          return;
        }
        const entryDate = moment(selectedDate);
        const detachDate = moment(job.detachCompletedAt);
        const roofingDate = moment(job.roofingCompletedAt);
        
        if (entryDate.isBefore(detachDate) || entryDate.isBefore(roofingDate)) {
          toast.error('Cannot schedule reset before detach/roofing completion');
          return;
        }
      }

      const scheduleEntry = {
        jobId: formData.jobId,
        crewId: formData.crewId,
        vehicleId: formData.vehicleId || null,
        type: formData.type,
        date: selectedDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'Scheduled',
      };

      await axios.post(`${API_URL}/dispatch/schedule`, scheduleEntry);
      toast.success('Schedule created successfully');
      setIsDialogOpen(false);
      onScheduleUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create schedule');
    }
  };

  const getWeatherIcon = (weather) => {
    if (!weather) return null;
    const condition = weather.condition?.toLowerCase() || '';
    if (condition.includes('rain')) return <CloudRain className="w-4 h-4 text-blue-500" />;
    if (condition.includes('snow')) return <CloudSnow className="w-4 h-4 text-gray-500" />;
    if (condition.includes('cloud')) return <Cloud className="w-4 h-4 text-gray-400" />;
    return <Sun className="w-4 h-4 text-yellow-500" />;
  };

  const eventStyleGetter = (event) => {
    const typeColors = {
      survey: '#3b82f6',
      detach: '#f59e0b',
      roofing: '#8b5cf6',
      reset: '#10b981',
      inspection: '#6366f1',
      other: '#6b7280',
    };

    return {
      style: {
        backgroundColor: typeColors[event.resource.entry.type] || typeColors.other,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const CustomEvent = ({ event }) => {
    const { entry, job, weather } = event.resource;
    return (
      <div className="p-1">
        <div className="font-semibold text-xs">{event.title}</div>
        {job && (
          <div className="text-xs opacity-90">{job.address?.city}</div>
        )}
        {weather && (
          <div className="flex items-center gap-1 mt-1">
            {getWeatherIcon(weather)}
            <span className="text-xs">{weather.temp}°F</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectSlot={handleSelectSlot}
        selectable
        onSelectEvent={(event) => {
          // Handle event click - could open edit dialog
          console.log('Event clicked:', event);
        }}
        eventPropGetter={eventStyleGetter}
        components={{
          event: CustomEvent,
        }}
        defaultView="week"
        views={['month', 'week', 'day', 'agenda']}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Schedule Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobId">Job</Label>
                <Select
                  value={formData.jobId}
                  onValueChange={(value) => setFormData({ ...formData, jobId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.id} - {job.address?.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survey">Survey</SelectItem>
                    <SelectItem value="detach">Detach</SelectItem>
                    <SelectItem value="roofing">Roofing</SelectItem>
                    <SelectItem value="reset">Reset</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="crewId">Crew</Label>
                <Select
                  value={formData.crewId}
                  onValueChange={(value) => setFormData({ ...formData, crewId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crew" />
                  </SelectTrigger>
                  <SelectContent>
                    {crews.map((crew) => (
                      <SelectItem key={crew.id} value={crew.id}>
                        {crew.name} - {crew.lead}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleId">Vehicle (Optional)</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} ({vehicle.maxPanelCapacity} panels)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            {formData.type === 'reset' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Validation Check:</p>
                  <p>Reset can only be scheduled after detach and roofing are complete.</p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit">Create Schedule</Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatchCalendar;

