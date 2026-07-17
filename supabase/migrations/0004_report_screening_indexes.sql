-- Query support for duplicate detection and unresolved moderation queues.
create index if not exists idx_duplicate_detections_report
  on duplicate_detections(report_id, similarity_score desc);

create index if not exists idx_duplicate_detections_possible_duplicate
  on duplicate_detections(possible_duplicate_report_id);

create index if not exists idx_flagged_contents_report_open
  on flagged_contents(report_id, is_resolved, flagged_at desc);

create index if not exists idx_reports_screening_queue
  on reports(status, duplicate_score desc, submission_date desc);
