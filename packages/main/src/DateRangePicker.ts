import customElement from "@ui5/webcomponents-base/dist/decorators/customElement.js";
import property from "@ui5/webcomponents-base/dist/decorators/property.js";
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js";
import type { IFormInputElement } from "@ui5/webcomponents-base/dist/features/InputElementsFormSupport.js";
import CalendarDate from "@ui5/webcomponents-localization/dist/dates/CalendarDate.js";
import UI5Date from "@ui5/webcomponents-localization/dist/dates/UI5Date.js";
import modifyDateBy from "@ui5/webcomponents-localization/dist/dates/modifyDateBy.js";
import getTodayUTCTimestamp from "@ui5/webcomponents-localization/dist/dates/getTodayUTCTimestamp.js";
import {
	DATERANGE_DESCRIPTION,
	DATERANGEPICKER_POPOVER_ACCESSIBLE_NAME,
	DATETIME_COMPONENTS_PLACEHOLDER_PREFIX,
} from "./generated/i18n/i18n-defaults.js";
import DateRangePickerTemplate from "./DateRangePickerTemplate.js";

// Styles
import DateRangePickerCss from "./generated/themes/DateRangePicker.css.js";
import DatePicker from "./DatePicker.js";

import type {
	DatePickerChangeEventDetail as DateRangePickerChangeEventDetail,
	DatePickerInputEventDetail as DateRangePickerInputEventDetail,
} from "./DatePicker.js";
import type { CalendarSelectionChangeEventDetail } from "./Calendar.js";
import type CalendarSelectionMode from "./types/CalendarSelectionMode.js";

const DEFAULT_DELIMITER = "-";

/**
 * @class
 *
 * ### Overview
 * The DateRangePicker enables the users to enter a localized date range using touch, mouse, keyboard input, or by selecting a date range in the calendar.
 *
 * ### Usage
 * The user can enter a date by:
 * Using the calendar that opens in a popup or typing it in directly in the input field (not available for mobile devices).
 * For the `ui5-daterange-picker`
 * ### ES6 Module Import
 *
 * `import "@ui5/webcomponents/dist/DateRangePicker.js";`
 *
 * ### Keyboard Handling
 * The `ui5-daterange-picker` provides advanced keyboard handling.
 *
 * When the `ui5-daterange-picker` input field is focused the user can
 * increment or decrement respectively the range start or end date, depending on where the cursor is.
 * The following shortcuts are available:
 *
 * - [Page Down] - Decrements the corresponding day of the month by one
 * - [Shift] + [Page Down] - Decrements the corresponding month by one
 * - [Shift] + [Ctrl] + [Page Down] - Decrements the corresponding year by one
 * - [Page Up] - Increments the corresponding day of the month by one
 * - [Shift] + [Page Up] - Increments the corresponding month by one
 * - [Shift] + [Ctrl] + [Page Up] - Increments the corresponding year by one
 * @constructor
 * @extends DatePicker
 * @since 1.0.0-rc.8
 * @public
 */
@customElement({
	tag: "ui5-daterange-picker",
	styles: [DatePicker.styles, DateRangePickerCss],
	template: DateRangePickerTemplate,
})
class DateRangePicker extends DatePicker implements IFormInputElement {
	 /**
	 * Determines the symbol which separates the dates.
	 * If not supplied, the default time interval delimiter for the current locale will be used.
	 * @default "-"
	 * @public
	 */
	@property()
	delimiter = "-";

	 /**
	 * The first date in the range during selection (this is a temporary value, not the first date in the value range)
	 * @private
	 */
	@property()
	_tempValue?: string;

	private _prevDelimiter: string | null;

	get formFormattedValue() {
		const values = this._splitValueByDelimiter(this.value || "").filter(Boolean);

		if (values.length && this.name) {
			const formData = new FormData();

			for (let i = 0; i < values.length; i++) {
				formData.append(this.name, values[i]);
			}

			return formData;
		}

		return this.value;
	}

	constructor() {
		super();
		this._prevDelimiter = null;
	}

	/**
	 * **Note:** The getter method is inherited and not supported. If called it will return an empty value.
	 * @public
	 * @default null
	 */
	get dateValue(): Date | null {
		return null;
	}

	/**
	 * **Note:** The getter method is inherited and not supported. If called it will return an empty value.
	 * @public
	 * @default null
	 */
	get dateValueUTC(): Date | null {
		return null;
	}

	get _startDateTimestamp() {
		return this._extractFirstTimestamp(this.value);
	}

	get _endDateTimestamp() {
		return this._extractLastTimestamp(this.value);
	}

	get _tempTimestamp() {
		return this._tempValue && (this.getFormat().parse(this._tempValue, true) as Date).getTime() / 1000;
	}

	/**
	 * Required by DatePicker.js
	 * @override
	 */
	get _calendarSelectionMode(): `${CalendarSelectionMode}` {
		return "Range";
	}

