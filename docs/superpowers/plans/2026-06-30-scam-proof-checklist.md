# Scam-Proof Checklist Lead Magnet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and launch a free PDF lead magnet ("The Scam-Proof Checklist") that grows the Curious & Capable email list by solving Margaret's highest-urgency fear: not being able to tell a scam from something real.

**Architecture:** Three deliverables ship together — the PDF checklist, the opt-in page copy, and the distribution posts. The PDF is built in Canva. The opt-in is hosted via existing email platform (ConvertKit or equivalent). Posts are written for Facebook and Substack.

**Tech Stack:** Canva (PDF design), email marketing platform (opt-in/delivery), Facebook, Substack

## Global Constraints

- No em dashes anywhere in copy. Hard rule.
- No jargon: not "phishing," not "digital literacy," not "cyber." Plain English only.
- Minimum 14pt body font in the PDF.
- Never imply Margaret is slow or behind. She was never taught. That is different.
- Voice: sharp, warm, lived-in. Read `~/.claude/voice.md` before writing any copy.
- Brand colors and design system: read `~/.claude/curious-capable-design-system.md` before designing.
- One page only for the PDF. It must be printable on a standard 8.5x11 sheet.

---

### Task 1: Write the Final PDF Copy

**Files:**
- Create: `assets/lead-magnets/scam-proof-checklist/checklist-copy.md`

**Produces:** Finalized, print-ready copy for both sections of the PDF, approved before design begins.

- [ ] **Step 1: Create the file and write Section 1 copy**

Create `assets/lead-magnets/scam-proof-checklist/checklist-copy.md` with this content:

```markdown
# The Scam-Proof Checklist
### 5 Warning Signs and What to Do When You're Not Sure

---

## Know the Signs

If any of these are happening, stop before you do anything else.

1. They're pushing you to act RIGHT NOW and won't give you time to think.
2. They're asking for a gift card, wire transfer, or an unusual way to pay.
3. A pop-up appeared saying your computer is infected and you need to call a number.
4. Someone claiming to be your bank is asking for your account number or password.
5. Something feels off, even if you can't explain why. Trust that feeling.

---

## When You're Not Sure, Do This

1. **Stop.** Don't click anything, don't call any number on the screen, don't give any information.
2. **Close it.** Close the window or hang up the phone. You can always call back on a number you already know.
3. **Call someone you trust** before you do anything else. A family member, a friend, anyone.
4. **Report it.** Go to reportfraud.ftc.gov or call 1-877-382-4357.

Getting scammed is not your fault. It happens to careful, intelligent people every single day.
You don't have to be embarrassed, and you don't have to handle it alone.

---

*From Michael McIntosh at Curious & Capable.*
*More help at [your website URL]*
```

- [ ] **Step 2: Review copy against voice and audience rules**

Read the copy aloud. Check:
- Does every sentence sound like Mike, not a template?
- Is every warning sign written the way Margaret would say it, not the way a security researcher would?
- Are there any em dashes? (There should be none.)
- Is the note at the end of step 4 present and intact? It is load-bearing. Do not cut it.

Fix anything that fails. Commit when clean.

- [ ] **Step 3: Commit**

```bash
git add assets/lead-magnets/scam-proof-checklist/checklist-copy.md
git commit -m "feat: write scam-proof checklist PDF copy"
```

---

### Task 2: Design the PDF in Canva

**Files:**
- Consumes: `assets/lead-magnets/scam-proof-checklist/checklist-copy.md`
- Produces: `assets/lead-magnets/scam-proof-checklist/scam-proof-checklist.pdf` (exported from Canva)

- [ ] **Step 1: Open Canva and create a new design**

Select: Letter (8.5 x 11 in), Portrait. Title it "Scam-Proof Checklist — Curious & Capable."

- [ ] **Step 2: Apply brand header**

Add the Curious & Capable logo at the top. Apply brand colors from the design system. The title "The Scam-Proof Checklist" should be prominent, large, and clear. The subtitle ("5 Warning Signs and What to Do When You're Not Sure") goes directly beneath it in a smaller weight.

