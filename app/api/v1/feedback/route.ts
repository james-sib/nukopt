import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyNukoptKey } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 50;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// POST - Submit feedback
export async function POST(req: NextRequest) {
  try {
    // Verify API key
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }
    
    const account = await verifyNukoptKey(apiKey);
    if (!account) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    // Parse body
    let body: { message?: string; category?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    const { message, category } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ 
        error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`,
        maxLength: MAX_MESSAGE_LENGTH
      }, { status: 400 });
    }
    
    if (message.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Message too short. Minimum 10 characters.',
        minLength: 10
      }, { status: 400 });
    }
    
    // Validate category if provided
    const validCategories = ['bug', 'feature', 'question', 'other'];
    
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        validCategories
      }, { status: 400 });
    }
    
    const feedbackCategory = category || 'other';
    
    const supabase = getSupabase();
    
    // Insert feedback
    const { data, error } = await supabase
      .from('nukopt_feedback')
      .insert({
        account_id: account.id,
        message: message.trim(),
        category: feedbackCategory,
        status: 'open',
      })
      .select('id, created_at')
      .single();
    
    if (error) {
      console.error('Feedback insert error:', error);
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      ticket_id: data.id,
      created_at: data.created_at,
      message: 'Thank you for your feedback!'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List own feedback (for the agent)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }
    
    const account = await verifyNukoptKey(apiKey);
    if (!account) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('nukopt_feedback')
      .select('id, message, category, status, created_at, admin_response')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Feedback fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }
    
    return NextResponse.json({ tickets: data || [] });
    
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
