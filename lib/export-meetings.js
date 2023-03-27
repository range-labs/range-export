import { info, progress } from './printer.js';
import { copy, getImages , mapUser} from './util.js';

const PAGE_SIZE = 50;

export default async function(client, options) {
  const { user, org } = await client.authUser();

  let query = {
    target_id: options.target || org.org_id,
    count: PAGE_SIZE,
    include_refs: true,
    ascending: true,
  };
  if (options.after) query.after = options.after.toISOString();
  if (options.before) query.before = options.before.toISOString();


  let max = options.before ? options.before.valueOf() : Date.now();
  let min = options.after ? options.after.valueOf() : null;
  let total = min ? (max - min) / 1000 : null;
  info('Fetching meetings');
  let bar = progress(total || 100, 0);

  let meetings = [];
  let sessions = {};
  let users = {};
  let teams = {};
  let attachments = {};

  let sessionCount = 0;

  while (1) {
    const resp = await client.listMeetings(query);
    if (!total) {
      total = max - new Date(resp.meetings[0].created_at).valueOf();
      bar.setTotal(total);
    }
    meetings = meetings.concat(resp.meetings);
    copy(users, resp.users.map(user => mapUser(user, options)), 'user_id');
    copy(teams, resp.teams, 'team_id');

    resp.sessions.forEach(session => {
      if (!sessions[session['meeting_id']]) sessions[session['meeting_id']] = [];
      sessions[session['meeting_id']].push(session);
      sessionCount++;
    })

    if (resp.pagination.pagination_state === 'CONTINUE') {
      query.after = meetings[meetings.length - 1].created_at;
      let p = (new Date(query.after).valueOf() - min) / 1000;
      bar.update(p);
    } else {
      bar.update(total);
      bar.stop();
      break;
    }
  }

  // Read session details and add to the session object for convenience.
  info('Exporting session details');
  let bar2 = progress(sessionCount, 0);
  let p = 0;
  for (let meetingId in sessions) {
    for (let sessionNumber = 0; sessionNumber < sessions[meetingId].length; sessionNumber++) {
      let sess = sessions[meetingId][sessionNumber];
      sess.attendees = sess.attendee_relations.map(rel => ({
        user: users[rel.user_id],
        is_absent: rel.is_absent
      }));
      sess.facilitator = users[sess.facilitator_id];
      sess.created_by = users[sess.created_by];
      delete sess.attendee_ids;
      delete sess.attendee_relations;
      delete sess.facilitator_id;
      delete sess.current_item_id;
      delete sess.session_key;
      const resp = await client.readSession(meetingId, sessionNumber);
      copy(attachments, resp.attachments, 'attachment_id');
      sess.agenda_items = resp.agenda_items.map(item => ({
        agenda_item_id: item.agenda_item_id,
        ref_id: item.ref_id,
        name: item.name,
        description: item.description,
        description_html: item.description_html,
        notes: item.notes,
        notes_html: item.notes_html,
        owner: users[item.owner_id],
        team: teams[item.team_id],
        position: item.position,
        phase: item.phase,
        type: item.type,
        timer_seconds: item.timer_seconds,
        type_settings: item.type_settings,
        is_private: item.is_private,
        is_hidden: item.is_hidden,
        is_recurring: item.is_recurring,
        origin: item.origin,
        snoozed_at: item.snoozed_at,
        resolved_at: item.resolved_at,
        decoration: item.decoration,
        tags: item.tags,
        attachments: item.attachment_ids.map(id => attachments[id]),
        ...getImages(item, options),
      }));
      // TODO: These might be nicer if nested under their respective agenda item.
      sess.action_items = resp.action_items.map(item => ({
        action_item_id: item.action_item_id,
        agenda_item_id: item.agenda_item_id,
        is_private: item.is_private,
        is_hidden: item.is_hidden,
        owner: users[item.owner_id],
        action_item_state: item.action_item_state,
        content: item.content,
        completed_at: item.completed_at,
        closed_at: item.closed_at,
        created_at: item.created_at,
      }));
      sess.personal_notes = resp.personal_notes.map(item => ({
        personal_note_id: item.personal_note_id,
        user: users[item.user_id],
        agenda_item_id: item.agenda_item_id,
        notes: item.notes,
        notes_html: item.notes_html
      }));
    }
    bar2.update(++p);
  }
  bar2.stop();

  return meetings.map(meeting => ({
    meeting_id: meeting.meeting_id,
    owner: users[meeting.owner_id],
    slug: meeting.slug,
    name: meeting.name,
    team: teams[meeting.team_id],
    created_at: meeting.created_at,
    archived_at: meeting.archived_at,
    visibility: meeting.visibility,
    sessions: sessions[meeting.meeting_id]
  }));
};
