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

// Detect and decode base64 content
function decodeBase64IfNeeded(str: string): string {
  if (!str) return str;
  
  // Check if string looks like base64 (only valid base64 chars, length multiple of 4)
  const base64Regex = /^[A-Za-z0-9+/\s]+=*$/;
  const cleanStr = str.trim();
  
  // Only try to decode if it looks like pure base64 (no spaces except line breaks)
  if (base64Regex.test(cleanStr) && cleanStr.length > 20) {
    try {
      const decoded = Buffer.from(cleanStr.replace(/\s/g, ''), 'base64').toString('utf-8');
      // Verify it decoded to valid text (has some printable chars)
      if (/[\x20-\x7E\u0080-\uFFFF]/.test(decoded) && !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(decoded)) {
        return decoded;
      }
    } catch {
      // Not valid base64, return original
    }
  }
  return str;
}

// Decode quoted-printable encoding (=XX hex and =\r\n line continuations)
function decodeQuotedPrintable(str: string): string {
  if (!str) return str;
  
  // First try to decode base64 if the content looks base64-encoded
  str = decodeBase64IfNeeded(str);
  
  // Remove soft line breaks
  str = str.replace(/=\r?\n/g, '');
  
  // Find all =XX sequences and convert to bytes, then decode as UTF-8
  const decoded = str.replace(/(?:=[0-9A-Fa-f]{2})+/g, (match) => {
    // Convert sequence of =XX to byte array
    const bytes = [];
    for (let i = 0; i < match.length; i += 3) {
      const hex = match.substring(i + 1, i + 3);
      bytes.push(parseInt(hex, 16));
    }
    // Decode as UTF-8
    try {
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    } catch {
      // If UTF-8 decode fails, fall back to latin1
      return bytes.map(b => String.fromCharCode(b)).join('');
    }
  });
  
  return decoded;
}

