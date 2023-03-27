![Range Logo](./img/range-arch.png)

# Range Export &middot; [![License](https://img.shields.io/github/license/range-labs/range-export.svg)](https://github.com/range-labs/range-export/blob/master/LICENSE) [![Twitter](https://img.shields.io/twitter/follow/rangelabs.svg?style=social)](https://twitter.com/rangelabs)

The Range Export script allows you to extract information from your team's
Range workspace.

This package makes use of Range API Keys, be careful to keep these keys secure.
Avoid checking them into git repositories or leaving them in unsecured source
code.

## Installation

```bash
$ npm install -g range-export-cli
```

## Usage

This package needs to be configured with an API key which you can generate by visiting your
[developer dashboard](https://range.co/_/settings/developer). The key can be passed in via the
`RANGE_ACCESS_KEY` environment variable.

```bash
$ export RANGE_ACCESS_KEY='deadbeef1234567890'
$ range-export-cli --help
```

### Options

| Flag           | Description                                                |
| -------------- | ---------------------------------------------------------- |
| _--after, -a_  | Return data after this JS compatible data.                 |
| _--before, -b_ | Return data after this JS compatible data.                 |
| _--fmt_        | Modify the output format; json or csv. (default: json)     |
| _--images_     | Download images and use local references. (default: false) |
| _--target_       | A user_id or team_id to fetch data for. (default: everything visible to API key ) |
| _--out_        | Output directory or file (default: ./range-export.json)    |

### Export check-in data

Export all check-ins for the workspace between two dates.

```bash
$ range-export-cli check-ins -a 2020-01-01 -b 2020-02-01 -o meetings.json
```

### Export meeting data

Export meetings for an org, team, or user.

```bash
$ range-export-cli meetings -o meetings.json
```

### On Formats

The JSON will contain nested entities that can be traversed as a tree.

HTML is only currently supported for check-ins.

CSV data will be "unwound" such that there is one row per item. If a check-in
has 3 plan items and 6 past items, there will be 9 rows per check-in. This format
does not work well with meeting data.

```
user_id,user_name,update_id,published_at,client_timezone_offset,mood,mood_color,snippets.id,snippets.type,snippets.is_main_focus,snippets.callout,snippets.content,snippets.attachment_id,snippets.attachment_provider,snippets.attachment_type,snippets.attachment_subtype,snippets.attachment_name,snippets.attachment_url
AAoBFg5fsqC7IqAmwgDy,Rence Calico,AB8BFg7z_0K1eAG6-gAc,2020-05-14T17:06:36Z,420,:grimacing:,UNSET_COLOR,AB4BFg7vGhqnbtYlWgD1,PAST,true,FYI,Tech spec drafted and now ready for review and comments. We will discuss this in today's planning session for next cycle #Delight,ACEBFg7vGhkiSzf2JAA0,Google Documents,DOCUMENT,GOOGLE_DOCUMENT,Project Garfield Tech Specification,https://docs.google.com/document/d/1ZROrMdgdkPMsAjci0gZmjksGDqMQr__-_ZD_tjvqR3s/edit
AAoBFg5fsqC7IqAmwgDy,Rence Calico,AB8BFg7z_0K1eAG6-gAc,2020-05-14T17:06:36Z,420,:grimacing:,UNSET_COLOR,AB4BFg7xh5R1H3v3uwDK,PAST,false,,,ACEBFg7xh5Mwv28k1AC1,Range Meeting Actions,TASK,,Draft Project Lasagna Tech Spec,https://meet.range.co/bbck7/cycle-planning/1
AAoBFg5fsqC7IqAmwgDy,Rence Calico,AB8BFg7z_0K1eAG6-gAc,2020-05-14T17:06:36Z,420,:grimacing:,UNSET_COLOR,AB4BFg7y_3blbfEvzQCL,PAST,false,feedback,Have proposed solution as comments in issue. Please review and react. #Catnip,ACEBFg7y_3WVXZ0KPgDE,GitHub,ISSUE,,3 uses of nip in rapid succession breaking build,https://github.com/Purrfect-Software/catnip/issues/2
AAoBFg5fsqC7IqAmwgDy,Rence Calico,AB8BFg7z_0K1eAG6-gAc,2020-05-14T17:06:36Z,420,:grimacing:,UNSET_COLOR,AB4BFg7vRDCeDCZYFwAg,PAST,false,,Proposed revised workflow for code reviews,ACEBFg7vRC9khX0IIgBN,Google Drawing,DOCUMENT,GOOGLE_DRIVE,Updated Code Review Workflow,https://docs.google.com/drawings/d/15taoox6U3EvwD9UIU08BC6T17bkoAtLfQirZ3QoTAio/edit?usp=drivesdk
```

## About Range

_Range helps teams know what’s happening, stay in sync, and actually feel like a team. It’s
thoughtfully designed software that helps teams share daily check-ins, track goals, and run better
meetings. So you can do your best work together._

_Everything is easier in Range because it works with the tools you already use. Your tasks,
documents, and code changes are already in Range, so you don’t have to enter data twice._

_Find out more at [www.range.co](https://www.range.co)._
