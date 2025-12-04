import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Cloud, CloudRain, Sun, CloudSnow, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const DispatchCalendar = ({ schedule, crews, vehicles, jobs, onAddSchedule, onUpdateSchedule, onDeleteSchedule, date, view, onNavigate, onView }) => {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
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
    setEditingEventId(null);
    setFormData({
      jobId: '',
      crewId: '',
      vehicleId: '',
      type: 'survey',
      startTime: moment(start).format('HH:mm'),
      endTime: moment(end).format('HH:mm'),
    });
    setIsDialogOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    const { entry } = event.resource;
    setEditingEventId(entry.id);
    setFormData({
      jobId: entry.jobId,
      crewId: entry.crewId,
      vehicleId: entry.vehicleId || 'unassigned',
      type: entry.type,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
    // Set selectedSlot for date reference in handleSubmit
    setSelectedSlot({ start: moment(entry.date).toDate() });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!editingEventId) return;
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await onDeleteSchedule(editingEventId);
      toast.success('Schedule deleted');
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete schedule');
    }
  };

  const checkCrewConflict = (crewId, date, startTime, endTime, excludeId = null) => {
    const start = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const end = moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');

    const conflict = schedule.find(entry => {
      if (entry.id === excludeId) return false; // Exclude current event being edited
      if (entry.crewId !== crewId) return false; // Different crew
      if (entry.date !== date) return false; // Different day

      const entryStart = moment(`${entry.date} ${entry.startTime}`, 'YYYY-MM-DD HH:mm');
      const entryEnd = moment(`${entry.date} ${entry.endTime}`, 'YYYY-MM-DD HH:mm');

      // Check overlap
      return (
        start.isBetween(entryStart, entryEnd, null, '[)') ||
        end.isBetween(entryStart, entryEnd, null, '(]') ||
        entryStart.isBetween(start, end, null, '[)') ||
        entryEnd.isBetween(start, end, null, '(]')
      );
    });

    return conflict;
  };

  const handleEventDrop = useCallback(async ({ event, start, end }) => {
    try {
      const date = moment(start).format('YYYY-MM-DD');
      const startTime = moment(start).format('HH:mm');
      const endTime = moment(end).format('HH:mm');

      // Conflict Check
      const conflict = checkCrewConflict(event.resource.entry.crewId, date, startTime, endTime, event.id);
      if (conflict) {
        toast.error(`Crew conflict: Already scheduled for Job ${conflict.jobId}`);
        return;
      }

      await onUpdateSchedule(event.id, {
        date,
        startTime,
        endTime
      });
      toast.success('Schedule updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update schedule');
    }
  }, [onUpdateSchedule, schedule]);

  const handleEventResize = useCallback(async ({ event, start, end }) => {
    try {
      const date = moment(start).format('YYYY-MM-DD');
      const startTime = moment(start).format('HH:mm');
      const endTime = moment(end).format('HH:mm');

      // Conflict Check
      const conflict = checkCrewConflict(event.resource.entry.crewId, date, startTime, endTime, event.id);
      if (conflict) {
        toast.error(`Crew conflict: Already scheduled for Job ${conflict.jobId}`);
        return;
      }

      await onUpdateSchedule(event.id, {
        date,
        startTime,
        endTime
      });
      toast.success('Schedule updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update schedule');
    }
  }, [onUpdateSchedule, schedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedDate = moment(selectedSlot.start).format('YYYY-MM-DD');

      // Validate constraints
      const job = jobs.find(j => j.id === formData.jobId);
      if (!job) {
        toast.error('Invalid job selected');
        return;
      }

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

      // Conflict Check
      const conflict = checkCrewConflict(formData.crewId, selectedDate, formData.startTime, formData.endTime, editingEventId);
      if (conflict) {
        toast.error(`Crew conflict: Already scheduled for Job ${conflict.jobId}`);
        return;
      }

      const scheduleData = {
        jobId: formData.jobId,
        crewId: formData.crewId,
        vehicleId: (formData.vehicleId === 'unassigned' || formData.vehicleId === '') ? null : formData.vehicleId,
        type: formData.type,
        date: selectedDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'Scheduled',
      };

      if (editingEventId) {
        await onUpdateSchedule(editingEventId, scheduleData);
        toast.success('Schedule updated successfully');
      } else {
        await onAddSchedule(scheduleData);
        toast.success('Schedule created successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(editingEventId ? 'Failed to update schedule' : 'Failed to create schedule');
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
    <div className="flex h-[600px] gap-4">
      {/* To-Do Tasks Sidebar */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col">
        <div className="p-4 border-b bg-gray-50 rounded-t-lg">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            To-Do Tasks
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {jobs.filter(j => j.workflowState === 'roofing_complete').length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No pending actions</p>
          )}
          {jobs.filter(j => j.workflowState === 'roofing_complete').map(job => (
            <div key={job.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-orange-900">Job {job.jobId || job.id}</span>
                <span className="text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded">Reset</span>
              </div>
              <p className="text-gray-600 text-xs mb-2">{job.address?.city || 'Unknown Location'}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs bg-white hover:bg-orange-100 border-orange-200"
                onClick={() => {
                  setFormData({
                    ...formData,
                    jobId: job.id,
                    type: 'reset'
                  });
                  setIsDialogOpen(true);
                }}
              >
                Schedule Reset
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectSlot={handleSelectSlot}
          selectable
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          resizable
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
          }}
          date={date}
          view={view}
          onNavigate={onNavigate}
          onView={onView}
          views={['month', 'week', 'day', 'agenda']}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEventId ? 'Edit Schedule Entry' : 'Create Schedule Entry'}</DialogTitle>
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
                  value={formData.vehicleId || 'unassigned'}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None</SelectItem>
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
            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button type="submit">{editingEventId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
              {editingEventId && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatchCalendar;
