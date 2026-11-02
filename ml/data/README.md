# Dataset intake — DRISHTI ML

Place curated datasets in a private, access-controlled workspace. Do not commit raw social-media data, private messages, personal information, credentials or unlicensed text to this public repository.

Before an item is included, retain:

- The public canonical URL and publisher / fact-check organisation.
- The explicit reuse licence or written permission.
- The date of verification and the exact claim being labelled.
- The language tag (including a Hinglish/code-mixed tag where relevant).
- The reviewer/curator provenance in a private audit record.
- The assigned train / validation / test partition.

Use only these controlled labels: supported, false_or_manipulated, misleading_context, insufficient_evidence.

Do not label opinions, satire, political affiliation, identity, criticism or dissent as false. Exclude records where the primary source is missing or the fact-check conclusion is ambiguous. Keep near-duplicate stories in the same split to avoid test leakage.

The training script expects a CSV with columns:
text,label,language,source_url,source_publisher,source_license,verified_at,split

This repository intentionally contains no scraped corpus or fabricated benchmark samples.
