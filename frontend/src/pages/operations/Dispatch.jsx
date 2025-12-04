import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Clock, MapPin, Users, Truck, Grid3x3, List } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DispatchCalendar from './DispatchCalendar';
import { useFirestore } from '../../hooks/useFirestore';
import { where } from 'firebase/firestore';
import moment from 'moment';

const Dispatch = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [filter, setFilter] = useState('all');

  // Real-time listeners
  const { data: schedule, loading: scheduleLoading, add: addScheduleEntry, update: updateScheduleEntry } = useFirestore('dispatch_schedule');
  const { data: crews, loading: crewsLoading } = useFirestore('crews');
  const { data: vehicles, loading: vehiclesLoading } = useFirestore('vehicles');
  const { data: jobs, loading: jobsLoading } = useFirestore('jobs');

  const loading = scheduleLoading || crewsLoading || vehiclesLoading || jobsLoading;

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredSchedule = schedule.filter(item => {
    const itemDate = item.date;
    const selectedDateStr = moment(selectedDate).format('YYYY-MM-DD');
    const matchesDate = itemDate === selectedDateStr;
    const matchesFilter = filter === 'all' || item.status === filter;
    return matchesDate && matchesFilter;
  });

  const handleNavigate = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dispatch</h1>
            <p className="text-gray-600 mt-1">Manage crew schedules and job assignments</p>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar">
              <Grid3x3 className="w-4 h-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="w-4 h-4 mr-2" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="pt-6">
                <DispatchCalendar
                  schedule={schedule}
                  crews={crews}
                  vehicles={vehicles}
                  jobs={jobs}
                  onAddSchedule={addScheduleEntry}
                  onUpdateSchedule={updateScheduleEntry}
                  onDeleteSchedule={useFirestore('dispatch_schedule').remove}
                  date={selectedDate}
                  view={view}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Date</label>
                    <Input
                      type="date"
                      value={moment(selectedDate).format('YYYY-MM-DD')}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Schedule List */}
              <div className="lg:col-span-2 space-y-4">
                {loading ? (
                  <Card>
                    <CardContent className="py-8 text-center">Loading...</CardContent>
                  </Card>
                ) : filteredSchedule.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No schedules found for this date
                    </CardContent>
                  </Card>
                ) : (
                  filteredSchedule.map((item) => {
                    const job = jobs.find(j => j.id === item.jobId);
                    const crew = crews.find(c => c.id === item.crewId);
                    const vehicle = vehicles.find(v => v.id === item.vehicleId);

                    return (
                      <Card key={item.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                                <span className="text-sm font-medium text-gray-600">
                                  {item.type}
                                </span>
                              </div>
                              {job && (
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  Job {job.id}
                                </h3>
                              )}
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{item.startTime} - {item.endTime}</span>
                                </div>
                                {job?.address && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>
                                      {job.address.street}, {job.address.city}
                                    </span>
                                  </div>
                                )}
                                {crew && (
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{crew.name}</span>
                                  </div>
                                )}
                                {vehicle && (
                                  <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4" />
                                    <span>{vehicle.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                View Job
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Stats ({moment(selectedDate).format('MMM D')})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Scheduled</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {filteredSchedule.filter(s => s.status === 'Scheduled').length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {filteredSchedule.filter(s => s.status === 'In Progress').length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          {filteredSchedule.filter(s => s.status === 'Completed').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Crews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {crews.filter(c => c.status === 'Available').map((crew) => (
                        <div key={crew.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{crew.name}</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Available
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DndProvider>
  );
};

export default Dispatch;
