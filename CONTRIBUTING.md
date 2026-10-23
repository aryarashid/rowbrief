# Contributing

Use Node.js 22 or later, run `npm ci`, then `npm start`. `npm run check` runs syntax checks and the Node tests. The app has no build step or package dependencies.

`src/core.js` contains the strict parser, structural checks and redacted-report serializer. `src/app.js` manages browser state using text nodes and explicit controls. `src/examples.js` contains original synthetic fixtures. `server.mjs` is a loopback development server.

For behavior changes, demonstrate the expected result with a focused test. Preserve source coordinates, bounded input, exact field contents and report redaction. UI changes should check keyboard use, a narrow viewport and stale-result handling. State what actually ran in the pull request. Use a branch and open a focused pull request explaining the problem and resulting behavior. Discuss new dependencies, telemetry or cloud services before introducing them.

Report bugs through GitHub issues with a minimal synthetic example, browser/OS, parsing choices and reproduction steps. Never attach private CSVs or unredacted source dumps. For a suspected security issue, use GitHub private vulnerability reporting if offered, or a private contact method published by the repository owner. If neither exists, ask publicly for a private reporting channel without posting exploit details. No response SLA is promised.

Original contributions should remain compatible with MIT and retain attribution and notices. No sole-human-engineering claim is made; the original project was built by Arya Rashid with AI assistance.
