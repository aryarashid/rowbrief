# Verification: version 1.0.0

Local release checks completed October 23, 2026. Marketplace publication is separate and remains unperformed.

## Completed checks

The initial `npm run check` passed all 18 focused Node tests under Node.js 26.9.0 in 251.8 ms. They cover empty/trailing fields, dialects/newlines, doubled quotes, multiline fields, exact source locations, Unicode/BOM, malformed UTF-8, header/row-width behavior, byte/record/field/finding bounds, redacted reports and 100 generated round trips.

Independent code review found and corrected server root normalization, imported CRLF/CR text retention outside the textarea, tab-delimited empty records and hidden filename/summary residue after Clear. Review approved the current code and factual documentation after those fixes. The tab-record regression assertion was added to the existing blank-record test. After these fixes, the final `npm run check` passed all 18 tests in 243.5 ms, including the tab-empty-record regression. No broad suite ran.

Observed local browser flows:

- Native file input successfully loaded the synthetic clean-handoff.csv. The original fixture has 162 bytes and CRLF endings. Its real downloaded JSON report preserved both facts, reported three data records, and omitted original cell values and filename.
- Synthetic malformed-width records produced two findings at physical source lines three and four. The source-context button displayed the original line.
- Explicit semicolon comparison preserved the synthetic Montréal, 京都 and São Paulo cells. Quoted comma and multiline values appeared intact in preview.
- Editing input disabled all report exports until inspection. HTML/formula-looking synthetic strings rendered as literal text with zero injected image/script elements; their markers and header names were absent from the report preview.
- At 390 and 320 CSS pixels, document width exactly matched viewport width. A wide table scrolled inside its region. Screenshots were inspected. This is not an independent assistive-technology audit.

Raw synthetic captures are in `docs/screenshots`. Five branded JPEG panels are exactly 1600 × 900 and below 5 MB. An independent reviewer inspected panels 2–5 for legibility and factual claims. Local Markdown/image paths exist, the listing field package parses, its short description is 112 characters, and seven FAQs are prepared. A source/package scan found no secret-pattern matches. The lockfile contains no dependency package.

## Final browser and release checks

A fresh Mac reading of 8.69 allowed the final focused suite and remaining browser flows. Pagination displayed records 41–46 of 46 for 45 synthetic data records, with Next disabled on the last page. Clear removed textarea content, hidden filename/count metadata, report and preview data; focus returned to the textarea. Tab/Space/Enter toggled the header option and activated inspection, producing the expected two data records without a header.

The real Markdown download had correct counts and omitted synthetic cell values. A programmatic unsupported UTF-16 File event preserved the previous input and produced a clear error without leaving the results busy. The unfinished-quote example labeled partial results and identified the physical stopping line. The final app console had zero errors/warnings; the observed request log contained only same-origin static GETs and no upload request. Browser cookies were not read.

At the end of validation the Mac load rose again to 40.00. No further local suite or heavy build was started. GitHub and static-demo publication use the existing authorized personal account; actual remote commit, deployment status and URL checks are recorded separately in the release record after publication. No third-party security audit or independent assistive-technology audit is implied.

The available marketplace browser redirected account access to sign-in. The current public seller catalog contained three existing offers and no RowBrief duplicate. No authenticated draft, price, source attachment, legal acceptance or new listing was created. The complete prepared package includes a no-credential prefill link; opening it does not itself create a listing. The correct personal seller identity and any new wizard terms/attestation still need verification before marketplace publication.
