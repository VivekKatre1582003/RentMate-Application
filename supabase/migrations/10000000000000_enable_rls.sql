-- Enable Row Level Security for items table
ALTER TABLE IF EXISTS public.items ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to view any item
DROP POLICY IF EXISTS "Anyone can view items" ON public.items;
CREATE POLICY "Anyone can view items" 
ON public.items FOR SELECT 
USING (true);

-- Policy to allow owners to update their own items
DROP POLICY IF EXISTS "Owners can update their own items" ON public.items;
CREATE POLICY "Owners can update their own items" 
ON public.items FOR UPDATE 
USING (auth.uid() = owner_id);

-- Policy to allow owners to delete their own items
DROP POLICY IF EXISTS "Owners can delete their own items" ON public.items;
CREATE POLICY "Owners can delete their own items" 
ON public.items FOR DELETE 
USING (auth.uid() = owner_id);

-- Policy to allow authenticated users to insert items (they own)
DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
CREATE POLICY "Users can insert their own items" 
ON public.items FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Enable Row Level Security for item_images table
ALTER TABLE IF EXISTS public.item_images ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to view any item images
DROP POLICY IF EXISTS "Anyone can view item images" ON public.item_images;
CREATE POLICY "Anyone can view item images" 
ON public.item_images FOR SELECT 
USING (true);

-- Policy to allow owners to insert images for their own items
DROP POLICY IF EXISTS "Users can insert images for their own items" ON public.item_images;
CREATE POLICY "Users can insert images for their own items" 
ON public.item_images FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.items 
  WHERE items.id = item_images.item_id 
  AND items.owner_id = auth.uid()
));

-- Policy to allow owners to delete images for their own items
DROP POLICY IF EXISTS "Users can delete images for their own items" ON public.item_images;
CREATE POLICY "Users can delete images for their own items" 
ON public.item_images FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.items 
  WHERE items.id = item_images.item_id 
  AND items.owner_id = auth.uid()
));

-- Enable Row Level Security for rentals table
ALTER TABLE IF EXISTS public.rentals ENABLE ROW LEVEL SECURITY;

-- Policy to allow owners to view rentals of their items
DROP POLICY IF EXISTS "Item owners can view rentals of their items" ON public.rentals;
CREATE POLICY "Item owners can view rentals of their items" 
ON public.rentals FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.items 
  WHERE items.id = rentals.item_id 
  AND items.owner_id = auth.uid()
));

-- Policy to allow renters to view their own rentals
DROP POLICY IF EXISTS "Renters can view their own rentals" ON public.rentals;
CREATE POLICY "Renters can view their own rentals" 
ON public.rentals FOR SELECT 
USING (auth.uid() = renter_id);

-- Policy to allow authenticated users to insert rentals
DROP POLICY IF EXISTS "Users can create rentals" ON public.rentals;
CREATE POLICY "Users can create rentals" 
ON public.rentals FOR INSERT 
WITH CHECK (auth.uid() = renter_id);

-- Policy to allow owners to update rentals for their items
DROP POLICY IF EXISTS "Item owners can update rentals of their items" ON public.rentals;
CREATE POLICY "Item owners can update rentals of their items" 
ON public.rentals FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.items 
  WHERE items.id = rentals.item_id 
  AND items.owner_id = auth.uid()
));

-- Policy to allow renters to update their own rentals
DROP POLICY IF EXISTS "Renters can update their own rentals" ON public.rentals;
CREATE POLICY "Renters can update their own rentals" 
ON public.rentals FOR UPDATE 
USING (auth.uid() = renter_id);

-- Create interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  type text NOT NULL, -- e.g., 'view', 'rent', 'rate'
  rating integer,     -- only for 'rate' type
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security for interactions table
ALTER TABLE IF EXISTS public.interactions ENABLE ROW LEVEL SECURITY;

-- Policy: allow users to view their own interactions
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.interactions;
CREATE POLICY "Users can view their own interactions"
ON public.interactions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: allow users to insert their own interactions
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
CREATE POLICY "Users can insert their own interactions"
ON public.interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