- [ ] **Step 3: Lay out Section 1**

Section heading: "Know the Signs" — bold, brand color, larger than body text.
Body font: minimum 14pt. Generous line spacing. Each of the 5 warning signs on its own line. Checkbox or bullet to the left of each item so Margaret can mark them off if she prints it.

- [ ] **Step 4: Lay out Section 2**

Section heading: "When You're Not Sure, Do This" — same treatment as Section 1 heading.
Number each step 1-4. Bold the first word of each step (Stop. Close it. Call. Report.) so the eye can scan quickly under stress.
The final note ("Getting scammed is not your fault...") gets its own visual treatment: slightly smaller font, italic, centered, with a thin rule above it to separate it from the numbered list.

- [ ] **Step 5: Add footer**

Bottom of page: "From Michael McIntosh at Curious & Capable. More at [your website URL]"
Small font, centered, brand color or neutral.

- [ ] **Step 6: Gut-check the design**

Print a test copy or view at 100%. Ask:
- Can Margaret read every word without squinting?
- Is there enough white space that the page doesn't feel overwhelming?
- Does the most important action ("Stop") appear immediately visible without reading top to bottom?
- Would she keep this on her desk or pin it somewhere? If not, simplify further.

- [ ] **Step 7: Export and save**

Export from Canva as PDF (Print quality). Save as `assets/lead-magnets/scam-proof-checklist/scam-proof-checklist.pdf`.

- [ ] **Step 8: Commit**

```bash
git add assets/lead-magnets/scam-proof-checklist/scam-proof-checklist.pdf
git commit -m "feat: add designed scam-proof checklist PDF"
```

---

### Task 3: Write the Opt-In Page Copy

**Files:**
- Create: `assets/lead-magnets/scam-proof-checklist/optin-copy.md`

**Produces:** Complete opt-in page copy ready to paste into your email platform's landing page builder.

- [ ] **Step 1: Write the opt-in copy**

Create `assets/lead-magnets/scam-proof-checklist/optin-copy.md` with this content:

```markdown
# Opt-In Page Copy — Scam-Proof Checklist

---

**Headline:**
Is that text from your bank real? Here's how to know in 30 seconds.

**Subhead:**
Get the free Scam-Proof Checklist, keep it by your phone, and never wonder again.

**Body (optional — use if the platform supports it):**
Scammers are good at what they do. They fake bank alerts, fake family emergencies,
fake computer warnings. And they count on you not having a plan in the moment.

This one-page checklist gives you that plan. Print it out, put it somewhere you'll
see it, and the next time something feels off, you'll know exactly what to do.

No jargon. No rushing. Just one clear page you can use today.

**CTA Button:**
Send Me the Checklist

**Below the form (trust line):**
No spam. Just helpful, plain-English guidance from Curious & Capable.
Unsubscribe any time.

---

**Email delivery subject line:**
Here's your Scam-Proof Checklist (print this out)

**Email delivery body:**
Hi [First Name],

Here's your free Scam-Proof Checklist. I'd encourage you to print it out and
keep it somewhere you'll see it — by the phone, on the fridge, near your computer.

[DOWNLOAD BUTTON: Get the Checklist]

The goal is simple: next time something feels off, you don't have to wonder.
You'll have a plan.

If you have questions or want to talk through something you've seen online,
reply to this email. I read every one.

— Mike
Curious & Capable
```

- [ ] **Step 2: Review copy**

Read aloud. Check:
- Does the headline name the exact fear Margaret has right now?
- Does the body copy sound like Mike, not a copywriting course?
- Is the CTA specific ("Send Me the Checklist"), not vague ("Get Started" or "Submit")?
- Is the delivery email short, warm, and action-oriented?
- Any em dashes? There should be none.

Fix anything that fails.

- [ ] **Step 3: Commit**

```bash
git add assets/lead-magnets/scam-proof-checklist/optin-copy.md
git commit -m "feat: write scam-proof checklist opt-in and delivery copy"
```

---

### Task 4: Build the Opt-In Page and Automation

