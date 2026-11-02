"""Run a local DRISHTI multilingual model and abstain on low confidence."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

CAUTION = (
    "Model output is an auxiliary review signal, not a fact-check or proof. "
    "Verify primary sources and require a human reviewer."
)


def predict(model_dir: Path, text: str, threshold: float = 0.70) -> dict:
    if not 0.0 <= threshold <= 1.0:
        raise ValueError("threshold must be between 0 and 1")
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    model.eval()
    encoded = tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
    with torch.no_grad():
        logits = model(**encoded).logits[0]
        probabilities = torch.softmax(logits, dim=-1)
    confidence, index = torch.max(probabilities, dim=-1)
    score = float(confidence.item())
    label = model.config.id2label[int(index.item())]
    return {
        "model_label": label if score >= threshold else "uncertain",
        "candidate_label": label,
        "confidence": round(score, 4),
        "threshold": threshold,
        "human_review_required": True,
        "disclaimer": CAUTION,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", required=True, type=Path)
    parser.add_argument("--text", required=True)
    parser.add_argument("--threshold", type=float, default=0.70)
    args = parser.parse_args()
    print(json.dumps(predict(args.model_dir, args.text, args.threshold), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
