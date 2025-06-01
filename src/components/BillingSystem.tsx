import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Calendar, DollarSign, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import RollerBillPrint from './RollerBillPrint';
import { format, parseISO, isSameMonth } from 'date-fns'; // Import isSameMonth and parseISO
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Import Popover components
import { Calendar as CalendarComponent } from '@/components/ui/calendar'; // Import CalendarComponent
import { cn } from '@/lib/utils'; // Import cn for classnames

const BillingSystem = ({ clients, attendance, bills, setBills, prints, setPrints, setAttendance }) => {
  // Initialize selectedMonth to the current month as a Date object
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState("all");

  console.log('BillingSystem - selectedClient:', selectedClient);
  console.log('BillingSystem - clients:', clients);
  console.log('BillingSystem - attendance:', attendance);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/bills');
        const data = await res.json();
        setBills(data);
      } catch (error) {
        console.error('Error fetching bills:', error);
        toast({
          title: 'Error fetching bills',
          description: 'Failed to load billing data.',
          variant: 'destructive',
        });
      }
    };

    const fetchPrints = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/prints');
        const data = await res.json();
        setPrints(data);
      } catch (error) {
        console.error('Error fetching prints:', error);
        toast({
          title: 'Error fetching prints',
          description: 'Failed to load print history.',
          variant: 'destructive',
        });
      }
    };

    // Fetch attendance data as well
    const fetchAttendance = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/attendance');
        const data = await res.json();
        // Assuming setAttendance is passed as a prop from the parent (Index.tsx)
        // If not, this component needs to manage attendance state internally
        if (setAttendance) {
          setAttendance(data);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast({
          title: 'Error fetching attendance',
          description: 'Failed to load attendance data.',
          variant: 'destructive',
        });
      }
    };

    fetchBills();
    fetchPrints();
    fetchAttendance(); // Fetch attendance data
  }, [setBills, setPrints, setAttendance]); // Add setAttendance to dependencies

  // Updated getMonthName to use date-fns format consistently
  const getMonthName = (date) => {
    return format(date, 'MMMM yyyy');
  };

  const calculateClientBill = (clientId, monthDate) => {
    const client = clients.find(c => c._id === clientId);
    if (!client) return null;

    // Use date-fns to correctly filter by month using Date objects
    const monthlyAttendance = attendance.filter(
      record => record.clientId === clientId && record.date && isSameMonth(parseISO(record.date), monthDate)
    );
    console.log(`calculateClientBill for client ${clientId} and month ${format(monthDate, 'yyyy-MM')}:`, { monthlyAttendance });

    const lunchDays = monthlyAttendance.filter(record => record.mealType === 'lunch').length;
    const dinnerDays = monthlyAttendance.filter(record => record.mealType === 'dinner').length;

    const lunchTotal = lunchDays * client.lunchCost;
    const dinnerTotal = dinnerDays * client.dinnerCost;
    const grandTotal = lunchTotal + dinnerTotal;

    return {
      client: { // Store only necessary client details to avoid large embedded documents
        _id: client._id,
        name: client.name,
        mobile: client.mobile,
        lunchCost: client.lunchCost,
        dinnerCost: client.dinnerCost
      },
      month: format(monthDate, 'yyyy-MM'), // Store month as yyyy-MM string
      lunchDays,
      dinnerDays,
      lunchTotal,
      dinnerTotal,
      grandTotal,
      attendanceRecords: monthlyAttendance.map(record => record._id) // Store attendance record IDs
    };
  };

  const handleExportPDF = async (clientId) => {
    const billData = calculateClientBill(clientId, selectedMonth);
    if (!billData) return;

    // Check if a bill for this client and month already exists
    const existingBill = bills.find(
      b => b.client && b.client._id === clientId && b.month === format(selectedMonth, 'yyyy-MM') // Compare with formatted month string
    );

    if (existingBill) {
      toast({
        title: 'Bill Already Exists',
        description: `A bill for ${billData.client.name} for ${getMonthName(selectedMonth)} has already been generated.`,
        variant: 'default',
      });
      return; // Prevent saving a duplicate bill
    }

    if (billData) {
      try {
        // Save bill to backend
        const response = await fetch('http://localhost:5000/api/bills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(billData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const savedBill = await response.json();
        console.log('Bill saved successfully:', savedBill);
        setBills([...bills, savedBill]); // Add the newly saved bill to state

        toast({
          title: 'Bill Generated and Saved',
          description: `Bill for ${billData.client.name} - ${getMonthName(selectedMonth)} has been generated and saved.`,
        });
        
        // Mock PDF generation - In a real app, trigger PDF generation here
        console.log('PDF Export Data:', billData);

      } catch (error) {
        console.error('Error saving bill:', error);
        toast({
          title: 'Error Saving Bill',
          description: `Failed to save the bill for ${billData.client.name}. ${error.message}`,
          variant: 'destructive',
        });
      }
    }
  };

  const filteredClients = selectedClient === "all" ? 
    clients : 
    clients.filter(c => c._id.toString() === selectedClient);

  const monthlyTotals = filteredClients.reduce((totals, client) => {
    // Check if a saved bill exists for this client and month
    const existingBill = bills.find(
      b => b.client && b.client._id === client._id && b.month === format(selectedMonth, 'yyyy-MM') // Compare with formatted month string
    );

    if (existingBill) {
      // Use saved bill data for totals
      totals.totalMeals += existingBill.lunchDays + existingBill.dinnerDays;
      totals.totalIncome += existingBill.grandTotal;
    } else {
      // Calculate from attendance if no saved bill exists
      const bill = calculateClientBill(client._id, selectedMonth);
      if (bill) {
        totals.totalMeals += bill.lunchDays + bill.dinnerDays;
        totals.totalIncome += bill.grandTotal;
      }
    }
    console.log('monthlyTotals intermediate:', totals);
    return totals;
  }, { totalMeals: 0, totalIncome: 0 });

  console.log('monthlyTotals final:', monthlyTotals);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing & Reports</h2>
          <p className="text-gray-600">Generate bills, reports and roller prints</p>
        </div>
      </div>

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Individual Bills
          </TabsTrigger>
          <TabsTrigger value="roller" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Roller Bill Print
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <div className="space-y-6">
            <div className="flex gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-48 justify-start text-left font-normal",
                      !selectedMonth && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span className="text-gray-500">Select month</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    month={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01") // Allow selecting past months
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-48">
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
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Total Meals ({getMonthName(selectedMonth)})</p>
                      <p className="text-3xl font-bold">{monthlyTotals.totalMeals}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-medium">Total Income ({getMonthName(selectedMonth)})</p>
                      <p className="text-3xl font-bold">₹{monthlyTotals.totalIncome}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client Bills */}
            <div className="space-y-6">
              {filteredClients.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Billing Data</h3>
                    <p className="text-gray-600">Add clients and track attendance to generate bills</p>
                  </CardContent>
                </Card>
              ) : (
                filteredClients.map(client => {
                  // First, try to find an existing saved bill for this client and month
                  const existingBill = bills.find(
                    b => b.client && b.client._id === client._id && b.month === format(selectedMonth, 'yyyy-MM') // Compare with formatted month string
                  );

                  // If a saved bill exists, use it; otherwise, calculate from attendance
                  const billToDisplay = existingBill || calculateClientBill(client._id, selectedMonth);
                  
                  // If no bill data exists (neither saved nor calculated), handle this case
                  if (!billToDisplay || billToDisplay.grandTotal === 0) {
                    return (
                      <Card key={client._id} className="opacity-60">
                        <CardContent className="p-6 text-center">
                          <h3 className="text-lg font-semibold text-gray-600">{client.name}</h3>
                          <p className="text-gray-500">No attendance recorded for {getMonthName(selectedMonth)}</p>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <Card key={client._id} className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-xl">{billToDisplay.client.name}</CardTitle>
                            <p className="text-blue-100">Bill for {getMonthName(selectedMonth)}</p>
                          </div>
                          {/* Only allow exporting if a bill has been calculated/saved */}
                          {billToDisplay && billToDisplay.grandTotal > 0 && (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleExportPDF(client._id)}
                              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {existingBill ? 'View/Re-export PDF' : 'Generate & Save Bill'}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Lunch Details */}
                          <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                            <div>
                              <h4 className="font-semibold text-green-800">Lunch</h4>
                              <p className="text-sm text-green-600">
                                {billToDisplay.lunchDays} days × ₹{billToDisplay.client.lunchCost}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg px-3 py-1">
                              ₹{billToDisplay.lunchTotal}
                            </Badge>
                          </div>

                          {/* Dinner Details */}
                          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <div>
                              <h4 className="font-semibold text-blue-800">Dinner</h4>
                              <p className="text-sm text-blue-600">
                                {billToDisplay.dinnerDays} days × ₹{billToDisplay.client.dinnerCost}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-lg px-3 py-1">
                              ₹{billToDisplay.dinnerTotal}
                            </Badge>
                          </div>

                          <Separator />

                          {/* Total */}
                          <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                            <div>
                              <h4 className="font-bold text-amber-800 text-lg">Total Amount</h4>
                              <p className="text-sm text-amber-600">
                                {billToDisplay.lunchDays + billToDisplay.dinnerDays} total meals
                              </p>
                            </div>
                            <Badge className="bg-amber-500 text-white text-xl px-4 py-2">
                              ₹{billToDisplay.grandTotal}
                            </Badge>
                          </div>

                          {/* Recent Meals - Display based on saved attendanceRecords or recalculate if not saved */}
                          <div className="mt-6">
                            <h5 className="font-semibold text-gray-700 mb-3">Recent Meals ({existingBill ? 'Saved' : 'Calculated from Attendance'})</h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {(existingBill && existingBill.attendanceRecords && existingBill.attendanceRecords.length > 0
                                ? existingBill.attendanceRecords.map(recordId => attendance.find(att => att._id === recordId)).filter(Boolean) // Find attendance records by ID if saved
                                : attendance.filter(record => record.clientId === client._id && record.date.startsWith(format(selectedMonth, 'yyyy-MM'))) // Otherwise, filter current attendance
                              )
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 5)
                                .map((record, index) => (
                                  <div key={record._id || index} className="flex justify-between text-sm text-gray-600 p-2 bg-gray-50 rounded">
                                    <span>{new Date(record.date).toLocaleDateString()}</span>
                                    <span className="capitalize">{record.mealType}</span>
                                    <span>{record.timestamp}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roller">
          <RollerBillPrint 
            clients={clients}
            attendance={attendance}
            bills={bills}
            prints={prints}
            setPrints={setPrints}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingSystem;
