import { test, expect, type Page } from "@playwright/test";

async function place(page: Page, id: string, side: number) {
  const card = page.locator(`.physical[data-id="${id}"]`);
  let box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 80);
  await page.waitForTimeout(450);
  box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 80);
  await page.mouse.down();
  const target = (await page.locator("#drop").boundingBox())!;
  await page.mouse.move(target.x + target.width * side, target.y + 80, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(card).toHaveAttribute("data-state", "detail");
  await page.waitForTimeout(650);
}

test("range updates damage; comparison scroll collapses and restores both headers", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  await place(page, "Famas", 0.75);
  await place(page, "K2", 0.25);
  const right = page.locator('[data-id="Famas"]');
  const left = page.locator('[data-id="K2"]');
  await expect(page.locator(".damage-chart")).toHaveCount(0);
  const slider = right.getByRole("slider", { name: "거리 (m)", exact: true });
  await slider.press("End");
  await expect(right.locator(".target-summary")).toContainText("— DMG");
  await slider.press("Home");
  await expect(right.locator(".target-summary")).toContainText("25.7");
  for (let i = 0; i < 4; i++) await slider.press("PageUp");
  await expect(right.locator(".target-summary")).toContainText("23.8");
  await right.getByRole("button", { name: "조끼 없음", exact: true }).click();
  await expect(right.locator(".target-summary")).not.toContainText("23.8");
  // A real wheel event, not a synthetic change to the scroll position.
  const bounds = (await left.locator(".physical-details").boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 60);
  await page.mouse.wheel(0, 150);
  await expect(left).toHaveAttribute("data-scrolled", "true");
  await expect(right).toHaveAttribute("data-scrolled", "true");
  await expect(left.locator(".physical-head")).toHaveCSS("height", "32px");
  await expect
    .poll(async () =>
      Math.abs(
        (await left
          .locator(".physical-details")
          .evaluate((el) => el.scrollTop)) -
          (await right
            .locator(".physical-details")
            .evaluate((el) => el.scrollTop)),
      ),
    )
    .toBeLessThan(2);
  await page.mouse.wheel(0, -2000);
  await expect(left).toHaveAttribute("data-scrolled", "false");
  await expect(right).toHaveAttribute("data-scrolled", "false");
  await expect
    .poll(
      async () => (await left.locator(".physical-head").boundingBox())!.height,
    )
    .toBeGreaterThan(150);
  await expect(page.locator(".physical")).toHaveCount(53);
});
