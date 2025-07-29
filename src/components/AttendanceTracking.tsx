import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, ChefHat, Moon, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

const AttendanceTracking = ({ clients, attendance, setAttendance, selectedClient, setSelectedClient }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [quantities, setQuantities] = useState({});
  
  // Fetch latest attendance from backend and initialize quantities
  const fetchAttendance = async () => {
    const res = await fetch('http://localhost:5000/api/attendance');
    const data = await res.json();
    setAttendance(data);

    // Initialize quantities state from fetched attendance data
    const initialQuantities = {};
    data.forEach(record => {
      initialQuantities[`${record.clientId}-${record.date}-${record.mealType}`] = parseInt(record.quantity) || 1;
    });
    setQuantities(initialQuantities);
  };

  useEffect(() => {
    fetchAttendance();
  }, [setAttendance]); // Add setAttendance to dependencies if it's not stable

  // Effect to update internal state or re-render when clients prop changes
  useEffect(() => {
    // This effect ensures the component re-renders with the latest client data
    // No specific state update is needed here, as using clients directly in render
  }, [clients]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getMonthName = (date) => {
    return format(date, 'MMMM yyyy');
  };

  const currentYear = currentMonth.getFullYear();
  const currentMonthNum = currentMonth.getMonth() + 1;
  const daysInMonth = getDaysInMonth(currentYear, currentMonthNum);

  const toggleAttendance = async (clientId, date, mealType) => {
    const client = clients.find(c => c._id === clientId);
    if (!client) return;
    const existingRecord = attendance.find(
      record => record.clientId === clientId && 
                record.date === date && 
                record.mealType === mealType
    );

    if (existingRecord) {
      // Remove attendance from backend
      await fetch(`http://localhost:5000/api/attendance/${existingRecord._id}`, {
        method: 'DELETE'
      });
      toast({
        title: "Attendance Removed",
        description: `${mealType} removed for ${date}`
      });
    } else {
      // Add attendance to backend
      const newRecord = {
        clientId,
        date,
        mealType,
        quantity: quantities[`${clientId}-${date}-${mealType}`] || 1,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      toast({
        title: "Attendance Marked",
        description: `${mealType} marked for ${date}`
      });
    }
    fetchAttendance();
  };

  const handleQuantityChange = async (clientId, date, mealType, value) => {
    const key = `${clientId}-${date}-${mealType}`;
    const newQuantity = Math.max(1, parseInt(value) || 1);

    // Update local state immediately for responsiveness
    setQuantities(prev => ({
      ...prev,
      [key]: newQuantity
    }));

    // Find the existing attendance record
    const existingRecord = attendance.find(
      record => record.clientId === clientId && 
                record.date === date && 
                record.mealType === mealType
    );

    // If a record exists, update it in the backend
    if (existingRecord) {
      try {
        const response = await fetch(`http://localhost:5000/api/attendance/${existingRecord._id}`, {
          method: 'PUT', // Or PATCH, depending on your API
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...existingRecord, quantity: newQuantity })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Update the attendance state with the modified record
        const updatedRecord = await response.json();
        setAttendance(prevAttendance => 
          prevAttendance.map(record => 
            record._id === updatedRecord._id ? updatedRecord : record
          )
        );

        toast({
          title: "Quantity Updated",
          description: `${mealType} quantity updated to ${newQuantity} for ${date}`
        });

      } catch (error) {
        console.error('Error updating quantity:', error);
        toast({
          title: "Error Updating Quantity",
          description: `Failed to update ${mealType} quantity. ${error.message}`,
          variant: 'destructive',
        });
        // Optionally, revert the local state change on error
        setQuantities(prev => ({
          ...prev,
          [key]: existingRecord.quantity // Revert to previous quantity on error
        }));
      }
    }
    // Note: If no existing record, handleQuantityChange alone doesn't add one.
    // Adding a record is handled by toggleAttendance when the checkbox is checked.
  };

  const isAttendanceMarked = (clientId, date, mealType) => {
    return attendance.some(
      record => record.clientId === clientId && 
                record.date === date && 
                record.mealType === mealType
    );
  };

  const getClientAttendanceStats = (clientId) => {
    const clientAttendance = attendance.filter(
      record => record.clientId === clientId && record.date.startsWith(format(currentMonth, 'yyyy-MM'))
    );
    
    const lunchDays = clientAttendance.filter(record => record.mealType === 'lunch').length;
    const dinnerDays = clientAttendance.filter(record => record.mealType === 'dinner').length;
    
    return { lunchDays, dinnerDays };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Tracking</h2>
          <p className="text-gray-600">{getMonthName(currentMonth)}</p>
        </div>
        
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !currentMonth && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {currentMonth ? format(currentMonth, "MMMM yyyy") : <span className="text-gray-500">Pick a month</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                disabled={date => date > new Date() || date < new Date("2023-01-01")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {clients.length > 0 && (
            <Select value={selectedClient?._id?.toString() || "all"} onValueChange={(value) => {
              if (value === "all") {
                setSelectedClient(null);
              } else {
                const client = clients.find(c => c._id.toString() === value);
                setSelectedClient(client || null);
              }
            }}>
              <SelectTrigger className="w-48">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client._id} value={client._id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {clients.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clients to Track</h3>
            <p className="text-gray-600">Add clients first to start tracking attendance</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(selectedClient ? [selectedClient] : clients).map(client => {
            const stats = getClientAttendanceStats(client._id);
            
            return (
              <Card key={client._id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">{client.name}</CardTitle>
                      <p className="text-amber-100">{client.mobile}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-4 text-sm">
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                          <ChefHat className="h-4 w-4 inline mr-1" />
                          {stats.lunchDays} Lunches
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                          <Moon className="h-4 w-4 inline mr-1" />
                          {stats.dinnerDays} Dinners
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const date = format(new Date(currentYear, currentMonthNum - 1, day), 'yyyy-MM-dd');
                      const isLunchMarked = isAttendanceMarked(client._id, date, 'lunch');
                      const isDinnerMarked = isAttendanceMarked(client._id, date, 'dinner');
                      
                      return (
                        <div key={day} className="border rounded-lg p-2 min-h-[80px] bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="text-center font-semibold text-gray-700 mb-2">
                            {day}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Checkbox
                                id={`lunch-${client._id}-${date}`}
                                checked={isLunchMarked}
                                onCheckedChange={() => toggleAttendance(client._id, date, 'lunch')}
                              />
                              <label 
                                htmlFor={`lunch-${client._id}-${date}`}
                                className="text-xs text-green-700 cursor-pointer"
                              >
                                L
                              </label>
                              {/* Show quantity input if attendance marked or custom quantity enabled */}
                              {(isLunchMarked || client.customQuantityEnabled) && (
                                <Input
                                  type="number"
                                  min="1"
                                  value={quantities[`${client._id}-${date}-lunch`] || 1}
                                  onChange={(e) => handleQuantityChange(client._id, date, 'lunch', e.target.value)}
                                  className="w-12 h-6 text-xs"
                                />
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Checkbox
                                id={`dinner-${client._id}-${date}`}
                                checked={isDinnerMarked}
                                onCheckedChange={() => toggleAttendance(client._id, date, 'dinner')}
                              />
                              <label 
                                htmlFor={`dinner-${client._id}-${date}`}
                                className="text-xs text-blue-700 cursor-pointer"
                              >
                                D
                              </label>
                              {(isDinnerMarked || client.customQuantityEnabled) && (
                                <Input
                                  type="number"
                                  min="1"
                                  value={quantities[`${client._id}-${date}-dinner`] || 1}
                                  onChange={(e) => handleQuantityChange(client._id, date, 'dinner', e.target.value)}
                                  className="w-12 h-6 text-xs"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;