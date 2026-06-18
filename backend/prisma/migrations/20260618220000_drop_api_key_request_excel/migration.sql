-- Drive links are now collected directly from the form instead of being
-- extracted from an uploaded Excel file, so the spreadsheet storage columns
-- are no longer needed.
-- (This migration is a no-op on this schema — the excel columns were never
-- added since the schema was authored after the drop decision.)
SELECT 1;
