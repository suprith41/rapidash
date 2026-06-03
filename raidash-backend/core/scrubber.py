import re


PAN_PATTERN = re.compile(r"[A-Z]{5}[0-9]{4}[A-Z]{1}")
CLIENT_ID_PATTERN = re.compile(r"\b[A-Z]{2}[0-9]{8}\b")
IFSC_PATTERN = re.compile(r"[A-Z]{4}0[A-Z0-9]{6}")
PHONE_PATTERN = re.compile(r"\b[6-9]\d{9}\b")
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
# CDSL DP ID: an 8-digit number that appears within ~60 chars of a "DP ID" / "DP-ID" label
# (DOTALL flag so we also catch multiline proximity)
_DP_ID_CONTEXTUAL_RE = re.compile(
    r"(DP[-\s]?ID\s*[:\-]?\s*)\b(\d{8})\b",
    re.IGNORECASE,
)


def scrub_pii(raw_text: str) -> str:
    remaining_text = "\n".join(raw_text.splitlines()[20:])

    # Replace CDSL DP ID first so the 8-digit number is removed before the
    # generic phone pattern (which only targets 10-digit numbers, but belt-and-
    # suspenders prevents future regressions).
    sanitized_text = _DP_ID_CONTEXTUAL_RE.sub(
        lambda m: m.group(1) + "[REDACTED_DP_ID]", remaining_text
    )
    sanitized_text = PAN_PATTERN.sub("[REDACTED_PAN]", sanitized_text)
    sanitized_text = CLIENT_ID_PATTERN.sub("[REDACTED_CLIENT_ID]", sanitized_text)
    sanitized_text = IFSC_PATTERN.sub("[REDACTED_IFSC]", sanitized_text)
    sanitized_text = PHONE_PATTERN.sub("[REDACTED_PHONE]", sanitized_text)
    sanitized_text = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", sanitized_text)

    return sanitized_text


if __name__ == "__main__":
    header_lines = [
        "Client Name: Example Investor",
        "Address: 1 Market Street",
        "Client ID: AB12345678",
        "PAN: ABCDE1234F",
        "Email: header@example.com",
        "Phone: 9876543210",
        "Bank IFSC: HDFC0123456",
        "Header line 8",
        "Header line 9",
        "Header line 10",
        "Header line 11",
        "Header line 12",
        "Header line 13",
        "Header line 14",
        "Header line 15",
        "Header line 16",
        "Header line 17",
        "Header line 18",
        "Header line 19",
        "Header line 20",
    ]
    body = "\n".join(
        [
            "Holding ISIN INE009A01021 should remain visible.",
            "PAN ABCDE1234F should be hidden.",
            "Demat client ID AB12345678 should be hidden.",
            "IFSC HDFC0123456 should be hidden.",
            "Phone 9876543210 should be hidden.",
            "Email investor@example.com should be hidden.",
        ]
    )
    sample_text = "\n".join(header_lines + [body])
    result = scrub_pii(sample_text)

    assert "Client Name: Example Investor" not in result
    assert "INE009A01021" in result
    assert "ABCDE1234F" not in result
    assert "AB12345678" not in result
    assert "HDFC0123456" not in result
    assert "9876543210" not in result
    assert "investor@example.com" not in result
    assert "[REDACTED_PAN]" in result
    assert "[REDACTED_CLIENT_ID]" in result
    assert "[REDACTED_IFSC]" in result
    assert "[REDACTED_PHONE]" in result
    assert "[REDACTED_EMAIL]" in result

    print("scrub_pii inline tests passed")
