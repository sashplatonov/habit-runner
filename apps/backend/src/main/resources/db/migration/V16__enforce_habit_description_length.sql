ALTER TABLE habits
  ADD CONSTRAINT habits_description_length CHECK (
    description IS NULL OR char_length(description) <= 8000
  );
