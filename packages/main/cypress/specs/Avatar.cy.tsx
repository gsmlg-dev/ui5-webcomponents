import Avatar from "../../src/Avatar.js";
import Tag from "../../src/Tag.js";
import Icon from "../../src/Icon.js";
import "@ui5/webcomponents-icons/dist/supplier.js";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/person-placeholder.js";

describe("Accessibility", () => {
	it("checks if initials of avatar are correctly announced", () => {
		const INITIALS = "XS";

		cy.mount(<Avatar id="interactive-avatar" initials={INITIALS} interactive></Avatar>);

		// Store the expected label to compare against
		const expectedLabel = `Avatar ${INITIALS}`;

		// Check if the aria-label is correctly set
		cy.get("#interactive-avatar")
			.shadow()
			.find(".ui5-avatar-root")
			.should("have.attr", "aria-label", expectedLabel);
	});

	it("checks if accessible-name is correctly passed to the icon", () => {
		const ACCESSIBLE_NAME = "Supplier Icon";
		const ICON_NAME = "supplier";

		cy.mount(<Avatar id="avatar-with-icon" icon={ICON_NAME} accessibleName={ACCESSIBLE_NAME}></Avatar>);

		cy.get("#avatar-with-icon")
			.shadow()
			.find("ui5-icon")
			.shadow()
			.find("svg")
			.should("have.attr", "aria-label", ACCESSIBLE_NAME);
	});

	it("doesn't fire ui5-click event, when disabled property is set", () => {
		cy.mount(
			<div>
				<Avatar interactive disabled initials="JD" id="diabled-avatar" onClick={increment}>
				<Tag slot="badge">
					<Icon slot="icon" name="accelerated"></Icon>
				</Tag>
				</Avatar>
				<input value="0" id="click-event" />
			</div>
		);

		function increment() {
			const input = document.getElementById("click-event") as HTMLInputElement;
			input.value = "1";
		}
		cy.get("#diabled-avatar").realClick();
		cy.get("#click-event").should("have.value", "0");
	});
});

