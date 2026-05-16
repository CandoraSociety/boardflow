import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // SECURITY: Verify request is from Beacon using the token
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const INTEGRATION_TOKEN = Deno.env.get('INTEGRATION_TOKEN');
  
  if (token !== INTEGRATION_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const { integration_id, integration_name, code } = body;
  
  // Log that we received an integration from Beacon
  console.log(`✓ Received integration from Beacon: ${integration_name}`);
  console.log('Code to apply:', code);
  
  // YOUR TASK: Do something with the code here
  // Options: save it, apply it, store in database, etc.
  
  return Response.json({ success: true });
});