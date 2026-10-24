import { createClient } from '@supabase/supabase-js';

const bucketName = 'guide-illustrations';
let cachedClient;

const intentStopWords = new Set(['a', 'an', 'and', 'by', 'for', 'from', 'in', 'of', 'on', 'the', 'to', 'with']);
export function makeGuideMatchKey(area, title) {
  const words = String(title || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+/g) || [];
  const intent = [...new Set(words.filter(word => word.length > 1 && !intentStopWords.has(word)))].sort().join('-');
  return intent ? `${String(area || 'Other').toLowerCase()}:${intent}`.slice(0, 240) : null;
}

export function isGuideStoreConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getGuideStore() {
  if (!isGuideStoreConfigured()) return null;
  if (!cachedClient) {
    cachedClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }
  return cachedClient;
}

function throwIfError(error) {
  if (error) throw new Error(error.message || 'The saved repair library is temporarily unavailable.');
}

function sortEmbedded(row) {
  return {
    ...row,
    guide_steps: [...(row.guide_steps || [])].sort((a, b) => a.ordinal - b.ordinal),
    guide_parts: [...(row.guide_parts || [])].sort((a, b) => a.ordinal - b.ordinal)
  };
}

export async function listPublishedGuides({ query = '', area = 'All', limit = 6, cursor = null } = {}) {
  const client = getGuideStore();
  if (!client) return null;
  const pageSize = Math.max(1, Math.min(Number(limit) || 6, 24));
  let request = client.from('guides')
    .select('id,slug,title,description,area,level,estimated_time,safety,safety_notes,tools,cover_path,created_at,guide_steps(ordinal,title,instruction,illustration_path,illustration_alt,illustration_status),guide_parts(ordinal,name,details,retailer,url)', { count: 'exact' })
    .in('status', ['published', 'needs_illustrations'])
    .eq('visibility', 'public');
  if (area && area !== 'All') request = request.eq('area', area);
  const normalizedQuery = String(query).trim().slice(0, 160);
  if (normalizedQuery) request = request.textSearch('search_vector', normalizedQuery, { config: 'simple', type: 'websearch' });
  let direction = 'after';
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      direction = decoded.direction === 'before' ? 'before' : 'after';
      const createdAt = new Date(decoded.createdAt).toISOString();
      const id = Number(decoded.id);
      if (Number.isFinite(id)) {
        request = direction === 'before'
          ? request.or(`created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`)
          : request.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`);
      }
    } catch { /* Invalid cursor starts at the first page. */ }
  }
  request = request.order('created_at', { ascending: direction === 'before' }).order('id', { ascending: direction === 'before' });
  const { data, error, count } = await request.limit(pageSize + 1);
  throwIfError(error);
  const rows = data || [];
  const hasMore = rows.length > pageSize;
  let items = rows.slice(0, pageSize).map(sortEmbedded);
  if (direction === 'before') items = items.reverse();
  const encodeCursor = (cursorDirection, row) => row ? Buffer.from(JSON.stringify({ direction: cursorDirection, createdAt: row.created_at, id: row.id })).toString('base64url') : null;
  const nextCursor = direction === 'before' ? encodeCursor('after', items.at(-1)) : (hasMore ? encodeCursor('after', items.at(-1)) : null);
  const previousCursor = !cursor ? null : direction === 'before' ? (hasMore ? encodeCursor('before', items[0]) : null) : encodeCursor('before', items[0]);
  return { items, nextCursor, previousCursor, total: count || 0 };
}

export async function getPublicGuideBySlug(slug) {
  const client = getGuideStore();
  if (!client) return null;
  const { data, error } = await client.from('guides')
    .select('*,guide_steps(*),guide_parts(*)')
    .eq('slug', slug)
    .in('status', ['published', 'needs_illustrations'])
    .eq('visibility', 'public')
    .maybeSingle();
  throwIfError(error);
  return data ? sortEmbedded(data) : null;
}

export async function getUnlistedGuideByToken(token) {
  const client = getGuideStore();
  if (!client) return null;
  const { data, error } = await client.from('guides')
    .select('*,guide_steps(*),guide_parts(*)')
    .eq('share_token', token)
    .in('status', ['published', 'needs_illustrations'])
    .eq('visibility', 'unlisted')
    .maybeSingle();
  throwIfError(error);
  return data ? sortEmbedded(data) : null;
}

export async function findGuideByMatchKey(matchKey) {
  const client = getGuideStore();
  if (!client || !matchKey) return null;
  const { data, error } = await client.from('guides')
    .select('*,guide_steps(*),guide_parts(*)')
    .eq('match_key', matchKey)
    .eq('visibility', 'public')
    .maybeSingle();
  throwIfError(error);
  return data ? sortEmbedded(data) : null;
}

export async function createGuideRecord(guide, steps, parts) {
  const client = getGuideStore();
  if (!client) return { configured: false, created: false, guide: null };
  const guidePayload = {
    slug: guide.slug || null,
    share_token: guide.shareToken || null,
    match_key: guide.matchKey || null,
    title: guide.title,
    description: guide.description || '',
    area: guide.area || 'Other',
    level: guide.level || 'Easy',
    estimated_time: guide.estimatedTime || '',
    confidence: Math.max(0, Math.min(100, Number(guide.confidence) || 0)),
    safety: guide.safety,
    safety_notes: guide.safetyNotes || '',
    tools: guide.tools || [],
    cover_path: guide.coverPath || '',
    cover_alt: guide.coverAlt || guide.title,
    source: 'generated',
    status: 'draft',
    visibility: guide.visibility || 'public'
  };
  let { data, error } = await client.from('guides').insert(guidePayload).select('id,slug,share_token,match_key,status,visibility').single();
  if (error?.code === '23505' && guide.matchKey) {
    const existing = await findGuideByMatchKey(guide.matchKey);
    if (existing && ['published', 'needs_illustrations'].includes(existing.status)) return { configured: true, created: false, guide: existing };
    if (existing) return { configured: true, created: false, guide: null, inProgress: true };
  }
  throwIfError(error);
  const guideId = data.id;
  const stepRows = steps.map((step, index) => ({
    guide_id: guideId,
    ordinal: index + 1,
    title: step.title,
    instruction: step.instruction,
    illustration_alt: step.illustrationAlt || `Illustration for ${guide.title}, step ${index + 1}`,
    illustration_status: 'pending'
  }));
  const partRows = parts.map((part, index) => ({ guide_id: guideId, ordinal: index + 1, name: part.name, details: part.details || '', retailer: part.retailer || null, url: validPurchaseUrl(part.url) }));
  try {
    if (stepRows.length) {
      ({ error } = await client.from('guide_steps').insert(stepRows));
      throwIfError(error);
    }
    if (partRows.length) {
      ({ error } = await client.from('guide_parts').insert(partRows));
      throwIfError(error);
    }
  } catch (writeError) {
    await client.from('guides').delete().eq('id', guideId);
    throw writeError;
  }
  return { configured: true, created: true, guide: { ...data, guide_steps: stepRows, guide_parts: partRows } };
}

export async function deleteGuideRecord(guideId) {
  const client = getGuideStore();
  if (!client || !guideId) return;
  const { error } = await client.from('guides').delete().eq('id', guideId);
  throwIfError(error);
}

export function validPurchaseUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export async function storeStepIllustration(guideId, ordinal, dataUri) {
  const client = getGuideStore();
  if (!client) return null;
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUri || ''));
  if (!match) throw new Error('The illustration was not a valid image.');
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const path = `${guideId}/step-${ordinal}.${extension}`;
  const bytes = Buffer.from(match[2], 'base64');
  const { error } = await client.storage.from(bucketName).upload(path, bytes, {
    contentType: `image/${match[1]}`,
    cacheControl: '31536000',
    upsert: true
  });
  throwIfError(error);
  const { error: updateError } = await client.from('guide_steps').update({ illustration_path: path, illustration_status: 'ready' }).eq('guide_id', guideId).eq('ordinal', ordinal);
  throwIfError(updateError);
  return path;
}

export async function getStepIllustrationUrl(path) {
  if (!path || path.startsWith('/')) return path || '';
  const client = getGuideStore();
  if (!client) return '';
  const { data, error } = await client.storage.from(bucketName).createSignedUrl(path, 3600);
  throwIfError(error);
  return data?.signedUrl || '';
}

export async function updateGuideStatus(guideId, status) {
  const client = getGuideStore();
  if (!client) return;
  const { error } = await client.from('guides').update({ status }).eq('id', guideId);
  throwIfError(error);
}

export async function updateGuideCover(guideId, path) {
  const client = getGuideStore();
  if (!client || !path) return;
  const { error } = await client.from('guides').update({ cover_path: path }).eq('id', guideId);
  throwIfError(error);
}

export async function getGuideByStepPath({ slug, ordinal }) {
  const client = getGuideStore();
  if (!client) return null;
  const { data, error } = await client.from('guides').select('id,slug,title,area,visibility,status,guide_steps(id,ordinal,title,instruction,illustration_path,illustration_status)')
    .eq('slug', slug).eq('visibility', 'public').in('status', ['published', 'needs_illustrations']).maybeSingle();
  throwIfError(error);
  return data ? { ...data, guide_steps: (data.guide_steps || []).filter(step => step.ordinal === ordinal) } : null;
}

export async function toPublicGuides(rows, { signImages = true } = {}) {
  const guides = rows.filter(Boolean);
  const mediaPaths = [...new Set(guides.flatMap(row => [
    row.cover_path,
    ...(row.guide_steps || []).map(step => step.illustration_path)
  ]).filter(path => path && !path.startsWith('/')))];
  const signedImages = new Map();
  if (signImages && mediaPaths.length) {
    const client = getGuideStore();
    if (client) {
      const { data, error } = await client.storage.from(bucketName).createSignedUrls(mediaPaths, 3600);
      throwIfError(error);
      for (const item of data || []) if (item.path && item.signedUrl) signedImages.set(item.path, item.signedUrl);
    }
  }
  const imageUrl = path => !path ? '' : path.startsWith('/') ? path : signImages ? signedImages.get(path) || '' : path;
  return guides.map(row => ({
    id: row.slug || row.share_token,
    slug: row.slug,
    shareToken: row.share_token,
    title: row.title,
    desc: row.description,
    area: row.area,
    level: row.level,
    time: row.estimated_time,
    confidence: row.confidence || 0,
    safety: row.safety,
    safetyNotes: row.safety_notes,
    tools: row.tools || [],
    image: imageUrl(row.cover_path),
    alt: row.cover_alt || row.title,
    steps: (row.guide_steps || []).map(step => ({
      ordinal: step.ordinal,
      title: step.title,
      instruction: step.instruction,
      image: imageUrl(step.illustration_path),
      imageAlt: step.illustration_alt,
      illustrationStatus: step.illustration_status
    })),
    parts: (row.guide_parts || []).map(part => ({ name: part.name, details: part.details, retailer: part.retailer, url: validPurchaseUrl(part.url) })),
    visibility: row.visibility,
    status: row.status,
    source: row.source
  }));
}

export async function toPublicGuide(row, options) {
  if (!row) return null;
  return (await toPublicGuides([row], options))[0];
}
