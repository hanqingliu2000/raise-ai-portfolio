import { expect, test } from "@playwright/test";

test("plot selection is synchronized and keyboard navigation moves one item", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))
      external.push(request.url());
  });
  await page.goto("/");
  const plot = page.locator(".chart-interaction");
  const bounds = await plot.boundingBox();
  const point = (year: number) =>
    bounds!.x + ((year - 2014 + 0.5) / 17) * bounds!.width;
  await page.mouse.move(point(2016), bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(point(2018), bounds!.y + bounds!.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: /^CURRENT, 2017,/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /^SOURCE_1, 2017,/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(point(2017), bounds!.y + bounds!.height / 2);
  await page.mouse.down({ button: "right" });
  await page.mouse.up({ button: "right" });
  await expect(
    page.getByRole("button", { name: /^CURRENT, 2017,/ }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "OUTPUT_IDX", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("heading", { name: "INVEST_IDX", exact: true }),
  ).toBeVisible();
  expect(external).toEqual([]);
});

test("summary export records the human draft and no simulated approval", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Reviewer draft", exact: true })
    .fill("Synthetic reviewer-authored follow-up.");
  await page
    .getByRole("button", { name: "Flag for follow-up", exact: true })
    .click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export review summary", exact: true })
    .click();
  const file = await pending;
  const { readFile } = await import("node:fs/promises");
  const summary = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(summary.demo).toBe(true);
  expect(summary.items).toHaveLength(1);
  expect(summary.items[0].draft).toBe("Synthetic reviewer-authored follow-up.");
});

test("assessment stays advisory; evidence locks only after human action", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "OUTPUT_IDX", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Run demo assessment", exact: true })
    .click();
  await expect(page.getByText("Follow up", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Flag for follow-up", exact: true }),
  ).toBeVisible();
  const value = page.getByRole("button", { name: /^CURRENT, 2020,/ });
  await expect(value).toHaveAttribute("aria-pressed", "true");
  await value.click();
  await expect(value).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: /^SOURCE_1, 2020,/ }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Restore default highlights", exact: true })
    .click();
  await expect(value).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Flag for follow-up", exact: true })
    .click();
  await expect(page.getByRole("slider", { name: "Start year" })).toBeDisabled();
  await value.dispatchEvent("click");
  await expect(value).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unflag", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unflag", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Start year" })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("delayed analysis cannot replace a different item; input context is inspectable", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Run demo assessment", exact: true })
    .click();
  await page.getByRole("button", { name: "INVEST_IDX", exact: true }).click();
  await page.waitForTimeout(650);
  await expect(page.getByText("Demo assessment not run.")).toBeVisible();
  await page
    .getByRole("button", { name: "Run demo assessment", exact: true })
    .click();
  await expect(page.getByText("Required forecast is missing")).toBeVisible();
  await page.getByRole("tab", { name: "Context", exact: true }).click();
  await expect(page.locator("pre")).toContainText('"synthetic": true');
});

test("evidence exports without depending on the related table visibility", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Related indicators", exact: true })
    .uncheck();
  await page.getByRole("heading", { name: "OUTPUT_IDX", exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export evidence PNG", exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("demo-evidence-OUTPUT_IDX.png");
  const path = await file.path();
  expect(path).toBeTruthy();
  const { readFile } = await import("node:fs/promises");
  const png = await readFile(path!);
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBeGreaterThan(2000);
  expect(png.length).toBeGreaterThan(10000);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
]) {
  test(`layout stays within viewport at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    for (let n = 0; n < 4; n++)
      await page
        .getByRole("button", { name: "Increase font size", exact: true })
        .click();
    await page
      .getByRole("heading", { name: "OUTPUT_IDX", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await expect(page.locator(".chart-canvas svg").first()).toBeVisible();
    expect(
      await page
        .locator(".chart-canvas")
        .first()
        .evaluate((e) => e.clientHeight),
    ).toBeGreaterThan(100);
    for (const selector of [
      ".review-surface",
      ".review-panel",
      ".draft-actions",
      ".time-range",
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
}
