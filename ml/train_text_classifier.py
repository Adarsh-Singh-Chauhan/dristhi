"""Train a provenance-aware multilingual DRISHTI text classifier.

This script does not ship a model or scrape data. It fine-tunes a selected
multilingual base model only on a curator-supplied, licensed, human-verified CSV.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from datetime import date
from urllib.parse import urlparse

import pandas as pd
from datasets import Dataset
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_fscore_support
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
    set_seed,
)

LABELS = ["supported", "false_or_manipulated", "misleading_context", "insufficient_evidence"]
REQUIRED_COLUMNS = {
    "text", "label", "language", "source_url", "source_publisher",
    "source_license", "verified_at", "split",
}
MODEL_CHOICES = {
    "mbert": "bert-base-multilingual-cased",
    "xlmr": "xlm-roberta-base",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_and_validate(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path).fillna("")
    missing = sorted(REQUIRED_COLUMNS - set(frame.columns))
    if missing:
        raise ValueError("Dataset is missing required columns: " + ", ".join(missing))
    for column in REQUIRED_COLUMNS:
        frame[column] = frame[column].astype(str).str.strip()
    for column in REQUIRED_COLUMNS - {"split"}:
        if (frame[column] == "").any():
            raise ValueError(f"Every row must include provenance/content field: {column}")
    for row_number, source_url in enumerate(frame["source_url"], start=2):
        parsed = urlparse(source_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError(f"Row {row_number}: source_url must be an absolute HTTP(S) URL.")
    for row_number, verified_at in enumerate(frame["verified_at"], start=2):
        try:
            date.fromisoformat(verified_at[:10])
        except ValueError as exc:
            raise ValueError(f"Row {row_number}: verified_at must begin with an ISO date (YYYY-MM-DD).") from exc
    invalid_labels = sorted(set(frame["label"]) - set(LABELS))
    if invalid_labels:
        raise ValueError("Unsupported labels: " + ", ".join(invalid_labels))
    if not set(frame["split"]).issubset({"train", "validation", "test"}):
        raise ValueError("split must be train, validation or test.")
    if set(frame["split"]) != {"train", "validation", "test"}:
        raise ValueError("Provide separate train, validation and test splits.")
    normalized = frame["text"].str.casefold().str.replace(r"\s+", " ", regex=True)
    if normalized.duplicated().any():
        duplicates = normalized[normalized.duplicated()].index.tolist()[:5]
        raise ValueError(f"Duplicate texts can leak across splits; inspect row indices: {duplicates}")
    for split in ("train", "validation", "test"):
        subset = frame[frame["split"] == split]
        if subset.empty:
            raise ValueError(f"The {split} split is empty.")
        if split == "train" and set(subset["label"]) != set(LABELS):
            raise ValueError("The train split must contain examples for all four labels.")
    return frame


def metrics(eval_prediction):
    logits, labels = eval_prediction
    predictions = logits.argmax(axis=-1)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average="macro", zero_division=0
    )
    return {
        "accuracy": float(accuracy_score(labels, predictions)),
        "macro_precision": float(precision),
        "macro_recall": float(recall),
        "macro_f1": float(f1),
    }


def to_dataset(frame: pd.DataFrame, tokenizer, label2id: dict[str, int]) -> Dataset:
    dataset = Dataset.from_pandas(
        frame[["text", "label"]].assign(label_id=lambda x: x["label"].map(label2id)),
        preserve_index=False,
    )

    def tokenize(batch):
        return tokenizer(batch["text"], truncation=True, max_length=256)

    tokenized = dataset.map(tokenize, batched=True, remove_columns=["text", "label"])
    return tokenized.rename_column("label_id", "labels")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", required=True, type=Path, help="Curated CSV with the required provenance columns.")
    parser.add_argument("--model", choices=MODEL_CHOICES, default="xlmr")
    parser.add_argument("--output", type=Path, default=Path("artifacts/drishti-xlmr"))
    parser.add_argument("--epochs", type=float, default=3.0)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    if args.epochs <= 0 or args.batch_size < 1 or args.learning_rate <= 0:
        parser.error("epochs, batch-size and learning-rate must be positive.")

    frame = load_and_validate(args.dataset)
    set_seed(args.seed)
    base_model = MODEL_CHOICES[args.model]
    label2id = {label: index for index, label in enumerate(LABELS)}
    id2label = {index: label for label, index in label2id.items()}

    tokenizer = AutoTokenizer.from_pretrained(base_model)
    model = AutoModelForSequenceClassification.from_pretrained(
        base_model,
        num_labels=len(LABELS),
        label2id=label2id,
        id2label=id2label,
    )
    datasets = {
        split: to_dataset(frame[frame["split"] == split], tokenizer, label2id)
        for split in ("train", "validation", "test")
    }
    args.output.mkdir(parents=True, exist_ok=True)
    training_args = TrainingArguments(
        output_dir=str(args.output / "checkpoints"),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        weight_decay=0.01,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="macro_f1",
        greater_is_better=True,
        save_total_limit=2,
        logging_steps=25,
        report_to="none",
        seed=args.seed,
    )
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=datasets["train"],
        eval_dataset=datasets["validation"],
        tokenizer=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        compute_metrics=metrics,
    )
    trainer.train()
    validation_metrics = trainer.evaluate(datasets["validation"], metric_key_prefix="validation")
    test_prediction = trainer.predict(datasets["test"], metric_key_prefix="test")
    predicted = test_prediction.predictions.argmax(axis=-1)
    truth = test_prediction.label_ids
    test_report = classification_report(
        truth, predicted, labels=list(range(len(LABELS))),
        target_names=LABELS, output_dict=True, zero_division=0,
    )
    test_confusion = confusion_matrix(
        truth, predicted, labels=list(range(len(LABELS)))
    ).tolist()

    per_language = {}
    test_frame = frame[frame["split"] == "test"].reset_index(drop=True)
    for language in sorted(test_frame["language"].unique()):
        indexes = test_frame.index[test_frame["language"] == language].tolist()
        if not indexes:
            continue
        lang_truth = truth[indexes]
        lang_pred = predicted[indexes]
        p, r, f, _ = precision_recall_fscore_support(
            lang_truth, lang_pred, average="macro", zero_division=0
        )
        per_language[language] = {
            "samples": len(indexes),
            "accuracy": float(accuracy_score(lang_truth, lang_pred)),
            "macro_precision": float(p),
            "macro_recall": float(r),
            "macro_f1": float(f),
            "confusion_matrix": confusion_matrix(
                lang_truth, lang_pred, labels=list(range(len(LABELS)))
            ).tolist(),
        }

    trainer.save_model(str(args.output))
    tokenizer.save_pretrained(str(args.output))
    model_card = {
        "model_name": args.model,
        "base_model": base_model,
        "labels": LABELS,
        "dataset_sha256": sha256_file(args.dataset),
        "dataset_rows": int(len(frame)),
        "dataset_publishers": sorted(frame["source_publisher"].unique().tolist()),
        "dataset_licenses": sorted(frame["source_license"].unique().tolist()),
        "split_counts": frame["split"].value_counts().to_dict(),
        "validation_metrics": validation_metrics,
        "test_metrics": test_report,
        "test_confusion_matrix": {
            "labels": LABELS,
            "rows_are_true_labels": True,
            "columns_are_predicted_labels": True,
            "values": test_confusion,
        },
        "per_language_test_metrics": per_language,
        "interpretation": (
            "Research triage signal only. Not a truth verdict, person score, political classifier, "
            "or automatic moderation decision. Human evidence review is mandatory."
        ),
    }
    (args.output / "drishti-model-card.json").write_text(
        json.dumps(model_card, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({"output": str(args.output), "validation": validation_metrics,
                      "test": test_report, "per_language": per_language}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
