from app.analyzer import analyze_text


def test_neutral_text_has_low_signal():
    result = analyze_text("The library will open at 9 AM on Monday. Please check the official timetable.")
    assert result["priority"] == "low"
    assert result["score"] < 30


def test_forwarding_and_urgency_are_explained():
    result = analyze_text("URGENT: Act now. Forward this to everyone before it is too late!")
    keys = {item["key"] for item in result["indicators"]}
    assert "urgency_language" in keys
    assert "share_pressure" in keys
    assert result["priority"] in {"medium", "high"}


def test_shortened_link_is_a_signal_not_a_verdict():
    result = analyze_text("Please review this notice and check the link: https://bit.ly/example")
    assert any(item["key"] == "shortened_link" for item in result["indicators"])
    assert "not a fact-check" in result["disclaimer"]


def test_political_criticism_is_not_a_rule_by_itself():
    result = analyze_text("I disagree with this policy and believe the public debate should continue.")
    assert result["priority"] == "low"
