
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async () => {
  try {
    // Check if status column already exists
    const { data: columns, error: checkError } = await supabase
      .from('payment_logs')
      .select('status')
      .limit(1);

    if (checkError && checkError.message.includes('column "status" does not exist')) {
      // Column doesn't exist, add it
      const { error } = await supabase.rpc('add_status_column_to_payment_logs');
      
      if (error) {
        throw error;
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Status column added to payment_logs table' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Status column already exists' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
