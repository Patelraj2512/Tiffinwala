import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientManagement from '@/components/ClientManagement';
import AttendanceTracking from '@/components/AttendanceTracking';
import BillingSystem from '@/components/BillingSystem';
import LoginScreen from '@/components/LoginScreen';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { isSameDay, parseISO } from 'date-fns';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [bills, setBills] = useState([]);
  const [prints, setPrints] = useState([]);
  const [activeTab, setActiveTab] = useState('clients');

  // Fetch data from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsRes = await fetch('http://localhost:5000/api/clients');
        const clientsData = await clientsRes.json();
        setClients(clientsData);

        const attendanceRes = await fetch('http://localhost:5000/api/attendance');
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData);

        const billsRes = await fetch('http://localhost:5000/api/bills');
        const billsData = await billsRes.json();
        setBills(billsData);

        const printsRes = await fetch('http://localhost:5000/api/prints');
        const printsData = await printsRes.json();
        setPrints(printsData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({
          title: "Error fetching data",
          description: "Could not load clients, attendance, bills, or prints.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, []);

  // Log clients data after fetching to inspect customQuantityEnabled
  useEffect(() => {
    console.log("Fetched Clients Data:", clients);
  }, [clients]);

  // Calculate dashboard metrics (using fetched data)
  const today = new Date();
  const todayMeals = attendance.filter(a => a.date && isSameDay(parseISO(a.date), today)).length;
  const monthlyIncome = calculateMonthlyIncome(clients, attendance);
  
  // Pass clients and attendance to calculateMonthlyIncome
  function calculateMonthlyIncome(clientsData, attendanceData) {
    const currentMonth = today.toISOString().slice(0, 7);
    const monthlyAttendance = attendanceData.filter(a => a.date && a.date.startsWith(currentMonth));
    return monthlyAttendance.reduce((total, record) => {
      const client = clientsData.find(c => c._id === record.clientId || c.id === record.clientId);
      if (!client) return total;
      // Calculate total based on quantity * cost
      const quantity = parseInt(record.quantity) || 1;
      const cost = record.mealType === 'lunch' ? client.lunchCost : client.dinnerCost;
      return total + (quantity * cost);
    }, 0);
  }

  const handleSelectClientAndViewAttendance = (client) => {
    setSelectedClient(client);
    setActiveTab('attendance');
  };

  const handleLogin = (credentials) => {
    // Use username for login
    fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsAuthenticated(true);
          toast({
            title: "Login Successful",
            description: "Welcome to Tiffinwala Dashboard!",
          });
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid credentials. Please try again.",
            variant: "destructive"
          });
        }
      });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedClient(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <span className="text-white font-bold text-xl">🍛</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Tiffinwala</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Clients</p>
                  <p className="text-3xl font-bold">{clients.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Today's Meals</p>
                  <p className="text-3xl font-bold">{todayMeals}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Monthly Income</p>
                  <p className="text-3xl font-bold">₹{monthlyIncome}</p>
                </div>
                <DollarSign className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Reminders</p>
                  <p className="text-3xl font-bold">{clients.filter(c => c.remindersEnabled).length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="clients" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="clients" className="text-center">Client Management</TabsTrigger>
            <TabsTrigger value="attendance" className="text-center">Attendance Tracking</TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2 text-center">Billing & Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <ClientManagement 
              clients={clients} 
              setClients={setClients}
              onSelectClient={handleSelectClientAndViewAttendance}
            />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTracking 
              clients={clients}
              attendance={attendance}
              setAttendance={setAttendance}
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
            />
          </TabsContent>

          <TabsContent value="billing">
            <BillingSystem 
              clients={clients}
              attendance={attendance}
              bills={bills}
              setBills={setBills}
              prints={prints}
              setPrints={setPrints}
              setAttendance={setAttendance}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