	/**
	 * Required by DatePicker.js - set the calendar focus on the first selected date (or today if not set)
	 * @override
	 */
	get _calendarTimestamp() {
		return this._tempTimestamp || this._startDateTimestamp || getTodayUTCTimestamp(this._primaryCalendarType);
	}

	/**
	 * Required by DatePicker.js
	 * @override
	 */
	get _calendarSelectedDates() {
		if (this._tempValue) {
			return [this._tempValue];
		}
		if (this.value && this._checkValueValidity(this.value)) {
			return this._splitValueByDelimiter(this.value);
		}
		return [];
	}

	/**
	 * Returns the start date of the currently selected range as JavaScript Date instance.
	 * @public
	 * @default null
	 */
	get startDateValue(): Date | null {
		return CalendarDate.fromTimestamp(this._startDateTimestamp! * 1000).toLocalJSDate();
	}

	/**
	 * Returns the end date of the currently selected range as JavaScript Date instance.
	 * @public
	 * @default null
	 */
	get endDateValue(): Date | null {
		return CalendarDate.fromTimestamp(this._endDateTimestamp! * 1000).toLocalJSDate();
	}

	get startValue(): string {
		return this._calendarSelectedDates[0] || "";
	}

	get endValue(): string {
		return this._calendarSelectedDates[1] || "";
	}

	get _lastDateRangeForTheCurrentYear() {
		const currentYear = UI5Date.getInstance().getFullYear();
		const lastDayOfTheYear = UI5Date.getInstance(currentYear, 11, 31, 23, 59, 59);
		const sevenDaysBeforeLastDayOfYear = UI5Date.getInstance(currentYear, 11, 24, 23, 59, 59);

		return `${this.getFormat().format(sevenDaysBeforeLastDayOfYear)} ${this._effectiveDelimiter} ${this.getFormat().format(lastDayOfTheYear)}`;
	}

	/**
	 * @override
	 */
	get _placeholder() {
		if (this.placeholder) {
			return this.placeholder;
		}

		// translatable placeholder – for example "e.g. 2025-12-27 - 2025-12-31"
		return `${DateRangePicker.i18nBundle.getText(DATETIME_COMPONENTS_PLACEHOLDER_PREFIX)} ${this._lastDateRangeForTheCurrentYear}`;
	}

	/**
	 * @override
	 */
	get dateAriaDescription() {
		return DateRangePicker.i18nBundle.getText(DATERANGE_DESCRIPTION);
	}

	/**
	 * @override
	 */
	get pickerAccessibleName() {
		return DateRangePicker.i18nBundle.getText(DATERANGEPICKER_POPOVER_ACCESSIBLE_NAME);
	}

	/**
	 * @override
	 */
	async _onInputSubmit() {
		const caretPos = this._dateTimeInput.getCaretPosition();
		await renderFinished();
		this._dateTimeInput.setCaretPosition(caretPos); // Return the caret on the previous position after rendering
	}

	/**
	 * @override
	 */
	 onResponsivePopoverAfterClose() {
		this._tempValue = ""; // reset _tempValue on popover close
		super.onResponsivePopoverAfterClose();
	}

	/**
	 * Checks if a value is valid against the current date format of the DatePicker.
	 * @public
	 * @param value A value to be tested against the current date format
	 */
	isValid(value: string): boolean {
		const parts = this._splitValueByDelimiter(value);
		return parts.length <= 2 && parts.every(dateString => super.isValid(dateString)); // must be at most 2 dates and each must be valid
	}

	/**
	 * Checks if a date is between the minimum and maximum date.
	 * @public
	 * @param value A value to be checked
	 */
	isInValidRange(value: string): boolean {
		return this._splitValueByDelimiter(value).every(dateString => super.isInValidRange(dateString));
	}

	/**
	 * Extract both dates as timestamps, flip if necessary, and build (which will use the desired format so we enforce the format too)
	 * @override
	 */
	normalizeValue(value: string) {
		const firstDateTimestamp = this._extractFirstTimestamp(value);
		const lastDateTimestamp = this._extractLastTimestamp(value);
		if (firstDateTimestamp && lastDateTimestamp && firstDateTimestamp > lastDateTimestamp) { // if both are timestamps (not undefined), flip if necessary
			return this._buildValue(lastDateTimestamp, firstDateTimestamp);
		}
		return this._buildValue(firstDateTimestamp, lastDateTimestamp);
	}

	/**
	 * @override
	 */
	onSelectedDatesChange(event: CustomEvent<CalendarSelectionChangeEventDetail>) {
		event.preventDefault(); // never let the calendar update its own dates, the parent component controls them
		const values = event.detail.selectedValues;

		if (values.length === 0) {
			return;
		}

		if (values.length === 1) { // Do nothing until the user selects 2 dates, we don't change any state at all for one date
			this._tempValue = values[0];
			return;
		}
		const newValue = this._buildValue(event.detail.selectedDates[0], event.detail.selectedDates[1]); // the value will be normalized so we don't need to order them here
		this._updateValueAndFireEvents(newValue, true, ["change", "value-changed"]);
		this._togglePicker();
	}

	/**
	 * @override
	 */
	async _modifyDateValue(amount: number, unit: string, preserveDate?: boolean) {
		if (!this._endDateTimestamp) { // If empty or only one date -> treat as datepicker entirely
			return super._modifyDateValue(amount, unit, preserveDate);
		}

		let caretPos: number = this._dateTimeInput.getCaretPosition()!; // caret position is always number for input of type text;
		let newValue: string;

		if (caretPos <= this.value.indexOf(this._effectiveDelimiter)) { // The user is focusing the first date -> change it and keep the second date
			const startDateModified = modifyDateBy(CalendarDate.fromTimestamp(this._startDateTimestamp! * 1000), amount, unit, preserveDate, this._minDate, this._maxDate);
			const newStartDateTimestamp = startDateModified.valueOf() / 1000;
			if (newStartDateTimestamp > this._endDateTimestamp) { // dates flipped -> move the caret to the same position but on the last date
				caretPos += Math.ceil(this.value.length / 2);
			}
			newValue = this._buildValue(newStartDateTimestamp, this._endDateTimestamp); // the value will be normalized so we don't try to order them here
		} else {
			const endDateModified = modifyDateBy(CalendarDate.fromTimestamp(this._endDateTimestamp * 1000), amount, unit, preserveDate, this._minDate, this._maxDate);
			const newEndDateTimestamp = endDateModified.valueOf() / 1000;
			newValue = this._buildValue(this._startDateTimestamp, newEndDateTimestamp); // the value will be normalized so we don't try to order them here
			if (newEndDateTimestamp < this._startDateTimestamp!) { // dates flipped -> move the caret to the same position but on the first date
				caretPos -= Math.ceil(this.value.length / 2);
			}
		}
		this._updateValueAndFireEvents(newValue, true, ["change", "value-changed"]);

		await renderFinished();
		this._dateTimeInput.setCaretPosition(caretPos); // Return the caret to the previous (or the adjusted, if dates flipped) position after rendering
	}

	get _effectiveDelimiter(): string {
		return this.delimiter || DEFAULT_DELIMITER;
	}

	_splitValueByDelimiter(value: string) {
		const valuesArray: Array<string> = [];
		const partsArray = value.split(this._prevDelimiter || this._effectiveDelimiter);

		// if format successfully parse the value, the value contains only single date
		if (this.getFormat().parse(value)) {
			valuesArray[0] = partsArray.join(this._effectiveDelimiter);
			valuesArray[1] = "";
		} else {
			valuesArray[0] = partsArray.slice(0, partsArray.length / 2).join(this._effectiveDelimiter);
			valuesArray[1] = partsArray.slice(partsArray.length / 2).join(this._effectiveDelimiter);
		}

		return valuesArray;
	}

	/**
	 * Returns a UTC timestamp, representing the first date in the value string or undefined if the value is empty
	 * @private
	 */
	_extractFirstTimestamp(value: string) {
		if (!value || !this._checkValueValidity(value)) {
			return undefined;
		}

		const dateStrings = this._splitValueByDelimiter(value); // at least one item guaranteed due to the checks above (non-empty and valid)

		const parsedDate = this.getFormat().parse(dateStrings[0], true) as Date;
		return parsedDate.getTime() / 1000;
	}

	/**
	 * Returns a UTC timestamp, representing the last date in the value string or undefined if the value is empty or there is just one date
	 * @private
	 */
	_extractLastTimestamp(value: string) {
		if (!value || !this._checkValueValidity(value)) {
			return undefined;
		}

		const dateStrings = this._splitValueByDelimiter(value);
		if (dateStrings[1]) {
			const parsedDate = this.getFormat().parse(dateStrings[1], true) as Date;
			return parsedDate.getTime() / 1000;
		}

		return undefined;
	}

	/**
	 * Builds a string value out of two UTC timestamps - this method is the counterpart to _extractFirstTimestamp/_extractLastTimestamp
	 * @private
	 */
	_buildValue(firstDateTimestamp: number | undefined, lastDateTimestamp: number | undefined) {
		this._prevDelimiter = this._effectiveDelimiter;
		if (firstDateTimestamp) {
			const firstDateString = this._getStringFromTimestamp(firstDateTimestamp * 1000);

			if (!lastDateTimestamp) {
				return firstDateString;
			}

			const lastDateString = this._getStringFromTimestamp(lastDateTimestamp * 1000);
			return `${firstDateString} ${this._effectiveDelimiter} ${lastDateString}`;
		}

		return "";
	}
}

DateRangePicker.define();

export default DateRangePicker;
export type {
	DateRangePickerChangeEventDetail,
	DateRangePickerInputEventDetail,
};
