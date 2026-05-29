-- Enable Row Level Security (RLS) for all tables
-- This ensures data security and proper access control

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles are viewable by all authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Spaces policies
CREATE POLICY "Anyone can view active spaces" ON public.spaces FOR SELECT USING (is_active = true);
CREATE POLICY "Hosts can manage their own spaces" ON public.spaces FOR ALL USING (auth.uid() = host_id);
CREATE POLICY "Authenticated users can view all spaces" ON public.spaces FOR SELECT USING (auth.role() = 'authenticated');

-- Bookings policies
CREATE POLICY "Users can view their own bookings as guest" ON public.bookings FOR SELECT USING (auth.uid() = guest_id);
CREATE POLICY "Users can view their own bookings as host" ON public.bookings FOR SELECT USING (auth.uid() = host_id);
CREATE POLICY "Users can create bookings as guest" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);
CREATE POLICY "Hosts can update their space bookings" ON public.bookings FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Guests can update their own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = guest_id);

-- Reviews policies
CREATE POLICY "Anyone can view public reviews" ON public.reviews FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create reviews for their bookings" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can view reviews they wrote" ON public.reviews FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can view reviews about them" ON public.reviews FOR SELECT USING (auth.uid() = reviewee_id);

-- Favorites policies
CREATE POLICY "Users can manage their own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Blog posts policies
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can manage their own blog posts" ON public.blog_posts FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage all blog posts" ON public.blog_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_superuser = true))
);

-- Blog comments policies
CREATE POLICY "Anyone can view approved comments" ON public.blog_comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can create comments" ON public.blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all comments" ON public.blog_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_superuser = true))
);

-- Messages policies
CREATE POLICY "Users can view messages sent to them" ON public.messages FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can view messages they sent" ON public.messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can update message read status" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Admin settings policies (only admins and superusers)
CREATE POLICY "Admins can view admin settings" ON public.admin_settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_superuser = true))
);
CREATE POLICY "Admins can manage admin settings" ON public.admin_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_superuser = true))
);

-- Space categories are public (no RLS needed, but enable for consistency)
ALTER TABLE public.space_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view space categories" ON public.space_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage space categories" ON public.space_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_superuser = true))
);
