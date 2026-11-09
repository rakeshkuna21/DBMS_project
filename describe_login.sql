SET PAGESIZE 100;
SELECT column_name, data_type, data_length, nullable FROM all_tab_columns WHERE owner = 'EAC_24037_RAKESH' AND table_name = 'LOGIN' ORDER BY column_id;
EXIT;
