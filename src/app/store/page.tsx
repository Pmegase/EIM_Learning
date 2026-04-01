"use client";

import React, { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { StoreItem } from "@/types/store";
import { STORE_CATEGORIES } from "@/types/store";
import Image from "next/image";
import {
  Search, Loader2, ShoppingBag, ExternalLink, MapPin, Gift,
  Clock, ChevronDown, ChevronUp, X,
} from "lucide-react";

export default function StorePage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await apiGet<{ items: StoreItem[] }>("/api/public/store");
        setItems(data.items);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchItems();
  }, []);

  const filtered = items.filter((item) => {
    if (category && item.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">
            Browse our collection of merchandise, resources, and more.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!category ? "bg-green-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
            >
              All
            </button>
            {STORE_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${category === c ? "bg-green-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">No items found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || category ? "Try adjusting your filters." : "Check back soon for new items!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  {item.images[0] ? (
                    <div className="relative h-48 bg-gray-100">
                      <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                      {item.is_featured && (
                        <Badge className="absolute top-2 left-2 bg-green-600 text-white text-[10px]">Featured</Badge>
                      )}
                      {item.is_free && (
                        <Badge className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px]">
                          <Gift className="h-3 w-3 mr-0.5" />Free
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-gray-300" />
                    </div>
                  )}

                  <CardContent className="p-4 space-y-3">
                    {/* Title + Price */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                      {item.is_free ? (
                        <Badge variant="success" className="flex-shrink-0 text-xs">Free</Badge>
                      ) : item.price ? (
                        <span className="text-lg font-bold text-green-600 flex-shrink-0">
                          {item.currency} {Number(item.price).toFixed(2)}
                        </span>
                      ) : null}
                    </div>

                    {/* Category */}
                    <Badge variant="secondary" className="text-[10px] capitalize">{item.category}</Badge>

                    {/* Description */}
                    <p className={`text-sm text-gray-600 ${isExpanded ? "" : "line-clamp-2"}`}>
                      {item.description}
                    </p>

                    {item.description.length > 100 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-xs text-green-600 hover:text-green-800 flex items-center gap-0.5"
                      >
                        {isExpanded ? <><ChevronUp className="h-3 w-3" />Less</> : <><ChevronDown className="h-3 w-3" />Read more</>}
                      </button>
                    )}

                    {/* Multiple images */}
                    {isExpanded && item.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {item.images.map((url, i) => (
                          <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 border">
                            <Image src={url} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Free item info */}
                    {item.is_free && (item.pickup_location || item.pickup_instructions) && (
                      <div className="p-2 bg-green-50 rounded-lg text-xs space-y-1">
                        {item.pickup_location && (
                          <p className="flex items-center gap-1 text-green-800">
                            <MapPin className="h-3 w-3 flex-shrink-0" />{item.pickup_location}
                          </p>
                        )}
                        {item.pickup_instructions && (
                          <p className="flex items-center gap-1 text-green-700">
                            <Clock className="h-3 w-3 flex-shrink-0" />{item.pickup_instructions}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action */}
                    {item.purchase_url && (
                      <a href={item.purchase_url} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Buy Now
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
