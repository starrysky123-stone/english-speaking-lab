import {config} from '@/lib/lab-server';
export const dynamic='force-dynamic';
export async function GET(){const c=config();return Response.json({ai:!!c.key,assessment:!!(c.speechKey&&c.endpoint)},{headers:{'Cache-Control':'no-store'}});}
