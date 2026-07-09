# Database Design

The schema is based on the draw.io class diagram for Truth Uncovered.

## Main Entity Groups

### User and Role Tables

- `app_users`
- `citizens`
- `admins`
- `government_officers`
- `ngo_partners`

### Reporting and Evidence Tables

- `reports`
- `locations`
- `evidence_files`
- `duplicate_detections`
- `flagged_contents`

### Case Workflow Tables

- `cases`
- `follow_up_reports`
- `institutions`
- `trust_scores`

### Public Intelligence Tables

- `analytics_dashboards`
- `heatmap_data`
- `fame_shame_records`
- `impact_stories`
- `public_report_directory`

### Content and Engagement Tables

- `blog_posts`
- `legal_resources`
- `badges`
- `gamification_records`
- `notifications`

## Important Relationship Summary

- One `app_user` may have one role-specific profile.
- One `citizen` may submit many `reports`.
- One `report` belongs to one `location`.
- One `report` may have many `evidence_files`.
- One `report` may spawn zero or one `case`.
- One `case` may include many `follow_up_reports`.
- One `case` may be assigned to one `government_officer` and one `ngo_partner`.
- One `report` may be filed against one `institution`.
- One `institution` may have many `trust_scores`, `fame_shame_records`, and `impact_stories`.
- One `admin` may publish many `blog_posts` and `legal_resources`.
- One `citizen` may earn many `gamification_records`.
- One `app_user` may receive many `notifications`.

