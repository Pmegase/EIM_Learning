// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Save, Plus, Trash2, Upload } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';

// Use backend origin when rendering images stored as /lovable-uploads/...
const BACKEND_PUBLIC_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const toPublicUrl = (u: string) =>
  !u ? u : /^https?:\/\//i.test(u) ? u : `${BACKEND_PUBLIC_URL}${u.startsWith('/') ? '' : '/'}${u}`;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { content, updateContent } = useContent();
  const { logout, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Keep editable copy in sync with context content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleLogout = () => {
    logout();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Clean out any legacy blob:/data: entries before persisting
      const sanitized = {
        ...localContent,
        carouselImages: (localContent.carouselImages ?? []).filter(
          (u) => typeof u === 'string' && !u.startsWith('blob:') && !u.startsWith('data:')
        ),
      };
      await updateContent(sanitized as any);

      toast({
        title: 'Changes saved',
        description: 'All content has been updated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error saving',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Immediate persist after upload so Gallery + Admin update without refresh
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget; // capture before await
    const file = input.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      // Field must be named 'image' to match multer.single('image')
      formData.append('image', file);

      // POST /api/content/upload -> { imageUrl: '/lovable-uploads/<file>' }
      const res = await apiClient.upload<{ imageUrl: string }>(
        API_ENDPOINTS.CONTENT.UPLOAD,
        formData
      );

      // 1) Optimistic local update so the admin grid shows immediately
      const nextImages = [...(localContent.carouselImages ?? []), res.imageUrl];
      setLocalContent((prev: any) => ({ ...prev, carouselImages: nextImages }));

      // 2) Persist right away so ContentContext updates → public Gallery updates too
      await updateContent({ carouselImages: nextImages } as any);

      toast({
        title: 'Image uploaded',
        description: 'Image has been added to the gallery',
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // allow re-selecting the same file
      try {
        input.value = '';
      } catch { }
    }
  };

  const addHeroText = () => {
    setLocalContent((prev: any) => ({
      ...prev,
      heroTexts: [...(prev.heroTexts ?? []), 'New hero text'],
    }));
  };

  const updateHeroText = (index: number, value: string) => {
    setLocalContent((prev: any) => ({
      ...prev,
      heroTexts: (prev.heroTexts ?? []).map((text: string, i: number) =>
        i === index ? value : text
      ),
    }));
  };

  const removeHeroText = (index: number) => {
    setLocalContent((prev: any) => ({
      ...prev,
      heroTexts: (prev.heroTexts ?? []).filter((_: string, i: number) => i !== index),
    }));
  };

  const removeCarouselImage = (index: number) => {
    const nextImages = (localContent.carouselImages ?? []).filter((_: string, i: number) => i !== index);
    setLocalContent((prev: any) => ({ ...prev, carouselImages: nextImages }));
    // Optional: persist removal immediately as well so Gallery updates instantly
    updateContent({ carouselImages: nextImages } as any).catch(() => {
      // non-blocking; the Save button still exists as a fallback
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/af7506d4-417a-4b90-95ab-b5e5d4d80b6a.png"
                alt="EIM Consultancy"
                className="h-12 w-auto mr-4"
              />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={() => navigate('/')} variant="outline">
                View Website
              </Button>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="about">About Section</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          {/* HERO */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section Texts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(localContent.heroTexts ?? []).map((text: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={text}
                      onChange={(e) => updateHeroText(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={() => removeHeroText(index)} variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addHeroText} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hero Text
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABOUT */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={localContent.vision ?? ''}
                    onChange={(e) =>
                      setLocalContent((prev: any) => ({ ...prev, vision: e.target.value }))
                    }
                    rows={6}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={localContent.mission ?? ''}
                    onChange={(e) =>
                      setLocalContent((prev: any) => ({ ...prev, mission: e.target.value }))
                    }
                    rows={6}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={localContent.aboutUs ?? ''}
                    onChange={(e) =>
                      setLocalContent((prev: any) => ({ ...prev, aboutUs: e.target.value }))
                    }
                    rows={6}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SERVICES (kept minimal to preserve your layout) */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* GALLERY */}
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </span>
                    </Button>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(localContent.carouselImages ?? []).map((image: string, index: number) => (
                    <div key={`${image}-${index}`} className="relative">
                      <img
                        src={toPublicUrl(image)}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        onClick={() => removeCarouselImage(index)}
                        className="absolute top-2 right-2"
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACT */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    value={localContent.contactInfo?.address ?? ''}
                    onChange={(e) =>
                      setLocalContent((prev: any) => ({
                        ...prev,
                        contactInfo: { ...(prev.contactInfo ?? {}), address: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    value={localContent.contactInfo?.email ?? ''}
                    onChange={(e) =>
                      setLocalContent((prev: any) => ({
                        ...prev,
                        contactInfo: { ...(prev.contactInfo ?? {}), email: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instagram</label>
                  <Input
                    value={localContent.contactInfo?.instagram ?? ''}
                    onChange={(e) =>
                      setLocalContent((prev: any) => ({
                        ...prev,
                        contactInfo: { ...(prev.contactInfo ?? {}), instagram: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Facebook</label>
                  <Input
                    value={localContent.contactInfo?.facebook ?? ''}
                    onChange={(e) =>
                      setLocalContent((prev: any) => ({
                        ...prev,
                        contactInfo: { ...(prev.contactInfo ?? {}), facebook: e.target.value },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
