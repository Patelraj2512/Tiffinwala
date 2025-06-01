import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LoginScreen = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(credentials);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto bg-white p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-4xl">🍛</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Tiffinwala Admin</CardTitle>
          <p className="text-gray-600 mt-2">Sign in to manage your tiffin service</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin@tiffinwala.com"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
              Sign In
            </Button>
          </form>
          <div className="mt-6 text-center">
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold">Demo Credentials:</p>
              <p className="text-xs text-gray-500">Username: admin@tiffinwala.com</p>
              <p className="text-xs text-gray-500">Password: admin123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;
