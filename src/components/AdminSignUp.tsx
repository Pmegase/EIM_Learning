// src/components/AdminSignUp.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AdminSignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminCode: '' // Required admin code
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { adminSignup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure your passwords match.",
                variant: "destructive",
            });
            return;
        }

        if (formData.password.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        if (!formData.adminCode.trim()) {
            toast({
                title: "Admin code required",
                description: "Please provide the admin access code.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            await adminSignup(formData.name, formData.email, formData.password, formData.adminCode);
            toast({
                title: "Admin Account Created!",
                description: "Welcome to the admin dashboard!",
            });
        } catch (error: any) {
            toast({
                title: "Admin signup failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <img
                        src="/lovable-uploads/af7506d4-417a-4b90-95ab-b5e5d4d80b6a.png"
                        alt="EIM Consultancy"
                        className="h-24 w-auto mx-auto mb-4"
                    />
                    <CardTitle className="text-2xl font-bold">Create Admin Account</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                        Create an administrator account for EIM Consultancy
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                type="text"
                                name="name"
                                placeholder="Admin Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                type="email"
                                name="email"
                                placeholder="Admin Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                type="text"
                                name="adminCode"
                                placeholder="Admin Access Code"
                                value={formData.adminCode}
                                onChange={handleChange}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Contact system administrator to get the admin access code
                            </p>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={loading}
                        >
                            {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
                        </Button>
                    </form>

                    <div className="mt-6 space-y-3 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an admin account?{' '}
                            <Link to="/login" className="text-green-600 hover:text-green-800 font-medium">
                                Admin Login
                            </Link>
                        </p>
                        <p className="text-sm text-gray-600">
                            Want to create a regular user account?{' '}
                            <Link to="/signup" className="text-green-600 hover:text-green-800 font-medium">
                                User Sign Up
                            </Link>
                        </p>
                        <Button
                            onClick={() => navigate('/')}
                            variant="ghost"
                            className="w-full text-sm"
                        >
                            ← Back to Website
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSignUp;