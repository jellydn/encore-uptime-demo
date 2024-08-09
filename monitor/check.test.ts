import { describe, expect, test } from "vitest";
import { site } from "~encore/clients";
import { check } from "./check";

describe("check", () => {
	test("it should add a site and check if it's up", async () => {
		const url = `encore.dev?${Math.random().toString(36).substring(7)}`;
		const obj = await site.add({ url });
		const resp = await check({ siteID: obj.id });
		expect(resp.up).toBe(true);
	});
});
