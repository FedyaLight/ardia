import assert from "node:assert/strict";
import { test } from "node:test";
const { useBrowser } = await import("./browser.ts");
const model = await import("./model.ts");

const S = () => useBrowser.getState();
const unloaded = (id) => model.isPageUnloaded(S().tabs[id]);
const tileOf = (w, url) => model.viewTabIds(S(), w).find((id) => S().tabs[id].pinned && S().tabs[id].pinnedUrl === url);

test("a tab counts as unloaded only while it has no page anywhere", () => {
  S().hydrate({});
  const a = S().createWindow({ url: "https://mail.com" });
  const [mail] = S().windows[a].tabIds;
  const docs = S().newTab(a, { url: "https://docs.com" });
  assert.equal(unloaded(mail), false, "a loaded tab");
  assert.equal(unloaded(docs), false, "a background tab that has its page");

  S().pinTabs([mail], true, true);
  S().activate(mail);
  S().closeTab(mail);
  assert.equal(unloaded(mail), true, "a closed pinned row");
  S().activate(mail);
  assert.equal(unloaded(mail), false, "selecting it loads it again");

  const b = S().createWindow({ url: "https://b.com" });
  S().activate(tileOf(b, "https://mail.com"));
  const frozen = tileOf(a, "https://mail.com");
  assert.ok(S().tabs[frozen].pageIn, "A's copy shows the page B now holds");
  assert.equal(unloaded(frozen), false, "a pin live in another window");
});
