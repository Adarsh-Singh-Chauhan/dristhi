"""Descriptive graph signals from pseudonymous public interaction edges.

This module reports aggregate coordination indicators only. It does not label
accounts as bots, identify people, ingest platform data, or attribute campaigns.
"""
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import re

import networkx as nx

REQUIRED = {"source_actor_hash", "target_actor_hash", "timestamp"}


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def analyse_edges(path: Path, window_minutes: int = 5) -> dict:
    if window_minutes < 1 or window_minutes > 1440:
        raise ValueError("window_minutes must be between 1 and 1440")
    graph = nx.DiGraph()
    windows: Counter[str] = Counter()
    rows = 0

    with path.open("r", newline="", encoding="utf-8-sig") as stream:
        reader = csv.DictReader(stream)
        missing = REQUIRED - set(reader.fieldnames or [])
        if missing:
            raise ValueError("CSV is missing columns: " + ", ".join(sorted(missing)))
        for row in reader:
            source = (row.get("source_actor_hash") or "").strip()
            target = (row.get("target_actor_hash") or "").strip()
            timestamp = parse_timestamp((row.get("timestamp") or "").strip())
            if not re.fullmatch(r"[a-fA-F0-9]{64}", source) or not re.fullmatch(r"[a-fA-F0-9]{64}", target):
                raise ValueError("Actor identifiers must be SHA-256 hex hashes; do not use usernames, emails or raw IDs.")
            if source == target:
                continue
            graph.add_edge(source, target)
            bucket_minute = (timestamp.minute // window_minutes) * window_minutes
            bucket = timestamp.replace(minute=bucket_minute, second=0, microsecond=0)
            windows[bucket.isoformat()] += 1
            rows += 1

    if graph.number_of_nodes() == 0:
        return {
            "events": 0, "nodes": 0, "edges": 0, "density": 0.0,
            "reciprocal_edge_ratio": 0.0, "weak_components": 0,
            "max_in_degree": 0, "max_out_degree": 0,
            "peak_to_median_window_ratio": 0.0,
            "interpretation": "No usable interaction edges were supplied.",
            "caution": "Descriptive metadata only; not proof of bot activity or coordination.",
        }

    edge_count = graph.number_of_edges()
    reciprocal_pairs = sum(1 for source, target in graph.edges if graph.has_edge(target, source))
    reciprocal_ratio = reciprocal_pairs / edge_count if edge_count else 0.0
    counts = list(windows.values())
    median = sorted(counts)[len(counts) // 2] if counts else 0
    peak_ratio = (max(counts) / median) if median else (float(max(counts)) if counts else 0.0)

    return {
        "events": rows,
        "nodes": graph.number_of_nodes(),
        "edges": edge_count,
        "density": round(float(nx.density(graph)), 6),
        "reciprocal_edge_ratio": round(reciprocal_ratio, 6),
        "weak_components": nx.number_weakly_connected_components(graph),
        "max_in_degree": max(dict(graph.in_degree()).values(), default=0),
        "max_out_degree": max(dict(graph.out_degree()).values(), default=0),
        "time_window_minutes": window_minutes,
        "active_windows": len(windows),
        "peak_to_median_window_ratio": round(float(peak_ratio), 4),
        "interpretation": (
            "These metrics may prioritise a dataset for analyst inspection. "
            "They do not establish automation, intent, identity or coordinated influence."
        ),
        "caution": (
            "Use only lawfully obtained public metadata with appropriate platform permissions. "
            "Pseudonymise identifiers, minimise retention and require human investigation."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--window-minutes", type=int, default=5)
    args = parser.parse_args()
    print(json.dumps(analyse_edges(args.input, args.window_minutes), indent=2))


if __name__ == "__main__":
    main()
