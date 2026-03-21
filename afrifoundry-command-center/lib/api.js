const call = async (path, options = {}) => {
  const res = await fetch(`/api/proxy/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

// ── Bridge ──────────────────────────────────────────────────────────────────
export const getBridgeStats  = () => call('api/v1/admin/stats');
export const seedKenyaToday  = () => call('api/v1/admin/kenya-today', { method: 'POST' });
export const exportFinetune  = () => call('api/v1/admin/export-training-data');
export const triggerScraper  = () => call('api/v1/admin/pipeline/run', { method: 'POST' });

// ── Intelligence ────────────────────────────────────────────────────────────
export const getPipelineStats  = () => call('api/v1/admin/training-stats');
export const getScraperStats   = () => call('api/v1/admin/pipeline/scrapers');
export const getDatapoints     = (limit = 30) => call(`api/v1/admin/datapoints?limit=${limit}`);
export const labelConversation = (id, label) =>
  call(`api/v1/admin/conversations/${id}/label`, {
    method: 'PATCH',
    body:   JSON.stringify({ label }),
  });
export const getQualityTracking = () => call('api/v1/admin/quality-tracking');

// ── Product ─────────────────────────────────────────────────────────────────
export const getProductStats  = () => call('api/v1/admin/user-analytics');
export const getConversations = (limit = 30) => call(`api/v1/admin/conversations?limit=${limit}`);
export const getFeedback      = (limit = 50) => call(`api/v1/admin/feedback?limit=${limit}`);

// ── Users ────────────────────────────────────────────────────────────────────
export const getUsers    = (limit = 200) => call(`api/v1/admin/users?limit=${limit}`);
export const promoteUser = (id, role)    =>
  call(`api/v1/admin/users/${id}/promote`, {
    method: 'POST',
    body:   JSON.stringify({ role }),
  });
export const deleteUser  = (id) => call(`api/v1/admin/users/${id}`, { method: 'DELETE' });

// ── Infrastructure ──────────────────────────────────────────────────────────
export const getPipelineStatus  = () => call('api/v1/admin/pipeline/status');
export const runPipeline        = () => call('api/v1/admin/pipeline/run', { method: 'POST' });
export const getPipelineHistory = () => call('api/v1/admin/pipeline/history');
export const getInfraOverview   = () => call('api/v1/admin/infrastructure/overview');

// ── Databases ────────────────────────────────────────────────────────────────
export const getDBList        = () => call('api/v1/admin/db/list');
export const getDBStats       = (id) => call(`api/v1/admin/db/${id}/stats`);
export const runSQL           = (id, sql) =>
  call('api/v1/admin/db/query', {
    method: 'POST',
    body:   JSON.stringify({ db_id: id, query: sql }),
  });
export const getPriceChanges   = () => call('api/v1/admin/price-changes');
export const confirmPriceChange = (id) =>
  call('api/v1/admin/price-changes/confirm', {
    method: 'POST',
    body:   JSON.stringify({ change_id: id }),
  });
export const getFieldConflicts = () => call('api/v1/admin/field-conflicts');
export const getADAStats       = () => call('api/v1/admin/ada/stats');

// ── Scouts (external AfriScout API) ─────────────────────────────────────────
const SCOUT_API = 'https://afriscout.onrender.com';
export const getScouts = () =>
  fetch(`${SCOUT_API}/scout/all`, { headers: { 'x-admin-key': '' } })
    .then(r => r.json()).catch(() => []);
export const getScoutFeed = () =>
  fetch(`${SCOUT_API}/sync/status`).then(r => r.json()).catch(() => []);

// ── Company (static — no backend endpoints yet) ──────────────────────────────
export const getMilestones = async () => ([
  { label: 'AfriFoundry founded',              date: '8 Jul 2025',  done: true  },
  { label: '10,000+ field datapoints collected', date: 'Sep 2025',  done: true  },
  { label: 'AfriScout V3 live',                date: 'Oct 2025',   done: true  },
  { label: 'AfriFoundry AI V1 launched',        date: 'Feb 2026',   done: true  },
  { label: 'Founding 100 beta users',           date: 'Mar 2026',   done: true  },
  { label: '2.5M datapoints loaded',            date: 'Mar 2026',   done: true  },
  { label: 'Command Center live',               date: 'Mar 2026',   done: true  },
  { label: 'KES 500/month paywall live',        date: 'Q2 2026',    done: false },
  { label: 'First paying customer',             date: 'Q2 2026',    done: false },
  { label: 'Company registration',              date: 'Q2 2026',    done: false },
  { label: 'V2: Fine-tuned AfriFoundry model',  date: 'Q3 2026',    done: false },
  { label: '5,000 users',                       date: 'Q4 2026',    done: false },
  { label: 'Own AI infrastructure deployed',    date: 'Q4 2026',    done: false },
]);

export const getFundingPipeline = async () => ([
  { name: 'Google.org',      type: 'Grant',          amount: '$100K–$500K',  deadline: 'Apr 2026',   status: 'applying', next: 'Submit application' },
  { name: 'Villgro Africa',  type: 'Incubator',      amount: '$50K–$200K',   deadline: 'Q2 2026',    status: 'research', next: 'Prepare pitch deck' },
  { name: 'Antler Africa',   type: 'VC',             amount: '$100K+',       deadline: 'Q2 2026',    status: 'research', next: 'Apply to cohort' },
  { name: 'GSMA Innovation', type: 'Grant',          amount: '$75K–$250K',   deadline: 'Q3 2026',    status: 'research', next: 'Monitor open call' },
  { name: 'Africa50',        type: 'VC',             amount: '$250K+',       deadline: 'Q3 2026',    status: 'research', next: 'Warm intro needed' },
]);

export const getRevenue = async () => ({ mrr: 0, total_revenue: 0, active_pro_users: 0, status: 'pre-revenue' });

// ── Kenya Today ──────────────────────────────────────────────────────────────
export const getKenyaToday    = () => call('api/v1/admin/kenya-today');
export const updateKenyaToday = (data) => call('api/v1/admin/kenya-today', {
  method: 'POST',
  body:   JSON.stringify(data),
});
