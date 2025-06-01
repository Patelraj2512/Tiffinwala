import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ClientManagement = ({ clients, setClients, onSelectClient }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    lunchCost: '',
    dinnerCost: '',
    remindersEnabled: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      lunchCost: '',
      dinnerCost: '',
      remindersEnabled: true
    });
    setEditingClient(null);
  };

  // Fetch latest clients from backend
  const fetchClients = async () => {
    const res = await fetch('http://localhost:5000/api/clients');
    const data = await res.json();
    setClients(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientData = {
      ...formData,
      lunchCost: parseFloat(formData.lunchCost),
      dinnerCost: parseFloat(formData.dinnerCost)
    };

    if (editingClient) {
      // Update client
      await fetch(`http://localhost:5000/api/clients/${editingClient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      toast({
        title: "Client Updated",
        description: `${clientData.name} has been updated successfully.`
      });
    } else {
      // Add client
      await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      toast({
        title: "Client Added",
        description: `${clientData.name} has been added successfully.`
      });
    }
    setIsDialogOpen(false);
    resetForm();
    fetchClients();
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      mobile: client.mobile,
      lunchCost: client.lunchCost.toString(),
      dinnerCost: client.dinnerCost.toString(),
      remindersEnabled: client.remindersEnabled
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId) => {
    await fetch(`http://localhost:5000/api/clients/${clientId}`, {
      method: 'DELETE'
    });
    toast({
      title: "Client Deleted",
      description: "Client has been removed successfully."
    });
    fetchClients();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  placeholder="+91 9876543210"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lunchCost">Lunch Cost (₹)</Label>
                  <Input
                    id="lunchCost"
                    type="number"
                    value={formData.lunchCost}
                    onChange={(e) => setFormData({...formData, lunchCost: e.target.value})}
                    placeholder="80"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dinnerCost">Dinner Cost (₹)</Label>
                  <Input
                    id="dinnerCost"
                    type="number"
                    value={formData.dinnerCost}
                    onChange={(e) => setFormData({...formData, dinnerCost: e.target.value})}
                    placeholder="90"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="reminders"
                  checked={formData.remindersEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, remindersEnabled: checked})}
                />
                <Label htmlFor="reminders">Enable SMS/WhatsApp Reminders</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  {editingClient ? 'Update' : 'Add'} Client
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client._id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Phone className="h-4 w-4 mr-1" />
                    {client.mobile}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(client._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lunch:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ₹{client.lunchCost}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dinner:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    ₹{client.dinnerCost}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reminders:</span>
                  <Badge variant={client.remindersEnabled ? "default" : "secondary"}>
                    {client.remindersEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <Button 
                  className="w-full mt-3 bg-amber-100 text-amber-800 hover:bg-amber-200"
                  variant="secondary"
                  onClick={() => onSelectClient(client)}
                >
                  View Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clients Yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first client</p>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientManagement;
