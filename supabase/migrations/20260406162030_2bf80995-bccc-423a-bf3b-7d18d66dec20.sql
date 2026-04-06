
-- Allow users to delete their own support conversations
CREATE POLICY "Users can delete own conversations"
ON public.support_conversations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to delete messages in their own conversations
CREATE POLICY "Users can delete own conversation messages"
ON public.support_messages
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM support_conversations sc
  WHERE sc.id = support_messages.conversation_id
  AND sc.user_id = auth.uid()
));
