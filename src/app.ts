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

  const authSection = isAuthenticated
    ? `<h1>Shalom ${displayName}!</h1>
       <div><a href="/logto/sign-out">Sign Out</a></div>`
    : `<h1>Shalom unknown user!</h1>
       <div><a href="/logto/sign-in">Sign In</a></div>`;

  // Shared links
  const sharedLinks = `
    <hr/>
    <div><a href="/local-user-claims">Profile</a></div>
    <div><a href="/protected">Protected Resource</a></div>
    <div><a href="/remote-full-user">Fetch user info</a></div>
    <div><a href="/fetch-access-token">Fetch access token</a></div>
    <div><a href="/fetch-organization-token">Fetch organization token</a></div>
  `;

  return `${authSection}${sharedLinks}`;
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