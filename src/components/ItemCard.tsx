
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, Trash2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { deleteItem } from "@/services/itemService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ItemOwner {
  id: string;
  name: string;
  avatar: string;
  rating: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  category: string;
  location: string;
  images: string[];
  owner: ItemOwner;
  status?: string;
}

interface ItemCardProps {
  item: Item;
  featured?: boolean;
  onDelete?: (itemId: string) => void;
  showDeleteButton?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  featured = false, 
  onDelete,
  showDeleteButton = false 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if the item has valid images
  const hasValidImages = Array.isArray(item.images) && item.images.length > 0;
  
  // Default placeholder image if no images are available
  const imageUrl = hasValidImages ? item.images[0] : null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to item detail
    e.stopPropagation(); // Stop event propagation
    
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await deleteItem(item.id);
      
      if (success) {
        toast.success("Item deleted successfully");
        // Call the onDelete callback if provided
        if (onDelete) {
          onDelete(item.id);
        }
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("An error occurred while deleting the item");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  // Check if current user is the owner of the item
  const isOwner = user && item.owner && user.id === item.owner.id;

  const handleImageError = () => {
    console.error('Image failed to load:', imageUrl);
    setImageError(true);
    setIsLoaded(true);
  };

  return (
    <>
      <div
        className={cn(
          "group relative rounded-2xl overflow-hidden animated-card bg-white transition-all duration-300 hover:shadow-md",
          featured ? "shadow-lg" : "shadow-subtle"
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 bg-muted/20 backdrop-blur-sm flex items-center justify-center transition-opacity",
              isLoaded && !imageError ? "opacity-0" : "opacity-100"
            )}
          >
            {!isLoaded && (
              <div className="w-10 h-10 rounded-full border-2 border-rentmate-orange border-t-transparent animate-spin"></div>
            )}
            {imageError && (
              <ImageOff className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          
          {imageError || !imageUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageOff className="w-10 h-10 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={item.name}
              className={cn(
                "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
                isLoaded && !imageError ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setIsLoaded(true)}
              onError={handleImageError}
            />
          )}
          
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
              aria-label={isLiked ? "Unlike item" : "Like item"}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isLiked ? "fill-rentmate-orange text-rentmate-orange" : "text-muted-foreground"
                )}
              />
            </button>
            
            {showDeleteButton && isOwner && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white hover:text-red-500 transition-colors"
                aria-label="Delete item"
                data-testid="delete-item-button"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
          {item.status === "rented" && (
            <div className="absolute top-0 left-0 right-0 bg-rentmate-charcoal/80 text-white text-xs font-medium py-1 px-3 text-center">
              Currently Rented
            </div>
          )}
          {featured && (
            <div className="absolute top-3 left-3 bg-rentmate-gold text-rentmate-charcoal text-xs font-medium py-1 px-3 rounded-full">
              Featured
            </div>
          )}
        </div>

        <Link to={`/item/${item.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="card-title text-base font-semibold line-clamp-1">{item.name}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-primary">₹{item.price.toFixed(0)}</span>
              <span className="text-sm text-muted-foreground">/{item.priceUnit}</span>
            </div>
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 text-rentmate-gold fill-rentmate-gold mr-1" />
              <span>{item.owner.rating}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-muted flex items-center justify-between">
            <div className="flex items-center">
              {item.owner?.avatar ? (
                <img
                  src={item.owner.avatar}
                  alt={item.owner.name || "User"}
                  className="w-6 h-6 rounded-full mr-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/150';
                  }}
                />
              ) : (
                <div className="w-6 h-6 bg-muted rounded-full mr-2" />
              )}
              <span className="text-xs text-muted-foreground">
                {item.owner?.name || "Unknown User"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{item.location}</span>
          </div>
        </Link>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your item 
              "{item.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ItemCard;
