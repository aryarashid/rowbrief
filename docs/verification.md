# Verification status: pre-release

Prepared October 23, 2026. This is an implemented, independently reviewed pre-release, not a published or fully verified release.

## Completed checks

The initial `npm run check` passed all 18 focused Node tests under Node.js 26.9.0 in 251.8 ms. They cover empty/trailing fields, dialects/newlines, doubled quotes, multiline fields, exact source locations, Unicode/BOM, malformed UTF-8, header/row-width behavior, byte/record/field/finding bounds, redacted reports and 100 generated round trips.

Independent code review found and corrected server root normalization, imported CRLF/CR text retention outside the textarea, tab-delimited empty records and hidden filename/summary residue after Clear. Review approved the current code and factual documentation after those fixes. The tab-record regression assertion was added to the existing blank-record test. The final suite has not been rerun after these changes.

Observed local browser flows:

- Native file input successfully loaded the synthetic clean-handoff.csv. The original fixture has 162 bytes and CRLF endings. Its real downloaded JSON report preserved both facts, reported three data records, and omitted original cell values and filename.
- Synthetic malformed-width records produced two findings at physical source lines three and four. The source-context button displayed the original line.
- Explicit semicolon comparison preserved the synthetic Montréal, 京都 and São Paulo cells. Quoted comma and multiline values appeared intact in preview.
- Editing input disabled all report exports until inspection. HTML/formula-looking synthetic strings rendered as literal text with zero injected image/script elements; their markers and header names were absent from the report preview.
- At 390 and 320 CSS pixels, document width exactly matched viewport width. A wide table scrolled inside its region. Screenshots were inspected. This is not an independent assistive-technology audit.

Raw synthetic captures are in `docs/screenshots`. Five branded JPEG panels are exactly 1600 × 900 and below 5 MB. An independent reviewer inspected panels 2–5 for legibility and factual claims. Local Markdown/image paths exist, the listing field package parses, its short description is 112 characters, and seven FAQs are prepared. A source/package scan found no secret-pattern matches. The lockfile contains no dependency package.

## Remaining release checks

Mac load rose from 7.06 before the initial test to 34.41 during browser work and remained above the established guard of 15 (latest recorded 27.07). Further test execution was held; no competing heavy build or unrelated process was started or stopped.

Before any public release, recheck resources, run the final focused suite, verify pagination/keyboard/Clear behavior after the final UI changes, review console/network behavior without reading browser cookies, and verify the deployed GitHub/demo URLs after authorized publication. Update this status using actual outcomes. No broad suite or third-party security audit is implied.

The available marketplace browser redirected account access to sign-in. The current public seller catalog contained three existing offers and no RowBrief duplicate. No authenticated draft, price, source attachment, legal acceptance or new listing was created. The complete prepared package includes a no-credential prefill link; opening it does not itself create a listing. The correct personal seller identity and any new wizard terms/attestation still need verification before marketplace publication.
