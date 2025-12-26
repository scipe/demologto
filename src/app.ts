import http from 'node:http';

import type { LogtoExpressConfig } from '@logto/express';
import { handleAuthRoutes, withLogto } from '@logto/express';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import session from 'express-session';

const config: LogtoExpressConfig = {
    endpoint: 'https://auth-dev.pathwayapp.co/',
    appId: '47spzu7egu8bwk1dws4i0',
    appSecret: 'DRQILJNBrKXLDlTDtMB34NYPCouAryZ0',
    baseUrl: 'https://logto-demo-ogpng.ondigitalocean.app',
};

const requireAuth = async (request: Request, response: Response, next: NextFunction) => {
  if (!request.user.isAuthenticated) {
    response.redirect('/logto/sign-in');
  }

  next();
};

const app = express();
app.use(cookieParser());
app.use(
  session({
    secret: 'aN4puGkIc6KWFSj9YCrYD0h43BFi8ZuQ',
    cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 },
  })
);
app.use(handleAuthRoutes(config));

// Helper: escape user-provided strings for HTML
function escapeHtml(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper: derive a friendly display name from available claims
function getDisplayName(user: any): string {
  const claims = user?.claims ?? {};
  // Prefer a full name if present
  if (claims.name) return String(claims.name);

  // Fallback to combination of given/middle/family
  const parts = [claims.given_name, claims.middle_name, claims.family_name]
    .filter(Boolean)
    .map((p: unknown) => String(p));
  if (parts.length) return parts.join(' ');

  // Fallback to username or subject
  return String(claims.username ?? claims.sub ?? 'unknown user');
}

// Helper: render the home page HTML
function renderHome(user: any): string {
  const isAuthenticated = Boolean(user?.isAuthenticated);
  const displayName = escapeHtml(getDisplayName(user));

  const styles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }
      
      .container {
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        width: 100%;
        padding: 40px;
      }
      
      .header {
        text-align: center;
        margin-bottom: 40px;
      }
      
      .header h1 {
        color: #2d3748;
        font-size: 32px;
        margin-bottom: 10px;
      }
      
      .user-badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 20px;
        border-radius: 25px;
        font-size: 14px;
        margin-top: 10px;
      }
      
      .user-badge::before {
        content: '👤';
        font-size: 18px;
      }
      
      .auth-button {
        display: block;
        width: 100%;
        padding: 14px 24px;
        margin: 20px 0;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        text-decoration: none;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
      }
      
      .btn-secondary {
        background: #f7fafc;
        color: #718096;
        border: 2px solid #e2e8f0;
      }
      
      .btn-secondary:hover {
        background: #edf2f7;
        border-color: #cbd5e0;
      }
      
      .divider {
        height: 1px;
        background: linear-gradient(to right, transparent, #cbd5e0, transparent);
        margin: 30px 0;
      }
      
      .links-section h2 {
        color: #4a5568;
        font-size: 18px;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .link-card {
        display: block;
        background: #f7fafc;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px 20px;
        margin: 12px 0;
        text-decoration: none;
        color: #2d3748;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .link-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        transform: scaleY(0);
        transition: transform 0.3s ease;
      }
      
      .link-card:hover {
        border-color: #667eea;
        background: white;
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      }
      
      .link-card:hover::before {
        transform: scaleY(1);
      }
      
      .link-card-title {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 4px;
      }
      
      .link-card-desc {
        font-size: 13px;
        color: #718096;
      }
      
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 10px;
      }
      
      .status-authenticated {
        background: #c6f6d5;
        color: #22543d;
      }
      
      .status-guest {
        background: #fed7d7;
        color: #742a2a;
      }
    </style>
  `;

  const authSection = isAuthenticated
    ? `
      <div class="header">
        <h1>Shalom ${displayName}! 👋</h1>
        <div class="user-badge">${displayName}</div>
        <span class="status-badge status-authenticated">✓ Authenticated</span>
      </div>
      <a href="/logto/sign-out" class="auth-button btn-secondary">Sign Out</a>
    `
    : `
      <div class="header">
        <h1>Shalom! 👋</h1>
        <span class="status-badge status-guest">Guest User</span>
      </div>
      <a href="/logto/sign-in" class="auth-button btn-primary">Sign In</a>
    `;

  const links = [
    { href: '/local-user-claims', title: '👤 Profile', desc: 'View your local user claims' },
    { href: '/protected', title: '🔒 Protected Resource', desc: 'Access protected content' },
    { href: '/remote-full-user', title: '🌐 Fetch User Info', desc: 'Get complete user information from remote' },
    { href: '/fetch-access-token', title: '🎫 Fetch Access Token', desc: 'Retrieve your access token' },
    { href: '/fetch-organization-token', title: '🏢 Fetch Organization Token', desc: 'Get organization-scoped token' },
  ];

  const linksHtml = links
    .map(link => `
      <a href="${link.href}" class="link-card">
        <div class="link-card-title">${link.title}</div>
        <div class="link-card-desc">${link.desc}</div>
      </a>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Logto Demo - ${isAuthenticated ? displayName : 'Welcome'}</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        ${authSection}
        <div class="divider"></div>
        <div class="links-section">
          <h2>🚀 Available Resources</h2>
          ${linksHtml}
        </div>
      </div>
    </body>
    </html>
  `;
}

app.get('/', withLogto(config), (req, res) => {
    res.setHeader('content-type', 'text/html');
    res.end(renderHome(req.user));
});

app.get('/local-user-claims', withLogto(config), (request, response) => {
  response.json(request.user);
});

app.get(
  '/remote-full-user',
  withLogto({
    ...config,
    // Fetch user info from remote, this may slowdown the response time, not recommended.
    fetchUserInfo: true,
  }),
  (request, response) => {
    response.json(request.user);
  }
);

app.get(
  '/fetch-access-token',
  withLogto({
    ...config,
    // Fetch access token from remote, this may slowdown the response time,
    // you can also add "resource" if needed.
    getAccessToken: true,
  }),
  (request, response) => {
    response.json(request.user);
  }
);

app.get(
  '/fetch-organization-token',
  withLogto({
    ...config,
    // Fetch organization token from remote
    // Remember to add "UserScope.Organizations" scope
    getOrganizationToken: true,
  }),
  (request, response) => {
    response.json(request.user);
  }
);

app.get('/protected', withLogto(config), requireAuth, (request, response) => {
  response.end('protected resource');
});

const server = http.createServer(app);
server.listen(3000, () => {
  console.log('Sample app listening on http://localhost:3000');
});