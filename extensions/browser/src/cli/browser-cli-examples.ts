/**
 * Help examples shown by the Browser CLI root command.
 */
/** Core Browser CLI examples for lifecycle and inspection commands. */
export const browserCoreExamples = [
  "grokbot browser status",
  "grokbot browser start",
  "grokbot browser start --headless",
  "grokbot browser stop",
  "grokbot browser tabs",
  "grokbot browser open https://example.com",
  "grokbot browser focus abcd1234",
  "grokbot browser close abcd1234",
  "grokbot browser screenshot",
  "grokbot browser screenshot --full-page",
  "grokbot browser screenshot --ref 12",
  "grokbot browser snapshot",
  "grokbot browser snapshot --format aria --limit 200",
  "grokbot browser snapshot --efficient",
  "grokbot browser snapshot --labels",
];

/** Browser CLI examples for interaction/action commands. */
export const browserActionExamples = [
  "grokbot browser navigate https://example.com",
  "grokbot browser resize 1280 720",
  "grokbot browser click 12 --double",
  "grokbot browser click-coords 120 340",
  'grokbot browser type 23 "hello" --submit',
  "grokbot browser press Enter",
  "grokbot browser hover 44",
  "grokbot browser drag 10 11",
  "grokbot browser select 9 OptionA OptionB",
  "grokbot browser upload /tmp/grokbot/uploads/file.pdf",
  "grokbot browser upload media://inbound/file.pdf",
  'grokbot browser fill --fields \'[{"ref":"1","value":"Ada"}]\'',
  "grokbot browser dialog --accept",
  'grokbot browser wait --text "Done"',
  "grokbot browser evaluate --fn '(el) => el.textContent' --ref 7",
  "grokbot browser evaluate --fn 'const title = document.title; return title;'",
  "grokbot browser console --level error",
  "grokbot browser pdf",
];
