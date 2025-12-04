import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TechLayout from '../components/TechLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ClipboardList, Search, MapPin, Calendar, ChevronRight, Smartphone, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextFirebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import moment from 'moment';

const TechHome = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('today'); // today, upcoming, completed

  useEffect(() => {
    if (!user?.crewId) {
      setLoading(false);
      return;
    }

    // Real-time listener for schedule
    const q = query(
      collection(db, 'dispatch_schedule'),
      where('crewId', '==', user.crewId),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const scheduleItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch job details for each schedule item
      // Note: In a production app with many items, we might want to optimize this 
      // by caching job details or using a separate listener for relevant jobs.
      const enrichedSchedule = await Promise.all(scheduleItems.map(async (item) => {
        try {
          // Assuming jobId corresponds to the document ID in 'jobs' collection
          // If not, we would need a query. Based on previous context, jobId is used as ID.
          const jobDoc = await getDoc(doc(db, 'jobs', item.jobId));
          if (jobDoc.exists()) {
            return { ...item, jobDetails: jobDoc.data() };
          }
        } catch (error) {
          console.error(`Error fetching job ${item.jobId}:`, error);
        }
        return item;
      }));

      setSchedule(enrichedSchedule);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to schedule:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter logic
  const filteredSchedule = schedule.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.jobId.toLowerCase().includes(searchLower) ||
      item.jobDetails?.customer?.name?.toLowerCase().includes(searchLower) ||
      item.jobDetails?.address?.street?.toLowerCase().includes(searchLower) ||
      item.jobDetails?.address?.city?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    const today = moment().format('YYYY-MM-DD');
    const itemDate = item.date;

    if (activeTab === 'today') {
      return itemDate === today && item.status !== 'Completed';
    } else if (activeTab === 'upcoming') {
      return itemDate > today && item.status !== 'Completed';
    } else if (activeTab === 'completed') {
      return item.status === 'Completed';
    }
    return false;
  });

  return (
    <TechLayout title="Technician Portal" showBack={false}>
      <div className="space-y-4">
        {/* Header & Search */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Hello, {user?.name || 'Tech'}</h1>
              <p className="text-xs text-gray-500">
                {user?.crewId ? 'Crew Assigned' : 'No Crew Assigned'}
              </p>
            </div>
            <Link to="/tech/jsa">
              <Button size="sm" variant="outline" className="h-8">
                <ClipboardList className="w-4 h-4 mr-1" />
                Quick JSA
              </Button>
            </Link>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search jobs, address, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Completed
          </button>
        </div>

        {/* Job List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading jobs...</p>
          </div>
        ) : filteredSchedule.length === 0 ? (
          <Card className="border-dashed shadow-none bg-transparent">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 font-medium">No jobs found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm ? 'Try adjusting your search' : `No ${activeTab} jobs assigned`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSchedule.map((item) => (
              <Link key={item.id} to={`/tech/job/${item.jobId}`}>
                <Card className="shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.jobId}
                        </Badge>
                        <Badge className={
                          item.type === 'reset' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                            item.type === 'detach' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                              'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }>
                          {item.type}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium text-gray-500">
                        {item.startTime}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {item.jobDetails?.customer && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{item.jobDetails.customer.name}</span>
                        </div>
                      )}

                      {item.jobDetails?.address && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                          <span className="line-clamp-2">
                            {item.jobDetails.address.street}, {item.jobDetails.address.city}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        <Calendar className="w-3 h-3" />
                        <span>{moment(item.date).format('dddd, MMM D')}</span>
                        {item.status === 'Completed' && (
                          <span className="ml-auto text-green-600 font-medium flex items-center gap-1">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TechLayout>
  );
};

export default TechHome;
