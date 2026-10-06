# WhatsApp Bot Kit — hsbteleet.com
## Last Updated: October 2026

## Import to Google Sheets
1. Open [Google Sheets](https://sheets.google.com) → Blank spreadsheet.
2. **File → Import → Upload** `Sheet1_FAQ_WhatsApp_Bot.csv` → Import location: *Replace spreadsheet* or new sheet named **FAQ**.
3. Create second sheet → Import `Sheet2_All_Pages_Resources_URLs.csv` → name it **Resources**.
4. Open `HSBTE_LEET_Project_Overview.html` in Chrome → **Ctrl+P → Save as PDF** (or use generated PDF).

## Suggested bot logic
```
IF message matches FAQ.Trigger_Keywords → send FAQ.Full_Answer
ELSE IF message has branch + semester → lookup Resources where Category=PYQ Semester
ELSE IF message has "syllabus" + branch → lookup Diploma Syllabus PDF
ELSE IF message has "leet syllabus" → send LEET PDF URL
ELSE IF message has buy/premium/ultra → send Premium/Ultra buy links
ELSE → send HIGH PRIORITY doubt template (Sheet1 Category = Doubt / Unknown)
```

## Must-know links (UPDATED October 2026)
| Need | URL |
|------|-----|
| Buy Premium ₹99 | https://hsbteleet.com/premium-login?tier=premium |
| Buy Ultra ₹149 | https://hsbteleet.com/premium-login?tier=ultra |
| Plans comparison page | https://hsbteleet.com/btech-leet-premium |
| LEET Syllabus PDF | https://hsbteleet.com/pdf/B.Tech-LEET-Syllabus-2026.pdf |
| CSE Syllabus PDF | https://hsbteleet.com/syllabus/2%20Final%2001-08-2024%20-%20Diploma%20in%20Computer%20Engineering.pdf |
| CSE Sem 1 PYQ | https://hsbteleet.com/computer-1-semester |
| Free sample paper | https://hsbteleet.com/leet-sample-paper |
| Premium papers (after login) | https://hsbteleet.com/premium-papers |
| Free Notes | https://hsbteleet.com/leet-notes |
| Counseling ₹99 | https://hsbteleet.com/counseling |
| Terms & Conditions | https://hsbteleet.com/terms |
| Contact | https://hsbteleet.com/contact |
| WhatsApp | https://wa.me/919992507270 |

## Current Pricing (October 2026)
- **Premium**: ₹99 one-time → 26 sample papers + PDFs + Rank Analysis + 365 days
- **Ultra Premium**: ₹149 one-time → Premium + AI College/Rank Predictor + AI Counselling tools + 50% off counselling + Chapter-wise Notes + 365 days
- **Counseling Help**: ₹99 (Ultra users) / ₹199 (non-Ultra) → personalized expert guidance
- **No auto-renewal** on any plan. Refund within 24 hours only.

## Example replies

**User:** leet syllabus
**Bot:** LEET Syllabus page + PDF link (Sheet1 → LEET Syllabus)

**User:** cse syllabus
**Bot:** Computer Engineering Diploma Syllabus PDF URL

**User:** computer 1st semester pyq
**Bot:** https://hsbteleet.com/computer-1-semester

**User:** why buy premium / premium kyu
**Bot:** Sheet1 → Why Buy Premium

**User:** ultra kya hai / ultra premium
**Bot:** Sheet1 → Ultra Premium Plan (₹149 — AI tools + everything in Premium)

**User:** premium vs ultra
**Bot:** Sheet1 → Premium vs Ultra comparison

**User:** something random / payment stuck
**Bot:** HIGH PRIORITY admin template → nishant@hsbteleet.com, WhatsApp wa.me/919992507270

**User:** notes chahiye / leet notes
**Bot:** Free notes at https://hsbteleet.com/leet-notes — covers Maths, Physics, Chemistry, all engineering sections

## Security Info (for bot responses)
Premium papers are watermarked with user's mobile. Screenshots, copying, and developer tools are blocked and violations are logged. Account can be permanently suspended. Full policy at https://hsbteleet.com/terms

## Contact
- Admin email: nishant@hsbteleet.com
- WhatsApp: https://wa.me/919992507270
- Official: https://hsbteleet.com/contact
