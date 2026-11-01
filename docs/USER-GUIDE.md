# DRISHTI — User & Superadmin Guide

This guide covers the current website and the browser-only demo. For system design and API details, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Start here

- Public website: [dristhi-five.vercel.app](https://dristhi-five.vercel.app/)
- Main user workspace: [Open workspace](https://dristhi-five.vercel.app/frontend/)
- 40-minute guided demo: [Open demo](https://dristhi-five.vercel.app/frontend/demo.html)
- API documentation: [Swagger UI](https://dristhi-five.vercel.app/docs)
- Mobile app help: [PWA install guide](../frontend/guide.html)

## 2. User workspace — analyse a claim

![Illustrative DRISHTI user workspace](assets/user-workspace-screen.svg)

1. Open the workspace and choose **Overview**.
2. Paste a public message or claim that you are authorised to review. Avoid passwords, private group messages and personal data.
3. Select where you saw it (WhatsApp, Telegram, Instagram, Facebook, X, website or other).
4. Add the original public source URL when available.
5. Choose **Analyse message**.
6. Read each matched indicator, the explanation and the recommended checks. A low signal score does not prove a claim is correct. A high score does not prove it is false.
7. Look for the primary circular/announcement, publication date, original media and independent corroboration before making a decision.

### What the current analysis result means

The production baseline is deterministic and rule-based. It can flag selected urgency terms, forwarding pressure, in-text authority claims, panic wording, short links and formatting patterns. It does not fetch the web, inspect videos/images, verify a government source or run a trained mBERT/XLM-RoBERTa model.

## 3. Create and track a case file

1. Run an analysis on the claim.
2. In the result panel, fill in a neutral case title and choose a category.
3. Add context for a human reviewer. Do not include passwords or unnecessary personal information.
4. Choose **Create case file**.
5. Open **My case files** to view the case ID and current status.

Possible case outcomes are:

- **Received:** the system has accepted the case; nobody has verified the claim yet.
- **Under review:** a human reviewer is checking the source and evidence.
- **Verified false:** a reviewer has recorded why the claim is false/manipulated and attached at least one evidence URL.
- **Supported by sources:** the submitted claim is supported by the cited material.
- **Misleading context:** the media or statement may be genuine, but context, date, location or framing changes its meaning.
- **Insufficient evidence:** available evidence does not justify a reliable conclusion.
- **Closed:** review is closed without a stronger public conclusion.

A signal score by itself cannot set any of these final outcomes.

## 4. Alerts, trusted contacts and SOS

1. Open **Alerts & SOS**.
2. Sign in with your normal user account.
3. Add trusted contacts that you may want to reference in an SOS submission.
4. Enter a clear title and incident details.
5. Add a source URL if available.
6. Location sharing is optional. If selected, the browser asks for GPS permission and submits a one-time location snapshot with that SOS record.
7. Check the SOS status from the same page.

**Important:** DRISHTI's SOS is an internal review queue. It does not automatically call police, emergency services, SMS, WhatsApp or trusted contacts. In a real emergency, contact local emergency services directly.

## 5. Superadmin control room

![Illustrative DRISHTI Superadmin control room](assets/superadmin-control-room.svg)

1. Open the separate [Superadmin login](https://dristhi-five.vercel.app/frontend/admin.html).
2. Sign in using the account promoted through the one-time first-Superadmin bootstrap procedure. Do not use a public demo password for a production account.
3. Review the **Evidence & case review queue**.
4. Open the user's submitted source and check primary or independent sources.
5. Add an evidence summary, source URLs and reviewer notes.
6. Set an outcome. The API requires a summary and at least one URL before saving verified-false, supported-by-sources or misleading-context outcomes.
7. Review the SOS queue, publish in-app notices where appropriate, and inspect the audit trail.

The Superadmin console also has the Public IP / Domain Threat Intelligence registry. Only add public indicators that you are authorised to investigate. Each entry should include a provenance/source reference and analyst note.

## 6. Global Signal Atlas & location

- The map plots coordinates explicitly shared by a user for an SOS or coordinates entered by a Superadmin for a public IOC.
- GeoIP is an approximate network-region estimate, not a device's precise position.
- VPNs, proxies, carrier networks and shared cloud egress can make estimates inaccurate.
- DRISHTI does not silently collect visitor IPs, identify the person behind an IP or track anyone's live movement.
- Use the map as an incident context view, not a surveillance system.

## 7. Install DRISHTI on a phone

DRISHTI's current mobile experience is an installable Progressive Web App (PWA).

**Android (Chrome):**
1. Open the HTTPS user workspace.
2. Tap **Install app** if it appears; otherwise open the ⋮ browser menu.
3. Choose **Install app** or **Add to Home screen**.
4. Launch DRISHTI using its home-screen icon.

**iPhone (Safari):**
1. Open the HTTPS user workspace in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen** and confirm.

The app shell can open when cached. Login, API analysis, case persistence and admin actions still require the backend and configured database. This is not currently a native Play Store APK or App Store app.

## 8. Try the 40-minute product demo

The demo is a separate, public, fictional sandbox. It does not use the production API or grant access to real accounts.

| Role | Demo ID | Password |
| --- | --- | --- |
| Mobile / User | `demo.user@drishti.in` | `DRISHTI-USER-40` |
| Superadmin tour | `demo.superadmin@drishti.in` | `DRISHTI-ADMIN-40` |

1. Open [Try the demo](https://dristhi-five.vercel.app/frontend/demo.html).
2. Select one of the two demo roles.
3. Enter the demo ID and password above (the quick-fill controls can fill them).
4. Explore analysis, sample case creation, the Superadmin review queue and the sample global atlas.
5. The timer counts down from 40 minutes. At expiry, the demo session and sample case data are cleared from that tab.

Demo actions are stored in browser `sessionStorage`; they are not saved to the production backend. These public credentials must never be used as real account credentials.

## 9. Production setup status

The live app's account-based functionality needs a persistent PostgreSQL database configured as the Vercel `DATABASE_URL` environment variable. The connected Vercel project currently has no `DATABASE_URL`. Until it is configured, anonymous analysis and static pages can be viewed, but production sign-in, persistent case files, history, alerts, SOS and the real Superadmin console remain unavailable.

Never put a database password, JWT secret or real administrator credential in GitHub, the public guide or the demo page.
