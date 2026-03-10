import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://ypgakuynmwcrbeppzrgw.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImQ5NDIwYzk4LWI4MzQtNDdkZi1hODk1LTJiNjIzMGY3NGI5ZiJ9.eyJwcm9qZWN0SWQiOiJ5cGdha3V5bm13Y3JiZXBwenJndyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzYzMDI0OTI1LCJleHAiOjIwNzgzODQ5MjUsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.9kl1WkhCum6kF992vlGjojvdj3DHywfGxuruliZbqY0';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };