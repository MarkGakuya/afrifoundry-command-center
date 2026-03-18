const proxy = (path, options = {}) =>
  fetch(`/api/proxy/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }).then((r) => r.json());

// ── Bridge ────────────────────────────────────────────────────────────────────
// Real endpoint: GET /api/v1/admin/stats
export const getBridgeStats = () => proxy('api/v1/admin/stats');

// Activity is embedded inside stats.activity — this is a passthrough wrapper
export const getActivityFeed = () => proxy('api/v1/admin/stats').then(d => d.activity || []);

// Kenya Today seed
export const seedKenyaToday = () => proxy('api/v1/admin/kenya-today', { method: 'POST' });

// Export fine-tune data
export const exportFinetune = () => proxy('api/v1/admin/export-training-data');

// Trigger scraper — not in backend yet, returns mock
export const triggerScraperRun = async () => ({ success: true, message: 'Scraper queued (connect to scraper API)' });

// ── Intelligence ──────────────────────────────────────────────────────────────
// Datapoints (review queue equivalent)
export const getReviewQueue = () => proxy('api/v1/admin/datapoints?limit=20&status=pending');
export const getScrapers = async () => ({ scrapers: [] }); // not in backend yet
export const getPipelineStats = () => proxy('api/v1/admin/training-stats');
export const approveDatapoint = (id) => proxy(`api/v1/admin/conversations/${id}/label`, {
  method: 'PATCH',
  body: JSON.stringify({ label: 'approved' }),
});
export const rejectDatapoint = (id) => proxy(`api/v1/admin/conversations/${id}/label`, {
  method: 'PATCH',
  body: JSON.stringify({ label: 'rejected' }),
});

// ── Product ───────────────────────────────────────────────────────────────────
// User analytics — closest to product stats
export const getProductStats = () => proxy('api/v1/admin/user-analytics');
export const getConversations = () => proxy('api/v1/admin/conversations?limit=30');
export const getFeedback = () => proxy('api/v1/admin/feedback?limit=50');

// ── Scouts ────────────────────────────────────────────────────────────────────
// AfriScout has its own backend — these hit afriscout.onrender.com
const SCOUT_API = 'https://afriscout.onrender.com';
export const getScouts = () =>
  fetch(`${SCOUT_API}/scout/all`, { headers: { 'x-admin-key': '' } })
    .then(r => r.json()).catch(() => []);
export const getScoutFeed = () =>
  fetch(`${SCOUT_API}/sync/status`).then(r => r.json()).catch(() => []);

// ── Company ───────────────────────────────────────────────────────────────────
// Not in backend — these return mock until company endpoints are built
export const getMilestones = async () => ([
  { title: 'AfriFoundry AI launched', date: 'Feb 2026', status: 'done' },
  { title: '100 users milestone', date: 'Mar 2026', status: 'done' },
  { title: 'AfriScout deployed', date: 'Mar 2026', status: 'done' },
  { title: 'Founding 100 completed', date: 'Apr 2026', status: 'pending' },
  { title: 'First paid customer', date: 'Apr 2026', status: 'pending' },
  { title: 'Pre-seed round closed', date: 'May 2026', status: 'pending' },
  { title: '1,000 users', date: 'Jun 2026', status: 'pending' },
  { title: 'API v1 launched', date: 'Aug 2026', status: 'pending' },
]);
export const getFundingPipeline = async () => ([]);
export const getRevenue = async () => ({ mrr: 0, status: 'pre_revenue' });

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = () => proxy('api/v1/admin/users?limit=200');
export const promoteUser = (id, role) =>
  proxy(`api/v1/admin/users/${id}/promote`, { method: 'POST' });
export const deleteUser = (id) =>
  proxy(`api/v1/admin/users/${id}`, { method: 'DELETE' });

// ── Errors ────────────────────────────────────────────────────────────────────
export const getErrors = () => proxy('api/v1/admin/errors?limit=50');
