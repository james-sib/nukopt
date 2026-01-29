import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { simpleParser } from 'mailparser';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Decode quoted-printable encoding (=XX hex and =\r\n line continuations)
function decodeQuotedPrintable(str: string): string {
  if (!str) return str;
  return str
    .replace(/=\r?\n/g, '')  // Remove soft line breaks
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/=3D/gi, '=');  // Common encoding for =
}

// Extract verification codes, OTPs, and links from email
function extractVerification(text: string, html: string) {
  const result: { otp?: string; links: string[] } = { links: [] };
  
  // OTP extraction - prioritized patterns (first match wins)
  // Priority 1: Labeled codes (most reliable)
  const labeledPatterns = [
    /(?:code|verification|otp|pin)[:\s]+(\d{6})\b/gi,      // "code: 123456"
    /(?:code|verification|otp|pin)[:\s]+(\d{4})\b/gi,      // "code: 1234"
    /(?:code|verification|otp|pin)[:\s]+([A-Z0-9]{4,8})\b/gi, // "code: ABC123"
  ];
  
  // Priority 2: Standalone numeric codes
  const numericPatterns = [
    /\b(\d{6})\b/g,   // 6-digit (most common OTP length)
    /\b(\d{4})\b/g,   // 4-digit PIN
  ];
  
  // Try labeled patterns first
  for (const pattern of labeledPatterns) {
    const match = pattern.exec(text);
    if (match) {
      result.otp = match[1];
      break;
    }
  }
  
  // If no labeled match, try standalone 6-digit first
  if (!result.otp) {
    const sixDigitMatches = text.match(/\b(\d{6})\b/g);
    if (sixDigitMatches && sixDigitMatches.length >= 1) {
      // Take first 6-digit match
      result.otp = sixDigitMatches[0];
    }
  }
  
  // If still no match, try 4-digit
  if (!result.otp) {
    const fourDigitMatches = text.match(/\b(\d{4})\b/g);
    if (fourDigitMatches && fourDigitMatches.length === 1) {
      // Only if single 4-digit match (avoid false positives like years)
      result.otp = fourDigitMatches[0];
    }
  }
  
  // Extract verification/confirmation links
  const linkPatterns = [
    /https?:\/\/[^\s<>"]+(?:verify|confirm|activate|token|auth|callback)[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]+\?[^\s<>"]*(?:code|token|key)=[^\s<>"]*/gi,
  ];
  
  // Decode quoted-printable before extracting links
  const content = decodeQuotedPrintable(html || text);
  for (const pattern of linkPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      result.links.push(...matches.slice(0, 5)); // Max 5 links
    }
  }
  
  // Dedupe links
  result.links = [...new Set(result.links)];
  
  return result;
}

// Cloudflare Email Workers format
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    
    const supabase = getSupabase();
    const contentType = req.headers.get('content-type') || '';
    let to: string, from: string, subject: string, text: string, html: string, rawEmail: string;
    
    if (contentType.includes('application/json')) {
      // JSON payload (custom forwarding)
      const body = await req.json();
      to = body.to;
      from = body.from;
      subject = body.subject;
      text = body.text || '';
      html = body.html || '';
      rawEmail = body.raw || '';
    } else {
      // Raw email (RFC 5322)
      rawEmail = await req.text();
      const parsed = await simpleParser(rawEmail);
      
      to = Array.isArray(parsed.to) 
        ? parsed.to[0]?.text || '' 
        : parsed.to?.text || '';
      from = Array.isArray(parsed.from)
        ? parsed.from[0]?.text || ''
        : parsed.from?.text || '';
      subject = parsed.subject || '';
      text = parsed.text || '';
      html = parsed.html || '';
    }
    
    // Extract local part from to address
    const localPart = to.split('@')[0]?.toLowerCase();
    if (!localPart) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
    }
    
    // Find mailbox
    const { data: mailbox } = await supabase
      .from('nukopt_mailboxes')
      .select('id, account_id')
      .eq('local_part', localPart)
      .single();
    
    if (!mailbox) {
      // Unknown mailbox - just acknowledge
      return NextResponse.json({ ok: true, status: 'dropped' });
    }
    
    // Check daily limit (100 per account)
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('nukopt_messages')
      .select('*', { count: 'exact', head: true })
      .eq('mailbox_id', mailbox.id)
      .gte('created_at', today);
    
    if ((count || 0) >= 100) {
      return NextResponse.json({ ok: true, status: 'rate_limited' });
    }
    
    // Extract verification info
    const verification = extractVerification(text, html);
    
    // Store message
    const { error } = await supabase
      .from('nukopt_messages')
      .insert({
        mailbox_id: mailbox.id,
        from_address: from,
        subject,
        text_body: text.substring(0, 50000), // Limit size
        html_body: html.substring(0, 100000),
        otp: verification.otp,
        verification_links: verification.links,
        raw_size: rawEmail.length
      });
    
    if (error) {
      console.error('Failed to store message:', error);
      return NextResponse.json({ error: 'Storage failed' }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, status: 'delivered' });
    
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'nukopt-email-webhook' });
}
