import { test, expect } from "@playwright/test";
test("all chapters render, formulas render, and no uncaught errors occur", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const id of [
    "introduction",
    "intuition",
    "theory",
    "algorithm",
    "project",
    "code",
    "review",
  ]) {
    await page.goto(`/#${id}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).not.toBeEmpty();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBeTruthy();
    if (id === "theory") {
      expect(await page.locator(".katex").count()).toBeGreaterThan(5);
      await expect(page.locator(".katex-error")).toHaveCount(0);
    }
    if (
      process.env.SCREENSHOT_DIR &&
      ["introduction", "intuition"].includes(id)
    )
      await page.screenshot({
        path: `${process.env.SCREENSHOT_DIR}/${testInfo.project.name}-${id}.png`,
      });
  }
  expect(errors).toEqual([]);
});
test("split search, growth, depth experiments, and prediction controls work", async ({
  page,
}) => {
  await page.goto("/#intuition");
  const before = await page.locator(".rule").innerText();
  await page
    .getByRole("slider", { name: "Threshold", exact: true })
    .fill("0.5");
  await expect(
    page.getByRole("status").filter({ hasText: "Invalid training split" }),
  ).toContainText("Invalid training split");
  await page.getByRole("button", { name: "Find the best split" }).click();
  expect(await page.locator(".rule").innerText()).not.toBe(before);
  await page.goto("/#algorithm");
  await page.getByRole("button", { name: "Next split" }).click();
  await expect(page.locator(".growth-readout")).toContainText("SPLIT 1");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".growth-readout")).toContainText(
    "START AT THE ROOT",
  );
  await page.goto("/#project");
  const lab = page.getByTestId("experiment-lab");
  await expect(lab).toContainText("87.5%");
  await page
    .getByRole("slider", { name: "Maximum depth", exact: true })
    .fill("4");
  await expect(lab).toContainText("89.6%");
  await page.getByRole("slider", { name: "Query vibration" }).fill("0");
  await expect(lab.locator(".prediction-panel h4")).toContainText("Normal");
  await page.getByRole("button", { name: "New dataset" }).click();
  await expect(lab).toContainText("Seed 43");
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(lab).toContainText("Seed 42");
});
test("progress persists, quizzes respond, and source downloads are real ZIP files", async ({
  page,
  request,
}) => {
  await page.goto("/#review");
  await page.getByRole("button", { name: "Mark chapter complete" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Chapter completed" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "B The sample-weighted reduction across both children",
    })
    .click();
  await expect(page.locator(".quiz-feedback").first()).toContainText(
    "Correct.",
  );
  for (const name of ["python-project.zip", "decision-tree-lab-source.zip"]) {
    const response = await request.get(`/downloads/${name}`);
    expect(response.status()).toBe(200);
    expect((await response.body()).subarray(0, 2).toString()).toBe("PK");
  }
});
test("chapter navigation and code module switching work", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile")
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page
    .getByRole("navigation", { name: "Chapters" })
    .getByRole("link", { name: /Code walkthrough/ })
    .click();
  await expect(page.locator("h1")).toHaveText("Read the machinery.");
  await page.getByRole("tab", { name: "02 · Search the splits" }).click();
  await expect(page.getByRole("tabpanel").locator("pre")).toContainText(
    "def best_split",
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "Copy tree.py · split", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Copy tree.py · split", exact: true }),
  ).toContainText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "def best_split(",
  );
  await page
    .getByRole("combobox", { name: "File", exact: true })
    .selectOption("main.py");
  await page.getByText("Read all of main.py", { exact: true }).click();
  await expect(page.locator(".full-source")).toContainText("def run(");
});
