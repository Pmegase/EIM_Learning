// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Save, Plus, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import { useContent, Service } from '@/contexts/ContentContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';

const BACKEND_PUBLIC_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const toPublicUrl = (u: string) =>
  !u ? u : /^https?:\/\//i.test(u) ? u : `${BACKEND_PUBLIC_URL}${u.startsWith('/') ? '' : '/'}${u}`;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { content, updateContent, refetch } = useContent();
  const { logout, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Sync editable copy with context content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleLogout = () => {
    logout();
  };

  /* ---------- Save buttons per tab (existing behavior) ---------- */

  const saveHero = async () => {
    setLoading(true);
    try {
      await updateContent({ heroTexts: localContent.heroTexts ?? [] });
      toast({ title: 'Saved', description: 'Hero section updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save hero.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveAbout = async () => {
    setLoading(true);
    try {
      await updateContent({
        vision: localContent.vision ?? '',
        mission: localContent.mission ?? '',
        aboutUs: localContent.aboutUs ?? '',
      });
      toast({ title: 'Saved', description: 'About section updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save about.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async () => {
    setLoading(true);
    try {
      await updateContent({ contactInfo: localContent.contactInfo ?? {} });
      toast({ title: 'Saved', description: 'Contact info updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save contact.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Services tab helpers (unchanged UI) ---------- */

  const mutateService = (index: number, patch: Partial<Service>) => {
    setLocalContent(prev => {
      const list = [...(prev.services ?? [])];
      list[index] = { ...list[index], ...patch };
      const normalized = list.map((s, i) => ({ ...s, sortOrder: i }));
      return { ...prev, services: normalized };
    });
  };

  const addService = () => {
    setLocalContent(prev => {
      const list = [...(prev.services ?? [])];
      list.push({
        title: '',
        description: '',
        icon: 'book',
        link: '',
        sortOrder: list.length,
        isActive: true,
      });
      return { ...prev, services: list };
    });
  };

  // replace your current removeService with this:
  const removeService = async (index: number) => {
    const svc = (localContent.services ?? [])[index];
    // Optimistic UI
    setLocalContent(prev => {
      const list = [...(prev.services ?? [])];
      list.splice(index, 1);
      return { ...prev, services: list.map((s, i) => ({ ...s, sortOrder: i })) };
    });

    try {
      if (typeof svc?.id === 'number' && Number.isFinite(svc.id)) {
        await apiClient.delete(`/api/services/${svc.id}`);
        await refetch(); // make sure context pulls fresh list from server
      }
    } catch (e: any) {
      // optional: roll back UI here if you want
      console.error('delete service failed', e);
      toast({ title: 'Delete failed', description: e?.message || 'Try again.', variant: 'destructive' });
      // quick re-fetch to resync
      await refetch();
    }
  };


  const moveService = (index: number, dir: -1 | 1) => {
    setLocalContent(prev => {
      const list = [...(prev.services ?? [])];
      const j = index + dir;
      if (j < 0 || j >= list.length) return prev;
      [list[index], list[j]] = [list[j], list[index]];
      return { ...prev, services: list.map((s, i) => ({ ...s, sortOrder: i })) };
    });
  };

  const saveServices = async () => {
    setLoading(true);
    try {
      const payload = (localContent.services ?? []).map((s, i) => {
        const base = {
          title: s.title ?? '',
          description: s.description ?? '',
          icon: s.icon ?? 'book',
          link: s.link ?? '',
          sortOrder: i,
          isActive: s.isActive !== false,
        };
        // Only include id if it’s a *valid number*
        if (typeof s.id === 'number' && Number.isFinite(s.id)) {
          (base as any).id = s.id;
        }
        return base;
      });

      await apiClient.put('/api/services/bulk', payload);
      await refetch();
      toast({ title: 'Saved', description: 'Services updated.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- GALLERY: upload to Supabase via backend, persist + refresh ---------- */

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const form = new FormData();
      // Must be 'image' to match backend multer.single('image')
      form.append('image', file);

      // Backend uploads to Supabase and returns the FINAL public URL in { imageUrl }
      const res = await apiClient.upload<{ imageUrl: string }>(API_ENDPOINTS.CONTENT.UPLOAD, form);

      // Optimistic local update
      const next = [...(localContent.carouselImages ?? []), res.imageUrl];
      setLocalContent(prev => ({ ...prev, carouselImages: next }));

      // Persist immediately so DB stores the Supabase URL
      await updateContent({ carouselImages: next });

      // Refresh ContentContext so public Gallery shows immediately (no page reload)
      await refetch();

      toast({ title: 'Image uploaded', description: 'Added to gallery.' });
    } catch (err) {
      console.error('Upload failed:', err);
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      try {
        input.value = '';
      } catch { }
    }
  };

  const removeCarouselImage = (index: number) => {
    const next = (localContent.carouselImages ?? []).filter((_, i) => i !== index);
    setLocalContent(prev => ({ ...prev, carouselImages: next }));
    // Persist removal (if you later add a backend delete-from-bucket route, call it before this)
    updateContent({ carouselImages: next }).catch(() => { });
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
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Hero Section Texts</CardTitle>
                <Button onClick={saveHero} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(localContent.heroTexts ?? []).map((text, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={text}
                      onChange={(e) =>
                        setLocalContent(prev => {
                          const arr = [...(prev.heroTexts ?? [])];
                          arr[index] = e.target.value;
                          return { ...prev, heroTexts: arr };
                        })
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() =>
                        setLocalContent(prev => ({
                          ...prev,
                          heroTexts: (prev.heroTexts ?? []).filter((_, i) => i !== index),
                        }))
                      }
                      variant="outline"
                      size="icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    setLocalContent(prev => ({
                      ...prev,
                      heroTexts: [...(prev.heroTexts ?? []), 'New hero text'],
                    }))
                  }
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hero Text
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABOUT */}
          <TabsContent value="about">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>About Section</CardTitle>
                <Button onClick={saveAbout} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Vision</h3>
                    <Textarea
                      value={localContent.vision ?? ''}
                      onChange={(e) => setLocalContent(prev => ({ ...prev, vision: e.target.value }))}
                      rows={6}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Mission</h3>
                    <Textarea
                      value={localContent.mission ?? ''}
                      onChange={(e) => setLocalContent(prev => ({ ...prev, mission: e.target.value }))}
                      rows={6}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">About Us</h3>
                    <Textarea
                      value={localContent.aboutUs ?? ''}
                      onChange={(e) => setLocalContent(prev => ({ ...prev, aboutUs: e.target.value }))}
                      rows={6}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SERVICES */}
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Services</CardTitle>
                <Button onClick={saveServices} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Services'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(localContent.services ?? []).map((s, i) => (
                  <div key={s.id ?? i} className="border rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input value={s.title} onChange={(e) => mutateService(i, { title: e.target.value })} placeholder="Title" />
                      <Input value={s.icon} onChange={(e) => mutateService(i, { icon: e.target.value })} placeholder="Icon e.g. 'book'" />
                      <Input value={s.link ?? ''} onChange={(e) => mutateService(i, { link: e.target.value })} placeholder="Optional link" />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => moveService(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                        <Button variant="outline" onClick={() => moveService(i, +1)}><ArrowDown className="h-4 w-4" /></Button>
                        <Button variant="destructive" onClick={() => removeService(i)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <Textarea value={s.description} onChange={(e) => mutateService(i, { description: e.target.value })} placeholder="Description" rows={3} />
                  </div>
                ))}
                <Button variant="outline" onClick={addService}>
                  <Plus className="h-4 w-4 mr-2" /> Add Service
                </Button>
              </CardContent>
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
                  {(localContent.carouselImages ?? []).map((image, index) => (
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
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Contact Information</CardTitle>
                <Button onClick={saveContact} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    value={localContent.contactInfo?.address ?? ''}
                    onChange={(e) =>
                      setLocalContent(prev => ({
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
                      setLocalContent(prev => ({
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
                      setLocalContent(prev => ({
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
                      setLocalContent(prev => ({
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
