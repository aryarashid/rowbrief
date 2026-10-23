# Make the next handoff clearer

RowBrief is a local CSV workbench for people receiving unfamiliar exports or preparing a file for someone else. Inspect structure, compare delimiter choices and locate a malformed record before passing it on.

## Included

- Strict UTF-8 file reading or pasted text, with explicit comma, semicolon, tab or pipe selection.
- Quoted delimiters, doubled quotes and multiline cells. Fatal syntax errors stop inspection and label partial results.
- Field-count checks, optional exact-duplicate and empty-header findings, physical source lines and source context.
- A paged preview that renders values as text. No formula execution or inferred types.
- JSON and Markdown handoff reports with parsing choices, counts and generic findings. Cell values, header names, source excerpts and filename are omitted.
- Five original synthetic examples, a focused test suite, documentation, MIT source and an original SVG identity.

## Use and requirements

Open the live tool in a modern browser, or use Node.js 22+ locally: npm ci, then npm start. There is no build, backend, account, API key or npm dependency. Files are read locally and are not uploaded. No browser storage or offline cache is installed. Public page hosting can receive ordinary request metadata.

Imported file text retains its original decoded line endings until explicitly edited. Textareas normalize pasted/edited newlines to LF. No original disk file is overwritten and no cleaned CSV is exported.

## Limits

2 MiB UTF-8, 10,000 parsed records including blank records, 100 fields per record and the first 200 findings. Preview is 20 records per page with 200 characters displayed per cell. UTF-16/32 are unsupported. BOM-marked unsupported encodings, malformed UTF-8 and NUL characters are rejected; no general encoding detector is claimed. Header duplicates are exact and case-sensitive.

This is a structural inspection tool, not a business-rule validator, formula-safety scanner, encoding converter or universal spreadsheet-compatibility certificate. A consistent file can still contain incorrect or unsafe data for another application. Reports still contain counts and source locations; review before sharing. Clear/refresh is not secure memory erasure.

## License and support

Original software, docs, examples and artwork are MIT licensed. Free repository and live-tool access do not require a marketplace purchase. Created by Arya Rashid with AI assistance. All example content and product screens are synthetic. No customer results or benchmark claims are made. Support is through GitHub issues/community contributions, without a paid maintenance agreement or response-time promise. Keep the MIT notice when redistributing.
