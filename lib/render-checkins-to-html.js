import emojiToolkit from 'emoji-toolkit';

export default function(data) {
  const parts = [];
  parts.push(header);
  for (const update of data) {
    parts.push(renderUpdate(update));
  }
  parts.push(footer);
  return parts.join('');
}

const header = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Range Check-ins</title>
  </head>
  <body>
    <h1>Range Check-ins</h1>
    <div class="checkins">
`;

function renderUpdate(update) {
  // Filter to only snippets with content.
  const snippets = update.snippets.filter(s => s.content || s.attachment_name);

  // Divide snippets into sections.
  const questionItems = snippets.filter(s => s.type === 'QUESTION');
  const planItems = snippets.filter(s => s.type === 'PLAN');
  const pastItems = snippets.filter(s => s.type === 'PAST');

  return `
    <div class="checkin">
      <h2>${update.user_name}</h2>
      <h3>
        <span class="checkin__date">${formatDate(update.published_at)}</span>
        <span class="checkin__time">${formatTime(update.published_at)}</span>
      </h3>
      ${
        update.mood || update.mood_color || update.mood_context
          ? `
      <div class="checkin__mood">
        <h4>Mood</h4>
        <span>
          ${moodColorToEmoji(update.mood_color)}
          ${update.mood ? emojiToolkit.shortnameToUnicode(update.mood) : ''}
          ${(update.mood || update.mood_color) && update.mood_context ? '<br>' : ''}
          ${update.mood_context}
        </span>
      </div>
      `
          : ''
      }
      ${questionItems
        .map(
          snippet => `
      <div class="checkin_question">
        <h4>${snippet.question_text}</h4>
        ${snippet.content}
      </div>
      `
        )
        .join('')}
      <h4>Plan</h4>
      <ol class="checkin__plan">
        ${planItems.map(renderSnippet).join('')}
        ${planItems.length === 0 ? `<li><em>No items</em></li>` : ''}
      </ol>
      <h4>What happened?</h4>
      <ol class="checkin__past">
        ${pastItems.map(renderSnippet).join('')}
        ${pastItems.length === 0 ? `<li><em>No items</em></li>` : ''}
      </ol>
    </div>
  `;
}

function renderSnippet(snippet) {
  return `
        <li>
          ${snippet.content}
          ${snippet.content && snippet.attachment_name ? '<br>' : ''}
          ${
            snippet.attachment_name
              ? `<a class="checkin__attachment" href="${snippet.attachment_url}">${snippet.attachment_name}</a>`
              : ''
          }
        </li>
  `;
}

const footer = `
    </div>
  </body>
</html>
`;

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-us', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-us', {
    timeStyle: 'short',
  });
}

function moodColorToEmoji(moodColor) {
  if (moodColor === 'GREEN') {
    return '🟢';
  }
  if (moodColor === 'YELLOW') {
    return '🟡';
  }
  if (moodColor === 'RED') {
    return '🔴';
  }
  return '';
}
