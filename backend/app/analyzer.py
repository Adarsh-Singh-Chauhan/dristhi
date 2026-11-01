"""Explainable baseline signal analysis. This does not determine factual truth."""
from __future__ import annotations

import re
from urllib.parse import urlparse

SIGNAL_RULES = [
    {
        "key": "urgency_language", "label": "Urgency language", "weight": 18,
        "phrases": ("act now", "immediately", "right now", "urgent", "before it is too late", "तुरंत", "अभी", "फौरन", "तत्काल"),
        "detail": "Urgent wording may pressure readers to react before checking the source.",
    },
    {
        "key": "share_pressure", "label": "Forwarding pressure", "weight": 22,
        "phrases": ("forward this", "forward to everyone", "share with everyone", "send to all", "share widely", "make it viral", "सबको भेजें", "आगे भेजें", "फॉरवर्ड करें", "अधिक से अधिक शेयर", "हर ग्रुप में भेजें"),
        "detail": "The message encourages rapid redistribution rather than independent verification.",
    },
    {
        "key": "authority_claim", "label": "Authority claim without an in-text source", "weight": 18,
        "phrases": ("official announcement", "government has announced", "police confirmed", "army confirmed", "official sources say", "सरकार ने आदेश दिया", "पुलिस ने पुष्टि की", "आधिकारिक घोषणा", "सरकारी आदेश"),
        "detail": "The text invokes an authority but does not itself provide a verifiable primary-source reference.",
    },
    {
        "key": "forward_chain", "label": "Forward-chain marker", "weight": 12,
        "phrases": ("forwarded many times", "forwarded as received", "whatsapp forward", "fwd:", "forwarded message", "फॉरवर्डेड मैसेज", "जैसा मिला वैसा भेजा"),
        "detail": "A forwarding marker suggests the original publisher or context may be missing.",
    },
    {
        "key": "panic_language", "label": "Panic or threat language", "weight": 18,
        "phrases": ("panic", "chaos", "massive danger", "everyone is at risk", "will be shut down", "account will be blocked", "दहशत", "हड़कंप", "सब खतरे में", "बंद हो जाएगा", "खाता बंद", "भारी खतरा"),
        "detail": "Alarm-oriented wording may amplify fear; check whether the underlying risk is supported by evidence.",
    },
]
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "ow.ly", "buff.ly", "rebrand.ly"}


def _shortened_url_present(text: str) -> bool:
    candidates = re.findall(r"https?://[^\s<>\])}]+|www\.[^\s<>\])}]+", text, flags=re.IGNORECASE)
    for candidate in candidates:
        candidate = candidate.rstrip(".,!?;:")
        candidate = candidate if "://" in candidate else "https://" + candidate
        try:
            if (urlparse(candidate).hostname or "").lower() in SHORTENERS:
                return True
        except ValueError:
            continue
    return False


def analyze_text(content: str) -> dict:
    normalized = content.casefold()
    indicators = []
    score = 0
    for rule in SIGNAL_RULES:
        matches = [phrase for phrase in rule["phrases"] if phrase in normalized]
        if matches:
            score += rule["weight"]
            indicators.append({
                "key": rule["key"], "label": rule["label"], "weight": rule["weight"],
                "matched_terms": matches[:4], "detail": rule["detail"],
            })

    if _shortened_url_present(content):
        score += 12
        indicators.append({
            "key": "shortened_link", "label": "Shortened URL detected", "weight": 12,
            "matched_terms": ["shortened URL"],
            "detail": "The destination is obscured by a URL shortener. Expand and inspect it safely before opening.",
        })

    letters = [char for char in content if char.isalpha()]
    uppercase = [char for char in letters if char.isupper()]
    if len(letters) >= 24 and len(uppercase) / len(letters) >= 0.35:
        score += 10
        indicators.append({
            "key": "excessive_caps", "label": "Unusually high capitalisation", "weight": 10,
            "matched_terms": ["uppercase ratio"],
            "detail": "Heavy capitalisation can attract attention, but is not evidence that a claim is false.",
        })

    if re.search(r"[!?]{3,}", content):
        score += 6
        indicators.append({
            "key": "repeated_punctuation", "label": "Repeated emphatic punctuation", "weight": 6,
            "matched_terms": ["repeated punctuation"],
            "detail": "Repeated punctuation adds emotional emphasis; assess the claim using independent evidence.",
        })

    score = min(score, 100)
    if score >= 60:
        priority, label = "high", "High review priority"
        summary = "Several surface-level signals were detected. Verify the claim and its source before sharing."
    elif score >= 30:
        priority, label = "medium", "Needs review"
        summary = "Some review signals were detected. Check the original source and context."
    else:
        priority, label = "low", "Low signal detected"
        summary = "Few baseline warning patterns were detected. This does not confirm that the content is accurate."

    checks = [
        "Find the earliest available publication of the claim.",
        "Look for a primary source such as the original notice, dataset or full statement.",
        "Check the date, location and surrounding context.",
        "Compare independent, credible sources before reaching a conclusion.",
        "If media is attached, check whether it is old, cropped or out of context.",
        "Do not open unfamiliar links or enter credentials on untrusted pages.",
    ]
    return {
        "score": score, "priority": priority, "label": label, "summary": summary,
        "indicators": indicators, "recommended_checks": checks,
        "method": "baseline-rules-v1",
        "disclaimer": "This is a heuristic review-priority signal, not a fact-check, truth probability or political classification. Human verification is required.",
    }
