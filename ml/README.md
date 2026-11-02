# DRISHTI multilingual ML research pipeline

This directory provides a reproducible **training and local inference workflow** for mBERT and XLM-RoBERTa. It does not contain trained weights and is not yet connected to the production FastAPI analyser.

## Current status

- Production API: deterministic, explainable text rules only (backend/app/analyzer.py).
- Training code: available here for curator-supplied labelled datasets.
- Trained production model: **not yet available**.
- Live social-network ingestion, NetworkX campaign analysis and Gemini Q&A: **not enabled**.

Do not present the model roadmap as shipped functionality until a model has been trained, independently evaluated and integrated behind an explicit feature flag.

## Models

| Key | Base checkpoint | Intended use |
| --- | --- | --- |
| mbert | bert-base-multilingual-cased | Multilingual text classification baseline |
| xlmr | xlm-roberta-base | Cross-lingual classification baseline |

Use English, Hindi and Hinglish examples with a manually reviewed language field. Code-mixed examples should be retained as a distinct evaluation group where possible.

## Dataset contract

Prepare a UTF-8 CSV with these columns:

| Column | Required meaning |
| --- | --- |
| text | Public claim/post text that the team is licensed and authorised to use |
| label | One of the four controlled labels below |
| language | en, hi, hinglish or another documented language tag |
| source_url | Canonical source or fact-check reference |
| source_publisher | Publisher / fact-check organisation |
| source_license | Explicit reuse licence or documented permission |
| verified_at | ISO date when a qualified fact-check/source review was completed |
| split | Curator-assigned train, validation or test split |

Allowed labels:

- supported: the submitted claim is supported by cited evidence.
- false_or_manipulated: the specific claim or media was verified false/manipulated.
- misleading_context: authentic material is presented with materially misleading date, place or context.
- insufficient_evidence: reliable evidence does not support a conclusion.

Do not label satire, criticism, opinion, political affiliation, identity or dissent as false. Do not use an unverified social post as ground truth. Keep publisher/source provenance with each row; retain the source licence and attribution requirements.

## Train

Create an isolated Python environment, install ml/requirements.txt, and pass a curated CSV:

~~~bash
python -m venv .venv-ml
# Windows PowerShell:
.venv-ml/Scripts/Activate.ps1
pip install -r ml/requirements.txt

python ml/train_text_classifier.py --dataset path/to/verified_claims.csv --model xlmr --output artifacts/drishti-xlmr
python ml/train_text_classifier.py --dataset path/to/verified_claims.csv --model mbert --output artifacts/drishti-mbert
~~~

The script requires absolute HTTP(S) source URLs, ISO verification dates, explicit train/validation/test partitions, provenance fields and all four labels in training data. Its model card records overall and language-wise metrics and confusion matrices. It rejects exact duplicate text across the full input to reduce accidental split leakage. Keep the test set untouched until model selection is complete.

## Predict locally

~~~bash
python ml/predict_text.py --model-dir artifacts/drishti-xlmr --threshold 0.70 --text "Paste a public claim here"
~~~

Predictions below the threshold are returned as uncertain. A high-confidence class is still only a triage signal. It must not set a user's case outcome or publish an accusation.

## Evaluation gate before production

Record and review:

1. Macro precision, recall and F1 on a held-out test set.
2. Per-language and code-mixed results, including false-positive / false-negative counts.
3. Confusion matrix by label and error review by a human fact-checker.
4. Calibration and abstention coverage at the proposed operating threshold.
5. Robustness against satire, quotes, negation, regional language, spelling variation and breaking-news claims.
6. Dataset balance, licensing, consent, source quality, duplicate leakage and label disagreement.
7. Model card, dataset hash, model version and rollback plan.

Do not connect model predictions to automatic blocking, account sanctions, police referrals or final case status.

## NetworkX research module

graph_signals.py accepts an analyst-prepared CSV with `source_actor_hash`, `target_actor_hash` and ISO `timestamp` columns. Actor identifiers must be 64-character SHA-256 hexadecimal hashes; usernames, emails and raw platform IDs are rejected. It reports descriptive graph metrics and synchronised activity windows. It does not identify real people, scrape platforms, decide whether an account is a bot or attribute a campaign. Source collection must comply with platform terms, applicable law, public-content restrictions and data-minimisation rules.

## Not included

- No private WhatsApp/Telegram collection.
- No unauthorised scraping with snscrape.
- No API keys or social-platform credentials.
- No Gemini key, external LLM call or chatbot integration.
- No production model weights or claim that a model has already been trained.

See docs/ARCHITECTURE.md for the deployment and trust boundaries.
