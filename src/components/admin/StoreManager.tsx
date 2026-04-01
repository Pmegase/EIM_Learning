"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { uploadFile } from "@/lib/storage";
import type { StoreItem } from "@/types/store";
import { STORE_CATEGORIES } from "@/types/store";
import Image from "next/image";
import {
  Plus, Save, Trash2, Pencil, Upload, Loader2, X,
  ShoppingBag, ExternalLink, MapPin, Gift,
} from "lucide-react";

export default function StoreManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const emptyForm = {
    title: "", description: "", images: [] as string[], price: "",
    currency: "GHS", purchase_url: "", is_free: false,
    pickup_location: "", pickup_instructions: "", category: "general",
    status: "draft" as string, is_featured: false,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiGet<{ items: StoreItem[] }>("/api/admin/store");
      setItems(data.items);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openNew = () => { setForm(emptyForm); setEditingItem(null); setShowForm(true); };
  const openEdit = (item: StoreItem) => {
    setForm({
      title: item.title, description: item.description, images: item.images,
      price: item.price?.toString() || "", currency: item.currency,
      purchase_url: item.purchase_url || "", is_free: item.is_free,
      pickup_location: item.pickup_location || "",
      pickup_instructions: item.pickup_instructions || "",
      category: item.category, status: item.status, is_featured: item.is_featured,
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const { url, error } = await uploadFile(file, "store");
    if (url) {
      setForm((f) => ({ ...f, images: [...f.images, url] }));
    } else {
      toast({ title: "Upload failed", description: error || "Unknown error", variant: "destructive" });
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.is_free ? null : (form.price ? parseFloat(form.price) : null),
        purchase_url: form.purchase_url || null,
        pickup_location: form.pickup_location || null,
        pickup_instructions: form.pickup_instructions || null,
      };

      if (editingItem) {
        const { item } = await apiPut<{ item: StoreItem }>(`/api/admin/store/${editingItem.id}`, payload);
        setItems((prev) => prev.map((i) => i.id === item.id ? item : i));
        toast({ title: "Item updated" });
      } else {
        const { item } = await apiPost<{ item: StoreItem }>("/api/admin/store", payload);
        setItems((prev) => [item, ...prev]);
        toast({ title: "Item created" });
      }
      setShowForm(false);
    } catch (err: unknown) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await apiDelete(`/api/admin/store/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Item deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Store Items ({items.length})</h3>
        {!showForm && (
          <Button onClick={openNew} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-1" />Add Item
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editingItem ? "Edit Item" : "New Item"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
              <div className="space-y-1">
                <Label>Category</Label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                  {STORE_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1"><Label>Description *</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} /></div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border group">
                    <Image src={url} alt="" fill className="object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                >
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_free} onChange={(e) => set("is_free", e.target.checked)} />
                <Gift className="h-4 w-4 text-green-600" /> This item is free
              </label>

              {!form.is_free && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" /></div>
                  <div className="space-y-1"><Label>Currency</Label><Input value={form.currency} onChange={(e) => set("currency", e.target.value)} /></div>
                </div>
              )}

              {form.is_free && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-green-50 rounded-lg">
                  <div className="space-y-1"><Label>Pickup Location</Label><Input value={form.pickup_location} onChange={(e) => set("pickup_location", e.target.value)} placeholder="e.g. EIM Office, Accra" /></div>
                  <div className="space-y-1"><Label>Pickup Instructions</Label><Input value={form.pickup_instructions} onChange={(e) => set("pickup_instructions", e.target.value)} placeholder="e.g. Mon-Fri 9am-5pm" /></div>
                </div>
              )}
            </div>

            {/* Purchase Link */}
            {!form.is_free && (
              <div className="space-y-1">
                <Label>Purchase Link (Amazon, AliExpress, etc.)</Label>
                <Input value={form.purchase_url} onChange={(e) => set("purchase_url", e.target.value)} placeholder="https://..." />
              </div>
            )}

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
                  Featured item
                </label>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingItem ? "Update Item" : "Create Item"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Items list */}
      {items.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No store items yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-3 flex items-center gap-3">
                {item.images[0] ? (
                  <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <Image src={item.images[0]} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-14 w-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <Badge variant={item.status === "published" ? "success" : "secondary"} className="text-[10px]">{item.status}</Badge>
                    {item.is_featured && <Badge variant="warning" className="text-[10px]">Featured</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {item.is_free ? (
                      <span className="flex items-center gap-0.5 text-green-600"><Gift className="h-3 w-3" />Free</span>
                    ) : item.price ? (
                      <span>{item.currency} {Number(item.price).toFixed(2)}</span>
                    ) : (
                      <span>No price set</span>
                    )}
                    <span className="capitalize">{item.category}</span>
                    {item.purchase_url && <span className="flex items-center gap-0.5"><ExternalLink className="h-3 w-3" />Has link</span>}
                    {item.pickup_location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{item.pickup_location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
