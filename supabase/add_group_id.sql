-- Add group_id to expenses to link fixed and installment expenses
ALTER TABLE expenses ADD COLUMN group_id uuid;
