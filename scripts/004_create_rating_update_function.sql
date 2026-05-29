-- Function to update space ratings when reviews are added/updated/deleted
-- This maintains accurate rating averages and counts

CREATE OR REPLACE FUNCTION update_space_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the space rating when a review is inserted, updated, or deleted
  UPDATE public.spaces
  SET 
    rating_average = (
      SELECT COALESCE(AVG(rating::DECIMAL), 0)
      FROM public.reviews
      WHERE space_id = COALESCE(NEW.space_id, OLD.space_id)
        AND review_type = 'space_review'
        AND is_public = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE space_id = COALESCE(NEW.space_id, OLD.space_id)
        AND review_type = 'space_review'
        AND is_public = true
    )
  WHERE id = COALESCE(NEW.space_id, OLD.space_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for rating updates
CREATE TRIGGER update_space_rating_on_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_space_rating();

CREATE TRIGGER update_space_rating_on_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_space_rating();

CREATE TRIGGER update_space_rating_on_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_space_rating();