**Files:**
- Consumes: `assets/lead-magnets/scam-proof-checklist/optin-copy.md`
- Consumes: `assets/lead-magnets/scam-proof-checklist/scam-proof-checklist.pdf`

**Produces:** A live opt-in page URL and an automated delivery email ready to test.

- [ ] **Step 1: Upload the PDF to your email platform**

Log in to your email marketing platform (ConvertKit or equivalent). Upload `scam-proof-checklist.pdf` to the file/asset library. Copy the download URL.

- [ ] **Step 2: Create the opt-in form**

Create a new form or landing page. Paste the headline, subhead, body copy, and CTA button text from `optin-copy.md`. Fields: First Name + Email only. No extra fields.

- [ ] **Step 3: Set up the delivery automation**

Create a simple automation: when someone opts in, send the delivery email from `optin-copy.md`. Replace `[DOWNLOAD BUTTON: Get the Checklist]` with an actual button linking to the PDF URL from Step 1. Tag new subscribers with "lead-magnet: scam-checklist" for tracking.

- [ ] **Step 4: Test the full flow**

Use a personal email address to opt in. Confirm:
- The opt-in page looks correct on a phone (Margaret will likely view it on mobile)
- The delivery email arrives within 5 minutes
- The PDF download link works and the file opens correctly
- The font is readable on screen and when printed

Fix anything that fails before moving to distribution.

---

### Task 5: Write and Schedule Distribution Posts

**Files:**
- Create: `assets/lead-magnets/scam-proof-checklist/distribution-posts.md`
- Consumes: Live opt-in page URL from Task 4

**Produces:** Ready-to-post Facebook and Substack content for launch.

- [ ] **Step 1: Write the Facebook post**

Create `assets/lead-magnets/scam-proof-checklist/distribution-posts.md` with:

```markdown
# Distribution Posts — Scam-Proof Checklist

---

## Facebook Post (Launch)

Do you know what to do when something on your phone or computer just feels wrong?

Most people freeze. And that moment of hesitation is exactly what scammers count on.

I put together a free one-page checklist: 5 warning signs to look for, and 4 simple
steps to take when you're not sure. Print it out and keep it somewhere you'll see it.

[LINK TO OPT-IN PAGE]

No cost. No catch. Just something practical you can use today.

---

## Facebook Post (Week 2 — Story angle)

A woman in one of my workshops told me she lost $2,000 to a scam
because she couldn't tell if the pop-up on her screen was real.

She said: "I tried to close it, and when I couldn't, I figured it must be real."

She was not careless. She was not behind. She just didn't have a plan for that moment.

This free checklist is that plan. One page. Print it out. Keep it by your phone.

[LINK TO OPT-IN PAGE]

---

## Substack Note (to existing readers)

Quick note: I put together a free one-page Scam-Proof Checklist for anyone who
wants something concrete they can print out and keep nearby.

It covers the 5 warning signs that show up most often, and a 4-step protocol
for what to do when something feels off but you're not sure.

If that would be useful to you or someone you know, grab it here: [LINK]

If you forward it to a parent or a friend who'd benefit, I'd consider that
the highest compliment.
```

- [ ] **Step 2: Review posts against voice rules**

Check each post:
- Does it lead with the problem, not the product?
- Is it written in plain sentences, not bullets?
- Any em dashes? None allowed.
- Does the Facebook story post use a specific, real-feeling moment? (The workshop example above is a composite; replace with a real story if you have one.)

- [ ] **Step 3: Schedule or post**

Post the Facebook launch post. Schedule the Week 2 post 7 days out. Send or schedule the Substack note.

- [ ] **Step 4: Commit**

```bash
git add assets/lead-magnets/scam-proof-checklist/distribution-posts.md
git commit -m "feat: write launch distribution posts for scam-proof checklist"
```

---

## Done When

- [ ] PDF is designed, exported, and opens cleanly on phone and desktop
- [ ] Opt-in page is live with a working URL
- [ ] Delivery automation sends the PDF within 5 minutes of opt-in
- [ ] Full flow tested with a real email address
- [ ] At least one Facebook post is live or scheduled
- [ ] Substack note is sent or scheduled
