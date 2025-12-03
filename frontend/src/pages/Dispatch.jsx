import React, { useState } from 'react';
import { mockSchedule, mockCrews, mockJobs } from '../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar, Users, Truck, Clock, MapPin, AlertCircle, CloudRain, Sun } from 'lucide-react';

const Dispatch = () => {
  const [schedule] = useState(mockSchedule);
  const [crews] = useState(mockCrews);
  const [selectedDate, setSelectedDate] = useState('2024-07-03');

  const todaysSchedule = schedule.filter((item) => item.date === selectedDate);

  const getStatusColor = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-800',
      'On Job': 'bg-blue-100 text-blue-800',
      'Off Duty': 'bg-gray-100 text-gray-800',
      Scheduled: 'bg-purple-100 text-purple-800',
      'In Progress': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Mock weather data
  const weatherForecast = [
    { date: '2024-07-03', condition: 'Clear', temp: 78, icon: Sun },
    { date: '2024-07-04', condition: 'Partly Cloudy', temp: 75, icon: Sun },
    { date: '2024-07-05', condition: 'Clear', temp: 82, icon: Sun },
    { date: '2024-07-06', condition: 'Rain', temp: 68, icon: CloudRain },
    { date: '2024-07-07', condition: 'Clear', temp: 80, icon: Sun }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations & Dispatch</h1>
          <p className="text-gray-600 mt-1">Schedule and manage crew assignments</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Calendar size={20} className="mr-2" />
          Schedule Job
        </Button>
      </div>

      {/* Weather Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun size={20} />
            5-Day Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {weatherForecast.map((day) => {
              const WeatherIcon = day.icon;
              return (
                <div
                  key={day.date}
                  className="text-center p-4 rounded-lg border hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => setSelectedDate(day.date)}
                >
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{day.date}</p>
                  <WeatherIcon
                    size={32}
                    className={`mx-auto my-3 ${
                      day.condition === 'Rain' ? 'text-blue-500' : 'text-yellow-500'
                    }`}
                  />
                  <p className="text-lg font-bold text-gray-900">{day.temp}°F</p>
                  <p className="text-xs text-gray-600 mt-1">{day.condition}</p>
                </div>
              );
            })}
          </div>
          {weatherForecast.find((d) => d.date === selectedDate)?.condition === 'Rain' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Weather Alert</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Rain forecasted for {selectedDate}. Consider rescheduling outdoor work.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crew Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {crews.map((crew) => (
          <Card key={crew.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{crew.name}</CardTitle>
                <Badge className={getStatusColor(crew.status)}>{crew.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Crew Lead</p>
                  <p className="text-sm font-semibold text-gray-900">{crew.lead}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Team Members</p>
                  <p className="text-sm text-gray-700">{crew.members.length} members</p>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">{crew.vehicleName}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-1">
                    {crew.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
                {crew.currentJob && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500">Current Assignment</p>
                    <p className="text-sm font-semibold text-blue-600">{crew.currentJob}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Schedule for {selectedDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysSchedule.length > 0 ? (
            <div className="space-y-4">
              {todaysSchedule.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{item.jobName}</h3>
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users size={16} />
                          <span>Crew: {item.crewName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={16} />
                          <span>
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Job
                      </Button>
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No scheduled jobs for this date</p>
              <Button className="mt-4" variant="outline">
                Schedule Job
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dispatch;
