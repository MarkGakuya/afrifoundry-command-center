const proxy = (path, options = {}) =>
  fetch(`/api/proxy/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }).then((r) => r.json());

// Bridge
export const getBridgeStats = () => proxy('admin/stats');
export const getActivityFeed = () => proxy('admin/activity?limit=20');
export const triggerScraperRun = () => proxy('admin/scrapers/trigger', { method: 'POST' });
export const seedKenyaToday = () => proxy('admin/seed/today', { method: 'POST' });
export const exportFinetune = () => proxy('admin/export/finetune', { method: 'POST' });

// Intelligence
export const getScrapers = () => proxy('admin/scrapers');
export const getPipelineStats = () => proxy('admin/pipeline/stats');
export const getReviewQueue = () => proxy('admin/review-queue?limit=20');
export const approveDatapoint = (id) => proxy(`admin/review-queue/${id}/approve`, { method: 'POST' });
export const rejectDatapoint = (id) => proxy(`admin/review-queue/${id}/reject`, { method: 'POST' });

// Product
export const getProductStats = () => proxy('admin/product/stats');
export const getConversations = () => proxy('admin/conversations?limit=30');

// Scouts
export const getScouts = () => proxy('admin/scouts');
export const getScoutFeed = () => proxy('admin/scouts/feed?limit=20');

// Company
export const getMilestones = () => proxy('admin/company/milestones');
export const getFundingPipeline = () => proxy('admin/company/funding');
export const getRevenue = () => proxy('admin/company/revenue');

// Users
export const getUsers = () => proxy('admin/users');
export const promoteUser = (id, role) =>
  proxy(`admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
