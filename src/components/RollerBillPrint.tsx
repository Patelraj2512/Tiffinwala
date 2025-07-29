import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Calendar, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, isSameMonth, parseISO } from 'date-fns'; // Import isSameMonth and parseISO
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Import Popover components
import { Calendar as CalendarComponent } from '@/components/ui/calendar'; // Import CalendarComponent
import { cn } from '@/lib/utils'; // Import cn for classnames

const RollerBillPrint = ({ clients, attendance, bills, prints, setPrints }) => {
  const [printFormat, setPrintFormat] = useState("thermal");
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Default to current Date object
  const [selectedClient, setSelectedClient] = useState("all");

  useEffect(() => {
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

    fetchPrints();
  }, [setPrints]);

  const getMonthName = (date) => {
    return format(date, 'MMMM yyyy');
  };

  const calculateClientBill = (clientId, monthDate) => {
    const client = clients.find(c => c._id === clientId);
    if (!client) return null;

    const monthlyAttendance = attendance.filter(
      record => record.clientId === clientId && record.date && isSameMonth(parseISO(record.date), monthDate)
    );

    // Calculate total quantities for lunch and dinner
    const lunchRecords = monthlyAttendance.filter(record => record.mealType === 'lunch');
    const dinnerRecords = monthlyAttendance.filter(record => record.mealType === 'dinner');
    
    // Calculate total quantities by summing up quantities for each record
    const lunchQuantity = lunchRecords.reduce((sum, record) => sum + (parseInt(record.quantity) || 1), 0);
    const dinnerQuantity = dinnerRecords.reduce((sum, record) => sum + (parseInt(record.quantity) || 1), 0);

    // Calculate totals by multiplying quantity with cost
    const lunchTotal = lunchQuantity * client.lunchCost;
    const dinnerTotal = dinnerQuantity * client.dinnerCost;
    const subtotal = lunchTotal + dinnerTotal;

    // Calculate discount amount
    const discountPercentage = client.discount || 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const grandTotal = subtotal - discountAmount;

    return {
      client,
      lunchDays: lunchRecords.length,
      dinnerDays: dinnerRecords.length,
      lunchQuantity,
      dinnerQuantity,
      lunchTotal,
      dinnerTotal,
      discountPercentage,
      discountAmount,
      grandTotal,
      monthlyAttendance: monthlyAttendance.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
  };

  const generateRollerBillData = () => {
    const filteredClients = selectedClient === "all" ? 
      clients : 
      clients.filter(c => c._id.toString() === selectedClient);

    return filteredClients.map(client => calculateClientBill(client._id, selectedMonth)).filter(Boolean);
  };

  const handlePrintRollerBill = async () => {
    const billData = generateRollerBillData();
    
    if (billData.length === 0) {
      toast({
        title: "No Data Available",
        description: "No attendance data found for the selected criteria.",
        variant: "destructive"
      });
      return;
    }

    // Create print window with roller bill format
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent(billData);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    // printWindow.focus(); // Commenting this out as it can be annoying
    printWindow.print();

    // Save print details to the backend
    try {
      const printDetails = {
        // Use client IDs from the generated billData to record which clients were included
        clientIDs: billData.map(bill => bill.client._id), 
        printDate: new Date().toISOString(), // Save current date
        month: format(selectedMonth, 'yyyy-MM'), // Save the month for the print
        totalClients: billData.length,
        totalAmount: billData.reduce((sum, bill) => sum + bill.grandTotal, 0),
        details: `Roller print generated for ${billData.length} client(s) for ${getMonthName(selectedMonth)}. Total Amount: ₹${billData.reduce((sum, bill) => sum + bill.grandTotal, 0)}` // Detailed summary
      };

      const response = await fetch('http://localhost:5000/api/prints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printDetails),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedPrint = await response.json();
      console.log('Print saved successfully:', savedPrint);
      setPrints([...prints, savedPrint]); // Add the newly saved print to state

      toast({
        title: "Roller Bill Printed & Saved",
        description: `Generated and saved ${billData.length} bill(s) for ${getMonthName(selectedMonth)}. Total: ₹${printDetails.totalAmount}`
      });

    } catch (error) {
      console.error('Error saving print:', error);
      toast({
        title: 'Error Saving Print',
        description: `Failed to save print details. ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const generatePrintContent = (billData) => {
    const isthermal = printFormat === "thermal";
    const width = isthermal ? "58mm" : "80mm";
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Roller Bill - ${getMonthName(selectedMonth)}</title>
          <style>
            @media print {
              @page {
                margin: 0;
                size: ${width} auto;
                width: ${width};
              }
              body {
                margin: 0;
                padding: 0;
                width: ${width};
                font-family: 'Courier New', monospace;
                font-size: ${isthermal ? '9px' : '11px'};
                line-height: 1.2;
                background: white;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: ${isthermal ? '9px' : '11px'};
              line-height: 1.2;
              margin: 0;
              padding: 2mm;
              width: ${width};
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 1mm;
              margin-bottom: 1mm;
            }
            .client-section {
              margin-bottom: 3mm;
              border-bottom: 1px dashed #000;
              padding-bottom: 1mm;
            }
            .client-name {
              font-weight: bold;
              font-size: ${isthermal ? '10px' : '12px'};
              margin-bottom: 1mm;
            }
            .line {
              display: flex;
              justify-content: space-between;
              margin: 0.3mm 0;
            }
            .total-line {
              font-weight: bold;
              border-top: 1px dashed #000;
              padding-top: 0.5mm;
              margin-top: 0.5mm;
            }
            .center { text-align: center; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: ${isthermal ? '12px' : '14px'}; font-weight: bold;">🍛 TIFFINWALA</div>
            <div>Meal Service Bill</div>
            <div>${getMonthName(selectedMonth)}</div>
            <div>Date: ${format(new Date(), 'yyyy-MM-dd')}</div>
          </div>
          
          ${billData.map(bill => `
            <div class="client-section">
              <div class="client-name">${bill.client.name}</div>
              <div>Mobile: ${bill.client.mobile}</div>
              <div style="margin: 2mm 0;">
                <div class="line">
                  <span>Lunch (${bill.lunchDays} days)</span>
                  <span>₹${bill.lunchTotal}</span>
                </div>
                <div class="line">
                  <span>Quantity: ${bill.lunchQuantity} × ₹${bill.client.lunchCost}</span>
                  <span></span>
                </div>
                <div class="line">
                  <span>Dinner (${bill.dinnerDays} days)</span>
                  <span>₹${bill.dinnerTotal}</span>
                </div>
                <div class="line">
                  <span>Quantity: ${bill.dinnerQuantity} × ₹${bill.client.dinnerCost}</span>
                  <span></span>
                </div>
                ${bill.discountPercentage > 0 ? `
                <div class="line total-line">
                  <span>Subtotal</span>
                  <span>₹${bill.lunchTotal + bill.dinnerTotal}</span>
                </div>
                <div class="line">
                  <span>Discount (${bill.discountPercentage}%)</span>
                  <span>-₹${bill.discountAmount}</span>
                </div>
                ` : ''}
                <div class="line total-line" style="border-top: 1px solid #000;">
                  <span>TOTAL</span>
                  <span>₹${bill.grandTotal}</span>
                </div>
              </div>
              
              <div style="font-size: ${isthermal ? '8px' : '10px'}; margin-top: 2mm;">
                <div>Meal Details:</div>
                ${bill.monthlyAttendance.slice(0, 10).map(record => `
                  <div>${format(parseISO(record.date), 'dd/MM/yyyy')} - ${record.mealType.toUpperCase()}</div>
                `).join('')}
                ${bill.monthlyAttendance.length > 10 ? `<div>... and ${bill.monthlyAttendance.length - 10} more meals</div>` : ''}
              </div>
            </div>
          `).join('')}
          
          <div class="center" style="margin-top: 4mm; font-size: ${isthermal ? '8px' : '10px'};">
            <div>Thank you for choosing Tiffinwala!</div>
            <div>Contact: 9904404326</div>
            <div>Contact: 9023971084</div>
          </div>
        </body>
      </html>
    `;
  };

  const billData = generateRollerBillData();
  const totalAmount = billData.reduce((sum, bill) => sum + bill.grandTotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roller Bill Print</h2>
          <p className="text-gray-600">Generate continuous format bills for thermal printers</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient} disabled={false}>
                <SelectTrigger>
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue />
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Print Format</label>
              <Select value={printFormat} onValueChange={setPrintFormat}>
                <SelectTrigger>
                  <Printer className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Thermal (58mm)</SelectItem>
                  <SelectItem value="standard">Standard (80mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handlePrintRollerBill}
              className="bg-green-600 hover:bg-green-700"
              disabled={billData.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Roller Bill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {billData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Printer className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bills to preview. Select criteria above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{billData.length}</div>
                  <div className="text-sm text-blue-600">Bills to Print</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {billData.reduce((sum, bill) => sum + bill.lunchDays + bill.dinnerDays, 0)}
                  </div>
                  <div className="text-sm text-green-600">Total Meals</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600">₹{totalAmount}</div>
                  <div className="text-sm text-amber-600">Total Amount</div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {billData.map((bill, index) => (
                  <div key={bill.client._id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{bill.client.name}</h4>
                        <p className="text-sm text-gray-600">{bill.client.mobile}</p>
                        <div className="text-sm mt-2">
                          <span className="bg-green-100 px-2 py-1 rounded mr-2">
                            {bill.lunchDays} Lunches
                          </span>
                          <span className="bg-blue-100 px-2 py-1 rounded">
                            {bill.dinnerDays} Dinners
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">₹{bill.grandTotal}</div>
                        <div className="text-sm text-gray-600">
                          {bill.lunchDays + bill.dinnerDays} meals
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RollerBillPrint;
