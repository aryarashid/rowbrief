# Architecture and deployment

Static HTML/CSS/JavaScript with no build, service worker, runtime package, external font or backend. The server binds to 127.0.0.1. All asset paths are relative for project-path hosting.

The parser is a single-pass state machine for start/plain/quoted/closed fields. It keeps physical line and Unicode-code-point columns, complete records and exact field values. It stops on invalid quoting or bounds; partially parsed records are not presented as complete. CR, LF and CRLF are distinguished, including inside quotes. Structural inspection applies explicit blank/header options without mutating the original input. A tab-delimited record containing empty fields is not a blank record. Reports construct an allowlisted object containing counts, options and generic diagnostics; they do not serialize source rows or names.

Browser state keeps decoded file text separately from the textarea because HTML normalizes line endings. An explicit edit switches to the normalized textarea representation. A revision token rejects stale file reads and inspection callbacks. Changed input disables exports until a new inspection. File decoding failure preserves the previous input. No app data is persisted. All source/preview strings use textContent or text nodes.

For public hosting, serve the repository root over HTTPS. No server feature is required in production. Publish a reviewed commit after checks and verify the real deployed URL. The local server's CSP restricts connect-src to none; static hosts may supply different headers. Preserve license and notices in source packages.

Rollback uses an ordinary git revert of a published commit and a normal push. Keep the prior release/tag and source archive available; public copies cannot be recalled. No browser storage migration or production database rollback is needed. Marketplace publication is independent; do not infer that a GitHub release also created or changed a listing.
