import emojiToolkit from 'emoji-toolkit';
import linkifyStr from 'linkify-string';

export default function(data) {
  const parts = [];
  parts.push(renderHeader(data));
  for (const update of data) {
    parts.push(renderUpdate(update));
  }
  parts.push(footer);
  return parts.join('');
}

function renderHeader(updates) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Range Check-ins</title>
    <link href="https://fonts.googleapis.com/css?family=Inter:400,500,700" rel="stylesheet">
    <style>
      body {
        color: #1e1f21;
        font-family: 'Inter', 'Helvetica', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        margin: 0 20px 20px;
      }
      h1 { /* Page title */
        font-size: 22px;
        font-weight: 500;
        margin: 0;
      }
      h2 { /* User name */
        font-size: 22px;
        font-weight: 700;
        margin: 0;
      }
      h3 { /* Check-in time */
        font-size: 16px;
        font-weight: 500;
        margin: 0;
      }
      h4 { /* Section heading */
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 5px;
      }
      a {
        color: #4848d3;
        overflow-wrap: anywhere; /* Prevent overflow from long urls without spaces */
      }
      a:hover,
      a:focus {
        color: #2d2db2;
      }
      .header {
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        padding: 5px 20px 10px;
        position: sticky;
        top: 0;
      }
      .checkins {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .checkin {
        background: #fff;
        border: 1px solid #dfe1e6;
        border-radius: 16px;
        box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.12);
        display: grid;
        gap: 20px;
        grid-template-columns: minmax(0, 1fr);
        padding: 20px;
      }
      .checkin__info {
        align-items: baseline;
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .checkin__info h3 {
        align-items: center;
        color: #656a72;
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .checkin__mood h4 {
        display: inline;
        padding-right: 5px;
      }
      .checkin__question {
        background-color: #fafafc;
        border: 1px solid #dfe1e6;
        border-radius: 10px;
        padding: 20px;
      }
      .checkin ol {
        margin: 0;
        padding: 0 0 0 15px;
      }
      .checkin li {
        margin: 0 0 15px;
      }
      .checkin__plan ol {
        list-style-type: circle;
      }
      .checkin__past ol {
        list-style-type: disc;
      }
      .checkin__images {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 5px;
      }
      .checkin__images a {
        cursor: zoom-in;
      }
      .checkin__images img {
        border: 1px solid #dfe1e6;
        border-radius: 10px;
      }
      .checkin__images a:hover img {
        border-color: #4848d3;
      }
      @media (min-width: 900px) {
        body {
          margin: 0 auto 20px;
          max-width: 900px;
        }
        h1 {
          font-size: 26px;
        }
        .header {
          align-items: center;
          flex-direction: row;
          justify-content: space-between;
          padding: 20px;
        }
        .checkin {
          column-gap: 41px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .checkin__info,
        .checkin__mood,
        .checkin__question {
          grid-column: 1 / span 2;
        }
        .checkin__plan {
          border-right: 1px solid #dfe1e6;
          margin-right: -21px;
          padding-right: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Range Check-ins</h1>
      ${updates.length > 0 ? `
      <div class="header__jumpTo">
        <label>
          Jump to:
          <input
            id="jump"
            type="date"
            min="${formatISODate(updates[0].published_at)}"
            max="${formatISODate(updates[updates.length - 1].published_at)}"
          >
          <script>
            document.getElementById('jump').addEventListener('change', e => {
              const targetDate = e.target.valueAsDate;
              for (const el of document.getElementsByClassName('checkin')) {
                if (new Date(el.id) >= targetDate) {
                  document.location.hash = \`#\${el.id}\`;
                  break;
                }
              }
            });
          </script>
        </label>
      </div>
      ` : ''}
    </div>
    <div class="checkins">
`;
};

function renderUpdate(update) {
  // Filter to only snippets with content.
  const snippets = update.snippets.filter(s => s.content || s.attachment_name || s.images?.length > 0);

  // Divide snippets into sections.
  const questionItems = snippets.filter(s => s.type === 'QUESTION');
  const planItems = snippets.filter(s => s.type === 'PLAN');
  const pastItems = snippets.filter(s => s.type === 'PAST');

  return `
    <div class="checkin" id="${update.published_at}">
      <div class="checkin__info">
        <h2>${update.user_name}</h2>
        <h3>
          <span class="checkin__date">${formatDate(update.published_at)}</span>
          <span class="checkin__time">${formatTime(update.published_at)}</span>
        </h3>
      </div>

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
      <div class="checkin__question">
        <h4>${snippet.question_text}</h4>
        ${snippet.content}
      </div>
      `
        )
        .join('')}
      <div class="checkin__plan">
        <h4>Plan</h4>
        <ol>
          ${planItems.map(renderSnippet).join('')}
          ${planItems.length === 0 ? `<li><em>No items</em></li>` : ''}
        </ol>
      </div>
      <div class="checkin__past">
        <h4>What happened?</h4>
        <ol>
          ${pastItems.map(renderSnippet).join('')}
          ${pastItems.length === 0 ? `<li><em>No items</em></li>` : ''}
        </ol>
      </div>
    </div>
  `;
}

function renderSnippet(snippet) {
  return `
        <li>
          ${snippet.callout ? `<b class="checkin__callout">${snippet.callout}</b>` : ''}
          ${linkifyStr(snippet.content, { target: '_blank', truncate: 100 })}
          ${
            snippet.attachment_name
              ? `<div class="checkin__attachment"><a href="${snippet.attachment_url}" target="_blank">${snippet.attachment_name}</a></div>`
              : ''
          }
          ${renderImages(snippet.images)}
        </li>
  `;
}

const footer = `
    </div>
  </body>
</html>
`;

function renderImages(images) {
  if (!images || images.length === 0) return '';
  return `
    <div class="checkin__images">
      ${images.map(src => `<a href="${src}" target="_blank"><img src="${src}" height="100"></a>`).join(' ')}
    </div>
  `;
}

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

function formatISODate(ts) {
  return ts.split('T')[0];
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
