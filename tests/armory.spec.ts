import { expect, test, type Page } from "@playwright/test";

async function dropCard(
  page: Page,
  id: string,
  side: "left" | "right" = "right",
) {
  const card = page.locator(`.physical[data-id="${id}"]`);
  const box = await card.boundingBox();
  const drop = await page.locator("#drop").boundingBox();
  if (!box || !drop) throw Error("Missing card or drop area");
  await page.mouse.move(box.x + box.width / 2, box.y + 80);
  await page.waitForTimeout(450);
  const lifted = (await card.boundingBox())!;
  await page.mouse.move(lifted.x + lifted.width / 2, lifted.y + 80);
  await page.mouse.down();
  await expect(card).toHaveAttribute("data-state", "drag");
  await page.mouse.move(
    drop.x + drop.width * (side === "left" ? 0.25 : 0.75),
    drop.y + 80,
    { steps: 15 },
  );
  await page.mouse.up();
  await expect(card).toHaveAttribute("data-state", "detail");
  await page.waitForTimeout(650);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
});

test("persistent cards, comparison sides, category switching and front-up return", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(page.locator(".physical")).toHaveCount(53);
  await page.evaluate(() => {
    (window as Window & { originalCards: Element[] }).originalCards = [
      ...document.querySelectorAll(".physical"),
    ];
  });
  await dropCard(page, "Famas");
  await dropCard(page, "K2", "left");
  const x = async (id: string) =>
    (await page.locator(`.physical[data-id="${id}"]`).boundingBox())!.x;
  expect(await x("K2")).toBeLessThan(await x("Famas"));
  const rightX = await x("Famas");
  await dropCard(page, "G36C", "left");
  expect(await x("Famas")).toBe(rightX);
  await expect(page.locator('[data-id="K2"]')).toHaveAttribute(
    "data-state",
    "desk",
  );
  await expect(page.locator('[data-id="K2"]')).not.toHaveClass(/back/);
  await page.getByRole("button", { name: "DMR", exact: true }).click();
  await expect(page.locator('.physical[data-state="hand"]')).toHaveCount(8);
  await expect(page.locator('.physical[data-state="detail"]')).toHaveCount(2);
  await page.keyboard.press("x");
  await expect(page.locator('[data-id="Famas"]')).toHaveAttribute(
    "data-state",
    "desk",
  );
  const stable = await page.evaluate(() => {
    const cards = [...document.querySelectorAll<HTMLElement>(".physical")];
    const original = (window as any).originalCards as HTMLElement[];
    return (
      cards.every((card, i) => card === original[i]) &&
      new Set(cards.map((c) => c.dataset.id)).size === 53
    );
  });
  expect(stable).toBe(true);
  const layers = await page
    .locator('.physical[data-state="desk"]')
    .evaluateAll((cards) =>
      cards.map((c) => Number((c as HTMLElement).style.zIndex)),
    );
  expect(Math.max(...layers)).toBeLessThan(70);
  expect(errors).toEqual([]);
});

test("title remains unchanged during dealing, then switches after arrival", async ({
  page,
}) => {
  const title = page.locator('[data-id="Mk14"] h2');
  const before = await title.evaluate((el) => ({
    size: getComputedStyle(el).fontSize,
    family: getComputedStyle(el).fontFamily,
    weight: getComputedStyle(el).fontWeight,
  }));
  await page.getByRole("button", { name: "DMR", exact: true }).click();
  await page.waitForTimeout(200);
  const moving = await title.evaluate((el) => ({
    size: getComputedStyle(el).fontSize,
    family: getComputedStyle(el).fontFamily,
    weight: getComputedStyle(el).fontWeight,
  }));
  expect(moving).toEqual(before);
  await expect(title).toHaveCSS("font-size", "23px");
});

test("real pointer drag and narrow layout render without runtime errors", async ({
  page,
}) => {
  const card = page.locator('[data-id="Famas"]');
  const box = await card.boundingBox();
  const drop = await page.locator("#drop").boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + 100);
  await page.waitForTimeout(450);
  const lifted = await card.boundingBox();
  await page.mouse.move(lifted!.x + lifted!.width / 2, lifted!.y + 90);
  await page.mouse.down();
  await page.mouse.move(drop!.x + drop!.width / 2, drop!.y + 100, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(card).toHaveAttribute("data-state", "detail");
  await page.waitForTimeout(700);
  await page.screenshot({ path: "test-results/desktop.png" });
  await page.setViewportSize({ width: 590, height: 836 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "test-results/narrow.png" });
  await expect(card).toHaveCSS("width", /px$/);
});
