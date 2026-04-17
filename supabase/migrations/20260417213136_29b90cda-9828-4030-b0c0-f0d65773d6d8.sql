CREATE POLICY "Users can delete own issues"
ON public.saved_issues
FOR DELETE
TO authenticated
USING (user_id = auth.uid());