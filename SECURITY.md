# Security Policy

## Supported scope

DRISHTI is an early-stage prototype. Security reports are welcome for vulnerabilities in repository code, authentication, data handling, API access controls and deployment examples.

## Reporting a vulnerability

Please do not publish exploit details, credentials, personal messages, tokens or private user data in a public issue.

Use GitHub's private vulnerability reporting feature for this repository when available. Include a concise description, potential impact, affected file or endpoint, reproduction steps using non-sensitive test data, and any suggested mitigation.

## Deployment safeguards

Before exposing an instance to the public internet:
- Use HTTPS and a strong, unique JWT secret.
- Restrict CORS to trusted frontend origins.
- Add gateway-level rate limiting and abuse monitoring.
- Configure backups and a documented data-retention policy.
- Review logs to ensure credentials and submitted content are not recorded.
- Add account recovery, email verification and a session-revocation strategy.
- Perform dependency, application-security and privacy reviews.

## Responsible-use boundary

DRISHTI must not be used to profile people by political opinion, suppress lawful speech, identify opponents, or automate consequential reporting and takedown decisions. Its baseline signals are not proof of factual falsity or malicious intent.