// Clean MIME boundary artifacts from body text
function cleanMimeBoundaries(str: string): string {
  if (!str) return str;
  return str
    // Remove MIME boundary lines (--boundary, --boundary--)
    .replace(/^--[a-zA-Z0-9_=\-\.]+--?\s*$/gm, '')
    // Remove Content-Type headers that may leak through
    .replace(/^Content-Type:.*$/gim, '')
    .replace(/^Content-Transfer-Encoding:.*$/gim, '')
    .replace(/^Content-Disposition:.*$/gim, '')
    // Remove MIME part headers
    .replace(/^MIME-Version:.*$/gim, '')
    // Clean up multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Strip invisible/zero-width characters that can hide between OTP digits
function stripInvisibleChars(str: string): string {
  if (!str) return str;
  return str
    // Zero-width chars: ZWSP, ZWNJ, ZWJ, Word Joiner, etc.
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    // Other invisible formatting chars
    .replace(/[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E]/g, '')
    // Variation selectors
    .replace(/[\uFE00-\uFE0F]/g, '');
}

// Convert HTML to plain text for OTP extraction
function htmlToText(html: string): string {
  if (!html) return '';
  return html
    // Remove script/style contents
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Replace block elements with newlines
    .replace(/<\/(p|div|br|tr|li|h[1-6])>/gi, '\n')
    // Remove inline tags without adding space (span, b, i, strong, em, a, etc.)
    .replace(/<\/?(span|b|i|strong|em|a|u|s|sub|sup|font|mark)[^>]*>/gi, '')
    // Remove remaining tags with space (for other block-like elements)
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Multilingual OTP keywords
// Supports: English, German, Russian, Chinese, Japanese, Arabic, Korean, Spanish, French, Portuguese
const OTP_KEYWORDS = [
  // English
  'code', 'verification', 'otp', 'one-time', 'passcode', 'pin', 'security',
  // German
  'bestätigungscode', 'einmalpasswort', 'sicherheitscode',
  // Russian
  'код', 'пароль', 'проверочный',
  // Chinese (Simplified & Traditional)
  '验证码', '驗證碼', '代码', '密码', '安全码',
  // Japanese
  'コード', '確認コード', '認証コード', 'パスワード',
  // Arabic
  'رمز', 'رمز التحقق', 'كلمة السر',
  // Korean
  '코드', '인증번호', '인증 코드', '비밀번호',
  // Spanish
  'código', 'contraseña', 'verificación',
  // French
  'code de vérification', 'mot de passe',
  // Portuguese
  'código de verificação', 'senha',
  // Italian
  'codice', 'codice di verifica',
  // Dutch
  'verificatiecode', 'wachtwoord',
  // Turkish
  'doğrulama kodu', 'şifre',
  // Polish
  'kod weryfikacyjny', 'hasło',
  // Hindi
  'सत्यापन कोड', 'पासवर्ड',
  // Thai
  'รหัส', 'รหัสยืนยัน'
].join('|');

// Extract verification codes, OTPs, and links from email
function extractVerification(text: string, html: string) {
  const result: { otp?: string; links: string[] } = { links: [] };
  
  // First, decode QP soft line breaks to reconstruct full URLs
  // QP uses =\r\n or =\n to wrap long lines
  let preprocessed = (text || '').replace(/=\r?\n/g, '');
  let preprocessedHtml = (html || '').replace(/=\r?\n/g, '');
  
  // Also decode =3D (equals sign) which is common in URLs with query params
  preprocessed = preprocessed.replace(/=3D/gi, '=');
  preprocessedHtml = preprocessedHtml.replace(/=3D/gi, '=');
  
  const rawCombined = preprocessed + ' ' + preprocessedHtml;
  
  // Extract verification/confirmation links
  const linkPatterns = [
    /https?:\/\/[^\s<>"'\]]+(?:verify|confirm|activate|reset|token|auth|callback|action-token)[^\s<>"'\]]*/gi,
    /https?:\/\/[^\s<>"'\]]+\?[^\s<>"'\]]*(?:code|token|key)=[^\s<>"'\]]*/gi,
  ];
  
  for (const pattern of linkPatterns) {
    pattern.lastIndex = 0;
    const matches = rawCombined.match(pattern);
    if (matches) {
      // Clean up links
      const cleanedMatches = matches.map(m => {
        let link = m
          .replace(/[.,;:!?)]+$/, '')  // Remove trailing punctuation
          .replace(/&amp;/g, '&')       // Decode HTML entities
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .replace(/=3D/gi, '=');       // Decode any remaining QP equals signs
        
        return link;
      });
      result.links.push(...cleanedMatches.slice(0, 5));
    }
  }
  
  // Dedupe links
  result.links = [...new Set(result.links)];
  
  // Prepare text for OTP extraction:
  // 1. Decode quoted-printable
  // 2. Convert HTML to plain text (handles <span>12</span><span>34</span>)
  // 3. Strip invisible characters (zero-width spaces between digits)
  let decodedText = stripInvisibleChars(decodeQuotedPrintable(text || ''));
  // If text contains HTML tags, also parse it as HTML (some emails put HTML in text field)
  if (/<[^>]+>/.test(decodedText)) {
    decodedText = stripInvisibleChars(htmlToText(decodedText));
  }
  const decodedHtml = stripInvisibleChars(htmlToText(decodeQuotedPrintable(html || '')));
  const combined = decodedText + ' ' + decodedHtml;
  
  // Debug: log what we're searching in (first 200 chars)
  console.log('[OTP] Searching in:', combined.substring(0, 200));
  
  // OTP extraction - prioritized patterns supporting 4-8 digits
  // Priority 1: Multilingual labeled codes (most reliable)
  // Uses Unicode flag (u) and case-insensitive (i) for proper international support
  const i18nPattern = new RegExp(`(?:${OTP_KEYWORDS})[^\\d]*?(\\d{4,8})`, 'iu');
  
  // Try i18n pattern first
  const i18nMatch = combined.match(i18nPattern);
  if (i18nMatch) {
    console.log('[OTP] i18n match:', i18nMatch[1]);
    result.otp = i18nMatch[1];
  }
  
  // Priority 2: Language-agnostic colon fallback (very reliable across all languages)
  // This catches patterns like "：123456" or ": 654321" in any language
  if (!result.otp) {
    const colonMatch = combined.match(/[:：]\s*(\d{4,8})(?:\s|$|[^\d])/);
    if (colonMatch) {
      console.log('[OTP] Colon match:', colonMatch[1]);
      result.otp = colonMatch[1];
    }
  }
  
  // Priority 3: Other patterns
  const otherPatterns = [
    /\b[Gg]-?(\d{6})\b/,  // Google-style "G-123456"
    /\b(\d{4,8})\s+(?:is\s+)?(?:your|the)\s+(?:code|verification|otp)/i,
  ];
  
  if (!result.otp) {
    for (const pattern of otherPatterns) {
      const match = combined.match(pattern);
      if (match) {
        console.log('[OTP] Other match:', match[1]);
        result.otp = match[1];
        break;
      }
    }
  }
  
  // Also try to extract OTP from URL query params (code=XXXXXX)
  if (!result.otp) {
    for (const link of result.links) {
      const codeMatch = link.match(/[?&]code=(\d{4,8})(?:&|$)/);
      if (codeMatch) {
        result.otp = codeMatch[1];
        break;
      }
    }
  }
  
  // If no labeled match, try standalone 6-digit first (prefer text over html)
  if (!result.otp) {
    const sixDigitMatches = decodedText.match(/\b(\d{6})\b/g) || decodedHtml.match(/\b(\d{6})\b/g);
    if (sixDigitMatches && sixDigitMatches.length >= 1) {
      result.otp = sixDigitMatches[0];
    }
  }
  
  // Try 5-digit (some services use this)
  if (!result.otp) {
    const fiveDigitMatches = decodedText.match(/\b(\d{5})\b/g);
    if (fiveDigitMatches && fiveDigitMatches.length === 1) {
      result.otp = fiveDigitMatches[0];
    }
  }
  
  // If still no match, try 4-digit
  if (!result.otp) {
    const fourDigitMatches = decodedText.match(/\b(\d{4})\b/g);
    if (fourDigitMatches && fourDigitMatches.length === 1) {
      result.otp = fourDigitMatches[0];
    }
  }
  
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
    
    // Decode QP before storing to avoid =3D artifacts
    const decodedText = decodeQuotedPrintable(text || '');
    const decodedHtml = decodeQuotedPrintable(html || '');
    
    // Store message (clean MIME artifacts)
    const { error } = await supabase
      .from('nukopt_messages')
      .insert({
        mailbox_id: mailbox.id,
        from_address: from,
        subject,
        text_body: cleanMimeBoundaries(decodedText).substring(0, 50000), // Limit size
        html_body: cleanMimeBoundaries(decodedHtml).substring(0, 100000),
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
