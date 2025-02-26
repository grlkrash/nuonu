-- Add exec_sql function for running SQL commands from the migration script
-- This function allows executing arbitrary SQL with admin privileges
-- IMPORTANT: This should only be used for migrations and by admin users

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Restrict access to the function to only authenticated users
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Add comment explaining the security implications
COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes arbitrary SQL. This function has security implications and should only be used by administrators.'; 