'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileText, DollarSign, ArrowUp } from 'lucide-react';

const metricCards = [
    { title: 'Total Users', value: '1,250', icon: <Users />, change: '+12.5%' },
    { title: 'Resumes Created', value: '3,480', icon: <FileText />, change: '+8.2%' },
    { title: 'Revenue', value: '$12,450', icon: <DollarSign />, change: '+20.1%' },
];

const salesData = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 300 },
    { name: 'Mar', users: 600 },
    { name: 'Apr', users: 800 },
    { name: 'May', users: 500 },
    { name: 'Jun', users: 700 },
];

const AdminDashboard = () => {
    return (
        <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {metricCards.map((card, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <div className="text-gray-500">{card.icon}</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-green-500 flex items-center">
                                <ArrowUp className="w-4 h-4 mr-1" />
                                {card.change} vs last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>New User Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="users" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                {/* Add another chart here if needed */}
            </div>
        </div>
    );
};

export default AdminDashboard; 