import { initDatabase } from './database.js';
import { handleEmailReceive } from './apiHandlers.js';
import { extractEmail } from './commonUtils.js';
import { forwardByLocalPart } from './emailForwarder.js';
import { parseEmailBody, extractVerificationCode, decodeMimeHeader } from './emailParser.js';
import { createRouter, authMiddleware, resolveAuthPayload } from './routes.js';
import { createAssetManager } from './assetManager.js';
import { getDatabaseWithValidation } from './dbConnectionHelper.js';

function normalizeOtpKvKey(value = '') {
  return String(value || '').trim().toLowerCase();
}

function collectEmailAddresses(...values) {
  const addresses = [];
  const seen = new Set();
  for (const value of values) {
    const parts = Array.isArray(value) ? value : [value];
    for (const part of parts) {
      const source = typeof part === 'string' ? part : (part?.address || '');
      const matches = String(source || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
      for (const match of matches) {
        const normalized = normalizeOtpKvKey(match);
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          addresses.push(normalized);
        }
      }
    }
  }
  return addresses;
}

function extractFallbackSixDigitOtp({ subject = '', text = '', html = '' } = {}) {
  const haystack = `${subject}\n${text}\n${String(html || '').replace(/<[^>]+>/g, ' ')}`;
  const contextualPatterns = [
    /(?:chatgpt|openai|verification|verify|code|otp|验证码|代码)[^0-9]{0,80}(\d{6})(?!\d)/i,
    /(?<!\d)(\d{6})(?!\d)[^\n\r]{0,80}(?:chatgpt|openai|verification|verify|code|otp|验证码|代码)/i,
  ];
  for (const pattern of contextualPatterns) {
    const match = haystack.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return '';
}

async function writeOtpToKv(env, { mailboxes = [], mailbox = '', otp = '', from = '', subject = '' } = {}) {
  const kv = env?.OTP_KV;
  const keys = collectEmailAddresses(mailboxes, mailbox);
  const code = String(otp || '').trim();
  if (!kv || !keys.length || !code) {
    return false;
  }

  const value = JSON.stringify({
    otp: code,
    ts: Date.now(),
    from: String(from || ''),
    subject: String(subject || ''),
  });
  await Promise.all(keys.map((key) => kv.put(key, value, { expirationTtl: 600 })));
  return true;
}

export default {
  /**
   * HTTP请求处理器，处理所有到达Worker的HTTP请求
   * @param {Request} request - HTTP请求对象
   * @param {object} env - 环境变量对象，包含数据库连接、配置等
   * @param {object} ctx - 上下文对象，包含执行上下文信息
   * @returns {Promise<Response>} HTTP响应对象
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let DB;
    try {
      DB = await getDatabaseWithValidation(env);
    } catch (error) {
      console.error('数据库连接失败:', error.message);
      return new Response('数据库连接失败，请检查配置', { status: 500 });
    }
    
    // 支持多个域名：使用逗号/空格分隔，创建地址时取第一个为默认显示
    const MAIL_DOMAINS = (env.MAIL_DOMAIN || 'temp.example.com')
      .split(/[,\s]+/)
      .map(d => d.trim())
      .filter(Boolean);

    // 缓存数据库初始化，避免每次请求重复执行
    if (!globalThis.__DB_INITED__) {
      await initDatabase(DB);
      globalThis.__DB_INITED__ = true;
    }

    // 创建路由器并添加认证中间件
    const router = createRouter();
    router.use(authMiddleware);

    // 尝试使用路由器处理请求
    const routeResponse = await router.handle(request, { request, env, ctx });
    if (routeResponse) {
      return routeResponse;
    }

    // 使用资源管理器处理静态资源请求
    const assetManager = createAssetManager();
    return await assetManager.handleAssetRequest(request, env, MAIL_DOMAINS);
  },

  /**
   * 邮件接收处理器，处理所有到达的邮件消息
   * @param {object} message - 邮件消息对象，包含邮件内容、头部信息等
   * @param {object} env - 环境变量对象，包含数据库连接、R2存储等
   * @param {object} ctx - 上下文对象，包含执行上下文信息
   * @returns {Promise<void>} 处理完成后无返回值
   */
  async email(message, env, ctx) {
    let DB;

    try {
      const headers = message.headers;
      const toHeader = headers.get('to') || headers.get('To') || '';
      const fromHeader = headers.get('from') || headers.get('From') || '';
      const subject = decodeMimeHeader(headers.get('subject') || headers.get('Subject') || '(无主题)') || '(无主题)';

      let envelopeTo = '';
      let messageTo = null;
      try {
        const toValue = message.to;
        messageTo = toValue;
        if (Array.isArray(toValue) && toValue.length > 0) {
          envelopeTo = typeof toValue[0] === 'string' ? toValue[0] : (toValue[0].address || '');
        } else if (typeof toValue === 'string') {
          envelopeTo = toValue;
        }
      } catch (_) {}

      const resolvedRecipient = (envelopeTo || toHeader || '').toString();
      const resolvedRecipientAddr = extractEmail(resolvedRecipient);
      const localPart = (resolvedRecipientAddr.split('@')[0] || '').toLowerCase();

      forwardByLocalPart(message, localPart, ctx, env);

      let textContent = '';
      let htmlContent = '';
      let rawBuffer = null;
      try {
        const resp = new Response(message.raw);
        rawBuffer = await resp.arrayBuffer();
        const rawText = await new Response(rawBuffer).text();
        const parsed = parseEmailBody(rawText);
        textContent = parsed.text || '';
        htmlContent = parsed.html || '';
        if (!textContent && !htmlContent) textContent = (rawText || '').slice(0, 100000);
      } catch (_) {
        textContent = '';
        htmlContent = '';
      }

      const mailbox = extractEmail(resolvedRecipient || toHeader);
      const sender = extractEmail(fromHeader);

      const preview = (() => {
        const plain = textContent && textContent.trim() ? textContent : (htmlContent || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return String(plain || '').slice(0, 120);
      })();
      let verificationCode = '';
      try {
        verificationCode = extractVerificationCode({ subject, text: textContent, html: htmlContent })
          || extractFallbackSixDigitOtp({ subject, text: textContent, html: htmlContent });
      } catch (_) {
        verificationCode = extractFallbackSixDigitOtp({ subject, text: textContent, html: htmlContent });
      }

      if (verificationCode) {
        try {
          await writeOtpToKv(env, {
            mailboxes: collectEmailAddresses(mailbox, resolvedRecipient, toHeader, messageTo),
            mailbox,
            otp: verificationCode,
            from: sender,
            subject,
          });
        } catch (e) {
          console.error('OTP_KV put failed:', e);
        }
      }

      try {
        DB = await getDatabaseWithValidation(env);
        await initDatabase(DB);
      } catch (error) {
        console.error('邮件处理时数据库连接失败:', error.message);
        return;
      }

      // 写入到 R2：完整 EML
      const r2 = env.MAIL_EML;
      let objectKey = '';
      try {
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');
        const hh = String(now.getUTCHours()).padStart(2, '0');
        const mm = String(now.getUTCMinutes()).padStart(2, '0');
        const ss = String(now.getUTCSeconds()).padStart(2, '0');
        const keyId = (globalThis.crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const safeMailbox = (mailbox || 'unknown').toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
        objectKey = `${y}/${m}/${d}/${safeMailbox}/${hh}${mm}${ss}-${keyId}.eml`;
        if (r2 && rawBuffer) {
          await r2.put(objectKey, new Uint8Array(rawBuffer), { httpMetadata: { contentType: 'message/rfc822' } });
        }
      } catch (e) {
        console.error('R2 put failed:', e);
      }

      // 写入新表结构（仅主要信息 + R2 引用）
      const resMb = await DB.prepare('SELECT id FROM mailboxes WHERE address = ?').bind(mailbox.toLowerCase()).all();
      let mailboxId;
      if (Array.isArray(resMb?.results) && resMb.results.length) {
        mailboxId = resMb.results[0].id;
      } else {
        const [localPart, domain] = (mailbox || '').toLowerCase().split('@');
        if (localPart && domain) {
        await DB.prepare('INSERT INTO mailboxes (address, local_part, domain, password_hash, last_accessed_at) VALUES (?, ?, ?, NULL, CURRENT_TIMESTAMP)')
          .bind((mailbox || '').toLowerCase(), localPart, domain).run();
          const created = await DB.prepare('SELECT id FROM mailboxes WHERE address = ?').bind((mailbox || '').toLowerCase()).all();
          mailboxId = created?.results?.[0]?.id;
        }
      }
      if (!mailboxId) throw new Error('无法解析或创建 mailbox 记录');

      // 收件人（逗号拼接）
      let toAddrs = '';
      try {
        const toValue = message.to;
        if (Array.isArray(toValue)) {
          toAddrs = toValue.map(v => (typeof v === 'string' ? v : (v?.address || ''))).filter(Boolean).join(',');
        } else if (typeof toValue === 'string') {
          toAddrs = toValue;
        } else {
          toAddrs = resolvedRecipient || toHeader || '';
        }
      } catch (_) {
        toAddrs = resolvedRecipient || toHeader || '';
      }

      // 直接使用标准列名插入（表结构已在初始化时固定）
      await DB.prepare(`
        INSERT INTO messages (mailbox_id, sender, to_addrs, subject, verification_code, preview, r2_bucket, r2_object_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        mailboxId,
        sender,
        String(toAddrs || ''),
        subject || '(无主题)',
        verificationCode || null,
        preview || null,
        'mail-eml',
        objectKey || ''
      ).run();
    } catch (err) {
      console.error('Email event handling error:', err);
    }
  }
};

