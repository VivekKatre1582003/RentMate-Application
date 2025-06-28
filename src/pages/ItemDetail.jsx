import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays, addDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { createRental } from "@/services/itemService";
import { CalendarIcon, ChevronLeft, Star, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [date, setDate] = useState({
    from: new Date(),
    to: addDays(new Date(), 2),
  });
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate rental days and total price
  const rentalDays = date.to
    ? differenceInDays(date.to, date.from) + 1
    : 1;
  const totalPrice = item?.price ? item.price * rentalDays : 0;

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("items")
          .select(`
            *,
            item_images (id, image_url, is_primary),
            profiles:owner_id (id, full_name, avatar_url)
          `)
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching item:", error);
          toast.error("Failed to load item details");
          navigate("/404");
          return;
        }

        if (!data) {
          navigate("/404");
          return;
        }

        // Format the data for display
        setItem({
          ...data,
          images: data.item_images?.map((img) => img.image_url) || [],
          owner: {
            id: data.profiles?.id,
            name: data.profiles?.full_name || "Unknown",
            avatar: data.profiles?.avatar_url || "https://via.placeholder.com/150",
            rating: 4.8, // Default rating
          },
          priceUnit: data.daily_rate ? "day" : "rental",
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error("An unexpected error occurred");
        navigate("/404");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleRent = async () => {
    if (!user) {
      toast.error("Please sign in to rent this item");
      navigate("/auth");
      return;
    }

    if (user.id === item.owner.id) {
      toast.error("You cannot rent your own item");
      return;
    }

    setIsSubmitting(true);
    try {
      // Make sure we're passing id as a string, not a number
      await createRental(
        item.id.toString(),
        date.from,
        date.to,
        totalPrice
      );

      toast.success("Rental request submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating rental:", error);
      toast.error("Failed to submit rental request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextImage = () => {
    if (!item?.images?.length) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === item.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevImage = () => {
    if (!item?.images?.length) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? item.images.length - 1 : prevIndex - 1
    );
  };

  const handleBackToBrowse = () => {
    navigate("/browse");
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 animate-pulse">
          <div className="w-32 h-10 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-[4/3] bg-gray-200 rounded-xl"></div>
            <div className="space-y-6">
              <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-24 bg-gray-200 rounded mb-6"></div>
              <div className="h-14 bg-gray-200 rounded mb-4"></div>
              <div className="h-14 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Item not found
  if (!item) return null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-start py-8 pt-24 md:pt-28">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-0 md:p-8 flex flex-col gap-6 relative">
          <Button
            onClick={handleBackToBrowse}
            variant="ghost"
            className="absolute top-4 left-4 z-10 inline-flex items-center text-rentmate-orange hover:underline hover:bg-orange-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Browse
          </Button>
          <div className="flex flex-col md:flex-row gap-0 md:gap-10 mt-12">
            {/* Item Images */}
            <div className="md:w-1/2 w-full flex flex-col items-center justify-center p-4 md:p-0">
              <div className="relative aspect-[4/3] w-full rounded-xl bg-muted shadow-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <>
                    <img
                      src={item.images[currentImageIndex]}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 rounded-xl"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
                      }}
                    />
                    {item.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-rentmate-orange/80 transition-colors z-10"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center rotate-180 hover:bg-rentmate-orange/80 transition-colors z-10"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl">
                    <span className="text-muted-foreground">No image available</span>
                  </div>
                )}
              </div>
              {item.images && item.images.length > 1 && (
                <div className="flex mt-4 space-x-2 overflow-x-auto pb-2 w-full justify-center">
                  {item.images.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                        currentImageIndex === index
                          ? "border-rentmate-orange ring-2 ring-rentmate-orange"
                          : "border-gray-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${item.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100?text=Error';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="md:w-1/2 w-full flex flex-col gap-8 p-4 md:p-0">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-gray-900">{item.name}</h1>
                <div className="flex flex-wrap items-center mt-2 gap-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-rentmate-gold fill-rentmate-gold mr-1" />
                    <span className="text-base font-medium">{item.owner.rating}</span>
                  </div>
                  <div className="flex items-center text-base text-muted-foreground">
                    <MapPin className="h-5 w-5 mr-1" />
                    {item.location || "Location not specified"}
                  </div>
                </div>
              </div>

              <div className="text-2xl font-bold text-rentmate-orange">
                ₹{item.price} <span className="text-base font-normal text-gray-700">per {item.priceUnit}</span>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{item.description || "No description provided"}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Category</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {item.category || "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Condition</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {item.condition || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Owner Info Card */}
              <div className="border border-gray-200 rounded-xl p-4 flex items-center bg-gray-50 shadow-sm mt-2">
                <img
                  src={item.owner.avatar}
                  alt={item.owner.name}
                  className="w-12 h-12 rounded-full mr-4 object-cover border"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150';
                  }}
                />
                <div>
                  <p className="font-semibold text-lg text-gray-900">{item.owner.name}</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
              </div>

              <div className="my-4 border-t border-gray-200" />

              {/* Rental options in a card */}
              <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-gray-100 shadow-md">
                {showDateSelector ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">Select rental period</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDateSelector(false)}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date.from ? (
                                  format(date.from, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={date.from}
                                onSelect={(day) =>
                                  setDate((prev) => ({
                                    from: day,
                                    to: prev.to && day > prev.to ? addDays(day, 1) : prev.to,
                                  }))
                                }
                                initialFocus
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date.to ? (
                                  format(date.to, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={date.to}
                                onSelect={(day) =>
                                  setDate((prev) => ({
                                    from: prev.from,
                                    to: day,
                                  }))
                                }
                                initialFocus
                                disabled={(date) =>
                                  date < new Date() || (date?.from && date < date.from)
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="bg-muted/30 p-3 rounded space-y-2">
                        <div className="flex justify-between text-base">
                          <span>₹{item.price.toFixed(0)} × {rentalDays} {rentalDays === 1 ? 'day' : 'days'}</span>
                          <span>₹{totalPrice.toFixed(0)}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>₹{totalPrice.toFixed(0)}</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleRent}
                        className="w-full bg-rentmate-orange hover:bg-rentmate-orange/90 text-lg font-semibold"
                        disabled={isSubmitting || !date.from || !date.to}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          "Rent Now"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowDateSelector(true)}
                    className="w-full bg-rentmate-orange hover:bg-rentmate-orange/90 text-lg font-semibold"
                    disabled={user?.id === item.owner.id}
                  >
                    {user?.id === item.owner.id ? (
                      <span className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Your Item
                      </span>
                    ) : (
                      "Rent This Item"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ItemDetail;