describe("Fallback Logic", () => {
	it("shows image when valid image is provided", () => {
		cy.mount(
			<Avatar id="avatar-with-image">
				<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Test" />
			</Avatar>
		);

		cy.get("#avatar-with-image")
			.shadow()
			.find(".ui5-avatar-root slot:not([name])")
			.should("exist");

		cy.get("#avatar-with-image")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("not.exist");
	});

	it("shows fallback icon when image fails to load", () => {
		cy.mount(
			<Avatar id="avatar-broken-image">
				<img src="./invalid-image.png" alt="Broken" />
			</Avatar>
		);

		// Wait for image error to trigger
		cy.wait(100);

		cy.get("#avatar-broken-image")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("exist")
			.and("be.visible");
	});

	it("shows custom icon when icon property is set (no image)", () => {
		cy.mount(<Avatar id="avatar-with-icon" icon="supplier"></Avatar>);

		cy.get("#avatar-with-icon")
			.shadow()
			.find(".ui5-avatar-icon")
			.should("exist")
			.and("be.visible")
			.and("have.attr", "name", "supplier");

		cy.get("#avatar-with-icon")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("not.be.visible");
	});

	it("shows valid initials when provided (no image, no icon)", () => {
		cy.mount(<Avatar id="avatar-with-initials" initials="JD"></Avatar>);

		cy.get("#avatar-with-initials")
			.shadow()
			.find(".ui5-avatar-initials")
			.should("exist")
			.and("contain.text", "JD");

		cy.get("#avatar-with-initials")
			.shadow()
			.find(".ui5-avatar-fallback-icon-hidden")
			.should("exist");
	});

	it("shows fallback icon for invalid initials (too many characters)", () => {
		cy.mount(<Avatar id="avatar-invalid-initials" initials="ABCD"></Avatar>);

		cy.get("#avatar-invalid-initials")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("exist")
			.and("be.visible");

		cy.get("#avatar-invalid-initials")
			.shadow()
			.find(".ui5-avatar-initials")
			.should("have.class", "ui5-avatar-initials-hidden");
	});

	it("shows fallback icon for non-Latin initials", () => {
		cy.mount(<Avatar id="avatar-non-latin" initials="АБ"></Avatar>);

		cy.get("#avatar-non-latin")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("exist")
			.and("be.visible");
	});

	it("shows custom fallback icon when specified", () => {
		cy.mount(<Avatar id="avatar-custom-fallback" fallbackIcon="alert"></Avatar>);

		cy.get("#avatar-custom-fallback")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("exist")
			.and("have.attr", "name", "alert");
	});

	it("prioritizes image over icon", () => {
		cy.mount(
			<Avatar id="avatar-image-over-icon" icon="supplier">
				<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Test" />
			</Avatar>
		);

		// Should show image, not icon
		cy.get("#avatar-image-over-icon")
			.shadow()
			.find("slot:not([name])")
			.should("exist");

		cy.get("#avatar-image-over-icon")
			.shadow()
			.find(".ui5-avatar-icon")
			.should("not.exist");
	});

	it("prioritizes icon over initials", () => {
		cy.mount(<Avatar id="avatar-icon-over-initials" icon="supplier" initials="JD"></Avatar>);

		cy.get("#avatar-icon-over-initials")
			.shadow()
			.find(".ui5-avatar-icon")
			.should("exist")
			.and("have.attr", "name", "supplier");

		cy.get("#avatar-icon-over-initials")
			.shadow()
			.find(".ui5-avatar-initials")
			.should("have.class", "ui5-avatar-initials-hidden");
	});

	it("switches from image to fallback when image fails dynamically", () => {
		cy.mount(
			<Avatar id="avatar-dynamic-fail">
				<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Test" />
			</Avatar>
		);

		// Initially should show image
		cy.get("#avatar-dynamic-fail")
			.shadow()
			.find("slot:not([name])")
			.should("exist");

		// Change image source to broken URL
		cy.get("#avatar-dynamic-fail img").then(($img) => {
			($img[0] as HTMLImageElement).src = "./broken-image.png";
		});

		// Wait for error handling
		cy.wait(100);

		// Should now show fallback icon
		cy.get("#avatar-dynamic-fail")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("exist")
			.and("be.visible");
	});

	it("switches from fallback back to image when image is fixed", () => {
		cy.mount(
			<Avatar id="avatar-dynamic-fix">
				<img src="./broken-image.png" alt="Initially broken" />
			</Avatar>
		);

		// Wait for initial error
		cy.wait(100);

		// Should show fallback initially
		cy.get("#avatar-dynamic-fix")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("exist");

		// Fix the image source
		cy.get("#avatar-dynamic-fix img").then(($img) => {
			($img[0] as HTMLImageElement).src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
		});

		// Wait for load handling
		cy.wait(100);

		// Should now show image
		cy.get("#avatar-dynamic-fix")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("not.exist");
	});

	it("shows fallback icon when no content is provided", () => {
		cy.mount(<Avatar id="avatar-empty"></Avatar>);

		cy.get("#avatar-empty")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("exist")
			.and("be.visible")
			.and("have.attr", "name", "employee"); // Default fallback icon
	});

	it("correctly handles initials that don't fit in small sizes", () => {
		cy.mount(<Avatar id="avatar-tight-initials" initials="WWW" size="XS"></Avatar>);

		// For XS size, "WWW" likely won't fit, so should show fallback
		cy.get("#avatar-tight-initials")
			.shadow()
			.find(".ui5-avatar-initials")
			.should("have.class", "ui5-avatar-initials-hidden");

		cy.get("#avatar-tight-initials")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("not.have.class", "ui5-avatar-fallback-icon-hidden");
	});

	it("maintains fallback hierarchy: Image > Icon > Initials > Fallback Icon", () => {
		// Test with broken image, should show icon
		cy.mount(
			<Avatar id="hierarchy-test" icon="supplier" initials="JD">
				<img src="./broken-image.png" alt="Broken" />
			</Avatar>
		);

		cy.wait(100);

		// Should show icon (not initials or fallback) when image fails
		cy.get("#hierarchy-test")
			.shadow()
			.find(".ui5-avatar-icon")
			.should("exist")
			.and("have.attr", "name", "supplier");

		cy.get("#hierarchy-test")
			.shadow()
			.find(".ui5-avatar-initials")
			.should("have.class", "ui5-avatar-initials-hidden");

		cy.get("#hierarchy-test")
			.shadow()
			.find(".ui5-avatar-icon-fallback")
			.should("have.class", "ui5-avatar-fallback-icon-hidden");
	});
});
