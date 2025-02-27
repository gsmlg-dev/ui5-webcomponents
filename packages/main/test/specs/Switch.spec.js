const assert = require("chai").assert;
const PORT = require("./_port.js");

describe("Switch general interaction", async () => {
	before(async () => {
		await browser.url(`http://localhost:${PORT}/test-resources/pages/Switch.html`);
	});

	it("tests change event", async () => {
		const switchEl = await browser.$("#sw");
		const field = await browser.$("#field");

		await switchEl.click();
		await switchEl.keys("Space");
		await switchEl.keys("Enter");

		assert.strictEqual(await field.getProperty("value"), "3", "Change event should be fired 3 times");
	});

	it("tests change event not fired, when disabled", async () => {
		const switchEl = await browser.$("#sw2");
		const field = await browser.$("#field");

		await switchEl.click();
		await switchEl.keys("Space");
		await switchEl.keys("Enter");

		assert.strictEqual(await field.getProperty("value"), "3", "Change event should not be called any more");
	});

	it("setting accessible-name on the host is reflected on the button tag", async () => {
		const switchEl = await browser.$("#switchAccName").shadow$("div");

		assert.strictEqual(await switchEl.getAttribute("role"), "switch", "Proper role attribute is set");
		assert.strictEqual(await switchEl.getAttribute("aria-label"), "Geographical location", "Attribute is reflected");
	});

	it("setting accessible-name-ref on the host is reflected on the button tag", async () => {
		const switchEl = await browser.$("#switchAccNameRef").shadow$("div");

		assert.strictEqual(await switchEl.getAttribute("role"), "switch", "Proper role attribute is set");
		assert.strictEqual(await switchEl.getAttribute("aria-label"), "Use GPS location", "Attribute is reflected");
	});
});
