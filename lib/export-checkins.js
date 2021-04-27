import { info, progress } from './printer.js';

const PAGE_SIZE = 50;

export default async function(client, options) {
  const { user, org } = await client.authUser();

  let query = {
    target_id: org.org_id,
    count: PAGE_SIZE,
    include_refs: true,
    ascending: true,
  };
  if (options.after) query.after = options.after.toISOString();
  if (options.before) query.before = options.before.toISOString();

  let updates = [];
  let snippets = {};
  let attachments = {};
  let users = {};

  let max = options.before ? options.before.valueOf() : Date.now();
  let min = options.after ? options.after.valueOf() : null;
  let total = min ? (max - min) / 1000 : null;
  let bar = progress(total || 100, 0);

  while (1) {
    const resp = await client.listUpdates(query);
    if (!total) {
      total = max - new Date(resp.updates[0].published_at).valueOf();
      bar.setTotal(total);
    }
    updates = updates.concat(resp.updates);
    copy(snippets, resp.snippets, 'id');
    copy(attachments, resp.attachments, 'id');
    copy(users, resp.users, 'user_id');
    if (resp.pagination.pagination_state === 'CONTINUE') {
      query.after = updates[updates.length - 1].published_at;
      let p = (new Date(query.after).valueOf() - min) / 1000;
      bar.update(p);
    } else {
      bar.stop();
      break;
    }
  }
  info(
    `${Object.keys(users).length} users shared ` +
      `${updates.length} check-ins ` +
      `with ${Object.keys(snippets).length} items and ` +
      `${Object.keys(attachments).length} unique artifacts.`
  );

  return updates.map(update => ({
    user_id: update.user_id,
    user_name: users[update.user_id].full_name,
    update_id: update.update_id,
    published_at: update.published_at,
    client_timezone_offset: update.client_timezone_offset,
    mood: update.mood,
    mood_color: update.mood_color,
    snippets: update.snippets.map(s => ({
      id: snippets[s].id,
      type:
        snippets[s].snippet_type === 1
          ? 'PAST'
          : snippets[s].snippet_type === 2
          ? 'PLAN'
          : 'QUESTION',
      is_main_focus: snippets[s].is_main_focus,
      callout: snippets[s].callout,
      content: snippets[s].transformed_content,
      ...getAttachment(attachments, snippets[s].attachment_id),
    })),
  }));
}

function getAttachment(map, id) {
  if (!map[id]) return null;
  return {
    attachment_id: map[id].id,
    attachment_provider: map[id].provider_name,
    attachment_type: map[id].type,
    attachment_subtype: map[id].subtype,
    attachment_name: map[id].name,
    attachment_url: map[id].html_url,
  };
}

function copy(dest, items, key) {
  items.forEach(item => {
    dest[item[[key]]] = item;
  });
}
