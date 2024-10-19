/**
 * @api {post} /create Create
 */

// Path: functions/create.js

function generateRandomString(length) {
    const characters = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const result = [];

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result.push(characters[randomIndex]); 
    }

    return result.join(''); 
}

// 处理 CORS 响应
function handleCORS() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400', // 24 hours
    };
}

export async function onRequest(context) {
    const { request, env } = context;

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: handleCORS() });
    }

    // 解析请求数据
    const { url, slug, expiry } = await request.json(); 
    const originUrl = new URL(request.url);
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("clientIP");
    const userAgent = request.headers.get("user-agent");
    const origin = `${originUrl.protocol}//${originUrl.hostname}`;
    const corsHeaders = handleCORS();

    if (!url) return Response.json({ message: '缺少必需的参数：url' }, { headers: corsHeaders, status: 400 });

    // URL 格式检查
    if (!/^https?:\/\/.{3,}/.test(url)) {
        return Response.json({ message: '非法格式：url' }, { headers: corsHeaders, status: 400 });
    }

    // 自定义 slug 长度检查
    if (slug && (slug.length < 4 || slug.length > 10 || /.+\.[a-zA-Z]+$/.test(slug))) {
        return Response.json({ message: '非法长度：4<短链接长度<10 ，或不以文件扩展名结尾' }, { headers: corsHeaders, status: 400 });
    }

    try {
        // 检查自定义 slug 是否存在
        if (slug) {
            const existUrl = await env.DB.prepare(`SELECT url as existUrl FROM links WHERE slug = ?`).bind(slug).first();
            if (existUrl) {
                if (existUrl.existUrl === url) {
                    return Response.json({ slug, link: `${origin}/${slug}` }, { headers: corsHeaders, status: 200 });
                }
                return Response.json({ message: '短链接已存在' }, { headers: corsHeaders, status: 400 });
            }
        }

        // 检查目标 URL 是否已经存在
        const existSlug = await env.DB.prepare(`SELECT slug as existSlug FROM links WHERE url = ?`).bind(url).first();
        if (existSlug && !slug) {
            return Response.json({ slug: existSlug.existSlug, link: `${origin}/${existSlug.existSlug}` }, { headers: corsHeaders, status: 200 });
        }

        // 不允许缩短指向同一域的链接
        const bodyUrl = new URL(url);
        if (bodyUrl.hostname === originUrl.hostname) {
            return Response.json({ message: '您不能缩短指向同一域的链接' }, { headers: corsHeaders, status: 400 });
        }

        // 生成随机 slug
        const slugToUse = slug || generateRandomString(7);

        // 计算过期时间
        let expiresAt = null;
        if (expiry) {
            const expiryValue = parseInt(expiry.slice(0, -1));
            const expiryUnit = expiry.slice(-1);
            const now = new Date();
            if (expiryUnit === 'm') now.setMinutes(now.getMinutes() + expiryValue);
            if (expiryUnit === 'h') now.setHours(now.getHours() + expiryValue);
            if (expiryUnit === 'd') now.setDate(now.getDate() + expiryValue);
            expiresAt = now.toISOString();
        }

        // 插入链接到数据库
        await env.DB.prepare(`INSERT INTO links (url, slug, ip, status, ua, create_time, expires_at) 
        VALUES (?, ?, ?, 1, ?, ?, ?, ?)`)
        .bind(url, slugToUse, clientIP, userAgent, new Intl.DateTimeFormat('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date()), expiresAt)
        .run();

        return Response.json({ slug: slugToUse, link: `${origin}/${slugToUse}` }, { headers: corsHeaders, status: 200 });
    } catch (error) {
        console.error(error);
        return Response.json({ message: error.message }, { headers: corsHeaders, status: 500 });
    }
}
