/* flatpickr v4.6.9, @license MIT */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.flatpickr = factory());
}(this, (function () { 'use strict';

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */

  var __assign = function() {
      __assign = Object.assign || function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };

  function __spreadArrays() {
      for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
      for (var r = Array(s), k = 0, i = 0; i < il; i++)
          for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
              r[k] = a[j];
      return r;
  }

  var HOOKS = [
      "onChange",
      "onClose",
      "onDayCreate",
      "onDestroy",
      "onKeyDown",
      "onMonthChange",
      "onOpen",
      "onParseConfig",
      "onReady",
      "onValueUpdate",
      "onYearChange",
      "onPreCalendarPosition",
  ];
  var defaults = {
      _disable: [],
      allowInput: false,
      allowInvalidPreload: false,
      altFormat: "F j, Y",
      altInput: false,
      altInputClass: "form-control input",
      animate: typeof window === "object" &&
          window.navigator.userAgent.indexOf("MSIE") === -1,
      ariaDateFormat: "F j, Y",
      autoFillDefaultTime: true,
      clickOpens: true,
      closeOnSelect: true,
      conjunction: ", ",
      dateFormat: "Y-m-d",
      defaultHour: 12,
      defaultMinute: 0,
      defaultSeconds: 0,
      disable: [],
      disableMobile: false,
      enableSeconds: false,
      enableTime: false,
      errorHandler: function (err) {
          return typeof console !== "undefined" && console.warn(err);
      },
      getWeek: function (givenDate) {
          var date = new Date(givenDate.getTime());
          date.setHours(0, 0, 0, 0);
          // Thursday in current week decides the year.
          date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
          // January 4 is always in week 1.
          var week1 = new Date(date.getFullYear(), 0, 4);
          // Adjust to Thursday in week 1 and count number of weeks from date to week1.
          return (1 +
              Math.round(((date.getTime() - week1.getTime()) / 86400000 -
                  3 +
                  ((week1.getDay() + 6) % 7)) /
                  7));
      },
      hourIncrement: 1,
      ignoredFocusElements: [],
      inline: false,
      locale: "default",
      minuteIncrement: 5,
      mode: "single",
      monthSelectorType: "dropdown",
      nextArrow: "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 17 17'><g></g><path d='M13.207 8.472l-7.854 7.854-0.707-0.707 7.146-7.146-7.146-7.148 0.707-0.707 7.854 7.854z' /></svg>",
      noCalendar: false,
      now: new Date(),
      onChange: [],
      onClose: [],
      onDayCreate: [],
      onDestroy: [],
      onKeyDown: [],
      onMonthChange: [],
      onOpen: [],
      onParseConfig: [],
      onReady: [],
      onValueUpdate: [],
      onYearChange: [],
      onPreCalendarPosition: [],
      plugins: [],
      position: "auto",
      positionElement: undefined,
      prevArrow: "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 17 17'><g></g><path d='M5.207 8.471l7.146 7.147-0.707 0.707-7.853-7.854 7.854-7.853 0.707 0.707-7.147 7.146z' /></svg>",
      shorthandCurrentMonth: false,
      showMonths: 1,
      static: false,
      time_24hr: false,
      weekNumbers: false,
      wrap: false,
  };

  var english = {
      weekdays: {
          shorthand: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          longhand: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
          ],
      },
      months: {
          shorthand: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
          ],
          longhand: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
          ],
      },
      daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      firstDayOfWeek: 0,
      ordinal: function (nth) {
          var s = nth % 100;
          if (s > 3 && s < 21)
              return "th";
          switch (s % 10) {
              case 1:
                  return "st";
              case 2:
                  return "nd";
              case 3:
                  return "rd";
              default:
                  return "th";
          }
      },
      rangeSeparator: " to ",
      weekAbbreviation: "Wk",
      scrollTitle: "Scroll to increment",
      toggleTitle: "Click to toggle",
      amPM: ["AM", "PM"],
      yearAriaLabel: "Year",
      monthAriaLabel: "Month",
      hourAriaLabel: "Hour",
      minuteAriaLabel: "Minute",
      time_24hr: false,
  };

  var pad = function (number, length) {
      if (length === void 0) { length = 2; }
      return ("000" + number).slice(length * -1);
  };
  var int = function (bool) { return (bool === true ? 1 : 0); };
  /* istanbul ignore next */
  function debounce(fn, wait) {
      var t;
      return function () {
          var _this = this;
          clearTimeout(t);
          t = setTimeout(function () { return fn.apply(_this, arguments); }, wait);
      };
  }
  var arrayify = function (obj) {
      return obj instanceof Array ? obj : [obj];
  };

  function toggleClass(elem, className, bool) {
      if (bool === true)
          return elem.classList.add(className);
      elem.classList.remove(className);
  }
  function createElement(tag, className, content) {
      var e = window.document.createElement(tag);
      className = className || "";
      content = content || "";
      e.className = className;
      if (content !== undefined)
          e.textContent = content;
      return e;
  }
  function clearNode(node) {
      while (node.firstChild)
          node.removeChild(node.firstChild);
  }
  function findParent(node, condition) {
      if (condition(node))
          return node;
      else if (node.parentNode)
          return findParent(node.parentNode, condition);
      return undefined; // nothing found
  }
  function createNumberInput(inputClassName, opts) {
      var wrapper = createElement("div", "numInputWrapper"), numInput = createElement("input", "numInput " + inputClassName), arrowUp = createElement("span", "arrowUp"), arrowDown = createElement("span", "arrowDown");
      if (navigator.userAgent.indexOf("MSIE 9.0") === -1) {
          numInput.type = "number";
      }
      else {
          numInput.type = "text";
          numInput.pattern = "\\d*";
      }
      if (opts !== undefined)
          for (var key in opts)
              numInput.setAttribute(key, opts[key]);
      wrapper.appendChild(numInput);
      wrapper.appendChild(arrowUp);
      wrapper.appendChild(arrowDown);
      return wrapper;
  }
  function getEventTarget(event) {
      try {
          if (typeof event.composedPath === "function") {
              var path = event.composedPath();
              return path[0];
          }
          return event.target;
      }
      catch (error) {
          return event.target;
      }
  }

  var doNothing = function () { return undefined; };
  var monthToStr = function (monthNumber, shorthand, locale) { return locale.months[shorthand ? "shorthand" : "longhand"][monthNumber]; };
  var revFormat = {
      D: doNothing,
      F: function (dateObj, monthName, locale) {
          dateObj.setMonth(locale.months.longhand.indexOf(monthName));
      },
      G: function (dateObj, hour) {
          dateObj.setHours(parseFloat(hour));
      },
      H: function (dateObj, hour) {
          dateObj.setHours(parseFloat(hour));
      },
      J: function (dateObj, day) {
          dateObj.setDate(parseFloat(day));
      },
      K: function (dateObj, amPM, locale) {
          dateObj.setHours((dateObj.getHours() % 12) +
              12 * int(new RegExp(locale.amPM[1], "i").test(amPM)));
      },
      M: function (dateObj, shortMonth, locale) {
          dateObj.setMonth(locale.months.shorthand.indexOf(shortMonth));
      },
      S: function (dateObj, seconds) {
          dateObj.setSeconds(parseFloat(seconds));
      },
      U: function (_, unixSeconds) { return new Date(parseFloat(unixSeconds) * 1000); },
      W: function (dateObj, weekNum, locale) {
          var weekNumber = parseInt(weekNum);
          var date = new Date(dateObj.getFullYear(), 0, 2 + (weekNumber - 1) * 7, 0, 0, 0, 0);
          date.setDate(date.getDate() - date.getDay() + locale.firstDayOfWeek);
          return date;
      },
      Y: function (dateObj, year) {
          dateObj.setFullYear(parseFloat(year));
      },
      Z: function (_, ISODate) { return new Date(ISODate); },
      d: function (dateObj, day) {
          dateObj.setDate(parseFloat(day));
      },
      h: function (dateObj, hour) {
          dateObj.setHours(parseFloat(hour));
      },
      i: function (dateObj, minutes) {
          dateObj.setMinutes(parseFloat(minutes));
      },
      j: function (dateObj, day) {
          dateObj.setDate(parseFloat(day));
      },
      l: doNothing,
      m: function (dateObj, month) {
          dateObj.setMonth(parseFloat(month) - 1);
      },
      n: function (dateObj, month) {
          dateObj.setMonth(parseFloat(month) - 1);
      },
      s: function (dateObj, seconds) {
          dateObj.setSeconds(parseFloat(seconds));
      },
      u: function (_, unixMillSeconds) {
          return new Date(parseFloat(unixMillSeconds));
      },
      w: doNothing,
      y: function (dateObj, year) {
          dateObj.setFullYear(2000 + parseFloat(year));
      },
  };
  var tokenRegex = {
      D: "(\\w+)",
      F: "(\\w+)",
      G: "(\\d\\d|\\d)",
      H: "(\\d\\d|\\d)",
      J: "(\\d\\d|\\d)\\w+",
      K: "",
      M: "(\\w+)",
      S: "(\\d\\d|\\d)",
      U: "(.+)",
      W: "(\\d\\d|\\d)",
      Y: "(\\d{4})",
      Z: "(.+)",
      d: "(\\d\\d|\\d)",
      h: "(\\d\\d|\\d)",
      i: "(\\d\\d|\\d)",
      j: "(\\d\\d|\\d)",
      l: "(\\w+)",
      m: "(\\d\\d|\\d)",
      n: "(\\d\\d|\\d)",
      s: "(\\d\\d|\\d)",
      u: "(.+)",
      w: "(\\d\\d|\\d)",
      y: "(\\d{2})",
  };
  var formats = {
      // get the date in UTC
      Z: function (date) { return date.toISOString(); },
      // weekday name, short, e.g. Thu
      D: function (date, locale, options) {
          return locale.weekdays.shorthand[formats.w(date, locale, options)];
      },
      // full month name e.g. January
      F: function (date, locale, options) {
          return monthToStr(formats.n(date, locale, options) - 1, false, locale);
      },
      // padded hour 1-12
      G: function (date, locale, options) {
          return pad(formats.h(date, locale, options));
      },
      // hours with leading zero e.g. 03
      H: function (date) { return pad(date.getHours()); },
      // day (1-30) with ordinal suffix e.g. 1st, 2nd
      J: function (date, locale) {
          return locale.ordinal !== undefined
              ? date.getDate() + locale.ordinal(date.getDate())
              : date.getDate();
      },
      // AM/PM
      K: function (date, locale) { return locale.amPM[int(date.getHours() > 11)]; },
      // shorthand month e.g. Jan, Sep, Oct, etc
      M: function (date, locale) {
          return monthToStr(date.getMonth(), true, locale);
      },
      // seconds 00-59
      S: function (date) { return pad(date.getSeconds()); },
      // unix timestamp
      U: function (date) { return date.getTime() / 1000; },
      W: function (date, _, options) {
          return options.getWeek(date);
      },
      // full year e.g. 2016, padded (0001-9999)
      Y: function (date) { return pad(date.getFullYear(), 4); },
      // day in month, padded (01-30)
      d: function (date) { return pad(date.getDate()); },
      // hour from 1-12 (am/pm)
      h: function (date) { return (date.getHours() % 12 ? date.getHours() % 12 : 12); },
      // minutes, padded with leading zero e.g. 09
      i: function (date) { return pad(date.getMinutes()); },
      // day in month (1-30)
      j: function (date) { return date.getDate(); },
      // weekday name, full, e.g. Thursday
      l: function (date, locale) {
          return locale.weekdays.longhand[date.getDay()];
      },
      // padded month number (01-12)
      m: function (date) { return pad(date.getMonth() + 1); },
      // the month number (1-12)
      n: function (date) { return date.getMonth() + 1; },
      // seconds 0-59
      s: function (date) { return date.getSeconds(); },
      // Unix Milliseconds
      u: function (date) { return date.getTime(); },
      // number of the day of the week
      w: function (date) { return date.getDay(); },
      // last two digits of year e.g. 16 for 2016
      y: function (date) { return String(date.getFullYear()).substring(2); },
  };

  var createDateFormatter = function (_a) {
      var _b = _a.config, config = _b === void 0 ? defaults : _b, _c = _a.l10n, l10n = _c === void 0 ? english : _c, _d = _a.isMobile, isMobile = _d === void 0 ? false : _d;
      return function (dateObj, frmt, overrideLocale) {
          var locale = overrideLocale || l10n;
          if (config.formatDate !== undefined && !isMobile) {
              return config.formatDate(dateObj, frmt, locale);
          }
          return frmt
              .split("")
              .map(function (c, i, arr) {
              return formats[c] && arr[i - 1] !== "\\"
                  ? formats[c](dateObj, locale, config)
                  : c !== "\\"
                      ? c
                      : "";
          })
              .join("");
      };
  };
  var createDateParser = function (_a) {
      var _b = _a.config, config = _b === void 0 ? defaults : _b, _c = _a.l10n, l10n = _c === void 0 ? english : _c;
      return function (date, givenFormat, timeless, customLocale) {
          if (date !== 0 && !date)
              return undefined;
          var locale = customLocale || l10n;
          var parsedDate;
          var dateOrig = date;
          if (date instanceof Date)
              parsedDate = new Date(date.getTime());
          else if (typeof date !== "string" &&
              date.toFixed !== undefined // timestamp
          )
              // create a copy
              parsedDate = new Date(date);
          else if (typeof date === "string") {
              // date string
              var format = givenFormat || (config || defaults).dateFormat;
              var datestr = String(date).trim();
              if (datestr === "today") {
                  parsedDate = new Date();
                  timeless = true;
              }
              else if (/Z$/.test(datestr) ||
                  /GMT$/.test(datestr) // datestrings w/ timezone
              )
                  parsedDate = new Date(date);
              else if (config && config.parseDate)
                  parsedDate = config.parseDate(date, format);
              else {
                  parsedDate =
                      !config || !config.noCalendar
                          ? new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0)
                          : new Date(new Date().setHours(0, 0, 0, 0));
                  var matched = void 0, ops = [];
                  for (var i = 0, matchIndex = 0, regexStr = ""; i < format.length; i++) {
                      var token_1 = format[i];
                      var isBackSlash = token_1 === "\\";
                      var escaped = format[i - 1] === "\\" || isBackSlash;
                      if (tokenRegex[token_1] && !escaped) {
                          regexStr += tokenRegex[token_1];
                          var match = new RegExp(regexStr).exec(date);
                          if (match && (matched = true)) {
                              ops[token_1 !== "Y" ? "push" : "unshift"]({
                                  fn: revFormat[token_1],
                                  val: match[++matchIndex],
                              });
                          }
                      }
                      else if (!isBackSlash)
                          regexStr += "."; // don't really care
                      ops.forEach(function (_a) {
                          var fn = _a.fn, val = _a.val;
                          return (parsedDate = fn(parsedDate, val, locale) || parsedDate);
                      });
                  }
                  parsedDate = matched ? parsedDate : undefined;
              }
          }
          /* istanbul ignore next */
          if (!(parsedDate instanceof Date && !isNaN(parsedDate.getTime()))) {
              config.errorHandler(new Error("Invalid date provided: " + dateOrig));
              return undefined;
          }
          if (timeless === true)
              parsedDate.setHours(0, 0, 0, 0);
          return parsedDate;
      };
  };
  /**
   * Compute the difference in dates, measured in ms
   */
  function compareDates(date1, date2, timeless) {
      if (timeless === void 0) { timeless = true; }
      if (timeless !== false) {
          return (new Date(date1.getTime()).setHours(0, 0, 0, 0) -
              new Date(date2.getTime()).setHours(0, 0, 0, 0));
      }
      return date1.getTime() - date2.getTime();
  }
  var isBetween = function (ts, ts1, ts2) {
      return ts > Math.min(ts1, ts2) && ts < Math.max(ts1, ts2);
  };
  var duration = {
      DAY: 86400000,
  };
  function getDefaultHours(config) {
      var hours = config.defaultHour;
      var minutes = config.defaultMinute;
      var seconds = config.defaultSeconds;
      if (config.minDate !== undefined) {
          var minHour = config.minDate.getHours();
          var minMinutes = config.minDate.getMinutes();
          var minSeconds = config.minDate.getSeconds();
          if (hours < minHour) {
              hours = minHour;
          }
          if (hours === minHour && minutes < minMinutes) {
              minutes = minMinutes;
          }
          if (hours === minHour && minutes === minMinutes && seconds < minSeconds)
              seconds = config.minDate.getSeconds();
      }
      if (config.maxDate !== undefined) {
          var maxHr = config.maxDate.getHours();
          var maxMinutes = config.maxDate.getMinutes();
          hours = Math.min(hours, maxHr);
          if (hours === maxHr)
              minutes = Math.min(maxMinutes, minutes);
          if (hours === maxHr && minutes === maxMinutes)
              seconds = config.maxDate.getSeconds();
      }
      return { hours: hours, minutes: minutes, seconds: seconds };
  }

  if (typeof Object.assign !== "function") {
      Object.assign = function (target) {
          var args = [];
          for (var _i = 1; _i < arguments.length; _i++) {
              args[_i - 1] = arguments[_i];
          }
          if (!target) {
              throw TypeError("Cannot convert undefined or null to object");
          }
          var _loop_1 = function (source) {
              if (source) {
                  Object.keys(source).forEach(function (key) { return (target[key] = source[key]); });
              }
          };
          for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
              var source = args_1[_a];
              _loop_1(source);
          }
          return target;
      };
  }

  var DEBOUNCED_CHANGE_MS = 300;
  function FlatpickrInstance(element, instanceConfig) {
      var self = {
          config: __assign(__assign({}, defaults), flatpickr.defaultConfig),
          l10n: english,
      };
      self.parseDate = createDateParser({ config: self.config, l10n: self.l10n });
      self._handlers = [];
      self.pluginElements = [];
      self.loadedPlugins = [];
      self._bind = bind;
      self._setHoursFromDate = setHoursFromDate;
      self._positionCalendar = positionCalendar;
      self.changeMonth = changeMonth;
      self.changeYear = changeYear;
      self.clear = clear;
      self.close = close;
      self._createElement = createElement;
      self.destroy = destroy;
      self.isEnabled = isEnabled;
      self.jumpToDate = jumpToDate;
      self.open = open;
      self.redraw = redraw;
      self.set = set;
      self.setDate = setDate;
      self.toggle = toggle;
      function setupHelperFunctions() {
          self.utils = {
              getDaysInMonth: function (month, yr) {
                  if (month === void 0) { month = self.currentMonth; }
                  if (yr === void 0) { yr = self.currentYear; }
                  if (month === 1 && ((yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0))
                      return 29;
                  return self.l10n.daysInMonth[month];
              },
          };
      }
      function init() {
          self.element = self.input = element;
          self.isOpen = false;
          parseConfig();
          setupLocale();
          setupInputs();
          setupDates();
          setupHelperFunctions();
          if (!self.isMobile)
              build();
          bindEvents();
          if (self.selectedDates.length || self.config.noCalendar) {
              if (self.config.enableTime) {
                  setHoursFromDate(self.config.noCalendar ? self.latestSelectedDateObj : undefined);
              }
              updateValue(false);
          }
          setCalendarWidth();
          var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          /* TODO: investigate this further

            Currently, there is weird positioning behavior in safari causing pages
            to scroll up. https://github.com/chmln/flatpickr/issues/563

            However, most browsers are not Safari and positioning is expensive when used
            in scale. https://github.com/chmln/flatpickr/issues/1096
          */
          if (!self.isMobile && isSafari) {
              positionCalendar();
          }
          triggerEvent("onReady");
      }
      function bindToInstance(fn) {
          return fn.bind(self);
      }
      function setCalendarWidth() {
          var config = self.config;
          if (config.weekNumbers === false && config.showMonths === 1) {
              return;
          }
          else if (config.noCalendar !== true) {
              window.requestAnimationFrame(function () {
                  if (self.calendarContainer !== undefined) {
                      self.calendarContainer.style.visibility = "hidden";
                      self.calendarContainer.style.display = "block";
                  }
                  if (self.daysContainer !== undefined) {
                      var daysWidth = (self.days.offsetWidth + 1) * config.showMonths;
                      self.daysContainer.style.width = daysWidth + "px";
                      self.calendarContainer.style.width =
                          daysWidth +
                              (self.weekWrapper !== undefined
                                  ? self.weekWrapper.offsetWidth
                                  : 0) +
                              "px";
                      self.calendarContainer.style.removeProperty("visibility");
                      self.calendarContainer.style.removeProperty("display");
                  }
              });
          }
      }
      /**
       * The handler for all events targeting the time inputs
       */
      function updateTime(e) {
          if (self.selectedDates.length === 0) {
              var defaultDate = self.config.minDate === undefined ||
                  compareDates(new Date(), self.config.minDate) >= 0
                  ? new Date()
                  : new Date(self.config.minDate.getTime());
              var defaults = getDefaultHours(self.config);
              defaultDate.setHours(defaults.hours, defaults.minutes, defaults.seconds, defaultDate.getMilliseconds());
              self.selectedDates = [defaultDate];
              self.latestSelectedDateObj = defaultDate;
          }
          if (e !== undefined && e.type !== "blur") {
              timeWrapper(e);
          }
          var prevValue = self._input.value;
          setHoursFromInputs();
          updateValue();
          if (self._input.value !== prevValue) {
              self._debouncedChange();
          }
      }
      function ampm2military(hour, amPM) {
          return (hour % 12) + 12 * int(amPM === self.l10n.amPM[1]);
      }
      function military2ampm(hour) {
          switch (hour % 24) {
              case 0:
              case 12:
                  return 12;
              default:
                  return hour % 12;
          }
      }
      /**
       * Syncs the selected date object time with user's time input
       */
      function setHoursFromInputs() {
          if (self.hourElement === undefined || self.minuteElement === undefined)
              return;
          var hours = (parseInt(self.hourElement.value.slice(-2), 10) || 0) % 24, minutes = (parseInt(self.minuteElement.value, 10) || 0) % 60, seconds = self.secondElement !== undefined
              ? (parseInt(self.secondElement.value, 10) || 0) % 60
              : 0;
          if (self.amPM !== undefined) {
              hours = ampm2military(hours, self.amPM.textContent);
          }
          var limitMinHours = self.config.minTime !== undefined ||
              (self.config.minDate &&
                  self.minDateHasTime &&
                  self.latestSelectedDateObj &&
                  compareDates(self.latestSelectedDateObj, self.config.minDate, true) ===
                      0);
          var limitMaxHours = self.config.maxTime !== undefined ||
              (self.config.maxDate &&
                  self.maxDateHasTime &&
                  self.latestSelectedDateObj &&
                  compareDates(self.latestSelectedDateObj, self.config.maxDate, true) ===
                      0);
          if (limitMaxHours) {
              var maxTime = self.config.maxTime !== undefined
                  ? self.config.maxTime
                  : self.config.maxDate;
              hours = Math.min(hours, maxTime.getHours());
              if (hours === maxTime.getHours())
                  minutes = Math.min(minutes, maxTime.getMinutes());
              if (minutes === maxTime.getMinutes())
                  seconds = Math.min(seconds, maxTime.getSeconds());
          }
          if (limitMinHours) {
              var minTime = self.config.minTime !== undefined
                  ? self.config.minTime
                  : self.config.minDate;
              hours = Math.max(hours, minTime.getHours());
              if (hours === minTime.getHours() && minutes < minTime.getMinutes())
                  minutes = minTime.getMinutes();
              if (minutes === minTime.getMinutes())
                  seconds = Math.max(seconds, minTime.getSeconds());
          }
          setHours(hours, minutes, seconds);
      }
      /**
       * Syncs time input values with a date
       */
      function setHoursFromDate(dateObj) {
          var date = dateObj || self.latestSelectedDateObj;
          if (date) {
              setHours(date.getHours(), date.getMinutes(), date.getSeconds());
          }
      }
      /**
       * Sets the hours, minutes, and optionally seconds
       * of the latest selected date object and the
       * corresponding time inputs
       * @param {Number} hours the hour. whether its military
       *                 or am-pm gets inferred from config
       * @param {Number} minutes the minutes
       * @param {Number} seconds the seconds (optional)
       */
      function setHours(hours, minutes, seconds) {
          if (self.latestSelectedDateObj !== undefined) {
              self.latestSelectedDateObj.setHours(hours % 24, minutes, seconds || 0, 0);
          }
          if (!self.hourElement || !self.minuteElement || self.isMobile)
              return;
          self.hourElement.value = pad(!self.config.time_24hr
              ? ((12 + hours) % 12) + 12 * int(hours % 12 === 0)
              : hours);
          self.minuteElement.value = pad(minutes);
          if (self.amPM !== undefined)
              self.amPM.textContent = self.l10n.amPM[int(hours >= 12)];
          if (self.secondElement !== undefined)
              self.secondElement.value = pad(seconds);
      }
      /**
       * Handles the year input and incrementing events
       * @param {Event} event the keyup or increment event
       */
      function onYearInput(event) {
          var eventTarget = getEventTarget(event);
          var year = parseInt(eventTarget.value) + (event.delta || 0);
          if (year / 1000 > 1 ||
              (event.key === "Enter" && !/[^\d]/.test(year.toString()))) {
              changeYear(year);
          }
      }
      /**
       * Essentially addEventListener + tracking
       * @param {Element} element the element to addEventListener to
       * @param {String} event the event name
       * @param {Function} handler the event handler
       */
      function bind(element, event, handler, options) {
          if (event instanceof Array)
              return event.forEach(function (ev) { return bind(element, ev, handler, options); });
          if (element instanceof Array)
              return element.forEach(function (el) { return bind(el, event, handler, options); });
          element.addEventListener(event, handler, options);
          self._handlers.push({
              remove: function () { return element.removeEventListener(event, handler); },
          });
      }
      function triggerChange() {
          triggerEvent("onChange");
      }
      /**
       * Adds all the necessary event listeners
       */
      function bindEvents() {
          if (self.config.wrap) {
              ["open", "close", "toggle", "clear"].forEach(function (evt) {
                  Array.prototype.forEach.call(self.element.querySelectorAll("[data-" + evt + "]"), function (el) {
                      return bind(el, "click", self[evt]);
                  });
              });
          }
          if (self.isMobile) {
              setupMobile();
              return;
          }
          var debouncedResize = debounce(onResize, 50);
          self._debouncedChange = debounce(triggerChange, DEBOUNCED_CHANGE_MS);
          if (self.daysContainer && !/iPhone|iPad|iPod/i.test(navigator.userAgent))
              bind(self.daysContainer, "mouseover", function (e) {
                  if (self.config.mode === "range")
                      onMouseOver(getEventTarget(e));
              });
          bind(window.document.body, "keydown", onKeyDown);
          if (!self.config.inline && !self.config.static)
              bind(window, "resize", debouncedResize);
          if (window.ontouchstart !== undefined)
              bind(window.document, "touchstart", documentClick);
          else
              bind(window.document, "mousedown", documentClick);
          bind(window.document, "focus", documentClick, { capture: true });
          if (self.config.clickOpens === true) {
              bind(self._input, "focus", self.open);
              bind(self._input, "click", self.open);
          }
          if (self.daysContainer !== undefined) {
              bind(self.monthNav, "click", onMonthNavClick);
              bind(self.monthNav, ["keyup", "increment"], onYearInput);
              bind(self.daysContainer, "click", selectDate);
          }
          if (self.timeContainer !== undefined &&
              self.minuteElement !== undefined &&
              self.hourElement !== undefined) {
              var selText = function (e) {
                  return getEventTarget(e).select();
              };
              bind(self.timeContainer, ["increment"], updateTime);
              bind(self.timeContainer, "blur", updateTime, { capture: true });
              bind(self.timeContainer, "click", timeIncrement);
              bind([self.hourElement, self.minuteElement], ["focus", "click"], selText);
              if (self.secondElement !== undefined)
                  bind(self.secondElement, "focus", function () { return self.secondElement && self.secondElement.select(); });
              if (self.amPM !== undefined) {
                  bind(self.amPM, "click", function (e) {
                      updateTime(e);
                      triggerChange();
                  });
              }
          }
          if (self.config.allowInput) {
              bind(self._input, "blur", onBlur);
          }
      }
      /**
       * Set the calendar view to a particular date.
       * @param {Date} jumpDate the date to set the view to
       * @param {boolean} triggerChange if change events should be triggered
       */
      function jumpToDate(jumpDate, triggerChange) {
          var jumpTo = jumpDate !== undefined
              ? self.parseDate(jumpDate)
              : self.latestSelectedDateObj ||
                  (self.config.minDate && self.config.minDate > self.now
                      ? self.config.minDate
                      : self.config.maxDate && self.config.maxDate < self.now
                          ? self.config.maxDate
                          : self.now);
          var oldYear = self.currentYear;
          var oldMonth = self.currentMonth;
          try {
              if (jumpTo !== undefined) {
                  self.currentYear = jumpTo.getFullYear();
                  self.currentMonth = jumpTo.getMonth();
              }
          }
          catch (e) {
              /* istanbul ignore next */
              e.message = "Invalid date supplied: " + jumpTo;
              self.config.errorHandler(e);
          }
          if (triggerChange && self.currentYear !== oldYear) {
              triggerEvent("onYearChange");
              buildMonthSwitch();
          }
          if (triggerChange &&
              (self.currentYear !== oldYear || self.currentMonth !== oldMonth)) {
              triggerEvent("onMonthChange");
          }
          self.redraw();
      }
      /**
       * The up/down arrow handler for time inputs
       * @param {Event} e the click event
       */
      function timeIncrement(e) {
          var eventTarget = getEventTarget(e);
          if (~eventTarget.className.indexOf("arrow"))
              incrementNumInput(e, eventTarget.classList.contains("arrowUp") ? 1 : -1);
      }
      /**
       * Increments/decrements the value of input associ-
       * ated with the up/down arrow by dispatching an
       * "increment" event on the input.
       *
       * @param {Event} e the click event
       * @param {Number} delta the diff (usually 1 or -1)
       * @param {Element} inputElem the input element
       */
      function incrementNumInput(e, delta, inputElem) {
          var target = e && getEventTarget(e);
          var input = inputElem ||
              (target && target.parentNode && target.parentNode.firstChild);
          var event = createEvent("increment");
          event.delta = delta;
          input && input.dispatchEvent(event);
      }
      function build() {
          var fragment = window.document.createDocumentFragment();
          self.calendarContainer = createElement("div", "flatpickr-calendar");
          self.calendarContainer.tabIndex = -1;
          if (!self.config.noCalendar) {
              fragment.appendChild(buildMonthNav());
              self.innerContainer = createElement("div", "flatpickr-innerContainer");
              if (self.config.weekNumbers) {
                  var _a = buildWeeks(), weekWrapper = _a.weekWrapper, weekNumbers = _a.weekNumbers;
                  self.innerContainer.appendChild(weekWrapper);
                  self.weekNumbers = weekNumbers;
                  self.weekWrapper = weekWrapper;
              }
              self.rContainer = createElement("div", "flatpickr-rContainer");
              self.rContainer.appendChild(buildWeekdays());
              if (!self.daysContainer) {
                  self.daysContainer = createElement("div", "flatpickr-days");
                  self.daysContainer.tabIndex = -1;
              }
              buildDays();
              self.rContainer.appendChild(self.daysContainer);
              self.innerContainer.appendChild(self.rContainer);
              fragment.appendChild(self.innerContainer);
          }
          if (self.config.enableTime) {
              fragment.appendChild(buildTime());
          }
          toggleClass(self.calendarContainer, "rangeMode", self.config.mode === "range");
          toggleClass(self.calendarContainer, "animate", self.config.animate === true);
          toggleClass(self.calendarContainer, "multiMonth", self.config.showMonths > 1);
          self.calendarContainer.appendChild(fragment);
          var customAppend = self.config.appendTo !== undefined &&
              self.config.appendTo.nodeType !== undefined;
          if (self.config.inline || self.config.static) {
              self.calendarContainer.classList.add(self.config.inline ? "inline" : "static");
              if (self.config.inline) {
                  if (!customAppend && self.element.parentNode)
                      self.element.parentNode.insertBefore(self.calendarContainer, self._input.nextSibling);
                  else if (self.config.appendTo !== undefined)
                      self.config.appendTo.appendChild(self.calendarContainer);
              }
              if (self.config.static) {
                  var wrapper = createElement("div", "flatpickr-wrapper");
                  if (self.element.parentNode)
                      self.element.parentNode.insertBefore(wrapper, self.element);
                  wrapper.appendChild(self.element);
                  if (self.altInput)
                      wrapper.appendChild(self.altInput);
                  wrapper.appendChild(self.calendarContainer);
              }
          }
          if (!self.config.static && !self.config.inline)
              (self.config.appendTo !== undefined
                  ? self.config.appendTo
                  : window.document.body).appendChild(self.calendarContainer);
      }
      function createDay(className, date, dayNumber, i) {
          var dateIsEnabled = isEnabled(date, true), dayElement = createElement("span", "flatpickr-day " + className, date.getDate().toString());
          dayElement.dateObj = date;
          dayElement.$i = i;
          dayElement.setAttribute("aria-label", self.formatDate(date, self.config.ariaDateFormat));
          if (className.indexOf("hidden") === -1 &&
              compareDates(date, self.now) === 0) {
              self.todayDateElem = dayElement;
              dayElement.classList.add("today");
              dayElement.setAttribute("aria-current", "date");
          }
          if (dateIsEnabled) {
              dayElement.tabIndex = -1;
              if (isDateSelected(date)) {
                  dayElement.classList.add("selected");
                  self.selectedDateElem = dayElement;
                  if (self.config.mode === "range") {
                      toggleClass(dayElement, "startRange", self.selectedDates[0] &&
                          compareDates(date, self.selectedDates[0], true) === 0);
                      toggleClass(dayElement, "endRange", self.selectedDates[1] &&
                          compareDates(date, self.selectedDates[1], true) === 0);
                      if (className === "nextMonthDay")
                          dayElement.classList.add("inRange");
                  }
              }
          }
          else {
              dayElement.classList.add("flatpickr-disabled");
          }
          if (self.config.mode === "range") {
              if (isDateInRange(date) && !isDateSelected(date))
                  dayElement.classList.add("inRange");
          }
          if (self.weekNumbers &&
              self.config.showMonths === 1 &&
              className !== "prevMonthDay" &&
              dayNumber % 7 === 1) {
              self.weekNumbers.insertAdjacentHTML("beforeend", "<span class='flatpickr-day'>" + self.config.getWeek(date) + "</span>");
          }
          triggerEvent("onDayCreate", dayElement);
          return dayElement;
      }
      function focusOnDayElem(targetNode) {
          targetNode.focus();
          if (self.config.mode === "range")
              onMouseOver(targetNode);
      }
      function getFirstAvailableDay(delta) {
          var startMonth = delta > 0 ? 0 : self.config.showMonths - 1;
          var endMonth = delta > 0 ? self.config.showMonths : -1;
          for (var m = startMonth; m != endMonth; m += delta) {
              var month = self.daysContainer.children[m];
              var startIndex = delta > 0 ? 0 : month.children.length - 1;
              var endIndex = delta > 0 ? month.children.length : -1;
              for (var i = startIndex; i != endIndex; i += delta) {
                  var c = month.children[i];
                  if (c.className.indexOf("hidden") === -1 && isEnabled(c.dateObj))
                      return c;
              }
          }
          return undefined;
      }
      function getNextAvailableDay(current, delta) {
          var givenMonth = current.className.indexOf("Month") === -1
              ? current.dateObj.getMonth()
              : self.currentMonth;
          var endMonth = delta > 0 ? self.config.showMonths : -1;
          var loopDelta = delta > 0 ? 1 : -1;
          for (var m = givenMonth - self.currentMonth; m != endMonth; m += loopDelta) {
              var month = self.daysContainer.children[m];
              var startIndex = givenMonth - self.currentMonth === m
                  ? current.$i + delta
                  : delta < 0
                      ? month.children.length - 1
                      : 0;
              var numMonthDays = month.children.length;
              for (var i = startIndex; i >= 0 && i < numMonthDays && i != (delta > 0 ? numMonthDays : -1); i += loopDelta) {
                  var c = month.children[i];
                  if (c.className.indexOf("hidden") === -1 &&
                      isEnabled(c.dateObj) &&
                      Math.abs(current.$i - i) >= Math.abs(delta))
                      return focusOnDayElem(c);
              }
          }
          self.changeMonth(loopDelta);
          focusOnDay(getFirstAvailableDay(loopDelta), 0);
          return undefined;
      }
      function focusOnDay(current, offset) {
          var dayFocused = isInView(document.activeElement || document.body);
          var startElem = current !== undefined
              ? current
              : dayFocused
                  ? document.activeElement
                  : self.selectedDateElem !== undefined && isInView(self.selectedDateElem)
                      ? self.selectedDateElem
                      : self.todayDateElem !== undefined && isInView(self.todayDateElem)
                          ? self.todayDateElem
                          : getFirstAvailableDay(offset > 0 ? 1 : -1);
          if (startElem === undefined) {
              self._input.focus();
          }
          else if (!dayFocused) {
              focusOnDayElem(startElem);
          }
          else {
              getNextAvailableDay(startElem, offset);
          }
      }
      function buildMonthDays(year, month) {
          var firstOfMonth = (new Date(year, month, 1).getDay() - self.l10n.firstDayOfWeek + 7) % 7;
          var prevMonthDays = self.utils.getDaysInMonth((month - 1 + 12) % 12, year);
          var daysInMonth = self.utils.getDaysInMonth(month, year), days = window.document.createDocumentFragment(), isMultiMonth = self.config.showMonths > 1, prevMonthDayClass = isMultiMonth ? "prevMonthDay hidden" : "prevMonthDay", nextMonthDayClass = isMultiMonth ? "nextMonthDay hidden" : "nextMonthDay";
          var dayNumber = prevMonthDays + 1 - firstOfMonth, dayIndex = 0;
          // prepend days from the ending of previous month
          for (; dayNumber <= prevMonthDays; dayNumber++, dayIndex++) {
              days.appendChild(createDay(prevMonthDayClass, new Date(year, month - 1, dayNumber), dayNumber, dayIndex));
          }
          // Start at 1 since there is no 0th day
          for (dayNumber = 1; dayNumber <= daysInMonth; dayNumber++, dayIndex++) {
              days.appendChild(createDay("", new Date(year, month, dayNumber), dayNumber, dayIndex));
          }
          // append days from the next month
          for (var dayNum = daysInMonth + 1; dayNum <= 42 - firstOfMonth &&
              (self.config.showMonths === 1 || dayIndex % 7 !== 0); dayNum++, dayIndex++) {
              days.appendChild(createDay(nextMonthDayClass, new Date(year, month + 1, dayNum % daysInMonth), dayNum, dayIndex));
          }
          //updateNavigationCurrentMonth();
          var dayContainer = createElement("div", "dayContainer");
          dayContainer.appendChild(days);
          return dayContainer;
      }
      function buildDays() {
          if (self.daysContainer === undefined) {
              return;
          }
          clearNode(self.daysContainer);
          // TODO: week numbers for each month
          if (self.weekNumbers)
              clearNode(self.weekNumbers);
          var frag = document.createDocumentFragment();
          for (var i = 0; i < self.config.showMonths; i++) {
              var d = new Date(self.currentYear, self.currentMonth, 1);
              d.setMonth(self.currentMonth + i);
              frag.appendChild(buildMonthDays(d.getFullYear(), d.getMonth()));
          }
          self.daysContainer.appendChild(frag);
          self.days = self.daysContainer.firstChild;
          if (self.config.mode === "range" && self.selectedDates.length === 1) {
              onMouseOver();
          }
      }
      function buildMonthSwitch() {
          if (self.config.showMonths > 1 ||
              self.config.monthSelectorType !== "dropdown")
              return;
          var shouldBuildMonth = function (month) {
              if (self.config.minDate !== undefined &&
                  self.currentYear === self.config.minDate.getFullYear() &&
                  month < self.config.minDate.getMonth()) {
                  return false;
              }
              return !(self.config.maxDate !== undefined &&
                  self.currentYear === self.config.maxDate.getFullYear() &&
                  month > self.config.maxDate.getMonth());
          };
          self.monthsDropdownContainer.tabIndex = -1;
          self.monthsDropdownContainer.innerHTML = "";
          for (var i = 0; i < 12; i++) {
              if (!shouldBuildMonth(i))
                  continue;
              var month = createElement("option", "flatpickr-monthDropdown-month");
              month.value = new Date(self.currentYear, i).getMonth().toString();
              month.textContent = monthToStr(i, self.config.shorthandCurrentMonth, self.l10n);
              month.tabIndex = -1;
              if (self.currentMonth === i) {
                  month.selected = true;
              }
              self.monthsDropdownContainer.appendChild(month);
          }
      }
      function buildMonth() {
          var container = createElement("div", "flatpickr-month");
          var monthNavFragment = window.document.createDocumentFragment();
          var monthElement;
          if (self.config.showMonths > 1 ||
              self.config.monthSelectorType === "static") {
              monthElement = createElement("span", "cur-month");
          }
          else {
              self.monthsDropdownContainer = createElement("select", "flatpickr-monthDropdown-months");
              self.monthsDropdownContainer.setAttribute("aria-label", self.l10n.monthAriaLabel);
              bind(self.monthsDropdownContainer, "change", function (e) {
                  var target = getEventTarget(e);
                  var selectedMonth = parseInt(target.value, 10);
                  self.changeMonth(selectedMonth - self.currentMonth);
                  triggerEvent("onMonthChange");
              });
              buildMonthSwitch();
              monthElement = self.monthsDropdownContainer;
          }
          var yearInput = createNumberInput("cur-year", { tabindex: "-1" });
          var yearElement = yearInput.getElementsByTagName("input")[0];
          yearElement.setAttribute("aria-label", self.l10n.yearAriaLabel);
          if (self.config.minDate) {
              yearElement.setAttribute("min", self.config.minDate.getFullYear().toString());
          }
          if (self.config.maxDate) {
              yearElement.setAttribute("max", self.config.maxDate.getFullYear().toString());
              yearElement.disabled =
                  !!self.config.minDate &&
                      self.config.minDate.getFullYear() === self.config.maxDate.getFullYear();
          }
          var currentMonth = createElement("div", "flatpickr-current-month");
          currentMonth.appendChild(monthElement);
          currentMonth.appendChild(yearInput);
          monthNavFragment.appendChild(currentMonth);
          container.appendChild(monthNavFragment);
          return {
              container: container,
              yearElement: yearElement,
              monthElement: monthElement,
          };
      }
      function buildMonths() {
          clearNode(self.monthNav);
          self.monthNav.appendChild(self.prevMonthNav);
          if (self.config.showMonths) {
              self.yearElements = [];
              self.monthElements = [];
          }
          for (var m = self.config.showMonths; m--;) {
              var month = buildMonth();
              self.yearElements.push(month.yearElement);
              self.monthElements.push(month.monthElement);
              self.monthNav.appendChild(month.container);
          }
          self.monthNav.appendChild(self.nextMonthNav);
      }
      function buildMonthNav() {
          self.monthNav = createElement("div", "flatpickr-months");
          self.yearElements = [];
          self.monthElements = [];
          self.prevMonthNav = createElement("span", "flatpickr-prev-month");
          self.prevMonthNav.innerHTML = self.config.prevArrow;
          self.nextMonthNav = createElement("span", "flatpickr-next-month");
          self.nextMonthNav.innerHTML = self.config.nextArrow;
          buildMonths();
          Object.defineProperty(self, "_hidePrevMonthArrow", {
              get: function () { return self.__hidePrevMonthArrow; },
              set: function (bool) {
                  if (self.__hidePrevMonthArrow !== bool) {
                      toggleClass(self.prevMonthNav, "flatpickr-disabled", bool);
                      self.__hidePrevMonthArrow = bool;
                  }
              },
          });
          Object.defineProperty(self, "_hideNextMonthArrow", {
              get: function () { return self.__hideNextMonthArrow; },
              set: function (bool) {
                  if (self.__hideNextMonthArrow !== bool) {
                      toggleClass(self.nextMonthNav, "flatpickr-disabled", bool);
                      self.__hideNextMonthArrow = bool;
                  }
              },
          });
          self.currentYearElement = self.yearElements[0];
          updateNavigationCurrentMonth();
          return self.monthNav;
      }
      function buildTime() {
          self.calendarContainer.classList.add("hasTime");
          if (self.config.noCalendar)
              self.calendarContainer.classList.add("noCalendar");
          var defaults = getDefaultHours(self.config);
          self.timeContainer = createElement("div", "flatpickr-time");
          self.timeContainer.tabIndex = -1;
          var separator = createElement("span", "flatpickr-time-separator", ":");
          var hourInput = createNumberInput("flatpickr-hour", {
              "aria-label": self.l10n.hourAriaLabel,
          });
          self.hourElement = hourInput.getElementsByTagName("input")[0];
          var minuteInput = createNumberInput("flatpickr-minute", {
              "aria-label": self.l10n.minuteAriaLabel,
          });
          self.minuteElement = minuteInput.getElementsByTagName("input")[0];
          self.hourElement.tabIndex = self.minuteElement.tabIndex = -1;
          self.hourElement.value = pad(self.latestSelectedDateObj
              ? self.latestSelectedDateObj.getHours()
              : self.config.time_24hr
                  ? defaults.hours
                  : military2ampm(defaults.hours));
          self.minuteElement.value = pad(self.latestSelectedDateObj
              ? self.latestSelectedDateObj.getMinutes()
              : defaults.minutes);
          self.hourElement.setAttribute("step", self.config.hourIncrement.toString());
          self.minuteElement.setAttribute("step", self.config.minuteIncrement.toString());
          self.hourElement.setAttribute("min", self.config.time_24hr ? "0" : "1");
          self.hourElement.setAttribute("max", self.config.time_24hr ? "23" : "12");
          self.hourElement.setAttribute("maxlength", "2");
          self.minuteElement.setAttribute("min", "0");
          self.minuteElement.setAttribute("max", "59");
          self.minuteElement.setAttribute("maxlength", "2");
          self.timeContainer.appendChild(hourInput);
          self.timeContainer.appendChild(separator);
          self.timeContainer.appendChild(minuteInput);
          if (self.config.time_24hr)
              self.timeContainer.classList.add("time24hr");
          if (self.config.enableSeconds) {
              self.timeContainer.classList.add("hasSeconds");
              var secondInput = createNumberInput("flatpickr-second");
              self.secondElement = secondInput.getElementsByTagName("input")[0];
              self.secondElement.value = pad(self.latestSelectedDateObj
                  ? self.latestSelectedDateObj.getSeconds()
                  : defaults.seconds);
              self.secondElement.setAttribute("step", self.minuteElement.getAttribute("step"));
              self.secondElement.setAttribute("min", "0");
              self.secondElement.setAttribute("max", "59");
              self.secondElement.setAttribute("maxlength", "2");
              self.timeContainer.appendChild(createElement("span", "flatpickr-time-separator", ":"));
              self.timeContainer.appendChild(secondInput);
          }
          if (!self.config.time_24hr) {
              // add self.amPM if appropriate
              self.amPM = createElement("span", "flatpickr-am-pm", self.l10n.amPM[int((self.latestSelectedDateObj
                  ? self.hourElement.value
                  : self.config.defaultHour) > 11)]);
              self.amPM.title = self.l10n.toggleTitle;
              self.amPM.tabIndex = -1;
              self.timeContainer.appendChild(self.amPM);
          }
          return self.timeContainer;
      }
      function buildWeekdays() {
          if (!self.weekdayContainer)
              self.weekdayContainer = createElement("div", "flatpickr-weekdays");
          else
              clearNode(self.weekdayContainer);
          for (var i = self.config.showMonths; i--;) {
              var container = createElement("div", "flatpickr-weekdaycontainer");
              self.weekdayContainer.appendChild(container);
          }
          updateWeekdays();
          return self.weekdayContainer;
      }
      function updateWeekdays() {
          if (!self.weekdayContainer) {
              return;
          }
          var firstDayOfWeek = self.l10n.firstDayOfWeek;
          var weekdays = __spreadArrays(self.l10n.weekdays.shorthand);
          if (firstDayOfWeek > 0 && firstDayOfWeek < weekdays.length) {
              weekdays = __spreadArrays(weekdays.splice(firstDayOfWeek, weekdays.length), weekdays.splice(0, firstDayOfWeek));
          }
          for (var i = self.config.showMonths; i--;) {
              self.weekdayContainer.children[i].innerHTML = "\n      <span class='flatpickr-weekday'>\n        " + weekdays.join("</span><span class='flatpickr-weekday'>") + "\n      </span>\n      ";
          }
      }
      /* istanbul ignore next */
      function buildWeeks() {
          self.calendarContainer.classList.add("hasWeeks");
          var weekWrapper = createElement("div", "flatpickr-weekwrapper");
          weekWrapper.appendChild(createElement("span", "flatpickr-weekday", self.l10n.weekAbbreviation));
          var weekNumbers = createElement("div", "flatpickr-weeks");
          weekWrapper.appendChild(weekNumbers);
          return {
              weekWrapper: weekWrapper,
              weekNumbers: weekNumbers,
          };
      }
      function changeMonth(value, isOffset) {
          if (isOffset === void 0) { isOffset = true; }
          var delta = isOffset ? value : value - self.currentMonth;
          if ((delta < 0 && self._hidePrevMonthArrow === true) ||
              (delta > 0 && self._hideNextMonthArrow === true))
              return;
          self.currentMonth += delta;
          if (self.currentMonth < 0 || self.currentMonth > 11) {
              self.currentYear += self.currentMonth > 11 ? 1 : -1;
              self.currentMonth = (self.currentMonth + 12) % 12;
              triggerEvent("onYearChange");
              buildMonthSwitch();
          }
          buildDays();
          triggerEvent("onMonthChange");
          updateNavigationCurrentMonth();
      }
      function clear(triggerChangeEvent, toInitial) {
          if (triggerChangeEvent === void 0) { triggerChangeEvent = true; }
          if (toInitial === void 0) { toInitial = true; }
          self.input.value = "";
          if (self.altInput !== undefined)
              self.altInput.value = "";
          if (self.mobileInput !== undefined)
              self.mobileInput.value = "";
          self.selectedDates = [];
          self.latestSelectedDateObj = undefined;
          if (toInitial === true) {
              self.currentYear = self._initialDate.getFullYear();
              self.currentMonth = self._initialDate.getMonth();
          }
          if (self.config.enableTime === true) {
              var _a = getDefaultHours(self.config), hours = _a.hours, minutes = _a.minutes, seconds = _a.seconds;
              setHours(hours, minutes, seconds);
          }
          self.redraw();
          if (triggerChangeEvent)
              // triggerChangeEvent is true (default) or an Event
              triggerEvent("onChange");
      }
      function close() {
          self.isOpen = false;
          if (!self.isMobile) {
              if (self.calendarContainer !== undefined) {
                  self.calendarContainer.classList.remove("open");
              }
              if (self._input !== undefined) {
                  self._input.classList.remove("active");
              }
          }
          triggerEvent("onClose");
      }
      function destroy() {
          if (self.config !== undefined)
              triggerEvent("onDestroy");
          for (var i = self._handlers.length; i--;) {
              self._handlers[i].remove();
          }
          self._handlers = [];
          if (self.mobileInput) {
              if (self.mobileInput.parentNode)
                  self.mobileInput.parentNode.removeChild(self.mobileInput);
              self.mobileInput = undefined;
          }
          else if (self.calendarContainer && self.calendarContainer.parentNode) {
              if (self.config.static && self.calendarContainer.parentNode) {
                  var wrapper = self.calendarContainer.parentNode;
                  wrapper.lastChild && wrapper.removeChild(wrapper.lastChild);
                  if (wrapper.parentNode) {
                      while (wrapper.firstChild)
                          wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
                      wrapper.parentNode.removeChild(wrapper);
                  }
              }
              else
                  self.calendarContainer.parentNode.removeChild(self.calendarContainer);
          }
          if (self.altInput) {
              self.input.type = "text";
              if (self.altInput.parentNode)
                  self.altInput.parentNode.removeChild(self.altInput);
              delete self.altInput;
          }
          if (self.input) {
              self.input.type = self.input._type;
              self.input.classList.remove("flatpickr-input");
              self.input.removeAttribute("readonly");
          }
          [
              "_showTimeInput",
              "latestSelectedDateObj",
              "_hideNextMonthArrow",
              "_hidePrevMonthArrow",
              "__hideNextMonthArrow",
              "__hidePrevMonthArrow",
              "isMobile",
              "isOpen",
              "selectedDateElem",
              "minDateHasTime",
              "maxDateHasTime",
              "days",
              "daysContainer",
              "_input",
              "_positionElement",
              "innerContainer",
              "rContainer",
              "monthNav",
              "todayDateElem",
              "calendarContainer",
              "weekdayContainer",
              "prevMonthNav",
              "nextMonthNav",
              "monthsDropdownContainer",
              "currentMonthElement",
              "currentYearElement",
              "navigationCurrentMonth",
              "selectedDateElem",
              "config",
          ].forEach(function (k) {
              try {
                  delete self[k];
              }
              catch (_) { }
          });
      }
      function isCalendarElem(elem) {
          if (self.config.appendTo && self.config.appendTo.contains(elem))
              return true;
          return self.calendarContainer.contains(elem);
      }
      function documentClick(e) {
          if (self.isOpen && !self.config.inline) {
              var eventTarget_1 = getEventTarget(e);
              var isCalendarElement = isCalendarElem(eventTarget_1);
              var isInput = eventTarget_1 === self.input ||
                  eventTarget_1 === self.altInput ||
                  self.element.contains(eventTarget_1) ||
                  // web components
                  // e.path is not present in all browsers. circumventing typechecks
                  (e.path &&
                      e.path.indexOf &&
                      (~e.path.indexOf(self.input) ||
                          ~e.path.indexOf(self.altInput)));
              var lostFocus = e.type === "blur"
                  ? isInput &&
                      e.relatedTarget &&
                      !isCalendarElem(e.relatedTarget)
                  : !isInput &&
                      !isCalendarElement &&
                      !isCalendarElem(e.relatedTarget);
              var isIgnored = !self.config.ignoredFocusElements.some(function (elem) {
                  return elem.contains(eventTarget_1);
              });
              if (lostFocus && isIgnored) {
                  if (self.timeContainer !== undefined &&
                      self.minuteElement !== undefined &&
                      self.hourElement !== undefined &&
                      self.input.value !== "" &&
                      self.input.value !== undefined) {
                      updateTime();
                  }
                  self.close();
                  if (self.config &&
                      self.config.mode === "range" &&
                      self.selectedDates.length === 1) {
                      self.clear(false);
                      self.redraw();
                  }
              }
          }
      }
      function changeYear(newYear) {
          if (!newYear ||
              (self.config.minDate && newYear < self.config.minDate.getFullYear()) ||
              (self.config.maxDate && newYear > self.config.maxDate.getFullYear()))
              return;
          var newYearNum = newYear, isNewYear = self.currentYear !== newYearNum;
          self.currentYear = newYearNum || self.currentYear;
          if (self.config.maxDate &&
              self.currentYear === self.config.maxDate.getFullYear()) {
              self.currentMonth = Math.min(self.config.maxDate.getMonth(), self.currentMonth);
          }
          else if (self.config.minDate &&
              self.currentYear === self.config.minDate.getFullYear()) {
              self.currentMonth = Math.max(self.config.minDate.getMonth(), self.currentMonth);
          }
          if (isNewYear) {
              self.redraw();
              triggerEvent("onYearChange");
              buildMonthSwitch();
          }
      }
      function isEnabled(date, timeless) {
          var _a;
          if (timeless === void 0) { timeless = true; }
          var dateToCheck = self.parseDate(date, undefined, timeless); // timeless
          if ((self.config.minDate &&
              dateToCheck &&
              compareDates(dateToCheck, self.config.minDate, timeless !== undefined ? timeless : !self.minDateHasTime) < 0) ||
              (self.config.maxDate &&
                  dateToCheck &&
                  compareDates(dateToCheck, self.config.maxDate, timeless !== undefined ? timeless : !self.maxDateHasTime) > 0))
              return false;
          if (!self.config.enable && self.config.disable.length === 0)
              return true;
          if (dateToCheck === undefined)
              return false;
          var bool = !!self.config.enable, array = (_a = self.config.enable) !== null && _a !== void 0 ? _a : self.config.disable;
          for (var i = 0, d = void 0; i < array.length; i++) {
              d = array[i];
              if (typeof d === "function" &&
                  d(dateToCheck) // disabled by function
              )
                  return bool;
              else if (d instanceof Date &&
                  dateToCheck !== undefined &&
                  d.getTime() === dateToCheck.getTime())
                  // disabled by date
                  return bool;
              else if (typeof d === "string") {
                  // disabled by date string
                  var parsed = self.parseDate(d, undefined, true);
                  return parsed && parsed.getTime() === dateToCheck.getTime()
                      ? bool
                      : !bool;
              }
              else if (
              // disabled by range
              typeof d === "object" &&
                  dateToCheck !== undefined &&
                  d.from &&
                  d.to &&
                  dateToCheck.getTime() >= d.from.getTime() &&
                  dateToCheck.getTime() <= d.to.getTime())
                  return bool;
          }
          return !bool;
      }
      function isInView(elem) {
          if (self.daysContainer !== undefined)
              return (elem.className.indexOf("hidden") === -1 &&
                  elem.className.indexOf("flatpickr-disabled") === -1 &&
                  self.daysContainer.contains(elem));
          return false;
      }
      function onBlur(e) {
          var isInput = e.target === self._input;
          if (isInput &&
              (self.selectedDates.length > 0 || self._input.value.length > 0) &&
              !(e.relatedTarget && isCalendarElem(e.relatedTarget))) {
              self.setDate(self._input.value, true, e.target === self.altInput
                  ? self.config.altFormat
                  : self.config.dateFormat);
          }
      }
      function onKeyDown(e) {
          // e.key                      e.keyCode
          // "Backspace"                        8
          // "Tab"                              9
          // "Enter"                           13
          // "Escape"     (IE "Esc")           27
          // "ArrowLeft"  (IE "Left")          37
          // "ArrowUp"    (IE "Up")            38
          // "ArrowRight" (IE "Right")         39
          // "ArrowDown"  (IE "Down")          40
          // "Delete"     (IE "Del")           46
          var eventTarget = getEventTarget(e);
          var isInput = self.config.wrap
              ? element.contains(eventTarget)
              : eventTarget === self._input;
          var allowInput = self.config.allowInput;
          var allowKeydown = self.isOpen && (!allowInput || !isInput);
          var allowInlineKeydown = self.config.inline && isInput && !allowInput;
          if (e.keyCode === 13 && isInput) {
              if (allowInput) {
                  self.setDate(self._input.value, true, eventTarget === self.altInput
                      ? self.config.altFormat
                      : self.config.dateFormat);
                  return eventTarget.blur();
              }
              else {
                  self.open();
              }
          }
          else if (isCalendarElem(eventTarget) ||
              allowKeydown ||
              allowInlineKeydown) {
              var isTimeObj = !!self.timeContainer &&
                  self.timeContainer.contains(eventTarget);
              switch (e.keyCode) {
                  case 13:
                      if (isTimeObj) {
                          e.preventDefault();
                          updateTime();
                          focusAndClose();
                      }
                      else
                          selectDate(e);
                      break;
                  case 27: // escape
                      e.preventDefault();
                      focusAndClose();
                      break;
                  case 8:
                  case 46:
                      if (isInput && !self.config.allowInput) {
                          e.preventDefault();
                          self.clear();
                      }
                      break;
                  case 37:
                  case 39:
                      if (!isTimeObj && !isInput) {
                          e.preventDefault();
                          if (self.daysContainer !== undefined &&
                              (allowInput === false ||
                                  (document.activeElement && isInView(document.activeElement)))) {
                              var delta_1 = e.keyCode === 39 ? 1 : -1;
                              if (!e.ctrlKey)
                                  focusOnDay(undefined, delta_1);
                              else {
                                  e.stopPropagation();
                                  changeMonth(delta_1);
                                  focusOnDay(getFirstAvailableDay(1), 0);
                              }
                          }
                      }
                      else if (self.hourElement)
                          self.hourElement.focus();
                      break;
                  case 38:
                  case 40:
                      e.preventDefault();
                      var delta = e.keyCode === 40 ? 1 : -1;
                      if ((self.daysContainer &&
                          eventTarget.$i !== undefined) ||
                          eventTarget === self.input ||
                          eventTarget === self.altInput) {
                          if (e.ctrlKey) {
                              e.stopPropagation();
                              changeYear(self.currentYear - delta);
                              focusOnDay(getFirstAvailableDay(1), 0);
                          }
                          else if (!isTimeObj)
                              focusOnDay(undefined, delta * 7);
                      }
                      else if (eventTarget === self.currentYearElement) {
                          changeYear(self.currentYear - delta);
                      }
                      else if (self.config.enableTime) {
                          if (!isTimeObj && self.hourElement)
                              self.hourElement.focus();
                          updateTime(e);
                          self._debouncedChange();
                      }
                      break;
                  case 9:
                      if (isTimeObj) {
                          var elems = [
                              self.hourElement,
                              self.minuteElement,
                              self.secondElement,
                              self.amPM,
                          ]
                              .concat(self.pluginElements)
                              .filter(function (x) { return x; });
                          var i = elems.indexOf(eventTarget);
                          if (i !== -1) {
                              var target = elems[i + (e.shiftKey ? -1 : 1)];
                              e.preventDefault();
                              (target || self._input).focus();
                          }
                      }
                      else if (!self.config.noCalendar &&
                          self.daysContainer &&
                          self.daysContainer.contains(eventTarget) &&
                          e.shiftKey) {
                          e.preventDefault();
                          self._input.focus();
                      }
                      break;
              }
          }
          if (self.amPM !== undefined && eventTarget === self.amPM) {
              switch (e.key) {
                  case self.l10n.amPM[0].charAt(0):
                  case self.l10n.amPM[0].charAt(0).toLowerCase():
                      self.amPM.textContent = self.l10n.amPM[0];
                      setHoursFromInputs();
                      updateValue();
                      break;
                  case self.l10n.amPM[1].charAt(0):
                  case self.l10n.amPM[1].charAt(0).toLowerCase():
                      self.amPM.textContent = self.l10n.amPM[1];
                      setHoursFromInputs();
                      updateValue();
                      break;
              }
          }
          if (isInput || isCalendarElem(eventTarget)) {
              triggerEvent("onKeyDown", e);
          }
      }
      function onMouseOver(elem) {
          if (self.selectedDates.length !== 1 ||
              (elem &&
                  (!elem.classList.contains("flatpickr-day") ||
                      elem.classList.contains("flatpickr-disabled"))))
              return;
          var hoverDate = elem
              ? elem.dateObj.getTime()
              : self.days.firstElementChild.dateObj.getTime(), initialDate = self.parseDate(self.selectedDates[0], undefined, true).getTime(), rangeStartDate = Math.min(hoverDate, self.selectedDates[0].getTime()), rangeEndDate = Math.max(hoverDate, self.selectedDates[0].getTime());
          var containsDisabled = false;
          var minRange = 0, maxRange = 0;
          for (var t = rangeStartDate; t < rangeEndDate; t += duration.DAY) {
              if (!isEnabled(new Date(t), true)) {
                  containsDisabled =
                      containsDisabled || (t > rangeStartDate && t < rangeEndDate);
                  if (t < initialDate && (!minRange || t > minRange))
                      minRange = t;
                  else if (t > initialDate && (!maxRange || t < maxRange))
                      maxRange = t;
              }
          }
          for (var m = 0; m < self.config.showMonths; m++) {
              var month = self.daysContainer.children[m];
              var _loop_1 = function (i, l) {
                  var dayElem = month.children[i], date = dayElem.dateObj;
                  var timestamp = date.getTime();
                  var outOfRange = (minRange > 0 && timestamp < minRange) ||
                      (maxRange > 0 && timestamp > maxRange);
                  if (outOfRange) {
                      dayElem.classList.add("notAllowed");
                      ["inRange", "startRange", "endRange"].forEach(function (c) {
                          dayElem.classList.remove(c);
                      });
                      return "continue";
                  }
                  else if (containsDisabled && !outOfRange)
                      return "continue";
                  ["startRange", "inRange", "endRange", "notAllowed"].forEach(function (c) {
                      dayElem.classList.remove(c);
                  });
                  if (elem !== undefined) {
                      elem.classList.add(hoverDate <= self.selectedDates[0].getTime()
                          ? "startRange"
                          : "endRange");
                      if (initialDate < hoverDate && timestamp === initialDate)
                          dayElem.classList.add("startRange");
                      else if (initialDate > hoverDate && timestamp === initialDate)
                          dayElem.classList.add("endRange");
                      if (timestamp >= minRange &&
                          (maxRange === 0 || timestamp <= maxRange) &&
                          isBetween(timestamp, initialDate, hoverDate))
                          dayElem.classList.add("inRange");
                  }
              };
              for (var i = 0, l = month.children.length; i < l; i++) {
                  _loop_1(i, l);
              }
          }
      }
      function onResize() {
          if (self.isOpen && !self.config.static && !self.config.inline)
              positionCalendar();
      }
      function open(e, positionElement) {
          if (positionElement === void 0) { positionElement = self._positionElement; }
          if (self.isMobile === true) {
              if (e) {
                  e.preventDefault();
                  var eventTarget = getEventTarget(e);
                  if (eventTarget) {
                      eventTarget.blur();
                  }
              }
              if (self.mobileInput !== undefined) {
                  self.mobileInput.focus();
                  self.mobileInput.click();
              }
              triggerEvent("onOpen");
              return;
          }
          else if (self._input.disabled || self.config.inline) {
              return;
          }
          var wasOpen = self.isOpen;
          self.isOpen = true;
          if (!wasOpen) {
              self.calendarContainer.classList.add("open");
              self._input.classList.add("active");
              triggerEvent("onOpen");
              positionCalendar(positionElement);
          }
          if (self.config.enableTime === true && self.config.noCalendar === true) {
              if (self.config.allowInput === false &&
                  (e === undefined ||
                      !self.timeContainer.contains(e.relatedTarget))) {
                  setTimeout(function () { return self.hourElement.select(); }, 50);
              }
          }
      }
      function minMaxDateSetter(type) {
          return function (date) {
              var dateObj = (self.config["_" + type + "Date"] = self.parseDate(date, self.config.dateFormat));
              var inverseDateObj = self.config["_" + (type === "min" ? "max" : "min") + "Date"];
              if (dateObj !== undefined) {
                  self[type === "min" ? "minDateHasTime" : "maxDateHasTime"] =
                      dateObj.getHours() > 0 ||
                          dateObj.getMinutes() > 0 ||
                          dateObj.getSeconds() > 0;
              }
              if (self.selectedDates) {
                  self.selectedDates = self.selectedDates.filter(function (d) { return isEnabled(d); });
                  if (!self.selectedDates.length && type === "min")
                      setHoursFromDate(dateObj);
                  updateValue();
              }
              if (self.daysContainer) {
                  redraw();
                  if (dateObj !== undefined)
                      self.currentYearElement[type] = dateObj.getFullYear().toString();
                  else
                      self.currentYearElement.removeAttribute(type);
                  self.currentYearElement.disabled =
                      !!inverseDateObj &&
                          dateObj !== undefined &&
                          inverseDateObj.getFullYear() === dateObj.getFullYear();
              }
          };
      }
      function parseConfig() {
          var boolOpts = [
              "wrap",
              "weekNumbers",
              "allowInput",
              "allowInvalidPreload",
              "clickOpens",
              "time_24hr",
              "enableTime",
              "noCalendar",
              "altInput",
              "shorthandCurrentMonth",
              "inline",
              "static",
              "enableSeconds",
              "disableMobile",
          ];
          var userConfig = __assign(__assign({}, JSON.parse(JSON.stringify(element.dataset || {}))), instanceConfig);
          var formats = {};
          self.config.parseDate = userConfig.parseDate;
          self.config.formatDate = userConfig.formatDate;
          Object.defineProperty(self.config, "enable", {
              get: function () { return self.config._enable; },
              set: function (dates) {
                  self.config._enable = parseDateRules(dates);
              },
          });
          Object.defineProperty(self.config, "disable", {
              get: function () { return self.config._disable; },
              set: function (dates) {
                  self.config._disable = parseDateRules(dates);
              },
          });
          var timeMode = userConfig.mode === "time";
          if (!userConfig.dateFormat && (userConfig.enableTime || timeMode)) {
              var defaultDateFormat = flatpickr.defaultConfig.dateFormat || defaults.dateFormat;
              formats.dateFormat =
                  userConfig.noCalendar || timeMode
                      ? "H:i" + (userConfig.enableSeconds ? ":S" : "")
                      : defaultDateFormat + " H:i" + (userConfig.enableSeconds ? ":S" : "");
          }
          if (userConfig.altInput &&
              (userConfig.enableTime || timeMode) &&
              !userConfig.altFormat) {
              var defaultAltFormat = flatpickr.defaultConfig.altFormat || defaults.altFormat;
              formats.altFormat =
                  userConfig.noCalendar || timeMode
                      ? "h:i" + (userConfig.enableSeconds ? ":S K" : " K")
                      : defaultAltFormat + (" h:i" + (userConfig.enableSeconds ? ":S" : "") + " K");
          }
          Object.defineProperty(self.config, "minDate", {
              get: function () { return self.config._minDate; },
              set: minMaxDateSetter("min"),
          });
          Object.defineProperty(self.config, "maxDate", {
              get: function () { return self.config._maxDate; },
              set: minMaxDateSetter("max"),
          });
          var minMaxTimeSetter = function (type) { return function (val) {
              self.config[type === "min" ? "_minTime" : "_maxTime"] = self.parseDate(val, "H:i:S");
          }; };
          Object.defineProperty(self.config, "minTime", {
              get: function () { return self.config._minTime; },
              set: minMaxTimeSetter("min"),
          });
          Object.defineProperty(self.config, "maxTime", {
              get: function () { return self.config._maxTime; },
              set: minMaxTimeSetter("max"),
          });
          if (userConfig.mode === "time") {
              self.config.noCalendar = true;
              self.config.enableTime = true;
          }
          Object.assign(self.config, formats, userConfig);
          for (var i = 0; i < boolOpts.length; i++)
              // https://github.com/microsoft/TypeScript/issues/31663
              self.config[boolOpts[i]] =
                  self.config[boolOpts[i]] === true ||
                      self.config[boolOpts[i]] === "true";
          HOOKS.filter(function (hook) { return self.config[hook] !== undefined; }).forEach(function (hook) {
              self.config[hook] = arrayify(self.config[hook] || []).map(bindToInstance);
          });
          self.isMobile =
              !self.config.disableMobile &&
                  !self.config.inline &&
                  self.config.mode === "single" &&
                  !self.config.disable.length &&
                  !self.config.enable &&
                  !self.config.weekNumbers &&
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          for (var i = 0; i < self.config.plugins.length; i++) {
              var pluginConf = self.config.plugins[i](self) || {};
              for (var key in pluginConf) {
                  if (HOOKS.indexOf(key) > -1) {
                      self.config[key] = arrayify(pluginConf[key])
                          .map(bindToInstance)
                          .concat(self.config[key]);
                  }
                  else if (typeof userConfig[key] === "undefined")
                      self.config[key] = pluginConf[key];
              }
          }
          if (!userConfig.altInputClass) {
              self.config.altInputClass =
                  getInputElem().className + " " + self.config.altInputClass;
          }
          triggerEvent("onParseConfig");
      }
      function getInputElem() {
          return self.config.wrap
              ? element.querySelector("[data-input]")
              : element;
      }
      function setupLocale() {
          if (typeof self.config.locale !== "object" &&
              typeof flatpickr.l10ns[self.config.locale] === "undefined")
              self.config.errorHandler(new Error("flatpickr: invalid locale " + self.config.locale));
          self.l10n = __assign(__assign({}, flatpickr.l10ns.default), (typeof self.config.locale === "object"
              ? self.config.locale
              : self.config.locale !== "default"
                  ? flatpickr.l10ns[self.config.locale]
                  : undefined));
          tokenRegex.K = "(" + self.l10n.amPM[0] + "|" + self.l10n.amPM[1] + "|" + self.l10n.amPM[0].toLowerCase() + "|" + self.l10n.amPM[1].toLowerCase() + ")";
          var userConfig = __assign(__assign({}, instanceConfig), JSON.parse(JSON.stringify(element.dataset || {})));
          if (userConfig.time_24hr === undefined &&
              flatpickr.defaultConfig.time_24hr === undefined) {
              self.config.time_24hr = self.l10n.time_24hr;
          }
          self.formatDate = createDateFormatter(self);
          self.parseDate = createDateParser({ config: self.config, l10n: self.l10n });
      }
      function positionCalendar(customPositionElement) {
          if (typeof self.config.position === "function") {
              return void self.config.position(self, customPositionElement);
          }
          if (self.calendarContainer === undefined)
              return;
          triggerEvent("onPreCalendarPosition");
          var positionElement = customPositionElement || self._positionElement;
          var calendarHeight = Array.prototype.reduce.call(self.calendarContainer.children, (function (acc, child) { return acc + child.offsetHeight; }), 0), calendarWidth = self.calendarContainer.offsetWidth, configPos = self.config.position.split(" "), configPosVertical = configPos[0], configPosHorizontal = configPos.length > 1 ? configPos[1] : null, inputBounds = positionElement.getBoundingClientRect(), distanceFromBottom = window.innerHeight - inputBounds.bottom, showOnTop = configPosVertical === "above" ||
              (configPosVertical !== "below" &&
                  distanceFromBottom < calendarHeight &&
                  inputBounds.top > calendarHeight);
          var top = window.pageYOffset +
              inputBounds.top +
              (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2);
          toggleClass(self.calendarContainer, "arrowTop", !showOnTop);
          toggleClass(self.calendarContainer, "arrowBottom", showOnTop);
          if (self.config.inline)
              return;
          var left = window.pageXOffset + inputBounds.left;
          var isCenter = false;
          var isRight = false;
          if (configPosHorizontal === "center") {
              left -= (calendarWidth - inputBounds.width) / 2;
              isCenter = true;
          }
          else if (configPosHorizontal === "right") {
              left -= calendarWidth - inputBounds.width;
              isRight = true;
          }
          toggleClass(self.calendarContainer, "arrowLeft", !isCenter && !isRight);
          toggleClass(self.calendarContainer, "arrowCenter", isCenter);
          toggleClass(self.calendarContainer, "arrowRight", isRight);
          var right = window.document.body.offsetWidth -
              (window.pageXOffset + inputBounds.right);
          var rightMost = left + calendarWidth > window.document.body.offsetWidth;
          var centerMost = right + calendarWidth > window.document.body.offsetWidth;
          toggleClass(self.calendarContainer, "rightMost", rightMost);
          if (self.config.static)
              return;
          self.calendarContainer.style.top = top + "px";
          if (!rightMost) {
              self.calendarContainer.style.left = left + "px";
              self.calendarContainer.style.right = "auto";
          }
          else if (!centerMost) {
              self.calendarContainer.style.left = "auto";
              self.calendarContainer.style.right = right + "px";
          }
          else {
              var doc = getDocumentStyleSheet();
              // some testing environments don't have css support
              if (doc === undefined)
                  return;
              var bodyWidth = window.document.body.offsetWidth;
              var centerLeft = Math.max(0, bodyWidth / 2 - calendarWidth / 2);
              var centerBefore = ".flatpickr-calendar.centerMost:before";
              var centerAfter = ".flatpickr-calendar.centerMost:after";
              var centerIndex = doc.cssRules.length;
              var centerStyle = "{left:" + inputBounds.left + "px;right:auto;}";
              toggleClass(self.calendarContainer, "rightMost", false);
              toggleClass(self.calendarContainer, "centerMost", true);
              doc.insertRule(centerBefore + "," + centerAfter + centerStyle, centerIndex);
              self.calendarContainer.style.left = centerLeft + "px";
              self.calendarContainer.style.right = "auto";
          }
      }
      function getDocumentStyleSheet() {
          var editableSheet = null;
          for (var i = 0; i < document.styleSheets.length; i++) {
              var sheet = document.styleSheets[i];
              try {
                  sheet.cssRules;
              }
              catch (err) {
                  continue;
              }
              editableSheet = sheet;
              break;
          }
          return editableSheet != null ? editableSheet : createStyleSheet();
      }
      function createStyleSheet() {
          var style = document.createElement("style");
          document.head.appendChild(style);
          return style.sheet;
      }
      function redraw() {
          if (self.config.noCalendar || self.isMobile)
              return;
          buildMonthSwitch();
          updateNavigationCurrentMonth();
          buildDays();
      }
      function focusAndClose() {
          self._input.focus();
          if (window.navigator.userAgent.indexOf("MSIE") !== -1 ||
              navigator.msMaxTouchPoints !== undefined) {
              // hack - bugs in the way IE handles focus keeps the calendar open
              setTimeout(self.close, 0);
          }
          else {
              self.close();
          }
      }
      function selectDate(e) {
          e.preventDefault();
          e.stopPropagation();
          var isSelectable = function (day) {
              return day.classList &&
                  day.classList.contains("flatpickr-day") &&
                  !day.classList.contains("flatpickr-disabled") &&
                  !day.classList.contains("notAllowed");
          };
          var t = findParent(getEventTarget(e), isSelectable);
          if (t === undefined)
              return;
          var target = t;
          var selectedDate = (self.latestSelectedDateObj = new Date(target.dateObj.getTime()));
          var shouldChangeMonth = (selectedDate.getMonth() < self.currentMonth ||
              selectedDate.getMonth() >
                  self.currentMonth + self.config.showMonths - 1) &&
              self.config.mode !== "range";
          self.selectedDateElem = target;
          if (self.config.mode === "single")
              self.selectedDates = [selectedDate];
          else if (self.config.mode === "multiple") {
              var selectedIndex = isDateSelected(selectedDate);
              if (selectedIndex)
                  self.selectedDates.splice(parseInt(selectedIndex), 1);
              else
                  self.selectedDates.push(selectedDate);
          }
          else if (self.config.mode === "range") {
              if (self.selectedDates.length === 2) {
                  self.clear(false, false);
              }
              self.latestSelectedDateObj = selectedDate;
              self.selectedDates.push(selectedDate);
              // unless selecting same date twice, sort ascendingly
              if (compareDates(selectedDate, self.selectedDates[0], true) !== 0)
                  self.selectedDates.sort(function (a, b) { return a.getTime() - b.getTime(); });
          }
          setHoursFromInputs();
          if (shouldChangeMonth) {
              var isNewYear = self.currentYear !== selectedDate.getFullYear();
              self.currentYear = selectedDate.getFullYear();
              self.currentMonth = selectedDate.getMonth();
              if (isNewYear) {
                  triggerEvent("onYearChange");
                  buildMonthSwitch();
              }
              triggerEvent("onMonthChange");
          }
          updateNavigationCurrentMonth();
          buildDays();
          updateValue();
          // maintain focus
          if (!shouldChangeMonth &&
              self.config.mode !== "range" &&
              self.config.showMonths === 1)
              focusOnDayElem(target);
          else if (self.selectedDateElem !== undefined &&
              self.hourElement === undefined) {
              self.selectedDateElem && self.selectedDateElem.focus();
          }
          if (self.hourElement !== undefined)
              self.hourElement !== undefined && self.hourElement.focus();
          if (self.config.closeOnSelect) {
              var single = self.config.mode === "single" && !self.config.enableTime;
              var range = self.config.mode === "range" &&
                  self.selectedDates.length === 2 &&
                  !self.config.enableTime;
              if (single || range) {
                  focusAndClose();
              }
          }
          triggerChange();
      }
      var CALLBACKS = {
          locale: [setupLocale, updateWeekdays],
          showMonths: [buildMonths, setCalendarWidth, buildWeekdays],
          minDate: [jumpToDate],
          maxDate: [jumpToDate],
          clickOpens: [
              function () {
                  if (self.config.clickOpens === true) {
                      bind(self._input, "focus", self.open);
                      bind(self._input, "click", self.open);
                  }
                  else {
                      self._input.removeEventListener("focus", self.open);
                      self._input.removeEventListener("click", self.open);
                  }
              },
          ],
      };
      function set(option, value) {
          if (option !== null && typeof option === "object") {
              Object.assign(self.config, option);
              for (var key in option) {
                  if (CALLBACKS[key] !== undefined)
                      CALLBACKS[key].forEach(function (x) { return x(); });
              }
          }
          else {
              self.config[option] = value;
              if (CALLBACKS[option] !== undefined)
                  CALLBACKS[option].forEach(function (x) { return x(); });
              else if (HOOKS.indexOf(option) > -1)
                  self.config[option] = arrayify(value);
          }
          self.redraw();
          updateValue(true);
      }
      function setSelectedDate(inputDate, format) {
          var dates = [];
          if (inputDate instanceof Array)
              dates = inputDate.map(function (d) { return self.parseDate(d, format); });
          else if (inputDate instanceof Date || typeof inputDate === "number")
              dates = [self.parseDate(inputDate, format)];
          else if (typeof inputDate === "string") {
              switch (self.config.mode) {
                  case "single":
                  case "time":
                      dates = [self.parseDate(inputDate, format)];
                      break;
                  case "multiple":
                      dates = inputDate
                          .split(self.config.conjunction)
                          .map(function (date) { return self.parseDate(date, format); });
                      break;
                  case "range":
                      dates = inputDate
                          .split(self.l10n.rangeSeparator)
                          .map(function (date) { return self.parseDate(date, format); });
                      break;
              }
          }
          else
              self.config.errorHandler(new Error("Invalid date supplied: " + JSON.stringify(inputDate)));
          self.selectedDates = (self.config.allowInvalidPreload
              ? dates
              : dates.filter(function (d) { return d instanceof Date && isEnabled(d, false); }));
          if (self.config.mode === "range")
              self.selectedDates.sort(function (a, b) { return a.getTime() - b.getTime(); });
      }
      function setDate(date, triggerChange, format) {
          if (triggerChange === void 0) { triggerChange = false; }
          if (format === void 0) { format = self.config.dateFormat; }
          if ((date !== 0 && !date) || (date instanceof Array && date.length === 0))
              return self.clear(triggerChange);
          setSelectedDate(date, format);
          self.latestSelectedDateObj =
              self.selectedDates[self.selectedDates.length - 1];
          self.redraw();
          jumpToDate(undefined, triggerChange);
          setHoursFromDate();
          if (self.selectedDates.length === 0) {
              self.clear(false);
          }
          updateValue(triggerChange);
          if (triggerChange)
              triggerEvent("onChange");
      }
      function parseDateRules(arr) {
          return arr
              .slice()
              .map(function (rule) {
              if (typeof rule === "string" ||
                  typeof rule === "number" ||
                  rule instanceof Date) {
                  return self.parseDate(rule, undefined, true);
              }
              else if (rule &&
                  typeof rule === "object" &&
                  rule.from &&
                  rule.to)
                  return {
                      from: self.parseDate(rule.from, undefined),
                      to: self.parseDate(rule.to, undefined),
                  };
              return rule;
          })
              .filter(function (x) { return x; }); // remove falsy values
      }
      function setupDates() {
          self.selectedDates = [];
          self.now = self.parseDate(self.config.now) || new Date();
          // Workaround IE11 setting placeholder as the input's value
          var preloadedDate = self.config.defaultDate ||
              ((self.input.nodeName === "INPUT" ||
                  self.input.nodeName === "TEXTAREA") &&
                  self.input.placeholder &&
                  self.input.value === self.input.placeholder
                  ? null
                  : self.input.value);
          if (preloadedDate)
              setSelectedDate(preloadedDate, self.config.dateFormat);
          self._initialDate =
              self.selectedDates.length > 0
                  ? self.selectedDates[0]
                  : self.config.minDate &&
                      self.config.minDate.getTime() > self.now.getTime()
                      ? self.config.minDate
                      : self.config.maxDate &&
                          self.config.maxDate.getTime() < self.now.getTime()
                          ? self.config.maxDate
                          : self.now;
          self.currentYear = self._initialDate.getFullYear();
          self.currentMonth = self._initialDate.getMonth();
          if (self.selectedDates.length > 0)
              self.latestSelectedDateObj = self.selectedDates[0];
          if (self.config.minTime !== undefined)
              self.config.minTime = self.parseDate(self.config.minTime, "H:i");
          if (self.config.maxTime !== undefined)
              self.config.maxTime = self.parseDate(self.config.maxTime, "H:i");
          self.minDateHasTime =
              !!self.config.minDate &&
                  (self.config.minDate.getHours() > 0 ||
                      self.config.minDate.getMinutes() > 0 ||
                      self.config.minDate.getSeconds() > 0);
          self.maxDateHasTime =
              !!self.config.maxDate &&
                  (self.config.maxDate.getHours() > 0 ||
                      self.config.maxDate.getMinutes() > 0 ||
                      self.config.maxDate.getSeconds() > 0);
      }
      function setupInputs() {
          self.input = getInputElem();
          /* istanbul ignore next */
          if (!self.input) {
              self.config.errorHandler(new Error("Invalid input element specified"));
              return;
          }
          // hack: store previous type to restore it after destroy()
          self.input._type = self.input.type;
          self.input.type = "text";
          self.input.classList.add("flatpickr-input");
          self._input = self.input;
          if (self.config.altInput) {
              // replicate self.element
              self.altInput = createElement(self.input.nodeName, self.config.altInputClass);
              self._input = self.altInput;
              self.altInput.placeholder = self.input.placeholder;
              self.altInput.disabled = self.input.disabled;
              self.altInput.required = self.input.required;
              self.altInput.tabIndex = self.input.tabIndex;
              self.altInput.type = "text";
              self.input.setAttribute("type", "hidden");
              if (!self.config.static && self.input.parentNode)
                  self.input.parentNode.insertBefore(self.altInput, self.input.nextSibling);
          }
          if (!self.config.allowInput)
              self._input.setAttribute("readonly", "readonly");
          self._positionElement = self.config.positionElement || self._input;
      }
      function setupMobile() {
          var inputType = self.config.enableTime
              ? self.config.noCalendar
                  ? "time"
                  : "datetime-local"
              : "date";
          self.mobileInput = createElement("input", self.input.className + " flatpickr-mobile");
          self.mobileInput.tabIndex = 1;
          self.mobileInput.type = inputType;
          self.mobileInput.disabled = self.input.disabled;
          self.mobileInput.required = self.input.required;
          self.mobileInput.placeholder = self.input.placeholder;
          self.mobileFormatStr =
              inputType === "datetime-local"
                  ? "Y-m-d\\TH:i:S"
                  : inputType === "date"
                      ? "Y-m-d"
                      : "H:i:S";
          if (self.selectedDates.length > 0) {
              self.mobileInput.defaultValue = self.mobileInput.value = self.formatDate(self.selectedDates[0], self.mobileFormatStr);
          }
          if (self.config.minDate)
              self.mobileInput.min = self.formatDate(self.config.minDate, "Y-m-d");
          if (self.config.maxDate)
              self.mobileInput.max = self.formatDate(self.config.maxDate, "Y-m-d");
          if (self.input.getAttribute("step"))
              self.mobileInput.step = String(self.input.getAttribute("step"));
          self.input.type = "hidden";
          if (self.altInput !== undefined)
              self.altInput.type = "hidden";
          try {
              if (self.input.parentNode)
                  self.input.parentNode.insertBefore(self.mobileInput, self.input.nextSibling);
          }
          catch (_a) { }
          bind(self.mobileInput, "change", function (e) {
              self.setDate(getEventTarget(e).value, false, self.mobileFormatStr);
              triggerEvent("onChange");
              triggerEvent("onClose");
          });
      }
      function toggle(e) {
          if (self.isOpen === true)
              return self.close();
          self.open(e);
      }
      function triggerEvent(event, data) {
          // If the instance has been destroyed already, all hooks have been removed
          if (self.config === undefined)
              return;
          var hooks = self.config[event];
          if (hooks !== undefined && hooks.length > 0) {
              for (var i = 0; hooks[i] && i < hooks.length; i++)
                  hooks[i](self.selectedDates, self.input.value, self, data);
          }
          if (event === "onChange") {
              self.input.dispatchEvent(createEvent("change"));
              // many front-end frameworks bind to the input event
              self.input.dispatchEvent(createEvent("input"));
          }
      }
      function createEvent(name) {
          var e = document.createEvent("Event");
          e.initEvent(name, true, true);
          return e;
      }
      function isDateSelected(date) {
          for (var i = 0; i < self.selectedDates.length; i++) {
              if (compareDates(self.selectedDates[i], date) === 0)
                  return "" + i;
          }
          return false;
      }
      function isDateInRange(date) {
          if (self.config.mode !== "range" || self.selectedDates.length < 2)
              return false;
          return (compareDates(date, self.selectedDates[0]) >= 0 &&
              compareDates(date, self.selectedDates[1]) <= 0);
      }
      function updateNavigationCurrentMonth() {
          if (self.config.noCalendar || self.isMobile || !self.monthNav)
              return;
          self.yearElements.forEach(function (yearElement, i) {
              var d = new Date(self.currentYear, self.currentMonth, 1);
              d.setMonth(self.currentMonth + i);
              if (self.config.showMonths > 1 ||
                  self.config.monthSelectorType === "static") {
                  self.monthElements[i].textContent =
                      monthToStr(d.getMonth(), self.config.shorthandCurrentMonth, self.l10n) + " ";
              }
              else {
                  self.monthsDropdownContainer.value = d.getMonth().toString();
              }
              yearElement.value = d.getFullYear().toString();
          });
          self._hidePrevMonthArrow =
              self.config.minDate !== undefined &&
                  (self.currentYear === self.config.minDate.getFullYear()
                      ? self.currentMonth <= self.config.minDate.getMonth()
                      : self.currentYear < self.config.minDate.getFullYear());
          self._hideNextMonthArrow =
              self.config.maxDate !== undefined &&
                  (self.currentYear === self.config.maxDate.getFullYear()
                      ? self.currentMonth + 1 > self.config.maxDate.getMonth()
                      : self.currentYear > self.config.maxDate.getFullYear());
      }
      function getDateStr(format) {
          return self.selectedDates
              .map(function (dObj) { return self.formatDate(dObj, format); })
              .filter(function (d, i, arr) {
              return self.config.mode !== "range" ||
                  self.config.enableTime ||
                  arr.indexOf(d) === i;
          })
              .join(self.config.mode !== "range"
              ? self.config.conjunction
              : self.l10n.rangeSeparator);
      }
      /**
       * Updates the values of inputs associated with the calendar
       */
      function updateValue(triggerChange) {
          if (triggerChange === void 0) { triggerChange = true; }
          if (self.mobileInput !== undefined && self.mobileFormatStr) {
              self.mobileInput.value =
                  self.latestSelectedDateObj !== undefined
                      ? self.formatDate(self.latestSelectedDateObj, self.mobileFormatStr)
                      : "";
          }
          self.input.value = getDateStr(self.config.dateFormat);
          if (self.altInput !== undefined) {
              self.altInput.value = getDateStr(self.config.altFormat);
          }
          if (triggerChange !== false)
              triggerEvent("onValueUpdate");
      }
      function onMonthNavClick(e) {
          var eventTarget = getEventTarget(e);
          var isPrevMonth = self.prevMonthNav.contains(eventTarget);
          var isNextMonth = self.nextMonthNav.contains(eventTarget);
          if (isPrevMonth || isNextMonth) {
              changeMonth(isPrevMonth ? -1 : 1);
          }
          else if (self.yearElements.indexOf(eventTarget) >= 0) {
              eventTarget.select();
          }
          else if (eventTarget.classList.contains("arrowUp")) {
              self.changeYear(self.currentYear + 1);
          }
          else if (eventTarget.classList.contains("arrowDown")) {
              self.changeYear(self.currentYear - 1);
          }
      }
      function timeWrapper(e) {
          e.preventDefault();
          var isKeyDown = e.type === "keydown", eventTarget = getEventTarget(e), input = eventTarget;
          if (self.amPM !== undefined && eventTarget === self.amPM) {
              self.amPM.textContent =
                  self.l10n.amPM[int(self.amPM.textContent === self.l10n.amPM[0])];
          }
          var min = parseFloat(input.getAttribute("min")), max = parseFloat(input.getAttribute("max")), step = parseFloat(input.getAttribute("step")), curValue = parseInt(input.value, 10), delta = e.delta ||
              (isKeyDown ? (e.which === 38 ? 1 : -1) : 0);
          var newValue = curValue + step * delta;
          if (typeof input.value !== "undefined" && input.value.length === 2) {
              var isHourElem = input === self.hourElement, isMinuteElem = input === self.minuteElement;
              if (newValue < min) {
                  newValue =
                      max +
                          newValue +
                          int(!isHourElem) +
                          (int(isHourElem) && int(!self.amPM));
                  if (isMinuteElem)
                      incrementNumInput(undefined, -1, self.hourElement);
              }
              else if (newValue > max) {
                  newValue =
                      input === self.hourElement ? newValue - max - int(!self.amPM) : min;
                  if (isMinuteElem)
                      incrementNumInput(undefined, 1, self.hourElement);
              }
              if (self.amPM &&
                  isHourElem &&
                  (step === 1
                      ? newValue + curValue === 23
                      : Math.abs(newValue - curValue) > step)) {
                  self.amPM.textContent =
                      self.l10n.amPM[int(self.amPM.textContent === self.l10n.amPM[0])];
              }
              input.value = pad(newValue);
          }
      }
      init();
      return self;
  }
  /* istanbul ignore next */
  function _flatpickr(nodeList, config) {
      // static list
      var nodes = Array.prototype.slice
          .call(nodeList)
          .filter(function (x) { return x instanceof HTMLElement; });
      var instances = [];
      for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          try {
              if (node.getAttribute("data-fp-omit") !== null)
                  continue;
              if (node._flatpickr !== undefined) {
                  node._flatpickr.destroy();
                  node._flatpickr = undefined;
              }
              node._flatpickr = FlatpickrInstance(node, config || {});
              instances.push(node._flatpickr);
          }
          catch (e) {
              console.error(e);
          }
      }
      return instances.length === 1 ? instances[0] : instances;
  }
  /* istanbul ignore next */
  if (typeof HTMLElement !== "undefined" &&
      typeof HTMLCollection !== "undefined" &&
      typeof NodeList !== "undefined") {
      // browser env
      HTMLCollection.prototype.flatpickr = NodeList.prototype.flatpickr = function (config) {
          return _flatpickr(this, config);
      };
      HTMLElement.prototype.flatpickr = function (config) {
          return _flatpickr([this], config);
      };
  }
  /* istanbul ignore next */
  var flatpickr = function (selector, config) {
      if (typeof selector === "string") {
          return _flatpickr(window.document.querySelectorAll(selector), config);
      }
      else if (selector instanceof Node) {
          return _flatpickr([selector], config);
      }
      else {
          return _flatpickr(selector, config);
      }
  };
  /* istanbul ignore next */
  flatpickr.defaultConfig = {};
  flatpickr.l10ns = {
      en: __assign({}, english),
      default: __assign({}, english),
  };
  flatpickr.localize = function (l10n) {
      flatpickr.l10ns.default = __assign(__assign({}, flatpickr.l10ns.default), l10n);
  };
  flatpickr.setDefaults = function (config) {
      flatpickr.defaultConfig = __assign(__assign({}, flatpickr.defaultConfig), config);
  };
  flatpickr.parseDate = createDateParser({});
  flatpickr.formatDate = createDateFormatter({});
  flatpickr.compareDates = compareDates;
  /* istanbul ignore next */
  if (typeof jQuery !== "undefined" && typeof jQuery.fn !== "undefined") {
      jQuery.fn.flatpickr = function (config) {
          return _flatpickr(this, config);
      };
  }
  Date.prototype.fp_incr = function (days) {
      return new Date(this.getFullYear(), this.getMonth(), this.getDate() + (typeof days === "string" ? parseInt(days, 10) : days));
  };
  if (typeof window !== "undefined") {
      window.flatpickr = flatpickr;
  }

  return flatpickr;

})));



;(function() {
  var $ = jQuery;
  function WPFWAjaxChosen(element, options) {
    this.element = $(element);
    this.options = options;
    this.init();
  };

  WPFWAjaxChosen.prototype.init = function() {
    this.element.chosen(this.options);
    this.container    = this.element.next('.chosen-container');
    this.search_field = this.container.find('.chosen-search-input');
    this.is_multiple  = this.container.hasClass('chosen-container-multi');
    this.is_typing    = false;
    this.chosenXhr    = null;
    this.events();
  };

  WPFWAjaxChosen.prototype.events = function() {

    var _this = this;

    this.search_field.on('compositionstart', function() {
      _this.is_typing = true;
    });

    this.search_field.on('compositionend', function() {
      _this.is_typing = false;
      _this.update_list();
    });

    this.search_field.on('keyup', function() {
      _this.update_list();
    });

    this.search_field.on('focus', function() {
      _this.search_field_focused();
    });

  };

  WPFWAjaxChosen.prototype.search_field_focused = function() {
    this.search_welcome_message();
    if ( this.options.min_length === 0 && this.search_field.val().length === 0 ) {
      this.update_list();
    }
  };

  WPFWAjaxChosen.prototype.search_welcome_message = function() {

    var value   = $.trim(this.search_field.val());
    var results = this.container.find('.chosen-results');

    if ( results.children().length === 0 && value.length === 0 ) {
      results.html('<li class="no-results">' + this.options.typing_text.replace('%s', this.options.min_length - value.length) + '</li>');
    }

  };

  WPFWAjaxChosen.prototype.update_list = function() {

    var _this = this;

    this.search_welcome_message();

    if ( this.is_typing ) { return; }

    var value   = $.trim(this.search_field.val());
    var message = ( value.length < this.options.min_length ) ? this.options.typing_text.replace('%s', this.options.min_length - value.length) : this.options.searching_text;

    this.container.find('.no-results').text(message);

    if ( value === this.search_field.data('prevVal') ) { return; }

    this.search_field.data('prevVal', value);

    if (this.timer) {
      clearTimeout(this.timer);
    }

    if ( value.length < this.options.min_length ) { return; }

    this.timer = setTimeout( function() {

      if ( _this.chosenXhr ) {
        _this.chosenXhr.abort();
      }

      _this.options.data['term'] = value;

      _this.chosenXhr = window.wp.ajax.post('wpfw-chosen', _this.options.data).done( function( response ) {
        _this.show_results( response );
      }).fail( function( response ) {
        _this.container.find('.no-results').text(response.error);
      });

    }, this.options.type_delay );

  };

  WPFWAjaxChosen.prototype.show_results = function( items ) {

    var _this = this;

    if ( this.is_typing || items === null ) { return; }

    if ( items.length === 0 ) {
      this.element.data().chosen.no_results_clear();
      this.element.data().chosen.no_results(this.search_field.val());
      return;
    }

    var selected_values = [];

    this.element.find('option').each(function() {
      if ( $(this).is(':selected') ) {
        selected_values.push( $(this).val() + "-" + $(this).text() );
      } else {
        if( $(this).attr('value').length ) {
          $(this).remove();
        }
      }
    });

    $.each(items, function(i, item) {
      if ( $.inArray( item.value + "-" + item.text, selected_values ) === -1 ) {
        $('<option />').attr('value', item.value).html(item.text).appendTo(_this.element);
      }
    });

    var value_before_trigger = this.search_field.val();
    var width_before_trigger = this.search_field.innerWidth();

    this.element.trigger('chosen:updated');

    if( this.is_multiple ) {

      var $hidden_select = this.element.parent().find('.wpfw-hidden-select');
      var $hidden_value  = $hidden_select.val() || [];

      this.element.PFChosenOrder($hidden_value, true);
      this.search_field.css('width', width_before_trigger);

    }

    this.search_field.val(value_before_trigger);

    if ( this.chosenXhr.done !== null ) {
      this.chosenXhr.done(items);
    }

  };

  jQuery.fn.WPFWAjaxChosen = function(chosenOptions) {
    return this.each(function() {
      new WPFWAjaxChosen(this, chosenOptions);
    });
  };

})(jQuery);
;// Chosen Order v1.2.1
// This plugin allows you to handle the order of the selection for Chosen multiple <select> dropdowns
// Full source at https://github.com/tristanjahier/chosen-order
// Copyright (c) 2013 - Tristan Jahier, http://tristan-jahier.fr
(function() {
  var $, PFAbstractChosenOrder, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PFAbstractChosenOrder = (function() {

    function PFAbstractChosenOrder() {}

    PFAbstractChosenOrder.insertAt = function(node, index, parentNode) {
      return parentNode.insertBefore(node, parentNode.children[index].nextSibling);
    };

    PFAbstractChosenOrder.getFlattenedOptionsAndGroups = function(select) {
      var flattened_options, opt, options, sub_opt, sub_options, _i, _j, _len, _len1;
      options = Array.prototype.filter.call(select.childNodes, function(o) {
        var _ref;
        return (_ref = o.nodeName.toUpperCase()) === 'OPTION' || _ref === 'OPTGROUP';
      });
      flattened_options = [];
      for (_i = 0, _len = options.length; _i < _len; _i++) {
        opt = options[_i];
        flattened_options.push(opt);
        if (opt.nodeName.toUpperCase() === 'OPTGROUP') {
          sub_options = Array.prototype.filter.call(opt.childNodes, function(o) {
            return o.nodeName.toUpperCase() === 'OPTION';
          });
          for (_j = 0, _len1 = sub_options.length; _j < _len1; _j++) {
            sub_opt = sub_options[_j];
            flattened_options.push(sub_opt);
          }
        }
      }
      return flattened_options;
    };

    PFAbstractChosenOrder.isValidMultipleSelectElement = function(element) {
      return element !== null && typeof element !== "undefined" && element.nodeName === "SELECT" && element.multiple;
    };

    PFAbstractChosenOrder.getChosenUIContainer = function(select) {
      if (select.id !== "") {
        return document.getElementById(select.id.replace(/-/g, "_") + "_chosen");
      } else {
        return this.searchChosenUIContainer(select);
      }
    };

    PFAbstractChosenOrder.isChosenified = function(select) {
      return this.getChosenUIContainer(select) != null;
    };

    PFAbstractChosenOrder.forceSelection = function(select, selection) {
      var i, opt, options, _ref;
      options = this.getFlattenedOptionsAndGroups(select);
      i = 0;
      while (i < options.length) {
        opt = options[i];
        if (_ref = opt.getAttribute("value"), __indexOf.call(selection, _ref) >= 0) {
          opt.selected = true;
          opt.setAttribute("selected", "");
        } else {
          opt.selected = false;
          opt.removeAttribute("selected");
        }
        i++;
      }
      return this.triggerEvent(select, "chosen:updated");
    };

    PFAbstractChosenOrder.PFChosenOrder = function(select, order, force) {
      var chosen_choices, chosen_options, chosen_ui, i, j, opt, opt_val, option, options, rel, relAttributeName, _i, _j, _len, _len1, _results;
      if (this.getDOMElement != null) {
        select = this.getDOMElement(select);
      }
      if (!this.isValidMultipleSelectElement(select)) {
        return;
      }
      chosen_ui = this.getChosenUIContainer(select);
      if (chosen_ui == null) {
        return;
      }
      if (order instanceof Array) {
        order = order.map(Function.prototype.call, String.prototype.trim);
        options = this.getFlattenedOptionsAndGroups(select);
        if ((force != null) && force === true) {
          this.forceSelection(select, order);
        }
        _results = [];
        for (i = _i = 0, _len = order.length; _i < _len; i = ++_i) {
          opt_val = order[i];
          rel = null;
          for (j = _j = 0, _len1 = options.length; _j < _len1; j = ++_j) {
            opt = options[j];
            if (opt.value === opt_val) {
              rel = j;
            }
          }
          chosen_options = chosen_ui.querySelectorAll('.search-choice');
          relAttributeName = this.relAttributeName;
          option = Array.prototype.filter.call(chosen_options, function(o) {
            return o.querySelector("a.search-choice-close[" + relAttributeName + "=\"" + rel + "\"]") != null;
          })[0];
          if (option == null) {
            continue;
          }
          chosen_choices = chosen_ui.querySelector("ul.chosen-choices");
          _results.push(this.insertAt(option, i, chosen_ui.querySelector('ul.chosen-choices')));
        }
        return _results;
      } else {
        return;
      }
    };

    return PFAbstractChosenOrder;

  })();

  $ = jQuery;

  $.fn.extend({
    PFChosenOrder: function(order, force) {
      return _PFChosenOrder.PFChosenOrder(this, order, force);
    }
  });

  this._PFChosenOrder = (function(_super) {
    __extends(_PFChosenOrder, _super);

    function _PFChosenOrder() {
      _ref = _PFChosenOrder.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    _PFChosenOrder.relAttributeName = 'data-option-array-index';

    _PFChosenOrder.isjQueryObject = function(obj) {
      return (typeof jQuery !== "undefined" && jQuery !== null) && obj instanceof jQuery;
    };

    _PFChosenOrder.getDOMElement = function(element) {
      if (this.isjQueryObject(element)) {
        return element.get(0);
      } else {
        return element;
      }
    };

    _PFChosenOrder.searchChosenUIContainer = function(element) {
      if ($(element).data("chosen") != null) {
        return $(element).data("chosen").container[0];
      } else {
        return $(element).next(".chosen-container.chosen-container-multi").get(0);
      }
    };

    _PFChosenOrder.triggerEvent = function(target, event_name) {
      return $(target).trigger(event_name);
    };

    return _PFChosenOrder;

  })(PFAbstractChosenOrder);

}).call(this);
;(function() {
  var $, AbstractChosen, Chosen, SelectParser,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SelectParser = (function() {
    function SelectParser() {
      this.options_index = 0;
      this.parsed = [];
    }

    SelectParser.prototype.add_node = function(child) {
      if (child.nodeName.toUpperCase() === "OPTGROUP") {
        return this.add_group(child);
      } else {
        return this.add_option(child);
      }
    };

    SelectParser.prototype.add_group = function(group) {
      var group_position, i, len, option, ref, results1;
      group_position = this.parsed.length;
      this.parsed.push({
        array_index: group_position,
        group: true,
        label: group.label,
        title: group.title ? group.title : void 0,
        children: 0,
        disabled: group.disabled,
        classes: group.className
      });
      ref = group.childNodes;
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        option = ref[i];
        results1.push(this.add_option(option, group_position, group.disabled));
      }
      return results1;
    };

    SelectParser.prototype.add_option = function(option, group_position, group_disabled) {
      if (option.nodeName.toUpperCase() === "OPTION") {
        if (option.text !== "") {
          if (group_position != null) {
            this.parsed[group_position].children += 1;
          }
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            title: option.title ? option.title : void 0,
            selected: option.selected,
            disabled: group_disabled === true ? group_disabled : option.disabled,
            group_array_index: group_position,
            group_label: group_position != null ? this.parsed[group_position].label : null,
            classes: option.className,
            style: option.style.cssText
          });
        } else {
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            empty: true
          });
        }
        return this.options_index += 1;
      }
    };

    return SelectParser;

  })();

  SelectParser.select_to_array = function(select) {
    var child, i, len, parser, ref;
    parser = new SelectParser();
    ref = select.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
      child = ref[i];
      parser.add_node(child);
    }
    return parser.parsed;
  };

  AbstractChosen = (function() {
    function AbstractChosen(form_field, options1) {
      this.form_field = form_field;
      this.options = options1 != null ? options1 : {};
      this.label_click_handler = bind(this.label_click_handler, this);
      if (!AbstractChosen.browser_is_supported()) {
        return;
      }
      this.is_multiple = this.form_field.multiple;
      this.set_default_text();
      this.set_default_values();
      this.setup();
      this.set_up_html();
      this.register_observers();
      this.on_ready();
    }

    AbstractChosen.prototype.set_default_values = function() {
      this.click_test_action = (function(_this) {
        return function(evt) {
          return _this.test_active_click(evt);
        };
      })(this);
      this.activate_action = (function(_this) {
        return function(evt) {
          return _this.activate_field(evt);
        };
      })(this);
      this.active_field = false;
      this.mouse_on_container = false;
      this.results_showing = false;
      this.result_highlighted = null;
      this.is_rtl = this.options.rtl || /\bchosen-rtl\b/.test(this.form_field.className);
      this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
      this.disable_search_threshold = this.options.disable_search_threshold || 0;
      this.disable_search = this.options.disable_search || false;
      this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
      this.group_search = this.options.group_search != null ? this.options.group_search : true;
      this.search_contains = this.options.search_contains || false;
      this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
      this.max_selected_options = this.options.max_selected_options || Infinity;
      this.inherit_select_classes = this.options.inherit_select_classes || false;
      this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
      this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
      this.include_group_label_in_selected = this.options.include_group_label_in_selected || false;
      this.max_shown_results = this.options.max_shown_results || Number.POSITIVE_INFINITY;
      this.case_sensitive_search = this.options.case_sensitive_search || false;
      return this.hide_results_on_select = this.options.hide_results_on_select != null ? this.options.hide_results_on_select : true;
    };

    AbstractChosen.prototype.set_default_text = function() {
      if (this.form_field.getAttribute("data-placeholder")) {
        this.default_text = this.form_field.getAttribute("data-placeholder");
      } else if (this.is_multiple) {
        this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
      } else {
        this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
      }
      this.default_text = this.escape_html(this.default_text);
      return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
    };

    AbstractChosen.prototype.choice_label = function(item) {
      if (this.include_group_label_in_selected && (item.group_label != null)) {
        return "<b class='group-name'>" + (this.escape_html(item.group_label)) + "</b>" + item.html;
      } else {
        return item.html;
      }
    };

    AbstractChosen.prototype.mouse_enter = function() {
      return this.mouse_on_container = true;
    };

    AbstractChosen.prototype.mouse_leave = function() {
      return this.mouse_on_container = false;
    };

    AbstractChosen.prototype.input_focus = function(evt) {
      if (this.is_multiple) {
        if (!this.active_field) {
          return setTimeout(((function(_this) {
            return function() {
              return _this.container_mousedown();
            };
          })(this)), 50);
        }
      } else {
        if (!this.active_field) {
          return this.activate_field();
        }
      }
    };

    AbstractChosen.prototype.input_blur = function(evt) {
      if (!this.mouse_on_container) {
        this.active_field = false;
        return setTimeout(((function(_this) {
          return function() {
            return _this.blur_test();
          };
        })(this)), 100);
      }
    };

    AbstractChosen.prototype.label_click_handler = function(evt) {
      if (this.is_multiple) {
        return this.container_mousedown(evt);
      } else {
        return this.activate_field();
      }
    };

    AbstractChosen.prototype.results_option_build = function(options) {
      var content, data, data_content, i, len, ref, shown_results;
      content = '';
      shown_results = 0;
      ref = this.results_data;
      for (i = 0, len = ref.length; i < len; i++) {
        data = ref[i];
        data_content = '';
        if (data.group) {
          data_content = this.result_add_group(data);
        } else {
          data_content = this.result_add_option(data);
        }
        if (data_content !== '') {
          shown_results++;
          content += data_content;
        }
        if (options != null ? options.first : void 0) {
          if (data.selected && this.is_multiple) {
            this.choice_build(data);
          } else if (data.selected && !this.is_multiple) {
            this.single_set_selected_text(this.choice_label(data));
          }
        }
        if (shown_results >= this.max_shown_results) {
          break;
        }
      }
      return content;
    };

    AbstractChosen.prototype.result_add_option = function(option) {
      var classes, option_el;
      if (!option.search_match) {
        return '';
      }
      if (!this.include_option_in_results(option)) {
        return '';
      }
      classes = [];
      if (!option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("active-result");
      }
      if (option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("disabled-result");
      }
      if (option.selected) {
        classes.push("result-selected");
      }
      if (option.group_array_index != null) {
        classes.push("group-option");
      }
      if (option.classes !== "") {
        classes.push(option.classes);
      }
      option_el = document.createElement("li");
      option_el.className = classes.join(" ");
      if (option.style) {
        option_el.style.cssText = option.style;
      }
      option_el.setAttribute("data-option-array-index", option.array_index);
      option_el.innerHTML = option.highlighted_html || option.html;
      if (option.title) {
        option_el.title = option.title;
      }
      return this.outerHTML(option_el);
    };

    AbstractChosen.prototype.result_add_group = function(group) {
      var classes, group_el;
      if (!(group.search_match || group.group_match)) {
        return '';
      }
      if (!(group.active_options > 0)) {
        return '';
      }
      classes = [];
      classes.push("group-result");
      if (group.classes) {
        classes.push(group.classes);
      }
      group_el = document.createElement("li");
      group_el.className = classes.join(" ");
      group_el.innerHTML = group.highlighted_html || this.escape_html(group.label);
      if (group.title) {
        group_el.title = group.title;
      }
      return this.outerHTML(group_el);
    };

    AbstractChosen.prototype.results_update_field = function() {
      this.set_default_text();
      if (!this.is_multiple) {
        this.results_reset_cleanup();
      }
      this.result_clear_highlight();
      this.results_build();
      if (this.results_showing) {
        return this.winnow_results();
      }
    };

    AbstractChosen.prototype.reset_single_select_options = function() {
      var i, len, ref, result, results1;
      ref = this.results_data;
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        result = ref[i];
        if (result.selected) {
          results1.push(result.selected = false);
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    };

    AbstractChosen.prototype.results_toggle = function() {
      if (this.results_showing) {
        return this.results_hide();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.results_search = function(evt) {
      if (this.results_showing) {
        return this.winnow_results();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.winnow_results = function(options) {
      var escapedQuery, fix, i, len, option, prefix, query, ref, regex, results, results_group, search_match, startpos, suffix, text;
      this.no_results_clear();
      results = 0;
      query = this.get_search_text();
      escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      regex = this.get_search_regex(escapedQuery);
      ref = this.results_data;
      for (i = 0, len = ref.length; i < len; i++) {
        option = ref[i];
        option.search_match = false;
        results_group = null;
        search_match = null;
        option.highlighted_html = '';
        if (this.include_option_in_results(option)) {
          if (option.group) {
            option.group_match = false;
            option.active_options = 0;
          }
          if ((option.group_array_index != null) && this.results_data[option.group_array_index]) {
            results_group = this.results_data[option.group_array_index];
            if (results_group.active_options === 0 && results_group.search_match) {
              results += 1;
            }
            results_group.active_options += 1;
          }
          text = option.group ? option.label : option.text;
          if (!(option.group && !this.group_search)) {
            search_match = this.search_string_match(text, regex);
            option.search_match = search_match != null;
            if (option.search_match && !option.group) {
              results += 1;
            }
            if (option.search_match) {
              if (query.length) {
                startpos = search_match.index;
                prefix = text.slice(0, startpos);
                fix = text.slice(startpos, startpos + query.length);
                suffix = text.slice(startpos + query.length);
                option.highlighted_html = (this.escape_html(prefix)) + "<em>" + (this.escape_html(fix)) + "</em>" + (this.escape_html(suffix));
              }
              if (results_group != null) {
                results_group.group_match = true;
              }
            } else if ((option.group_array_index != null) && this.results_data[option.group_array_index].search_match) {
              option.search_match = true;
            }
          }
        }
      }
      this.result_clear_highlight();
      if (results < 1 && query.length) {
        this.update_results_content("");
        return this.no_results(query);
      } else {
        this.update_results_content(this.results_option_build());
        if (!(options != null ? options.skip_highlight : void 0)) {
          return this.winnow_results_set_highlight();
        }
      }
    };

    AbstractChosen.prototype.get_search_regex = function(escaped_search_string) {
      var regex_flag, regex_string;
      regex_string = this.search_contains ? escaped_search_string : "(^|\\s|\\b)" + escaped_search_string + "[^\\s]*";
      if (!(this.enable_split_word_search || this.search_contains)) {
        regex_string = "^" + regex_string;
      }
      regex_flag = this.case_sensitive_search ? "" : "i";
      return new RegExp(regex_string, regex_flag);
    };

    AbstractChosen.prototype.search_string_match = function(search_string, regex) {
      var match;
      match = regex.exec(search_string);
      if (!this.search_contains && (match != null ? match[1] : void 0)) {
        match.index += 1;
      }
      return match;
    };

    AbstractChosen.prototype.choices_count = function() {
      var i, len, option, ref;
      if (this.selected_option_count != null) {
        return this.selected_option_count;
      }
      this.selected_option_count = 0;
      ref = this.form_field.options;
      for (i = 0, len = ref.length; i < len; i++) {
        option = ref[i];
        if (option.selected) {
          this.selected_option_count += 1;
        }
      }
      return this.selected_option_count;
    };

    AbstractChosen.prototype.choices_click = function(evt) {
      evt.preventDefault();
      this.activate_field();
      if (!(this.results_showing || this.is_disabled)) {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.keydown_checker = function(evt) {
      var ref, stroke;
      stroke = (ref = evt.which) != null ? ref : evt.keyCode;
      this.search_field_scale();
      if (stroke !== 8 && this.pending_backstroke) {
        this.clear_backstroke();
      }
      switch (stroke) {
        case 8:
          this.backstroke_length = this.get_search_field_value().length;
          break;
        case 9:
          if (this.results_showing && !this.is_multiple) {
            this.result_select(evt);
          }
          this.mouse_on_container = false;
          break;
        case 13:
          if (this.results_showing) {
            evt.preventDefault();
          }
          break;
        case 27:
          if (this.results_showing) {
            evt.preventDefault();
          }
          break;
        case 32:
          if (this.disable_search) {
            evt.preventDefault();
          }
          break;
        case 38:
          evt.preventDefault();
          this.keyup_arrow();
          break;
        case 40:
          evt.preventDefault();
          this.keydown_arrow();
          break;
      }
    };

    AbstractChosen.prototype.keyup_checker = function(evt) {
      var ref, stroke;
      stroke = (ref = evt.which) != null ? ref : evt.keyCode;
      this.search_field_scale();
      switch (stroke) {
        case 8:
          if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
            this.keydown_backstroke();
          } else if (!this.pending_backstroke) {
            this.result_clear_highlight();
            this.results_search();
          }
          break;
        case 13:
          evt.preventDefault();
          if (this.results_showing) {
            this.result_select(evt);
          }
          break;
        case 27:
          if (this.results_showing) {
            this.results_hide();
          }
          break;
        case 9:
        case 16:
        case 17:
        case 18:
        case 38:
        case 40:
        case 91:
          break;
        default:
          this.results_search();
          break;
      }
    };

    AbstractChosen.prototype.clipboard_event_checker = function(evt) {
      if (this.is_disabled) {
        return;
      }
      return setTimeout(((function(_this) {
        return function() {
          return _this.results_search();
        };
      })(this)), 50);
    };

    AbstractChosen.prototype.container_width = function() {
      if (this.options.width != null) {
        return this.options.width;
      } else {
        return this.form_field.offsetWidth + "px";
      }
    };

    AbstractChosen.prototype.include_option_in_results = function(option) {
      if (this.is_multiple && (!this.display_selected_options && option.selected)) {
        return false;
      }
      if (!this.display_disabled_options && option.disabled) {
        return false;
      }
      if (option.empty) {
        return false;
      }
      return true;
    };

    AbstractChosen.prototype.search_results_touchstart = function(evt) {
      this.touch_started = true;
      return this.search_results_mouseover(evt);
    };

    AbstractChosen.prototype.search_results_touchmove = function(evt) {
      this.touch_started = false;
      return this.search_results_mouseout(evt);
    };

    AbstractChosen.prototype.search_results_touchend = function(evt) {
      if (this.touch_started) {
        return this.search_results_mouseup(evt);
      }
    };

    AbstractChosen.prototype.outerHTML = function(element) {
      var tmp;
      if (element.outerHTML) {
        return element.outerHTML;
      }
      tmp = document.createElement("div");
      tmp.appendChild(element);
      return tmp.innerHTML;
    };

    AbstractChosen.prototype.get_single_html = function() {
      return "<a class=\"chosen-single chosen-default\">\n  <span>" + this.default_text + "</span>\n  <div><b></b></div>\n</a>\n<div class=\"chosen-drop\">\n  <div class=\"chosen-search\">\n    <input class=\"chosen-search-input\" type=\"text\" autocomplete=\"off\" />\n  </div>\n  <ul class=\"chosen-results\"></ul>\n</div>";
    };

    AbstractChosen.prototype.get_multi_html = function() {
      return "<ul class=\"chosen-choices\">\n  <li class=\"search-field\">\n    <input class=\"chosen-search-input\" type=\"text\" autocomplete=\"off\" value=\"" + this.default_text + "\" />\n  </li>\n</ul>\n<div class=\"chosen-drop\">\n  <ul class=\"chosen-results\"></ul>\n</div>";
    };

    AbstractChosen.prototype.get_no_results_html = function(terms) {
      return "<li class=\"no-results\">\n  " + this.results_none_found + " <span>" + (this.escape_html(terms)) + "</span>\n</li>";
    };

    AbstractChosen.browser_is_supported = function() {
      if ("Microsoft Internet Explorer" === window.navigator.appName) {
        return document.documentMode >= 8;
      }
      if (/iP(od|hone)/i.test(window.navigator.userAgent) || /IEMobile/i.test(window.navigator.userAgent) || /Windows Phone/i.test(window.navigator.userAgent) || /BlackBerry/i.test(window.navigator.userAgent) || /BB10/i.test(window.navigator.userAgent) || /Android.*Mobile/i.test(window.navigator.userAgent)) {
        return false;
      }
      return true;
    };

    AbstractChosen.default_multiple_text = "Select Some Options";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "No results match";

    return AbstractChosen;

  })();

  $ = jQuery;

  $.fn.extend({
    chosen: function(options) {
      if (!AbstractChosen.browser_is_supported()) {
        return this;
      }
      return this.each(function(input_field) {
        var $this, chosen;
        $this = $(this);
        chosen = $this.data('chosen');
        if (options === 'destroy') {
          if (chosen instanceof Chosen) {
            chosen.destroy();
          }
          return;
        }
        if (!(chosen instanceof Chosen)) {
          $this.data('chosen', new Chosen(this, options));
        }
      });
    }
  });

  Chosen = (function(superClass) {
    extend(Chosen, superClass);

    function Chosen() {
      return Chosen.__super__.constructor.apply(this, arguments);
    }

    Chosen.prototype.setup = function() {
      this.form_field_jq = $(this.form_field);
      return this.current_selectedIndex = this.form_field.selectedIndex;
    };

    Chosen.prototype.set_up_html = function() {
      var container_classes, container_props;
      container_classes = ["chosen-container"];
      container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
      if (this.inherit_select_classes && this.form_field.className) {
        container_classes.push(this.form_field.className);
      }
      if (this.is_rtl) {
        container_classes.push("chosen-rtl");
      }
      container_props = {
        'class': container_classes.join(' '),
        'title': this.form_field.title
      };
      if (this.form_field.id.length) {
        container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
      }
      this.container = $("<div />", container_props);
      this.container.width(this.container_width());
      if (this.is_multiple) {
        this.container.html(this.get_multi_html());
      } else {
        this.container.html(this.get_single_html());
      }
      this.form_field_jq.hide().after(this.container);
      this.dropdown = this.container.find('div.chosen-drop').first();
      this.search_field = this.container.find('input').first();
      this.search_results = this.container.find('ul.chosen-results').first();
      this.search_field_scale();
      this.search_no_results = this.container.find('li.no-results').first();
      if (this.is_multiple) {
        this.search_choices = this.container.find('ul.chosen-choices').first();
        this.search_container = this.container.find('li.search-field').first();
      } else {
        this.search_container = this.container.find('div.chosen-search').first();
        this.selected_item = this.container.find('.chosen-single').first();
      }
      this.results_build();
      this.set_tab_index();
      return this.set_label_behavior();
    };

    Chosen.prototype.on_ready = function() {
      return this.form_field_jq.trigger("chosen:ready", {
        chosen: this
      });
    };

    Chosen.prototype.register_observers = function() {
      this.container.on('touchstart.chosen', (function(_this) {
        return function(evt) {
          _this.container_mousedown(evt);
        };
      })(this));
      this.container.on('touchend.chosen', (function(_this) {
        return function(evt) {
          _this.container_mouseup(evt);
        };
      })(this));
      this.container.on('mousedown.chosen', (function(_this) {
        return function(evt) {
          _this.container_mousedown(evt);
        };
      })(this));
      this.container.on('mouseup.chosen', (function(_this) {
        return function(evt) {
          _this.container_mouseup(evt);
        };
      })(this));
      this.container.on('mouseenter.chosen', (function(_this) {
        return function(evt) {
          _this.mouse_enter(evt);
        };
      })(this));
      this.container.on('mouseleave.chosen', (function(_this) {
        return function(evt) {
          _this.mouse_leave(evt);
        };
      })(this));
      this.search_results.on('mouseup.chosen', (function(_this) {
        return function(evt) {
          _this.search_results_mouseup(evt);
        };
      })(this));
      this.search_results.on('mouseover.chosen', (function(_this) {
        return function(evt) {
          _this.search_results_mouseover(evt);
        };
      })(this));
      this.search_results.on('mouseout.chosen', (function(_this) {
        return function(evt) {
          _this.search_results_mouseout(evt);
        };
      })(this));
      this.search_results.on('mousewheel.chosen DOMMouseScroll.chosen', (function(_this) {
        return function(evt) {
          _this.search_results_mousewheel(evt);
        };
      })(this));
      this.search_results.on('touchstart.chosen', (function(_this) {
        return function(evt) {
          _this.search_results_touchstart(evt);
        };
      })(this));
      this.search_results.on('touchmove.chosen', (function(_this) {
        return function(evt) {
          _this.search_results_touchmove(evt);
        };
      })(this));
      this.search_results.on('touchend.chosen', (function(_this) {
        return function(evt) {
          _this.search_results_touchend(evt);
        };
      })(this));
      this.form_field_jq.on("chosen:updated.chosen", (function(_this) {
        return function(evt) {
          _this.results_update_field(evt);
        };
      })(this));
      this.form_field_jq.on("chosen:activate.chosen", (function(_this) {
        return function(evt) {
          _this.activate_field(evt);
        };
      })(this));
      this.form_field_jq.on("chosen:open.chosen", (function(_this) {
        return function(evt) {
          _this.container_mousedown(evt);
        };
      })(this));
      this.form_field_jq.on("chosen:close.chosen", (function(_this) {
        return function(evt) {
          _this.close_field(evt);
        };
      })(this));
      this.search_field.on('blur.chosen', (function(_this) {
        return function(evt) {
          _this.input_blur(evt);
        };
      })(this));
      this.search_field.on('keyup.chosen', (function(_this) {
        return function(evt) {
          _this.keyup_checker(evt);
        };
      })(this));
      this.search_field.on('keydown.chosen', (function(_this) {
        return function(evt) {
          _this.keydown_checker(evt);
        };
      })(this));
      this.search_field.on('focus.chosen', (function(_this) {
        return function(evt) {
          _this.input_focus(evt);
        };
      })(this));
      this.search_field.on('cut.chosen', (function(_this) {
        return function(evt) {
          _this.clipboard_event_checker(evt);
        };
      })(this));
      this.search_field.on('paste.chosen', (function(_this) {
        return function(evt) {
          _this.clipboard_event_checker(evt);
        };
      })(this));
      if (this.is_multiple) {
        return this.search_choices.on('click.chosen', (function(_this) {
          return function(evt) {
            _this.choices_click(evt);
          };
        })(this));
      } else {
        return this.container.on('click.chosen', function(evt) {
          evt.preventDefault();
        });
      }
    };

    Chosen.prototype.destroy = function() {
      $(this.container[0].ownerDocument).off('click.chosen', this.click_test_action);
      if (this.form_field_label.length > 0) {
        this.form_field_label.off('click.chosen');
      }
      if (this.search_field[0].tabIndex) {
        this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex;
      }
      this.container.remove();
      this.form_field_jq.removeData('chosen');
      return this.form_field_jq.show();
    };

    Chosen.prototype.search_field_disabled = function() {
      this.is_disabled = this.form_field.disabled || this.form_field_jq.parents('fieldset').is(':disabled');
      this.container.toggleClass('chosen-disabled', this.is_disabled);
      this.search_field[0].disabled = this.is_disabled;
      if (!this.is_multiple) {
        this.selected_item.off('focus.chosen', this.activate_field);
      }
      if (this.is_disabled) {
        return this.close_field();
      } else if (!this.is_multiple) {
        return this.selected_item.on('focus.chosen', this.activate_field);
      }
    };

    Chosen.prototype.container_mousedown = function(evt) {
      var ref;
      if (this.is_disabled) {
        return;
      }
      if (evt && ((ref = evt.type) === 'mousedown' || ref === 'touchstart') && !this.results_showing) {
        evt.preventDefault();
      }
      if (!((evt != null) && ($(evt.target)).hasClass("search-choice-close"))) {
        if (!this.active_field) {
          if (this.is_multiple) {
            this.search_field.val("");
          }
          $(this.container[0].ownerDocument).on('click.chosen', this.click_test_action);
          this.results_show();
        } else if (!this.is_multiple && evt && (($(evt.target)[0] === this.selected_item[0]) || $(evt.target).parents("a.chosen-single").length)) {
          evt.preventDefault();
          this.results_toggle();
        }
        return this.activate_field();
      }
    };

    Chosen.prototype.container_mouseup = function(evt) {
      if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
        return this.results_reset(evt);
      }
    };

    Chosen.prototype.search_results_mousewheel = function(evt) {
      var delta;
      if (evt.originalEvent) {
        delta = evt.originalEvent.deltaY || -evt.originalEvent.wheelDelta || evt.originalEvent.detail;
      }
      if (delta != null) {
        evt.preventDefault();
        if (evt.type === 'DOMMouseScroll') {
          delta = delta * 40;
        }
        return this.search_results.scrollTop(delta + this.search_results.scrollTop());
      }
    };

    Chosen.prototype.blur_test = function(evt) {
      if (!this.active_field && this.container.hasClass("chosen-container-active")) {
        return this.close_field();
      }
    };

    Chosen.prototype.close_field = function() {
      $(this.container[0].ownerDocument).off("click.chosen", this.click_test_action);
      this.active_field = false;
      this.results_hide();
      this.container.removeClass("chosen-container-active");
      this.clear_backstroke();
      this.show_search_field_default();
      this.search_field_scale();
      return this.search_field.blur();
    };

    Chosen.prototype.activate_field = function() {
      if (this.is_disabled) {
        return;
      }
      this.container.addClass("chosen-container-active");
      this.active_field = true;
      this.search_field.val(this.search_field.val());
      return this.search_field.focus();
    };

    Chosen.prototype.test_active_click = function(evt) {
      var active_container;
      active_container = $(evt.target).closest('.chosen-container');
      if (active_container.length && this.container[0] === active_container[0]) {
        return this.active_field = true;
      } else {
        return this.close_field();
      }
    };

    Chosen.prototype.results_build = function() {
      this.parsing = true;
      this.selected_option_count = null;
      this.results_data = SelectParser.select_to_array(this.form_field);
      if (this.is_multiple) {
        this.search_choices.find("li.search-choice").remove();
      } else {
        this.single_set_selected_text();
        if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
          this.search_field[0].readOnly = true;
          this.container.addClass("chosen-container-single-nosearch");
        } else {
          this.search_field[0].readOnly = false;
          this.container.removeClass("chosen-container-single-nosearch");
        }
      }
      this.update_results_content(this.results_option_build({
        first: true
      }));
      this.search_field_disabled();
      this.show_search_field_default();
      this.search_field_scale();
      return this.parsing = false;
    };

    Chosen.prototype.result_do_highlight = function(el) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
      if (el.length) {
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.addClass("highlighted");
        maxHeight = parseInt(this.search_results.css("maxHeight"), 10);
        visible_top = this.search_results.scrollTop();
        visible_bottom = maxHeight + visible_top;
        high_top = this.result_highlight.position().top + this.search_results.scrollTop();
        high_bottom = high_top + this.result_highlight.outerHeight();
        if (high_bottom >= visible_bottom) {
          return this.search_results.scrollTop((high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0);
        } else if (high_top < visible_top) {
          return this.search_results.scrollTop(high_top);
        }
      }
    };

    Chosen.prototype.result_clear_highlight = function() {
      if (this.result_highlight) {
        this.result_highlight.removeClass("highlighted");
      }
      return this.result_highlight = null;
    };

    Chosen.prototype.results_show = function() {
      if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
        this.form_field_jq.trigger("chosen:maxselected", {
          chosen: this
        });
        return false;
      }
      this.container.addClass("chosen-with-drop");
      this.results_showing = true;
      this.search_field.focus();
      this.search_field.val(this.get_search_field_value());
      this.winnow_results();
      return this.form_field_jq.trigger("chosen:showing_dropdown", {
        chosen: this
      });
    };

    Chosen.prototype.update_results_content = function(content) {
      return this.search_results.html(content);
    };

    Chosen.prototype.results_hide = function() {
      if (this.results_showing) {
        this.result_clear_highlight();
        this.container.removeClass("chosen-with-drop");
        this.form_field_jq.trigger("chosen:hiding_dropdown", {
          chosen: this
        });
      }
      return this.results_showing = false;
    };

    Chosen.prototype.set_tab_index = function(el) {
      var ti;
      if (this.form_field.tabIndex) {
        ti = this.form_field.tabIndex;
        this.form_field.tabIndex = -1;
        return this.search_field[0].tabIndex = ti;
      }
    };

    Chosen.prototype.set_label_behavior = function() {
      this.form_field_label = this.form_field_jq.parents("label");
      if (!this.form_field_label.length && this.form_field.id.length) {
        this.form_field_label = $("label[for='" + this.form_field.id + "']");
      }
      if (this.form_field_label.length > 0) {
        return this.form_field_label.on('click.chosen', this.label_click_handler);
      }
    };

    Chosen.prototype.show_search_field_default = function() {
      if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
        this.search_field.val(this.default_text);
        return this.search_field.addClass("default");
      } else {
        this.search_field.val("");
        return this.search_field.removeClass("default");
      }
    };

    Chosen.prototype.search_results_mouseup = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target.length) {
        this.result_highlight = target;
        this.result_select(evt);
        return this.search_field.focus();
      }
    };

    Chosen.prototype.search_results_mouseover = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target) {
        return this.result_do_highlight(target);
      }
    };

    Chosen.prototype.search_results_mouseout = function(evt) {
      if ($(evt.target).hasClass("active-result") || $(evt.target).parents('.active-result').first()) {
        return this.result_clear_highlight();
      }
    };

    Chosen.prototype.choice_build = function(item) {
      var choice, close_link;
      choice = $('<li />', {
        "class": "search-choice"
      }).html("<span>" + (this.choice_label(item)) + "</span>");
      if (item.disabled) {
        choice.addClass('search-choice-disabled');
      } else {
        close_link = $('<a />', {
          "class": 'search-choice-close',
          'data-option-array-index': item.array_index
        });
        close_link.on('click.chosen', (function(_this) {
          return function(evt) {
            return _this.choice_destroy_link_click(evt);
          };
        })(this));
        choice.append(close_link);
      }
      return this.search_container.before(choice);
    };

    Chosen.prototype.choice_destroy_link_click = function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!this.is_disabled) {
        return this.choice_destroy($(evt.target));
      }
    };

    Chosen.prototype.choice_destroy = function(link) {
      if (this.result_deselect(link[0].getAttribute("data-option-array-index"))) {
        if (this.active_field) {
          this.search_field.focus();
        } else {
          this.show_search_field_default();
        }
        if (this.is_multiple && this.choices_count() > 0 && this.get_search_field_value().length < 1) {
          this.results_hide();
        }
        link.parents('li').first().remove();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.results_reset = function() {
      this.reset_single_select_options();
      this.form_field.options[0].selected = true;
      this.single_set_selected_text();
      this.show_search_field_default();
      this.results_reset_cleanup();
      this.trigger_form_field_change();
      if (this.active_field) {
        return this.results_hide();
      }
    };

    Chosen.prototype.results_reset_cleanup = function() {
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.selected_item.find("abbr").remove();
    };

    Chosen.prototype.result_select = function(evt) {
      var high, item;
      if (this.result_highlight) {
        high = this.result_highlight;
        this.result_clear_highlight();
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field_jq.trigger("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        if (this.is_multiple) {
          high.removeClass("active-result");
        } else {
          this.reset_single_select_options();
        }
        high.addClass("result-selected");
        item = this.results_data[high[0].getAttribute("data-option-array-index")];
        item.selected = true;
        this.form_field.options[item.options_index].selected = true;
        this.selected_option_count = null;
        if (this.is_multiple) {
          this.choice_build(item);
        } else {
          this.single_set_selected_text(this.choice_label(item));
        }
        if (this.is_multiple && (!this.hide_results_on_select || (evt.metaKey || evt.ctrlKey))) {
          if (evt.metaKey || evt.ctrlKey) {
            this.winnow_results({
              skip_highlight: true
            });
          } else {
            this.search_field.val("");
            this.winnow_results();
          }
        } else {
          this.results_hide();
          this.show_search_field_default();
        }
        if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
          this.trigger_form_field_change({
            selected: this.form_field.options[item.options_index].value
          });
        }
        this.current_selectedIndex = this.form_field.selectedIndex;
        evt.preventDefault();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.single_set_selected_text = function(text) {
      if (text == null) {
        text = this.default_text;
      }
      if (text === this.default_text) {
        this.selected_item.addClass("chosen-default");
      } else {
        this.single_deselect_control_build();
        this.selected_item.removeClass("chosen-default");
      }
      return this.selected_item.find("span").html(text);
    };

    Chosen.prototype.result_deselect = function(pos) {
      var result_data;
      result_data = this.results_data[pos];
      if (!this.form_field.options[result_data.options_index].disabled) {
        result_data.selected = false;
        this.form_field.options[result_data.options_index].selected = false;
        this.selected_option_count = null;
        this.result_clear_highlight();
        if (this.results_showing) {
          this.winnow_results();
        }
        this.trigger_form_field_change({
          deselected: this.form_field.options[result_data.options_index].value
        });
        this.search_field_scale();
        return true;
      } else {
        return false;
      }
    };

    Chosen.prototype.single_deselect_control_build = function() {
      if (!this.allow_single_deselect) {
        return;
      }
      if (!this.selected_item.find("abbr").length) {
        this.selected_item.find("span").first().after("<abbr class=\"search-choice-close\"></abbr>");
      }
      return this.selected_item.addClass("chosen-single-with-deselect");
    };

    Chosen.prototype.get_search_field_value = function() {
      return this.search_field.val();
    };

    Chosen.prototype.get_search_text = function() {
      return $.trim(this.get_search_field_value());
    };

    Chosen.prototype.escape_html = function(text) {
      return $('<div/>').text(text).html();
    };

    Chosen.prototype.winnow_results_set_highlight = function() {
      var do_high, selected_results;
      selected_results = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
      do_high = selected_results.length ? selected_results.first() : this.search_results.find(".active-result").first();
      if (do_high != null) {
        return this.result_do_highlight(do_high);
      }
    };

    Chosen.prototype.no_results = function(terms) {
      var no_results_html;
      no_results_html = this.get_no_results_html(terms);
      this.search_results.append(no_results_html);
      return this.form_field_jq.trigger("chosen:no_results", {
        chosen: this
      });
    };

    Chosen.prototype.no_results_clear = function() {
      return this.search_results.find(".no-results").remove();
    };

    Chosen.prototype.keydown_arrow = function() {
      var next_sib;
      if (this.results_showing && this.result_highlight) {
        next_sib = this.result_highlight.nextAll("li.active-result").first();
        if (next_sib) {
          return this.result_do_highlight(next_sib);
        }
      } else {
        return this.results_show();
      }
    };

    Chosen.prototype.keyup_arrow = function() {
      var prev_sibs;
      if (!this.results_showing && !this.is_multiple) {
        return this.results_show();
      } else if (this.result_highlight) {
        prev_sibs = this.result_highlight.prevAll("li.active-result");
        if (prev_sibs.length) {
          return this.result_do_highlight(prev_sibs.first());
        } else {
          if (this.choices_count() > 0) {
            this.results_hide();
          }
          return this.result_clear_highlight();
        }
      }
    };

    Chosen.prototype.keydown_backstroke = function() {
      var next_available_destroy;
      if (this.pending_backstroke) {
        this.choice_destroy(this.pending_backstroke.find("a").first());
        return this.clear_backstroke();
      } else {
        next_available_destroy = this.search_container.siblings("li.search-choice").last();
        if (next_available_destroy.length && !next_available_destroy.hasClass("search-choice-disabled")) {
          this.pending_backstroke = next_available_destroy;
          if (this.single_backstroke_delete) {
            return this.keydown_backstroke();
          } else {
            return this.pending_backstroke.addClass("search-choice-focus");
          }
        }
      }
    };

    Chosen.prototype.clear_backstroke = function() {
      if (this.pending_backstroke) {
        this.pending_backstroke.removeClass("search-choice-focus");
      }
      return this.pending_backstroke = null;
    };

    Chosen.prototype.search_field_scale = function() {
      var div, i, len, style, style_block, styles, width;
      if (!this.is_multiple) {
        return;
      }
      style_block = {
        position: 'absolute',
        left: '-1000px',
        top: '-1000px',
        display: 'none',
        whiteSpace: 'pre'
      };
      styles = ['fontSize', 'fontStyle', 'fontWeight', 'fontFamily', 'lineHeight', 'textTransform', 'letterSpacing'];
      for (i = 0, len = styles.length; i < len; i++) {
        style = styles[i];
        style_block[style] = this.search_field.css(style);
      }
      div = $('<div />').css(style_block);
      div.text(this.get_search_field_value());
      $('body').append(div);
      width = div.width() + 25;
      div.remove();
      if (this.container.is(':visible')) {
        width = Math.min(this.container.outerWidth() - 10, width);
      }
      return this.search_field.width(width);
    };

    Chosen.prototype.trigger_form_field_change = function(extra) {
      this.form_field_jq.trigger("input", extra);
      return this.form_field_jq.trigger("change", extra);
    };

    return Chosen;

  })(AbstractChosen);

}).call(this);
  ;

  /*
Copyright 2012 Igor Vaynberg

Version: 3.5.4 Timestamp: Sun Aug 30 13:30:32 EDT 2015

This software is licensed under the Apache License, Version 2.0 (the "Apache License") or the GNU
General Public License version 2 (the "GPL License"). You may choose either license to govern your
use of this software only upon the condition that you accept all of the terms of either the Apache
License or the GPL License.

You may obtain a copy of the Apache License and the GPL License at:

    http://www.apache.org/licenses/LICENSE-2.0
    http://www.gnu.org/licenses/gpl-2.0.html

Unless required by applicable law or agreed to in writing, software distributed under the
Apache License or the GPL License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the Apache License and the GPL License for
the specific language governing permissions and limitations under the Apache License and the GPL License.
*/
(function ($) {
  if(typeof $.fn.each2 == "undefined") {
      $.extend($.fn, {
          /*
          * 4-10 times faster .each replacement
          * use it carefully, as it overrides jQuery context of element on each iteration
          */
          each2 : function (c) {
              var j = $([0]), i = -1, l = this.length;
              while (
                  ++i < l
                  && (j.context = j[0] = this[i])
                  && c.call(j[0], i, j) !== false //"this"=DOM, i=index, j=jQuery object
              );
              return this;
          }
      });
  }
})(jQuery);

(function ($, undefined) {
  "use strict";
  /*global document, window, jQuery, console */

  if (window.Select2 !== undefined) {
      return;
  }

  var AbstractSelect2, SingleSelect2, MultiSelect2, nextUid, sizer,
      lastMousePosition={x:0,y:0}, $document, scrollBarDimensions,

  KEY = {
      TAB: 9,
      ENTER: 13,
      ESC: 27,
      SPACE: 32,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      SHIFT: 16,
      CTRL: 17,
      ALT: 18,
      PAGE_UP: 33,
      PAGE_DOWN: 34,
      HOME: 36,
      END: 35,
      BACKSPACE: 8,
      DELETE: 46,
      isArrow: function (k) {
          k = k.which ? k.which : k;
          switch (k) {
          case KEY.LEFT:
          case KEY.RIGHT:
          case KEY.UP:
          case KEY.DOWN:
              return true;
          }
          return false;
      },
      isControl: function (e) {
          var k = e.which;
          switch (k) {
          case KEY.SHIFT:
          case KEY.CTRL:
          case KEY.ALT:
              return true;
          }

          if (e.metaKey) return true;

          return false;
      },
      isFunctionKey: function (k) {
          k = k.which ? k.which : k;
          return k >= 112 && k <= 123;
      }
  },
  MEASURE_SCROLLBAR_TEMPLATE = "<div class='select2-measure-scrollbar'></div>",

  DIACRITICS = {"\u24B6":"A","\uFF21":"A","\u00C0":"A","\u00C1":"A","\u00C2":"A","\u1EA6":"A","\u1EA4":"A","\u1EAA":"A","\u1EA8":"A","\u00C3":"A","\u0100":"A","\u0102":"A","\u1EB0":"A","\u1EAE":"A","\u1EB4":"A","\u1EB2":"A","\u0226":"A","\u01E0":"A","\u00C4":"A","\u01DE":"A","\u1EA2":"A","\u00C5":"A","\u01FA":"A","\u01CD":"A","\u0200":"A","\u0202":"A","\u1EA0":"A","\u1EAC":"A","\u1EB6":"A","\u1E00":"A","\u0104":"A","\u023A":"A","\u2C6F":"A","\uA732":"AA","\u00C6":"AE","\u01FC":"AE","\u01E2":"AE","\uA734":"AO","\uA736":"AU","\uA738":"AV","\uA73A":"AV","\uA73C":"AY","\u24B7":"B","\uFF22":"B","\u1E02":"B","\u1E04":"B","\u1E06":"B","\u0243":"B","\u0182":"B","\u0181":"B","\u24B8":"C","\uFF23":"C","\u0106":"C","\u0108":"C","\u010A":"C","\u010C":"C","\u00C7":"C","\u1E08":"C","\u0187":"C","\u023B":"C","\uA73E":"C","\u24B9":"D","\uFF24":"D","\u1E0A":"D","\u010E":"D","\u1E0C":"D","\u1E10":"D","\u1E12":"D","\u1E0E":"D","\u0110":"D","\u018B":"D","\u018A":"D","\u0189":"D","\uA779":"D","\u01F1":"DZ","\u01C4":"DZ","\u01F2":"Dz","\u01C5":"Dz","\u24BA":"E","\uFF25":"E","\u00C8":"E","\u00C9":"E","\u00CA":"E","\u1EC0":"E","\u1EBE":"E","\u1EC4":"E","\u1EC2":"E","\u1EBC":"E","\u0112":"E","\u1E14":"E","\u1E16":"E","\u0114":"E","\u0116":"E","\u00CB":"E","\u1EBA":"E","\u011A":"E","\u0204":"E","\u0206":"E","\u1EB8":"E","\u1EC6":"E","\u0228":"E","\u1E1C":"E","\u0118":"E","\u1E18":"E","\u1E1A":"E","\u0190":"E","\u018E":"E","\u24BB":"F","\uFF26":"F","\u1E1E":"F","\u0191":"F","\uA77B":"F","\u24BC":"G","\uFF27":"G","\u01F4":"G","\u011C":"G","\u1E20":"G","\u011E":"G","\u0120":"G","\u01E6":"G","\u0122":"G","\u01E4":"G","\u0193":"G","\uA7A0":"G","\uA77D":"G","\uA77E":"G","\u24BD":"H","\uFF28":"H","\u0124":"H","\u1E22":"H","\u1E26":"H","\u021E":"H","\u1E24":"H","\u1E28":"H","\u1E2A":"H","\u0126":"H","\u2C67":"H","\u2C75":"H","\uA78D":"H","\u24BE":"I","\uFF29":"I","\u00CC":"I","\u00CD":"I","\u00CE":"I","\u0128":"I","\u012A":"I","\u012C":"I","\u0130":"I","\u00CF":"I","\u1E2E":"I","\u1EC8":"I","\u01CF":"I","\u0208":"I","\u020A":"I","\u1ECA":"I","\u012E":"I","\u1E2C":"I","\u0197":"I","\u24BF":"J","\uFF2A":"J","\u0134":"J","\u0248":"J","\u24C0":"K","\uFF2B":"K","\u1E30":"K","\u01E8":"K","\u1E32":"K","\u0136":"K","\u1E34":"K","\u0198":"K","\u2C69":"K","\uA740":"K","\uA742":"K","\uA744":"K","\uA7A2":"K","\u24C1":"L","\uFF2C":"L","\u013F":"L","\u0139":"L","\u013D":"L","\u1E36":"L","\u1E38":"L","\u013B":"L","\u1E3C":"L","\u1E3A":"L","\u0141":"L","\u023D":"L","\u2C62":"L","\u2C60":"L","\uA748":"L","\uA746":"L","\uA780":"L","\u01C7":"LJ","\u01C8":"Lj","\u24C2":"M","\uFF2D":"M","\u1E3E":"M","\u1E40":"M","\u1E42":"M","\u2C6E":"M","\u019C":"M","\u24C3":"N","\uFF2E":"N","\u01F8":"N","\u0143":"N","\u00D1":"N","\u1E44":"N","\u0147":"N","\u1E46":"N","\u0145":"N","\u1E4A":"N","\u1E48":"N","\u0220":"N","\u019D":"N","\uA790":"N","\uA7A4":"N","\u01CA":"NJ","\u01CB":"Nj","\u24C4":"O","\uFF2F":"O","\u00D2":"O","\u00D3":"O","\u00D4":"O","\u1ED2":"O","\u1ED0":"O","\u1ED6":"O","\u1ED4":"O","\u00D5":"O","\u1E4C":"O","\u022C":"O","\u1E4E":"O","\u014C":"O","\u1E50":"O","\u1E52":"O","\u014E":"O","\u022E":"O","\u0230":"O","\u00D6":"O","\u022A":"O","\u1ECE":"O","\u0150":"O","\u01D1":"O","\u020C":"O","\u020E":"O","\u01A0":"O","\u1EDC":"O","\u1EDA":"O","\u1EE0":"O","\u1EDE":"O","\u1EE2":"O","\u1ECC":"O","\u1ED8":"O","\u01EA":"O","\u01EC":"O","\u00D8":"O","\u01FE":"O","\u0186":"O","\u019F":"O","\uA74A":"O","\uA74C":"O","\u01A2":"OI","\uA74E":"OO","\u0222":"OU","\u24C5":"P","\uFF30":"P","\u1E54":"P","\u1E56":"P","\u01A4":"P","\u2C63":"P","\uA750":"P","\uA752":"P","\uA754":"P","\u24C6":"Q","\uFF31":"Q","\uA756":"Q","\uA758":"Q","\u024A":"Q","\u24C7":"R","\uFF32":"R","\u0154":"R","\u1E58":"R","\u0158":"R","\u0210":"R","\u0212":"R","\u1E5A":"R","\u1E5C":"R","\u0156":"R","\u1E5E":"R","\u024C":"R","\u2C64":"R","\uA75A":"R","\uA7A6":"R","\uA782":"R","\u24C8":"S","\uFF33":"S","\u1E9E":"S","\u015A":"S","\u1E64":"S","\u015C":"S","\u1E60":"S","\u0160":"S","\u1E66":"S","\u1E62":"S","\u1E68":"S","\u0218":"S","\u015E":"S","\u2C7E":"S","\uA7A8":"S","\uA784":"S","\u24C9":"T","\uFF34":"T","\u1E6A":"T","\u0164":"T","\u1E6C":"T","\u021A":"T","\u0162":"T","\u1E70":"T","\u1E6E":"T","\u0166":"T","\u01AC":"T","\u01AE":"T","\u023E":"T","\uA786":"T","\uA728":"TZ","\u24CA":"U","\uFF35":"U","\u00D9":"U","\u00DA":"U","\u00DB":"U","\u0168":"U","\u1E78":"U","\u016A":"U","\u1E7A":"U","\u016C":"U","\u00DC":"U","\u01DB":"U","\u01D7":"U","\u01D5":"U","\u01D9":"U","\u1EE6":"U","\u016E":"U","\u0170":"U","\u01D3":"U","\u0214":"U","\u0216":"U","\u01AF":"U","\u1EEA":"U","\u1EE8":"U","\u1EEE":"U","\u1EEC":"U","\u1EF0":"U","\u1EE4":"U","\u1E72":"U","\u0172":"U","\u1E76":"U","\u1E74":"U","\u0244":"U","\u24CB":"V","\uFF36":"V","\u1E7C":"V","\u1E7E":"V","\u01B2":"V","\uA75E":"V","\u0245":"V","\uA760":"VY","\u24CC":"W","\uFF37":"W","\u1E80":"W","\u1E82":"W","\u0174":"W","\u1E86":"W","\u1E84":"W","\u1E88":"W","\u2C72":"W","\u24CD":"X","\uFF38":"X","\u1E8A":"X","\u1E8C":"X","\u24CE":"Y","\uFF39":"Y","\u1EF2":"Y","\u00DD":"Y","\u0176":"Y","\u1EF8":"Y","\u0232":"Y","\u1E8E":"Y","\u0178":"Y","\u1EF6":"Y","\u1EF4":"Y","\u01B3":"Y","\u024E":"Y","\u1EFE":"Y","\u24CF":"Z","\uFF3A":"Z","\u0179":"Z","\u1E90":"Z","\u017B":"Z","\u017D":"Z","\u1E92":"Z","\u1E94":"Z","\u01B5":"Z","\u0224":"Z","\u2C7F":"Z","\u2C6B":"Z","\uA762":"Z","\u24D0":"a","\uFF41":"a","\u1E9A":"a","\u00E0":"a","\u00E1":"a","\u00E2":"a","\u1EA7":"a","\u1EA5":"a","\u1EAB":"a","\u1EA9":"a","\u00E3":"a","\u0101":"a","\u0103":"a","\u1EB1":"a","\u1EAF":"a","\u1EB5":"a","\u1EB3":"a","\u0227":"a","\u01E1":"a","\u00E4":"a","\u01DF":"a","\u1EA3":"a","\u00E5":"a","\u01FB":"a","\u01CE":"a","\u0201":"a","\u0203":"a","\u1EA1":"a","\u1EAD":"a","\u1EB7":"a","\u1E01":"a","\u0105":"a","\u2C65":"a","\u0250":"a","\uA733":"aa","\u00E6":"ae","\u01FD":"ae","\u01E3":"ae","\uA735":"ao","\uA737":"au","\uA739":"av","\uA73B":"av","\uA73D":"ay","\u24D1":"b","\uFF42":"b","\u1E03":"b","\u1E05":"b","\u1E07":"b","\u0180":"b","\u0183":"b","\u0253":"b","\u24D2":"c","\uFF43":"c","\u0107":"c","\u0109":"c","\u010B":"c","\u010D":"c","\u00E7":"c","\u1E09":"c","\u0188":"c","\u023C":"c","\uA73F":"c","\u2184":"c","\u24D3":"d","\uFF44":"d","\u1E0B":"d","\u010F":"d","\u1E0D":"d","\u1E11":"d","\u1E13":"d","\u1E0F":"d","\u0111":"d","\u018C":"d","\u0256":"d","\u0257":"d","\uA77A":"d","\u01F3":"dz","\u01C6":"dz","\u24D4":"e","\uFF45":"e","\u00E8":"e","\u00E9":"e","\u00EA":"e","\u1EC1":"e","\u1EBF":"e","\u1EC5":"e","\u1EC3":"e","\u1EBD":"e","\u0113":"e","\u1E15":"e","\u1E17":"e","\u0115":"e","\u0117":"e","\u00EB":"e","\u1EBB":"e","\u011B":"e","\u0205":"e","\u0207":"e","\u1EB9":"e","\u1EC7":"e","\u0229":"e","\u1E1D":"e","\u0119":"e","\u1E19":"e","\u1E1B":"e","\u0247":"e","\u025B":"e","\u01DD":"e","\u24D5":"f","\uFF46":"f","\u1E1F":"f","\u0192":"f","\uA77C":"f","\u24D6":"g","\uFF47":"g","\u01F5":"g","\u011D":"g","\u1E21":"g","\u011F":"g","\u0121":"g","\u01E7":"g","\u0123":"g","\u01E5":"g","\u0260":"g","\uA7A1":"g","\u1D79":"g","\uA77F":"g","\u24D7":"h","\uFF48":"h","\u0125":"h","\u1E23":"h","\u1E27":"h","\u021F":"h","\u1E25":"h","\u1E29":"h","\u1E2B":"h","\u1E96":"h","\u0127":"h","\u2C68":"h","\u2C76":"h","\u0265":"h","\u0195":"hv","\u24D8":"i","\uFF49":"i","\u00EC":"i","\u00ED":"i","\u00EE":"i","\u0129":"i","\u012B":"i","\u012D":"i","\u00EF":"i","\u1E2F":"i","\u1EC9":"i","\u01D0":"i","\u0209":"i","\u020B":"i","\u1ECB":"i","\u012F":"i","\u1E2D":"i","\u0268":"i","\u0131":"i","\u24D9":"j","\uFF4A":"j","\u0135":"j","\u01F0":"j","\u0249":"j","\u24DA":"k","\uFF4B":"k","\u1E31":"k","\u01E9":"k","\u1E33":"k","\u0137":"k","\u1E35":"k","\u0199":"k","\u2C6A":"k","\uA741":"k","\uA743":"k","\uA745":"k","\uA7A3":"k","\u24DB":"l","\uFF4C":"l","\u0140":"l","\u013A":"l","\u013E":"l","\u1E37":"l","\u1E39":"l","\u013C":"l","\u1E3D":"l","\u1E3B":"l","\u017F":"l","\u0142":"l","\u019A":"l","\u026B":"l","\u2C61":"l","\uA749":"l","\uA781":"l","\uA747":"l","\u01C9":"lj","\u24DC":"m","\uFF4D":"m","\u1E3F":"m","\u1E41":"m","\u1E43":"m","\u0271":"m","\u026F":"m","\u24DD":"n","\uFF4E":"n","\u01F9":"n","\u0144":"n","\u00F1":"n","\u1E45":"n","\u0148":"n","\u1E47":"n","\u0146":"n","\u1E4B":"n","\u1E49":"n","\u019E":"n","\u0272":"n","\u0149":"n","\uA791":"n","\uA7A5":"n","\u01CC":"nj","\u24DE":"o","\uFF4F":"o","\u00F2":"o","\u00F3":"o","\u00F4":"o","\u1ED3":"o","\u1ED1":"o","\u1ED7":"o","\u1ED5":"o","\u00F5":"o","\u1E4D":"o","\u022D":"o","\u1E4F":"o","\u014D":"o","\u1E51":"o","\u1E53":"o","\u014F":"o","\u022F":"o","\u0231":"o","\u00F6":"o","\u022B":"o","\u1ECF":"o","\u0151":"o","\u01D2":"o","\u020D":"o","\u020F":"o","\u01A1":"o","\u1EDD":"o","\u1EDB":"o","\u1EE1":"o","\u1EDF":"o","\u1EE3":"o","\u1ECD":"o","\u1ED9":"o","\u01EB":"o","\u01ED":"o","\u00F8":"o","\u01FF":"o","\u0254":"o","\uA74B":"o","\uA74D":"o","\u0275":"o","\u01A3":"oi","\u0223":"ou","\uA74F":"oo","\u24DF":"p","\uFF50":"p","\u1E55":"p","\u1E57":"p","\u01A5":"p","\u1D7D":"p","\uA751":"p","\uA753":"p","\uA755":"p","\u24E0":"q","\uFF51":"q","\u024B":"q","\uA757":"q","\uA759":"q","\u24E1":"r","\uFF52":"r","\u0155":"r","\u1E59":"r","\u0159":"r","\u0211":"r","\u0213":"r","\u1E5B":"r","\u1E5D":"r","\u0157":"r","\u1E5F":"r","\u024D":"r","\u027D":"r","\uA75B":"r","\uA7A7":"r","\uA783":"r","\u24E2":"s","\uFF53":"s","\u00DF":"s","\u015B":"s","\u1E65":"s","\u015D":"s","\u1E61":"s","\u0161":"s","\u1E67":"s","\u1E63":"s","\u1E69":"s","\u0219":"s","\u015F":"s","\u023F":"s","\uA7A9":"s","\uA785":"s","\u1E9B":"s","\u24E3":"t","\uFF54":"t","\u1E6B":"t","\u1E97":"t","\u0165":"t","\u1E6D":"t","\u021B":"t","\u0163":"t","\u1E71":"t","\u1E6F":"t","\u0167":"t","\u01AD":"t","\u0288":"t","\u2C66":"t","\uA787":"t","\uA729":"tz","\u24E4":"u","\uFF55":"u","\u00F9":"u","\u00FA":"u","\u00FB":"u","\u0169":"u","\u1E79":"u","\u016B":"u","\u1E7B":"u","\u016D":"u","\u00FC":"u","\u01DC":"u","\u01D8":"u","\u01D6":"u","\u01DA":"u","\u1EE7":"u","\u016F":"u","\u0171":"u","\u01D4":"u","\u0215":"u","\u0217":"u","\u01B0":"u","\u1EEB":"u","\u1EE9":"u","\u1EEF":"u","\u1EED":"u","\u1EF1":"u","\u1EE5":"u","\u1E73":"u","\u0173":"u","\u1E77":"u","\u1E75":"u","\u0289":"u","\u24E5":"v","\uFF56":"v","\u1E7D":"v","\u1E7F":"v","\u028B":"v","\uA75F":"v","\u028C":"v","\uA761":"vy","\u24E6":"w","\uFF57":"w","\u1E81":"w","\u1E83":"w","\u0175":"w","\u1E87":"w","\u1E85":"w","\u1E98":"w","\u1E89":"w","\u2C73":"w","\u24E7":"x","\uFF58":"x","\u1E8B":"x","\u1E8D":"x","\u24E8":"y","\uFF59":"y","\u1EF3":"y","\u00FD":"y","\u0177":"y","\u1EF9":"y","\u0233":"y","\u1E8F":"y","\u00FF":"y","\u1EF7":"y","\u1E99":"y","\u1EF5":"y","\u01B4":"y","\u024F":"y","\u1EFF":"y","\u24E9":"z","\uFF5A":"z","\u017A":"z","\u1E91":"z","\u017C":"z","\u017E":"z","\u1E93":"z","\u1E95":"z","\u01B6":"z","\u0225":"z","\u0240":"z","\u2C6C":"z","\uA763":"z","\u0386":"\u0391","\u0388":"\u0395","\u0389":"\u0397","\u038A":"\u0399","\u03AA":"\u0399","\u038C":"\u039F","\u038E":"\u03A5","\u03AB":"\u03A5","\u038F":"\u03A9","\u03AC":"\u03B1","\u03AD":"\u03B5","\u03AE":"\u03B7","\u03AF":"\u03B9","\u03CA":"\u03B9","\u0390":"\u03B9","\u03CC":"\u03BF","\u03CD":"\u03C5","\u03CB":"\u03C5","\u03B0":"\u03C5","\u03C9":"\u03C9","\u03C2":"\u03C3"};

  $document = $(document);

  nextUid=(function() { var counter=1; return function() { return counter++; }; }());


  function reinsertElement(element) {
      var placeholder = $(document.createTextNode(''));

      element.before(placeholder);
      placeholder.before(element);
      placeholder.remove();
  }

  function stripDiacritics(str) {
      // Used 'uni range + named function' from http://jsperf.com/diacritics/18
      function match(a) {
          return DIACRITICS[a] || a;
      }

      return str.replace(/[^\u0000-\u007E]/g, match);
  }

  function indexOf(value, array) {
      var i = 0, l = array.length;
      for (; i < l; i = i + 1) {
          if (equal(value, array[i])) return i;
      }
      return -1;
  }

  function measureScrollbar () {
      var $template = $( MEASURE_SCROLLBAR_TEMPLATE );
      $template.appendTo(document.body);

      var dim = {
          width: $template.width() - $template[0].clientWidth,
          height: $template.height() - $template[0].clientHeight
      };
      $template.remove();

      return dim;
  }

  /**
   * Compares equality of a and b
   * @param a
   * @param b
   */
  function equal(a, b) {
      if (a === b) return true;
      if (a === undefined || b === undefined) return false;
      if (a === null || b === null) return false;
      // Check whether 'a' or 'b' is a string (primitive or object).
      // The concatenation of an empty string (+'') converts its argument to a string's primitive.
      if (a.constructor === String) return a+'' === b+''; // a+'' - in case 'a' is a String object
      if (b.constructor === String) return b+'' === a+''; // b+'' - in case 'b' is a String object
      return false;
  }

  /**
   * Splits the string into an array of values, transforming each value. An empty array is returned for nulls or empty
   * strings
   * @param string
   * @param separator
   */
  function splitVal(string, separator, transform) {
      var val, i, l;
      if (string === null || string.length < 1) return [];
      val = string.split(separator);
      for (i = 0, l = val.length; i < l; i = i + 1) val[i] = transform(val[i]);
      return val;
  }

  function getSideBorderPadding(element) {
      return element.outerWidth(false) - element.width();
  }

  function installKeyUpChangeEvent(element) {
      var key="keyup-change-value";
      element.on("keydown", function () {
          if ($.data(element, key) === undefined) {
              $.data(element, key, element.val());
          }
      });
      element.on("keyup", function () {
          var val= $.data(element, key);
          if (val !== undefined && element.val() !== val) {
              $.removeData(element, key);
              element.trigger("keyup-change");
          }
      });
  }


  /**
   * filters mouse events so an event is fired only if the mouse moved.
   *
   * filters out mouse events that occur when mouse is stationary but
   * the elements under the pointer are scrolled.
   */
  function installFilteredMouseMove(element) {
      element.on("mousemove", function (e) {
          var lastpos = lastMousePosition;
          if (lastpos === undefined || lastpos.x !== e.pageX || lastpos.y !== e.pageY) {
              $(e.target).trigger("mousemove-filtered", e);
          }
      });
  }

  /**
   * Debounces a function. Returns a function that calls the original fn function only if no invocations have been made
   * within the last quietMillis milliseconds.
   *
   * @param quietMillis number of milliseconds to wait before invoking fn
   * @param fn function to be debounced
   * @param ctx object to be used as this reference within fn
   * @return debounced version of fn
   */
  function debounce(quietMillis, fn, ctx) {
      ctx = ctx || undefined;
      var timeout;
      return function () {
          var args = arguments;
          window.clearTimeout(timeout);
          timeout = window.setTimeout(function() {
              fn.apply(ctx, args);
          }, quietMillis);
      };
  }

  function installDebouncedScroll(threshold, element) {
      var notify = debounce(threshold, function (e) { element.trigger("scroll-debounced", e);});
      element.on("scroll", function (e) {
          if (indexOf(e.target, element.get()) >= 0) notify(e);
      });
  }

  function focus($el) {
      if ($el[0] === document.activeElement) return;

      /* set the focus in a 0 timeout - that way the focus is set after the processing
          of the current event has finished - which seems like the only reliable way
          to set focus */
      window.setTimeout(function() {
          var el=$el[0], pos=$el.val().length, range;

          $el.focus();

          /* make sure el received focus so we do not error out when trying to manipulate the caret.
              sometimes modals or others listeners may steal it after its set */
          var isVisible = (el.offsetWidth > 0 || el.offsetHeight > 0);
          if (isVisible && el === document.activeElement) {

              /* after the focus is set move the caret to the end, necessary when we val()
                  just before setting focus */
              if(el.setSelectionRange)
              {
                  el.setSelectionRange(pos, pos);
              }
              else if (el.createTextRange) {
                  range = el.createTextRange();
                  range.collapse(false);
                  range.select();
              }
          }
      }, 0);
  }

  function getCursorInfo(el) {
      el = $(el)[0];
      var offset = 0;
      var length = 0;
      if ('selectionStart' in el) {
          offset = el.selectionStart;
          length = el.selectionEnd - offset;
      } else if ('selection' in document) {
          el.focus();
          var sel = document.selection.createRange();
          length = document.selection.createRange().text.length;
          sel.moveStart('character', -el.value.length);
          offset = sel.text.length - length;
      }
      return { offset: offset, length: length };
  }

  function killEvent(event) {
      event.preventDefault();
      event.stopPropagation();
  }
  function killEventImmediately(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
  }

  function measureTextWidth(e) {
      if (!sizer){
          var style = e[0].currentStyle || window.getComputedStyle(e[0], null);
          sizer = $(document.createElement("div")).css({
              position: "absolute",
              left: "-10000px",
              top: "-10000px",
              display: "none",
              fontSize: style.fontSize,
              fontFamily: style.fontFamily,
              fontStyle: style.fontStyle,
              fontWeight: style.fontWeight,
              letterSpacing: style.letterSpacing,
              textTransform: style.textTransform,
              whiteSpace: "nowrap"
          });
          sizer.attr("class","select2-sizer");
          $(document.body).append(sizer);
      }
      sizer.text(e.val());
      return sizer.width();
  }

  function syncCssClasses(dest, src, adapter) {
      var classes, replacements = [], adapted;

      classes = $.trim(dest.attr("class"));

      if (classes) {
          classes = '' + classes; // for IE which returns object

          $(classes.split(/\s+/)).each2(function() {
              if (this.indexOf("select2-") === 0) {
                  replacements.push(this);
              }
          });
      }

      classes = $.trim(src.attr("class"));

      if (classes) {
          classes = '' + classes; // for IE which returns object

          $(classes.split(/\s+/)).each2(function() {
              if (this.indexOf("select2-") !== 0) {
                  adapted = adapter(this);

                  if (adapted) {
                      replacements.push(adapted);
                  }
              }
          });
      }

      dest.attr("class", replacements.join(" "));
  }


  function markMatch(text, term, markup, escapeMarkup) {
      var match=stripDiacritics(text.toUpperCase()).indexOf(stripDiacritics(term.toUpperCase())),
          tl=term.length;

      if (match<0) {
          markup.push(escapeMarkup(text));
          return;
      }

      markup.push(escapeMarkup(text.substring(0, match)));
      markup.push("<span class='select2-match'>");
      markup.push(escapeMarkup(text.substring(match, match + tl)));
      markup.push("</span>");
      markup.push(escapeMarkup(text.substring(match + tl, text.length)));
  }

  function defaultEscapeMarkup(markup) {
      var replace_map = {
          '\\': '&#92;',
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
          "/": '&#47;'
      };

      return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
          return replace_map[match];
      });
  }

  /**
   * Produces an ajax-based query function
   *
   * @param options object containing configuration parameters
   * @param options.params parameter map for the transport ajax call, can contain such options as cache, jsonpCallback, etc. see $.ajax
   * @param options.transport function that will be used to execute the ajax request. must be compatible with parameters supported by $.ajax
   * @param options.url url for the data
   * @param options.data a function(searchTerm, pageNumber, context) that should return an object containing query string parameters for the above url.
   * @param options.dataType request data type: ajax, jsonp, other datatypes supported by jQuery's $.ajax function or the transport function if specified
   * @param options.quietMillis (optional) milliseconds to wait before making the ajaxRequest, helps debounce the ajax function if invoked too often
   * @param options.results a function(remoteData, pageNumber, query) that converts data returned form the remote request to the format expected by Select2.
   *      The expected format is an object containing the following keys:
   *      results array of objects that will be used as choices
   *      more (optional) boolean indicating whether there are more results available
   *      Example: {results:[{id:1, text:'Red'},{id:2, text:'Blue'}], more:true}
   */
  function ajax(options) {
      var timeout, // current scheduled but not yet executed request
          handler = null,
          quietMillis = options.quietMillis || 100,
          ajaxUrl = options.url,
          self = this;

      return function (query) {
          window.clearTimeout(timeout);
          timeout = window.setTimeout(function () {
              var data = options.data, // ajax data function
                  url = ajaxUrl, // ajax url string or function
                  transport = options.transport || $.fn.select2.ajaxDefaults.transport,
                  // deprecated - to be removed in 4.0  - use params instead
                  deprecated = {
                      type: options.type || 'GET', // set type of request (GET or POST)
                      cache: options.cache || false,
                      jsonpCallback: options.jsonpCallback||undefined,
                      dataType: options.dataType||"json"
                  },
                  params = $.extend({}, $.fn.select2.ajaxDefaults.params, deprecated);

              data = data ? data.call(self, query.term, query.page, query.context) : null;
              url = (typeof url === 'function') ? url.call(self, query.term, query.page, query.context) : url;

              if (handler && typeof handler.abort === "function") { handler.abort(); }

              if (options.params) {
                  if ($.isFunction(options.params)) {
                      $.extend(params, options.params.call(self));
                  } else {
                      $.extend(params, options.params);
                  }
              }

              $.extend(params, {
                  url: url,
                  dataType: options.dataType,
                  data: data,
                  success: function (data) {
                      // TODO - replace query.page with query so users have access to term, page, etc.
                      // added query as third paramter to keep backwards compatibility
                      var results = options.results(data, query.page, query);
                      query.callback(results);
                  },
                  error: function(jqXHR, textStatus, errorThrown){
                      var results = {
                          hasError: true,
                          jqXHR: jqXHR,
                          textStatus: textStatus,
                          errorThrown: errorThrown
                      };

                      query.callback(results);
                  }
              });
              handler = transport.call(self, params);
          }, quietMillis);
      };
  }

  /**
   * Produces a query function that works with a local array
   *
   * @param options object containing configuration parameters. The options parameter can either be an array or an
   * object.
   *
   * If the array form is used it is assumed that it contains objects with 'id' and 'text' keys.
   *
   * If the object form is used it is assumed that it contains 'data' and 'text' keys. The 'data' key should contain
   * an array of objects that will be used as choices. These objects must contain at least an 'id' key. The 'text'
   * key can either be a String in which case it is expected that each element in the 'data' array has a key with the
   * value of 'text' which will be used to match choices. Alternatively, text can be a function(item) that can extract
   * the text.
   */
  function local(options) {
      var data = options, // data elements
          dataText,
          tmp,
          text = function (item) { return ""+item.text; }; // function used to retrieve the text portion of a data item that is matched against the search

       if ($.isArray(data)) {
          tmp = data;
          data = { results: tmp };
      }

       if ($.isFunction(data) === false) {
          tmp = data;
          data = function() { return tmp; };
      }

      var dataItem = data();
      if (dataItem.text) {
          text = dataItem.text;
          // if text is not a function we assume it to be a key name
          if (!$.isFunction(text)) {
              dataText = dataItem.text; // we need to store this in a separate variable because in the next step data gets reset and data.text is no longer available
              text = function (item) { return item[dataText]; };
          }
      }

      return function (query) {
          var t = query.term, filtered = { results: [] }, process;
          if (t === "") {
              query.callback(data());
              return;
          }

          process = function(datum, collection) {
              var group, attr;
              datum = datum[0];
              if (datum.children) {
                  group = {};
                  for (attr in datum) {
                      if (datum.hasOwnProperty(attr)) group[attr]=datum[attr];
                  }
                  group.children=[];
                  $(datum.children).each2(function(i, childDatum) { process(childDatum, group.children); });
                  if (group.children.length || query.matcher(t, text(group), datum)) {
                      collection.push(group);
                  }
              } else {
                  if (query.matcher(t, text(datum), datum)) {
                      collection.push(datum);
                  }
              }
          };

          $(data().results).each2(function(i, datum) { process(datum, filtered.results); });
          query.callback(filtered);
      };
  }

  // TODO javadoc
  function tags(data) {
      var isFunc = $.isFunction(data);
      return function (query) {
          var t = query.term, filtered = {results: []};
          var result = isFunc ? data(query) : data;
          if ($.isArray(result)) {
              $(result).each(function () {
                  var isObject = this.text !== undefined,
                      text = isObject ? this.text : this;
                  if (t === "" || query.matcher(t, text)) {
                      filtered.results.push(isObject ? this : {id: this, text: this});
                  }
              });
              query.callback(filtered);
          }
      };
  }

  /**
   * Checks if the formatter function should be used.
   *
   * Throws an error if it is not a function. Returns true if it should be used,
   * false if no formatting should be performed.
   *
   * @param formatter
   */
  function checkFormatter(formatter, formatterName) {
      if ($.isFunction(formatter)) return true;
      if (!formatter) return false;
      if (typeof(formatter) === 'string') return true;
      throw new Error(formatterName +" must be a string, function, or falsy value");
  }

/**
 * Returns a given value
 * If given a function, returns its output
 *
 * @param val string|function
 * @param context value of "this" to be passed to function
 * @returns {*}
 */
  function evaluate(val, context) {
      if ($.isFunction(val)) {
          var args = Array.prototype.slice.call(arguments, 2);
          return val.apply(context, args);
      }
      return val;
  }

  function countResults(results) {
      var count = 0;
      $.each(results, function(i, item) {
          if (item.children) {
              count += countResults(item.children);
          } else {
              count++;
          }
      });
      return count;
  }

  /**
   * Default tokenizer. This function uses breaks the input on substring match of any string from the
   * opts.tokenSeparators array and uses opts.createSearchChoice to create the choice object. Both of those
   * two options have to be defined in order for the tokenizer to work.
   *
   * @param input text user has typed so far or pasted into the search field
   * @param selection currently selected choices
   * @param selectCallback function(choice) callback tho add the choice to selection
   * @param opts select2's opts
   * @return undefined/null to leave the current input unchanged, or a string to change the input to the returned value
   */
  function defaultTokenizer(input, selection, selectCallback, opts) {
      var original = input, // store the original so we can compare and know if we need to tell the search to update its text
          dupe = false, // check for whether a token we extracted represents a duplicate selected choice
          token, // token
          index, // position at which the separator was found
          i, l, // looping variables
          separator; // the matched separator

      if (!opts.createSearchChoice || !opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;

      while (true) {
          index = -1;

          for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
              separator = opts.tokenSeparators[i];
              index = input.indexOf(separator);
              if (index >= 0) break;
          }

          if (index < 0) break; // did not find any token separator in the input string, bail

          token = input.substring(0, index);
          input = input.substring(index + separator.length);

          if (token.length > 0) {
              token = opts.createSearchChoice.call(this, token, selection);
              if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
                  dupe = false;
                  for (i = 0, l = selection.length; i < l; i++) {
                      if (equal(opts.id(token), opts.id(selection[i]))) {
                          dupe = true; break;
                      }
                  }

                  if (!dupe) selectCallback(token);
              }
          }
      }

      if (original!==input) return input;
  }

  function cleanupJQueryElements() {
      var self = this;

      $.each(arguments, function (i, element) {
          self[element].remove();
          self[element] = null;
      });
  }

  /**
   * Creates a new class
   *
   * @param superClass
   * @param methods
   */
  function clazz(SuperClass, methods) {
      var constructor = function () {};
      constructor.prototype = new SuperClass;
      constructor.prototype.constructor = constructor;
      constructor.prototype.parent = SuperClass.prototype;
      constructor.prototype = $.extend(constructor.prototype, methods);
      return constructor;
  }

  AbstractSelect2 = clazz(Object, {

      // abstract
      bind: function (func) {
          var self = this;
          return function () {
              func.apply(self, arguments);
          };
      },

      // abstract
      init: function (opts) {
          var results, search, resultsSelector = ".select2-results";

          // prepare options
          this.opts = opts = this.prepareOpts(opts);

          this.id=opts.id;

          // destroy if called on an existing component
          if (opts.element.data("select2") !== undefined &&
              opts.element.data("select2") !== null) {
              opts.element.data("select2").destroy();
          }

          this.container = this.createContainer();

          this.liveRegion = $('.select2-hidden-accessible');
          if (this.liveRegion.length == 0) {
              this.liveRegion = $("<span>", {
                      role: "status",
                      "aria-live": "polite"
                  })
                  .addClass("select2-hidden-accessible")
                  .appendTo(document.body);
          }

          this.containerId="s2id_"+(opts.element.attr("id") || "autogen"+nextUid());
          this.containerEventName= this.containerId
              .replace(/([.])/g, '_')
              .replace(/([;&,\-\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
          this.container.attr("id", this.containerId);

          this.container.attr("title", opts.element.attr("title"));

          this.body = $(document.body);

          syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);

          this.container.attr("style", opts.element.attr("style"));
          this.container.css(evaluate(opts.containerCss, this.opts.element));
          this.container.addClass(evaluate(opts.containerCssClass, this.opts.element));

          this.elementTabIndex = this.opts.element.attr("tabindex");

          // swap container for the element
          this.opts.element
              .data("select2", this)
              .attr("tabindex", "-1")
              .before(this.container)
              .on("click.select2", killEvent); // do not leak click events

          this.container.data("select2", this);

          this.dropdown = this.container.find(".select2-drop");

          syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);

          this.dropdown.addClass(evaluate(opts.dropdownCssClass, this.opts.element));
          this.dropdown.data("select2", this);
          this.dropdown.on("click", killEvent);

          this.results = results = this.container.find(resultsSelector);
          this.search = search = this.container.find("input.select2-input");

          this.queryCount = 0;
          this.resultsPage = 0;
          this.context = null;

          // initialize the container
          this.initContainer();

          this.container.on("click", killEvent);

          installFilteredMouseMove(this.results);

          this.dropdown.on("mousemove-filtered", resultsSelector, this.bind(this.highlightUnderEvent));
          this.dropdown.on("touchstart touchmove touchend", resultsSelector, this.bind(function (event) {
              this._touchEvent = true;
              this.highlightUnderEvent(event);
          }));
          this.dropdown.on("touchmove", resultsSelector, this.bind(this.touchMoved));
          this.dropdown.on("touchstart touchend", resultsSelector, this.bind(this.clearTouchMoved));

          // Waiting for a click event on touch devices to select option and hide dropdown
          // otherwise click will be triggered on an underlying element
          this.dropdown.on('click', this.bind(function (event) {
              if (this._touchEvent) {
                  this._touchEvent = false;
                  this.selectHighlighted();
              }
          }));

          installDebouncedScroll(80, this.results);
          this.dropdown.on("scroll-debounced", resultsSelector, this.bind(this.loadMoreIfNeeded));

          // do not propagate change event from the search field out of the component
          $(this.container).on("change", ".select2-input", function(e) {e.stopPropagation();});
          $(this.dropdown).on("change", ".select2-input", function(e) {e.stopPropagation();});

          // if jquery.mousewheel plugin is installed we can prevent out-of-bounds scrolling of results via mousewheel
          if ($.fn.mousewheel) {
              results.mousewheel(function (e, delta, deltaX, deltaY) {
                  var top = results.scrollTop();
                  if (deltaY > 0 && top - deltaY <= 0) {
                      results.scrollTop(0);
                      killEvent(e);
                  } else if (deltaY < 0 && results.get(0).scrollHeight - results.scrollTop() + deltaY <= results.height()) {
                      results.scrollTop(results.get(0).scrollHeight - results.height());
                      killEvent(e);
                  }
              });
          }

          installKeyUpChangeEvent(search);
          search.on("keyup-change input paste", this.bind(this.updateResults));
          search.on("focus", function () { search.addClass("select2-focused"); });
          search.on("blur", function () { search.removeClass("select2-focused");});

          this.dropdown.on("mouseup", resultsSelector, this.bind(function (e) {
              if ($(e.target).closest(".select2-result-selectable").length > 0) {
                  this.highlightUnderEvent(e);
                  this.selectHighlighted(e);
              }
          }));

          // trap all mouse events from leaving the dropdown. sometimes there may be a modal that is listening
          // for mouse events outside of itself so it can close itself. since the dropdown is now outside the select2's
          // dom it will trigger the popup close, which is not what we want
          // focusin can cause focus wars between modals and select2 since the dropdown is outside the modal.
          this.dropdown.on("click mouseup mousedown touchstart touchend focusin", function (e) { e.stopPropagation(); });

          this.lastSearchTerm = undefined;

          if ($.isFunction(this.opts.initSelection)) {
              // initialize selection based on the current value of the source element
              this.initSelection();

              // if the user has provided a function that can set selection based on the value of the source element
              // we monitor the change event on the element and trigger it, allowing for two way synchronization
              this.monitorSource();
          }

          if (opts.maximumInputLength !== null) {
              this.search.attr("maxlength", opts.maximumInputLength);
          }

          var disabled = opts.element.prop("disabled");
          if (disabled === undefined) disabled = false;
          this.enable(!disabled);

          var readonly = opts.element.prop("readonly");
          if (readonly === undefined) readonly = false;
          this.readonly(readonly);

          // Calculate size of scrollbar
          scrollBarDimensions = scrollBarDimensions || measureScrollbar();

          this.autofocus = opts.element.prop("autofocus");
          opts.element.prop("autofocus", false);
          if (this.autofocus) this.focus();

          this.search.attr("placeholder", opts.searchInputPlaceholder);
      },

      // abstract
      destroy: function () {
          var element=this.opts.element, select2 = element.data("select2"), self = this;

          this.close();

          if (element.length && element[0].detachEvent && self._sync) {
              element.each(function () {
                  if (self._sync) {
                      this.detachEvent("onpropertychange", self._sync);
                  }
              });
          }
          if (this.propertyObserver) {
              this.propertyObserver.disconnect();
              this.propertyObserver = null;
          }
          this._sync = null;

          if (select2 !== undefined) {
              select2.container.remove();
              select2.liveRegion.remove();
              select2.dropdown.remove();
              element.removeData("select2")
                  .off(".select2");
              if (!element.is("input[type='hidden']")) {
                  element
                      .show()
                      .prop("autofocus", this.autofocus || false);
                  if (this.elementTabIndex) {
                      element.attr({tabindex: this.elementTabIndex});
                  } else {
                      element.removeAttr("tabindex");
                  }
                  element.show();
              } else {
                  element.css("display", "");
              }
          }

          cleanupJQueryElements.call(this,
              "container",
              "liveRegion",
              "dropdown",
              "results",
              "search"
          );
      },

      // abstract
      optionToData: function(element) {
          if (element.is("option")) {
              return {
                  id:element.prop("value"),
                  text:element.text(),
                  element: element.get(),
                  css: element.attr("class"),
                  disabled: element.prop("disabled"),
                  locked: equal(element.attr("locked"), "locked") || equal(element.data("locked"), true)
              };
          } else if (element.is("optgroup")) {
              return {
                  text:element.attr("label"),
                  children:[],
                  element: element.get(),
                  css: element.attr("class")
              };
          }
      },

      // abstract
      prepareOpts: function (opts) {
          var element, select, idKey, ajaxUrl, self = this;

          element = opts.element;

          if (element.get(0).tagName.toLowerCase() === "select") {
              this.select = select = opts.element;
          }

          if (select) {
              // these options are not allowed when attached to a select because they are picked up off the element itself
              // $.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
              $.each(["id", "multiple", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
                  if (this in opts) {
                      throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.");
                  }
              });
          }

          opts.debug = opts.debug || $.fn.select2.defaults.debug;

          // Warnings for options renamed/removed in Select2 4.0.0
          // Only when it's enabled through debug mode
          if (opts.debug && console && console.warn) {
              // id was removed
              if (opts.id != null) {
                  console.warn(
                      'Select2: The `id` option has been removed in Select2 4.0.0, ' +
                      'consider renaming your `id` property or mapping the property before your data makes it to Select2. ' +
                      'You can read more at https://select2.github.io/announcements-4.0.html#changed-id'
                  );
              }

              // text was removed
              if (opts.text != null) {
                  console.warn(
                      'Select2: The `text` option has been removed in Select2 4.0.0, ' +
                      'consider renaming your `text` property or mapping the property before your data makes it to Select2. ' +
                      'You can read more at https://select2.github.io/announcements-4.0.html#changed-id'
                  );
              }

              // sortResults was renamed to results
              if (opts.sortResults != null) {
                  console.warn(
                      'Select2: the `sortResults` option has been renamed to `sorter` in Select2 4.0.0. '
                  );
              }

              // selectOnBlur was renamed to selectOnClose
              if (opts.selectOnBlur != null) {
                  console.warn(
                      'Select2: The `selectOnBlur` option has been renamed to `selectOnClose` in Select2 4.0.0.'
                  );
              }

              // ajax.results was renamed to ajax.processResults
              if (opts.ajax != null && opts.ajax.results != null) {
                  console.warn(
                      'Select2: The `ajax.results` option has been renamed to `ajax.processResults` in Select2 4.0.0.'
                  );
              }

              // format* options were renamed to language.*
              if (opts.formatNoResults != null) {
                  console.warn(
                      'Select2: The `formatNoResults` option has been renamed to `language.noResults` in Select2 4.0.0.'
                  );
              }
              if (opts.formatSearching != null) {
                  console.warn(
                      'Select2: The `formatSearching` option has been renamed to `language.searching` in Select2 4.0.0.'
                  );
              }
              if (opts.formatInputTooShort != null) {
                  console.warn(
                      'Select2: The `formatInputTooShort` option has been renamed to `language.inputTooShort` in Select2 4.0.0.'
                  );
              }
              if (opts.formatInputTooLong != null) {
                  console.warn(
                      'Select2: The `formatInputTooLong` option has been renamed to `language.inputTooLong` in Select2 4.0.0.'
                  );
              }
              if (opts.formatLoading != null) {
                  console.warn(
                      'Select2: The `formatLoading` option has been renamed to `language.loadingMore` in Select2 4.0.0.'
                  );
              }
              if (opts.formatSelectionTooBig != null) {
                  console.warn(
                      'Select2: The `formatSelectionTooBig` option has been renamed to `language.maximumSelected` in Select2 4.0.0.'
                  );
              }

              if (opts.element.data('select2Tags')) {
                  console.warn(
                      'Select2: The `data-select2-tags` attribute has been renamed to `data-tags` in Select2 4.0.0.'
                  );
              }
          }

          // Aliasing options renamed in Select2 4.0.0

          // data-select2-tags -> data-tags
          if (opts.element.data('tags') != null) {
              var elemTags = opts.element.data('tags');

              // data-tags should actually be a boolean
              if (!$.isArray(elemTags)) {
                  elemTags = [];
              }

              opts.element.data('select2Tags', elemTags);
          }

          // sortResults -> sorter
          if (opts.sorter != null) {
              opts.sortResults = opts.sorter;
          }

          // selectOnBlur -> selectOnClose
          if (opts.selectOnClose != null) {
              opts.selectOnBlur = opts.selectOnClose;
          }

          // ajax.results -> ajax.processResults
          if (opts.ajax != null) {
              if ($.isFunction(opts.ajax.processResults)) {
                  opts.ajax.results = opts.ajax.processResults;
              }
          }

          // Formatters/language options
          if (opts.language != null) {
              var lang = opts.language;

              // formatNoMatches -> language.noMatches
              if ($.isFunction(lang.noMatches)) {
                  opts.formatNoMatches = lang.noMatches;
              }

              // formatSearching -> language.searching
              if ($.isFunction(lang.searching)) {
                  opts.formatSearching = lang.searching;
              }

              // formatInputTooShort -> language.inputTooShort
              if ($.isFunction(lang.inputTooShort)) {
                  opts.formatInputTooShort = lang.inputTooShort;
              }

              // formatInputTooLong -> language.inputTooLong
              if ($.isFunction(lang.inputTooLong)) {
                  opts.formatInputTooLong = lang.inputTooLong;
              }

              // formatLoading -> language.loadingMore
              if ($.isFunction(lang.loadingMore)) {
                  opts.formatLoading = lang.loadingMore;
              }

              // formatSelectionTooBig -> language.maximumSelected
              if ($.isFunction(lang.maximumSelected)) {
                  opts.formatSelectionTooBig = lang.maximumSelected;
              }
          }

          opts = $.extend({}, {
              populateResults: function(container, results, query) {
                  var populate, id=this.opts.id, liveRegion=this.liveRegion;

                  populate=function(results, container, depth) {

                      var i, l, result, selectable, disabled, compound, node, label, innerContainer, formatted;

                      results = opts.sortResults(results, container, query);

                      // collect the created nodes for bulk append
                      var nodes = [];
                      for (i = 0, l = results.length; i < l; i = i + 1) {

                          result=results[i];

                          disabled = (result.disabled === true);
                          selectable = (!disabled) && (id(result) !== undefined);

                          compound=result.children && result.children.length > 0;

                          node=$("<li></li>");
                          node.addClass("select2-results-dept-"+depth);
                          node.addClass("select2-result");
                          node.addClass(selectable ? "select2-result-selectable" : "select2-result-unselectable");
                          if (disabled) { node.addClass("select2-disabled"); }
                          if (compound) { node.addClass("select2-result-with-children"); }
                          node.addClass(self.opts.formatResultCssClass(result));
                          node.attr("role", "presentation");

                          label=$(document.createElement("div"));
                          label.addClass("select2-result-label");
                          label.attr("id", "select2-result-label-" + nextUid());
                          label.attr("role", "option");

                          formatted=opts.formatResult(result, label, query, self.opts.escapeMarkup);
                          if (formatted!==undefined) {
                              label.html(formatted);
                              node.append(label);
                          }


                          if (compound) {
                              innerContainer=$("<ul></ul>");
                              innerContainer.addClass("select2-result-sub");
                              populate(result.children, innerContainer, depth+1);
                              node.append(innerContainer);
                          }

                          node.data("select2-data", result);
                          nodes.push(node[0]);
                      }

                      // bulk append the created nodes
                      container.append(nodes);
                      liveRegion.text(opts.formatMatches(results.length));
                  };

                  populate(results, container, 0);
              }
          }, $.fn.select2.defaults, opts);

          if (typeof(opts.id) !== "function") {
              idKey = opts.id;
              opts.id = function (e) { return e[idKey]; };
          }

          if ($.isArray(opts.element.data("select2Tags"))) {
              if ("tags" in opts) {
                  throw "tags specified as both an attribute 'data-select2-tags' and in options of Select2 " + opts.element.attr("id");
              }
              opts.tags=opts.element.data("select2Tags");
          }

          if (select) {
              opts.query = this.bind(function (query) {
                  var data = { results: [], more: false },
                      term = query.term,
                      children, placeholderOption, process;

                  process=function(element, collection) {
                      var group;
                      if (element.is("option")) {
                          if (query.matcher(term, element.text(), element)) {
                              collection.push(self.optionToData(element));
                          }
                      } else if (element.is("optgroup")) {
                          group=self.optionToData(element);
                          element.children().each2(function(i, elm) { process(elm, group.children); });
                          if (group.children.length>0) {
                              collection.push(group);
                          }
                      }
                  };

                  children=element.children();

                  // ignore the placeholder option if there is one
                  if (this.getPlaceholder() !== undefined && children.length > 0) {
                      placeholderOption = this.getPlaceholderOption();
                      if (placeholderOption) {
                          children=children.not(placeholderOption);
                      }
                  }

                  children.each2(function(i, elm) { process(elm, data.results); });

                  query.callback(data);
              });
              // this is needed because inside val() we construct choices from options and their id is hardcoded
              opts.id=function(e) { return e.id; };
          } else {
              if (!("query" in opts)) {
                  if ("ajax" in opts) {
                      ajaxUrl = opts.element.data("ajax-url");
                      if (ajaxUrl && ajaxUrl.length > 0) {
                          opts.ajax.url = ajaxUrl;
                      }
                      opts.query = ajax.call(opts.element, opts.ajax);
                  } else if ("data" in opts) {
                      opts.query = local(opts.data);
                  } else if ("tags" in opts) {
                      opts.query = tags(opts.tags);
                      if (opts.createSearchChoice === undefined) {
                          opts.createSearchChoice = function (term) { return {id: $.trim(term), text: $.trim(term)}; };
                      }
                      if (opts.initSelection === undefined) {
                          opts.initSelection = function (element, callback) {
                              var data = [];
                              $(splitVal(element.val(), opts.separator, opts.transformVal)).each(function () {
                                  var obj = { id: this, text: this },
                                      tags = opts.tags;
                                  if ($.isFunction(tags)) tags=tags();
                                  $(tags).each(function() { if (equal(this.id, obj.id)) { obj = this; return false; } });
                                  data.push(obj);
                              });

                              callback(data);
                          };
                      }
                  }
              }
          }
          if (typeof(opts.query) !== "function") {
              throw "query function not defined for Select2 " + opts.element.attr("id");
          }

          if (opts.createSearchChoicePosition === 'top') {
              opts.createSearchChoicePosition = function(list, item) { list.unshift(item); };
          }
          else if (opts.createSearchChoicePosition === 'bottom') {
              opts.createSearchChoicePosition = function(list, item) { list.push(item); };
          }
          else if (typeof(opts.createSearchChoicePosition) !== "function")  {
              throw "invalid createSearchChoicePosition option must be 'top', 'bottom' or a custom function";
          }

          return opts;
      },

      /**
       * Monitor the original element for changes and update select2 accordingly
       */
      // abstract
      monitorSource: function () {
          var el = this.opts.element, observer, self = this;

          el.on("change.select2", this.bind(function (e) {
              if (this.opts.element.data("select2-change-triggered") !== true) {
                  this.initSelection();
              }
          }));

          this._sync = this.bind(function () {

              // sync enabled state
              var disabled = el.prop("disabled");
              if (disabled === undefined) disabled = false;
              this.enable(!disabled);

              var readonly = el.prop("readonly");
              if (readonly === undefined) readonly = false;
              this.readonly(readonly);

              if (this.container) {
                  syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);
                  this.container.addClass(evaluate(this.opts.containerCssClass, this.opts.element));
              }

              if (this.dropdown) {
                  syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);
                  this.dropdown.addClass(evaluate(this.opts.dropdownCssClass, this.opts.element));
              }

          });

          // IE8-10 (IE9/10 won't fire propertyChange via attachEventListener)
          if (el.length && el[0].attachEvent) {
              el.each(function() {
                  this.attachEvent("onpropertychange", self._sync);
              });
          }

          // safari, chrome, firefox, IE11
          observer = window.MutationObserver || window.WebKitMutationObserver|| window.MozMutationObserver;
          if (observer !== undefined) {
              if (this.propertyObserver) { delete this.propertyObserver; this.propertyObserver = null; }
              this.propertyObserver = new observer(function (mutations) {
                  $.each(mutations, self._sync);
              });
              this.propertyObserver.observe(el.get(0), { attributes:true, subtree:false });
          }
      },

      // abstract
      triggerSelect: function(data) {
          var evt = $.Event("select2-selecting", { val: this.id(data), object: data, choice: data });
          this.opts.element.trigger(evt);
          return !evt.isDefaultPrevented();
      },

      /**
       * Triggers the change event on the source element
       */
      // abstract
      triggerChange: function (details) {

          details = details || {};
          details= $.extend({}, details, { type: "change", val: this.val() });
          // prevents recursive triggering
          this.opts.element.data("select2-change-triggered", true);
          this.opts.element.trigger(details);
          this.opts.element.data("select2-change-triggered", false);

          // some validation frameworks ignore the change event and listen instead to keyup, click for selects
          // so here we trigger the click event manually
          this.opts.element.click();

          // ValidationEngine ignores the change event and listens instead to blur
          // so here we trigger the blur event manually if so desired
          if (this.opts.blurOnChange)
              this.opts.element.blur();
      },

      //abstract
      isInterfaceEnabled: function()
      {
          return this.enabledInterface === true;
      },

      // abstract
      enableInterface: function() {
          var enabled = this._enabled && !this._readonly,
              disabled = !enabled;

          if (enabled === this.enabledInterface) return false;

          this.container.toggleClass("select2-container-disabled", disabled);
          this.close();
          this.enabledInterface = enabled;

          return true;
      },

      // abstract
      enable: function(enabled) {
          if (enabled === undefined) enabled = true;
          if (this._enabled === enabled) return;
          this._enabled = enabled;

          this.opts.element.prop("disabled", !enabled);
          this.enableInterface();
      },

      // abstract
      disable: function() {
          this.enable(false);
      },

      // abstract
      readonly: function(enabled) {
          if (enabled === undefined) enabled = false;
          if (this._readonly === enabled) return;
          this._readonly = enabled;

          this.opts.element.prop("readonly", enabled);
          this.enableInterface();
      },

      // abstract
      opened: function () {
          return (this.container) ? this.container.hasClass("select2-dropdown-open") : false;
      },

      // abstract
      positionDropdown: function() {
          var $dropdown = this.dropdown,
              container = this.container,
              offset = container.offset(),
              height = container.outerHeight(false),
              width = container.outerWidth(false),
              dropHeight = $dropdown.outerHeight(false),
              $window = $(window),
              windowWidth = $window.width(),
              windowHeight = $window.height(),
              viewPortRight = $window.scrollLeft() + windowWidth,
              viewportBottom = $window.scrollTop() + windowHeight,
              dropTop = offset.top + height,
              dropLeft = offset.left,
              enoughRoomBelow = dropTop + dropHeight <= viewportBottom,
              enoughRoomAbove = (offset.top - dropHeight) >= $window.scrollTop(),
              dropWidth = $dropdown.outerWidth(false),
              enoughRoomOnRight = function() {
                  return dropLeft + dropWidth <= viewPortRight;
              },
              enoughRoomOnLeft = function() {
                  return offset.left + viewPortRight + container.outerWidth(false)  > dropWidth;
              },
              aboveNow = $dropdown.hasClass("select2-drop-above"),
              bodyOffset,
              above,
              changeDirection,
              css,
              resultsListNode;

          // always prefer the current above/below alignment, unless there is not enough room
          if (aboveNow) {
              above = true;
              if (!enoughRoomAbove && enoughRoomBelow) {
                  changeDirection = true;
                  above = false;
              }
          } else {
              above = false;
              if (!enoughRoomBelow && enoughRoomAbove) {
                  changeDirection = true;
                  above = true;
              }
          }

          //if we are changing direction we need to get positions when dropdown is hidden;
          if (changeDirection) {
              $dropdown.hide();
              offset = this.container.offset();
              height = this.container.outerHeight(false);
              width = this.container.outerWidth(false);
              dropHeight = $dropdown.outerHeight(false);
              viewPortRight = $window.scrollLeft() + windowWidth;
              viewportBottom = $window.scrollTop() + windowHeight;
              dropTop = offset.top + height;
              dropLeft = offset.left;
              dropWidth = $dropdown.outerWidth(false);
              $dropdown.show();

              // fix so the cursor does not move to the left within the search-textbox in IE
              this.focusSearch();
          }

          if (this.opts.dropdownAutoWidth) {
              resultsListNode = $('.select2-results', $dropdown)[0];
              $dropdown.addClass('select2-drop-auto-width');
              $dropdown.css('width', '');
              // Add scrollbar width to dropdown if vertical scrollbar is present
              dropWidth = $dropdown.outerWidth(false) + (resultsListNode.scrollHeight === resultsListNode.clientHeight ? 0 : scrollBarDimensions.width);
              dropWidth > width ? width = dropWidth : dropWidth = width;
              dropHeight = $dropdown.outerHeight(false);
          }
          else {
              this.container.removeClass('select2-drop-auto-width');
          }

          //console.log("below/ droptop:", dropTop, "dropHeight", dropHeight, "sum", (dropTop+dropHeight)+" viewport bottom", viewportBottom, "enough?", enoughRoomBelow);
          //console.log("above/ offset.top", offset.top, "dropHeight", dropHeight, "top", (offset.top-dropHeight), "scrollTop", this.body.scrollTop(), "enough?", enoughRoomAbove);

          // fix positioning when body has an offset and is not position: static
          if (this.body.css('position') !== 'static') {
              bodyOffset = this.body.offset();
              dropTop -= bodyOffset.top;
              dropLeft -= bodyOffset.left;
          }

          if (!enoughRoomOnRight() && enoughRoomOnLeft()) {
              dropLeft = offset.left + this.container.outerWidth(false) - dropWidth;
          }

          css =  {
              left: dropLeft,
              width: width
          };

          if (above) {
              this.container.addClass("select2-drop-above");
              $dropdown.addClass("select2-drop-above");
              dropHeight = $dropdown.outerHeight(false);
              css.top = offset.top - dropHeight;
              css.bottom = 'auto';
          }
          else {
              css.top = dropTop;
              css.bottom = 'auto';
              this.container.removeClass("select2-drop-above");
              $dropdown.removeClass("select2-drop-above");
          }
          css = $.extend(css, evaluate(this.opts.dropdownCss, this.opts.element));

          $dropdown.css(css);
      },

      // abstract
      shouldOpen: function() {
          var event;

          if (this.opened()) return false;

          if (this._enabled === false || this._readonly === true) return false;

          event = $.Event("select2-opening");
          this.opts.element.trigger(event);
          return !event.isDefaultPrevented();
      },

      // abstract
      clearDropdownAlignmentPreference: function() {
          // clear the classes used to figure out the preference of where the dropdown should be opened
          this.container.removeClass("select2-drop-above");
          this.dropdown.removeClass("select2-drop-above");
      },

      /**
       * Opens the dropdown
       *
       * @return {Boolean} whether or not dropdown was opened. This method will return false if, for example,
       * the dropdown is already open, or if the 'open' event listener on the element called preventDefault().
       */
      // abstract
      open: function () {

          if (!this.shouldOpen()) return false;

          this.opening();

          // Only bind the document mousemove when the dropdown is visible
          $document.on("mousemove.select2Event", function (e) {
              lastMousePosition.x = e.pageX;
              lastMousePosition.y = e.pageY;
          });

          return true;
      },

      /**
       * Performs the opening of the dropdown
       */
      // abstract
      opening: function() {
          var cid = this.containerEventName,
              scroll = "scroll." + cid,
              resize = "resize."+cid,
              orient = "orientationchange."+cid,
              mask;

          this.container.addClass("select2-dropdown-open").addClass("select2-container-active");

          this.clearDropdownAlignmentPreference();

          if(this.dropdown[0] !== this.body.children().last()[0]) {
              this.dropdown.detach().appendTo(this.body);
          }

          // create the dropdown mask if doesn't already exist
          mask = $("#select2-drop-mask");
          if (mask.length === 0) {
              mask = $(document.createElement("div"));
              mask.attr("id","select2-drop-mask").attr("class","select2-drop-mask");
              mask.hide();
              mask.appendTo(this.body);
              mask.on("mousedown touchstart click", function (e) {
                  // Prevent IE from generating a click event on the body
                  reinsertElement(mask);

                  var dropdown = $("#select2-drop"), self;
                  if (dropdown.length > 0) {
                      self=dropdown.data("select2");
                      if (self.opts.selectOnBlur) {
                          self.selectHighlighted({noFocus: true});
                      }
                      self.close();
                      e.preventDefault();
                      e.stopPropagation();
                  }
              });
          }

          // ensure the mask is always right before the dropdown
          if (this.dropdown.prev()[0] !== mask[0]) {
              this.dropdown.before(mask);
          }

          // move the global id to the correct dropdown
          $("#select2-drop").removeAttr("id");
          this.dropdown.attr("id", "select2-drop");

          // show the elements
          mask.show();

          this.positionDropdown();
          this.dropdown.show();
          this.positionDropdown();

          this.dropdown.addClass("select2-drop-active");

          // attach listeners to events that can change the position of the container and thus require
          // the position of the dropdown to be updated as well so it does not come unglued from the container
          var that = this;
          this.container.parents().add(window).each(function () {
              $(this).on(resize+" "+scroll+" "+orient, function (e) {
                  if (that.opened()) that.positionDropdown();
              });
          });


      },

      // abstract
      close: function () {
          if (!this.opened()) return;

          var cid = this.containerEventName,
              scroll = "scroll." + cid,
              resize = "resize."+cid,
              orient = "orientationchange."+cid;

          // unbind event listeners
          this.container.parents().add(window).each(function () { $(this).off(scroll).off(resize).off(orient); });

          this.clearDropdownAlignmentPreference();

          $("#select2-drop-mask").hide();
          this.dropdown.removeAttr("id"); // only the active dropdown has the select2-drop id
          this.dropdown.hide();
          this.container.removeClass("select2-dropdown-open").removeClass("select2-container-active");
          this.results.empty();

          // Now that the dropdown is closed, unbind the global document mousemove event
          $document.off("mousemove.select2Event");

          this.clearSearch();
          this.search.removeClass("select2-active");

          // Remove the aria active descendant for highlighted element
          this.search.removeAttr("aria-activedescendant");
          this.opts.element.trigger($.Event("select2-close"));
      },

      /**
       * Opens control, sets input value, and updates results.
       */
      // abstract
      externalSearch: function (term) {
          this.open();
          this.search.val(term);
          this.updateResults(false);
      },

      // abstract
      clearSearch: function () {

      },

      /**
       * @return {Boolean} Whether or not search value was changed.
       * @private
       */
      prefillNextSearchTerm: function () {
          // initializes search's value with nextSearchTerm (if defined by user)
          // ignore nextSearchTerm if the dropdown is opened by the user pressing a letter
          if(this.search.val() !== "") {
              return false;
          }

          var nextSearchTerm = this.opts.nextSearchTerm(this.data(), this.lastSearchTerm);
          if(nextSearchTerm !== undefined){
              this.search.val(nextSearchTerm);
              this.search.select();
              return true;
          }

          return false;
      },

      //abstract
      getMaximumSelectionSize: function() {
          return evaluate(this.opts.maximumSelectionSize, this.opts.element);
      },

      // abstract
      ensureHighlightVisible: function () {
          var results = this.results, children, index, child, hb, rb, y, more, topOffset;

          index = this.highlight();

          if (index < 0) return;

          if (index == 0) {

              // if the first element is highlighted scroll all the way to the top,
              // that way any unselectable headers above it will also be scrolled
              // into view

              results.scrollTop(0);
              return;
          }

          children = this.findHighlightableChoices().find('.select2-result-label');

          child = $(children[index]);

          topOffset = (child.offset() || {}).top || 0;

          hb = topOffset + child.outerHeight(true);

          // if this is the last child lets also make sure select2-more-results is visible
          if (index === children.length - 1) {
              more = results.find("li.select2-more-results");
              if (more.length > 0) {
                  hb = more.offset().top + more.outerHeight(true);
              }
          }

          rb = results.offset().top + results.outerHeight(false);
          if (hb > rb) {
              results.scrollTop(results.scrollTop() + (hb - rb));
          }
          y = topOffset - results.offset().top;

          // make sure the top of the element is visible
          if (y < 0 && child.css('display') != 'none' ) {
              results.scrollTop(results.scrollTop() + y); // y is negative
          }
      },

      // abstract
      findHighlightableChoices: function() {
          return this.results.find(".select2-result-selectable:not(.select2-disabled):not(.select2-selected)");
      },

      // abstract
      moveHighlight: function (delta) {
          var choices = this.findHighlightableChoices(),
              index = this.highlight();

          while (index > -1 && index < choices.length) {
              index += delta;
              var choice = $(choices[index]);
              if (choice.hasClass("select2-result-selectable") && !choice.hasClass("select2-disabled") && !choice.hasClass("select2-selected")) {
                  this.highlight(index);
                  break;
              }
          }
      },

      // abstract
      highlight: function (index) {
          var choices = this.findHighlightableChoices(),
              choice,
              data;

          if (arguments.length === 0) {
              return indexOf(choices.filter(".select2-highlighted")[0], choices.get());
          }

          if (index >= choices.length) index = choices.length - 1;
          if (index < 0) index = 0;

          this.removeHighlight();

          choice = $(choices[index]);
          choice.addClass("select2-highlighted");

          // ensure assistive technology can determine the active choice
          this.search.attr("aria-activedescendant", choice.find(".select2-result-label").attr("id"));

          this.ensureHighlightVisible();

          this.liveRegion.text(choice.text());

          data = choice.data("select2-data");
          if (data) {
              this.opts.element.trigger({ type: "select2-highlight", val: this.id(data), choice: data });
          }
      },

      removeHighlight: function() {
          this.results.find(".select2-highlighted").removeClass("select2-highlighted");
      },

      touchMoved: function() {
          this._touchMoved = true;
      },

      clearTouchMoved: function() {
        this._touchMoved = false;
      },

      // abstract
      countSelectableResults: function() {
          return this.findHighlightableChoices().length;
      },

      // abstract
      highlightUnderEvent: function (event) {
          var el = $(event.target).closest(".select2-result-selectable");
          if (el.length > 0 && !el.is(".select2-highlighted")) {
              var choices = this.findHighlightableChoices();
              this.highlight(choices.index(el));
          } else if (el.length == 0) {
              // if we are over an unselectable item remove all highlights
              this.removeHighlight();
          }
      },

      // abstract
      loadMoreIfNeeded: function () {
          var results = this.results,
              more = results.find("li.select2-more-results"),
              below, // pixels the element is below the scroll fold, below==0 is when the element is starting to be visible
              page = this.resultsPage + 1,
              self=this,
              term=this.search.val(),
              context=this.context;

          if (more.length === 0) return;
          below = more.offset().top - results.offset().top - results.height();

          if (below <= this.opts.loadMorePadding) {
              more.addClass("select2-active");
              this.opts.query({
                      element: this.opts.element,
                      term: term,
                      page: page,
                      context: context,
                      matcher: this.opts.matcher,
                      callback: this.bind(function (data) {

                  // ignore a response if the select2 has been closed before it was received
                  if (!self.opened()) return;


                  self.opts.populateResults.call(this, results, data.results, {term: term, page: page, context:context});
                  self.postprocessResults(data, false, false);

                  if (data.more===true) {
                      more.detach().appendTo(results).html(self.opts.escapeMarkup(evaluate(self.opts.formatLoadMore, self.opts.element, page+1)));
                      window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                  } else {
                      more.remove();
                  }
                  self.positionDropdown();
                  self.resultsPage = page;
                  self.context = data.context;
                  this.opts.element.trigger({ type: "select2-loaded", items: data });
              })});
          }
      },

      /**
       * Default tokenizer function which does nothing
       */
      tokenize: function() {

      },

      /**
       * @param initial whether or not this is the call to this method right after the dropdown has been opened
       */
      // abstract
      updateResults: function (initial) {
          var search = this.search,
              results = this.results,
              opts = this.opts,
              data,
              self = this,
              input,
              term = search.val(),
              lastTerm = $.data(this.container, "select2-last-term"),
              // sequence number used to drop out-of-order responses
              queryNumber;

          // prevent duplicate queries against the same term
          if (initial !== true && lastTerm && equal(term, lastTerm)) return;

          $.data(this.container, "select2-last-term", term);

          // if the search is currently hidden we do not alter the results
          if (initial !== true && (this.showSearchInput === false || !this.opened())) {
              return;
          }

          function postRender() {
              search.removeClass("select2-active");
              self.positionDropdown();
              if (results.find('.select2-no-results,.select2-selection-limit,.select2-searching').length) {
                  self.liveRegion.text(results.text());
              }
              else {
                  self.liveRegion.text(self.opts.formatMatches(results.find('.select2-result-selectable:not(".select2-selected")').length));
              }
          }

          function render(html) {
              results.html(html);
              postRender();
          }

          queryNumber = ++this.queryCount;

          var maxSelSize = this.getMaximumSelectionSize();
          if (maxSelSize >=1) {
              data = this.data();
              if ($.isArray(data) && data.length >= maxSelSize && checkFormatter(opts.formatSelectionTooBig, "formatSelectionTooBig")) {
                  render("<li class='select2-selection-limit'>" + evaluate(opts.formatSelectionTooBig, opts.element, maxSelSize) + "</li>");
                  return;
              }
          }

          if (search.val().length < opts.minimumInputLength) {
              if (checkFormatter(opts.formatInputTooShort, "formatInputTooShort")) {
                  render("<li class='select2-no-results'>" + evaluate(opts.formatInputTooShort, opts.element, search.val(), opts.minimumInputLength) + "</li>");
              } else {
                  render("");
              }
              if (initial && this.showSearch) this.showSearch(true);
              return;
          }

          if (opts.maximumInputLength && search.val().length > opts.maximumInputLength) {
              if (checkFormatter(opts.formatInputTooLong, "formatInputTooLong")) {
                  render("<li class='select2-no-results'>" + evaluate(opts.formatInputTooLong, opts.element, search.val(), opts.maximumInputLength) + "</li>");
              } else {
                  render("");
              }
              return;
          }

          if (opts.formatSearching && this.findHighlightableChoices().length === 0) {
              render("<li class='select2-searching'>" + evaluate(opts.formatSearching, opts.element) + "</li>");
          }

          search.addClass("select2-active");

          this.removeHighlight();

          // give the tokenizer a chance to pre-process the input
          input = this.tokenize();
          if (input != undefined && input != null) {
              search.val(input);
          }

          this.resultsPage = 1;

          opts.query({
              element: opts.element,
                  term: search.val(),
                  page: this.resultsPage,
                  context: null,
                  matcher: opts.matcher,
                  callback: this.bind(function (data) {
              var def; // default choice

              // ignore old responses
              if (queryNumber != this.queryCount) {
                return;
              }

              // ignore a response if the select2 has been closed before it was received
              if (!this.opened()) {
                  this.search.removeClass("select2-active");
                  return;
              }

              // handle ajax error
              if(data.hasError !== undefined && checkFormatter(opts.formatAjaxError, "formatAjaxError")) {
                  render("<li class='select2-ajax-error'>" + evaluate(opts.formatAjaxError, opts.element, data.jqXHR, data.textStatus, data.errorThrown) + "</li>");
                  return;
              }

              // save context, if any
              this.context = (data.context===undefined) ? null : data.context;
              // create a default choice and prepend it to the list
              if (this.opts.createSearchChoice && search.val() !== "") {
                  def = this.opts.createSearchChoice.call(self, search.val(), data.results);
                  if (def !== undefined && def !== null && self.id(def) !== undefined && self.id(def) !== null) {
                      if ($(data.results).filter(
                          function () {
                              return equal(self.id(this), self.id(def));
                          }).length === 0) {
                          this.opts.createSearchChoicePosition(data.results, def);
                      }
                  }
              }

              if (data.results.length === 0 && checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
                  render("<li class='select2-no-results'>" + evaluate(opts.formatNoMatches, opts.element, search.val()) + "</li>");
                  if(this.showSearch){
                      this.showSearch(search.val());
                  }
                  return;
              }

              results.empty();
              self.opts.populateResults.call(this, results, data.results, {term: search.val(), page: this.resultsPage, context:null});

              if (data.more === true && checkFormatter(opts.formatLoadMore, "formatLoadMore")) {
                  results.append("<li class='select2-more-results'>" + opts.escapeMarkup(evaluate(opts.formatLoadMore, opts.element, this.resultsPage)) + "</li>");
                  window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
              }

              this.postprocessResults(data, initial);

              postRender();

              this.opts.element.trigger({ type: "select2-loaded", items: data });
          })});
      },

      // abstract
      cancel: function () {
          this.close();
      },

      // abstract
      blur: function () {
          // if selectOnBlur == true, select the currently highlighted option
          if (this.opts.selectOnBlur)
              this.selectHighlighted({noFocus: true});

          this.close();
          this.container.removeClass("select2-container-active");
          // synonymous to .is(':focus'), which is available in jquery >= 1.6
          if (this.search[0] === document.activeElement) { this.search.blur(); }
          this.clearSearch();
          this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
      },

      // abstract
      focusSearch: function () {
          focus(this.search);
      },

      // abstract
      selectHighlighted: function (options) {
          if (this._touchMoved) {
            this.clearTouchMoved();
            return;
          }
          var index=this.highlight(),
              highlighted=this.results.find(".select2-highlighted"),
              data = highlighted.closest('.select2-result').data("select2-data");

          if (data) {
              this.highlight(index);
              this.onSelect(data, options);
          } else if (options && options.noFocus) {
              this.close();
          }
      },

      // abstract
      getPlaceholder: function () {
          var placeholderOption;
          return this.opts.element.attr("placeholder") ||
              this.opts.element.attr("data-placeholder") || // jquery 1.4 compat
              this.opts.element.data("placeholder") ||
              this.opts.placeholder ||
              ((placeholderOption = this.getPlaceholderOption()) !== undefined ? placeholderOption.text() : undefined);
      },

      // abstract
      getPlaceholderOption: function() {
          if (this.select) {
              var firstOption = this.select.children('option').first();
              if (this.opts.placeholderOption !== undefined ) {
                  //Determine the placeholder option based on the specified placeholderOption setting
                  return (this.opts.placeholderOption === "first" && firstOption) ||
                         (typeof this.opts.placeholderOption === "function" && this.opts.placeholderOption(this.select));
              } else if ($.trim(firstOption.text()) === "" && firstOption.val() === "") {
                  //No explicit placeholder option specified, use the first if it's blank
                  return firstOption;
              }
          }
      },

      /**
       * Get the desired width for the container element.  This is
       * derived first from option `width` passed to select2, then
       * the inline 'style' on the original element, and finally
       * falls back to the jQuery calculated element width.
       */
      // abstract
      initContainerWidth: function () {
          function resolveContainerWidth() {
              var style, attrs, matches, i, l, attr;

              if (this.opts.width === "off") {
                  return null;
              } else if (this.opts.width === "element"){
                  return this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px';
              } else if (this.opts.width === "copy" || this.opts.width === "resolve") {
                  // check if there is inline style on the element that contains width
                  style = this.opts.element.attr('style');
                  if (typeof(style) === "string") {
                      attrs = style.split(';');
                      for (i = 0, l = attrs.length; i < l; i = i + 1) {
                          attr = attrs[i].replace(/\s/g, '');
                          matches = attr.match(/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i);
                          if (matches !== null && matches.length >= 1)
                              return matches[1];
                      }
                  }

                  if (this.opts.width === "resolve") {
                      // next check if css('width') can resolve a width that is percent based, this is sometimes possible
                      // when attached to input type=hidden or elements hidden via css
                      style = this.opts.element.css('width');
                      if (style.indexOf("%") > 0) return style;

                      // finally, fallback on the calculated width of the element
                      return (this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px');
                  }

                  return null;
              } else if ($.isFunction(this.opts.width)) {
                  return this.opts.width();
              } else {
                  return this.opts.width;
             }
          };

          var width = resolveContainerWidth.call(this);
          if (width !== null) {
              this.container.css("width", width);
          }
      }
  });

  SingleSelect2 = clazz(AbstractSelect2, {

      // single

      createContainer: function () {
          var container = $(document.createElement("div")).attr({
              "class": "select2-container"
          }).html([
              "<a href='javascript:void(0)' class='select2-choice' tabindex='-1'>",
              "   <span class='select2-chosen'>&#160;</span><abbr class='select2-search-choice-close'></abbr>",
              "   <span class='select2-arrow' role='presentation'><b role='presentation'></b></span>",
              "</a>",
              "<label for='' class='select2-offscreen'></label>",
              "<input class='select2-focusser select2-offscreen' type='text' aria-haspopup='true' role='button' />",
              "<div class='select2-drop select2-display-none'>",
              "   <div class='select2-search'>",
              "       <label for='' class='select2-offscreen'></label>",
              "       <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input' role='combobox' aria-expanded='true'",
              "       aria-autocomplete='list' />",
              "   </div>",
              "   <ul class='select2-results' role='listbox'>",
              "   </ul>",
              "</div>"].join(""));
          return container;
      },

      // single
      enableInterface: function() {
          if (this.parent.enableInterface.apply(this, arguments)) {
              this.focusser.prop("disabled", !this.isInterfaceEnabled());
          }
      },

      // single
      opening: function () {
          var el, range, len;

          if (this.opts.minimumResultsForSearch >= 0) {
              this.showSearch(true);
          }

          this.parent.opening.apply(this, arguments);

          if (this.showSearchInput !== false) {
              // IE appends focusser.val() at the end of field :/ so we manually insert it at the beginning using a range
              // all other browsers handle this just fine

              this.search.val(this.focusser.val());
          }
          if (this.opts.shouldFocusInput(this)) {
              this.search.focus();
              // move the cursor to the end after focussing, otherwise it will be at the beginning and
              // new text will appear *before* focusser.val()
              el = this.search.get(0);
              if (el.createTextRange) {
                  range = el.createTextRange();
                  range.collapse(false);
                  range.select();
              } else if (el.setSelectionRange) {
                  len = this.search.val().length;
                  el.setSelectionRange(len, len);
              }
          }

          this.prefillNextSearchTerm();

          this.focusser.prop("disabled", true).val("");
          this.updateResults(true);
          this.opts.element.trigger($.Event("select2-open"));
      },

      // single
      close: function () {
          if (!this.opened()) return;
          this.parent.close.apply(this, arguments);

          this.focusser.prop("disabled", false);

          if (this.opts.shouldFocusInput(this)) {
              this.focusser.focus();
          }
      },

      // single
      focus: function () {
          if (this.opened()) {
              this.close();
          } else {
              this.focusser.prop("disabled", false);
              if (this.opts.shouldFocusInput(this)) {
                  this.focusser.focus();
              }
          }
      },

      // single
      isFocused: function () {
          return this.container.hasClass("select2-container-active");
      },

      // single
      cancel: function () {
          this.parent.cancel.apply(this, arguments);
          this.focusser.prop("disabled", false);

          if (this.opts.shouldFocusInput(this)) {
              this.focusser.focus();
          }
      },

      // single
      destroy: function() {
          $("label[for='" + this.focusser.attr('id') + "']")
              .attr('for', this.opts.element.attr("id"));
          this.parent.destroy.apply(this, arguments);

          cleanupJQueryElements.call(this,
              "selection",
              "focusser"
          );
      },

      // single
      initContainer: function () {

          var selection,
              container = this.container,
              dropdown = this.dropdown,
              idSuffix = nextUid(),
              elementLabel;

          if (this.opts.minimumResultsForSearch < 0) {
              this.showSearch(false);
          } else {
              this.showSearch(true);
          }

          this.selection = selection = container.find(".select2-choice");

          this.focusser = container.find(".select2-focusser");

          // add aria associations
          selection.find(".select2-chosen").attr("id", "select2-chosen-"+idSuffix);
          this.focusser.attr("aria-labelledby", "select2-chosen-"+idSuffix);
          this.results.attr("id", "select2-results-"+idSuffix);
          this.search.attr("aria-owns", "select2-results-"+idSuffix);

          // rewrite labels from original element to focusser
          this.focusser.attr("id", "s2id_autogen"+idSuffix);

          elementLabel = $("label[for='" + this.opts.element.attr("id") + "']");
          this.opts.element.on('focus.select2', this.bind(function () { this.focus(); }));

          this.focusser.prev()
              .text(elementLabel.text())
              .attr('for', this.focusser.attr('id'));

          // Ensure the original element retains an accessible name
          var originalTitle = this.opts.element.attr("title");
          this.opts.element.attr("title", (originalTitle || elementLabel.text()));

          this.focusser.attr("tabindex", this.elementTabIndex);

          // write label for search field using the label from the focusser element
          this.search.attr("id", this.focusser.attr('id') + '_search');

          this.search.prev()
              .text($("label[for='" + this.focusser.attr('id') + "']").text())
              .attr('for', this.search.attr('id'));

          this.search.on("keydown", this.bind(function (e) {
              if (!this.isInterfaceEnabled()) return;

              // filter 229 keyCodes (input method editor is processing key input)
              if (229 == e.keyCode) return;

              if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                  // prevent the page from scrolling
                  killEvent(e);
                  return;
              }

              switch (e.which) {
                  case KEY.UP:
                  case KEY.DOWN:
                      this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                      killEvent(e);
                      return;
                  case KEY.ENTER:
                      this.selectHighlighted();
                      killEvent(e);
                      return;
                  case KEY.TAB:
                      this.selectHighlighted({noFocus: true});
                      return;
                  case KEY.ESC:
                      this.cancel(e);
                      killEvent(e);
                      return;
              }
          }));

          this.search.on("blur", this.bind(function(e) {
              // a workaround for chrome to keep the search field focussed when the scroll bar is used to scroll the dropdown.
              // without this the search field loses focus which is annoying
              if (document.activeElement === this.body.get(0)) {
                  window.setTimeout(this.bind(function() {
                      if (this.opened() && this.results && this.results.length > 1) {
                          this.search.focus();
                      }
                  }), 0);
              }
          }));

          this.focusser.on("keydown", this.bind(function (e) {
              if (!this.isInterfaceEnabled()) return;

              if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
                  return;
              }

              if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
                  killEvent(e);
                  return;
              }

              if (e.which == KEY.DOWN || e.which == KEY.UP
                  || (e.which == KEY.ENTER && this.opts.openOnEnter)) {

                  if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;

                  this.open();
                  killEvent(e);
                  return;
              }

              if (e.which == KEY.DELETE || e.which == KEY.BACKSPACE) {
                  if (this.opts.allowClear) {
                      this.clear();
                  }
                  killEvent(e);
                  return;
              }
          }));


          installKeyUpChangeEvent(this.focusser);
          this.focusser.on("keyup-change input", this.bind(function(e) {
              if (this.opts.minimumResultsForSearch >= 0) {
                  e.stopPropagation();
                  if (this.opened()) return;
                  this.open();
              }
          }));

          selection.on("mousedown touchstart", "abbr", this.bind(function (e) {
              if (!this.isInterfaceEnabled()) {
                  return;
              }

              this.clear();
              killEventImmediately(e);
              this.close();

              if (this.selection) {
                  this.selection.focus();
              }
          }));

          selection.on("mousedown touchstart", this.bind(function (e) {
              // Prevent IE from generating a click event on the body
              reinsertElement(selection);

              if (!this.container.hasClass("select2-container-active")) {
                  this.opts.element.trigger($.Event("select2-focus"));
              }

              if (this.opened()) {
                  this.close();
              } else if (this.isInterfaceEnabled()) {
                  this.open();
              }

              killEvent(e);
          }));

          dropdown.on("mousedown touchstart", this.bind(function() {
              if (this.opts.shouldFocusInput(this)) {
                  this.search.focus();
              }
          }));

          selection.on("focus", this.bind(function(e) {
              killEvent(e);
          }));

          this.focusser.on("focus", this.bind(function(){
              if (!this.container.hasClass("select2-container-active")) {
                  this.opts.element.trigger($.Event("select2-focus"));
              }
              this.container.addClass("select2-container-active");
          })).on("blur", this.bind(function() {
              if (!this.opened()) {
                  this.container.removeClass("select2-container-active");
                  this.opts.element.trigger($.Event("select2-blur"));
              }
          }));
          this.search.on("focus", this.bind(function(){
              if (!this.container.hasClass("select2-container-active")) {
                  this.opts.element.trigger($.Event("select2-focus"));
              }
              this.container.addClass("select2-container-active");
          }));

          this.initContainerWidth();
          this.opts.element.hide();
          this.setPlaceholder();

      },

      // single
      clear: function(triggerChange) {
          var data=this.selection.data("select2-data");
          if (data) { // guard against queued quick consecutive clicks
              var evt = $.Event("select2-clearing");
              this.opts.element.trigger(evt);
              if (evt.isDefaultPrevented()) {
                  return;
              }
              var placeholderOption = this.getPlaceholderOption();
              this.opts.element.val(placeholderOption ? placeholderOption.val() : "");
              this.selection.find(".select2-chosen").empty();
              this.selection.removeData("select2-data");
              this.setPlaceholder();

              if (triggerChange !== false){
                  this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
                  this.triggerChange({removed:data});
              }
          }
      },

      /**
       * Sets selection based on source element's value
       */
      // single
      initSelection: function () {
          var selected;
          if (this.isPlaceholderOptionSelected()) {
              this.updateSelection(null);
              this.close();
              this.setPlaceholder();
          } else {
              var self = this;
              this.opts.initSelection.call(null, this.opts.element, function(selected){
                  if (selected !== undefined && selected !== null) {
                      self.updateSelection(selected);
                      self.close();
                      self.setPlaceholder();
                      self.lastSearchTerm = self.search.val();
                  }
              });
          }
      },

      isPlaceholderOptionSelected: function() {
          var placeholderOption;
          if (this.getPlaceholder() === undefined) return false; // no placeholder specified so no option should be considered
          return ((placeholderOption = this.getPlaceholderOption()) !== undefined && placeholderOption.prop("selected"))
              || (this.opts.element.val() === "")
              || (this.opts.element.val() === undefined)
              || (this.opts.element.val() === null);
      },

      // single
      prepareOpts: function () {
          var opts = this.parent.prepareOpts.apply(this, arguments),
              self=this;

          if (opts.element.get(0).tagName.toLowerCase() === "select") {
              // install the selection initializer
              opts.initSelection = function (element, callback) {
                  var selected = element.find("option").filter(function() { return this.selected && !this.disabled });
                  // a single select box always has a value, no need to null check 'selected'
                  callback(self.optionToData(selected));
              };
          } else if ("data" in opts) {
              // install default initSelection when applied to hidden input and data is local
              opts.initSelection = opts.initSelection || function (element, callback) {
                  var id = element.val();
                  //search in data by id, storing the actual matching item
                  var match = null;
                  opts.query({
                      matcher: function(term, text, el){
                          var is_match = equal(id, opts.id(el));
                          if (is_match) {
                              match = el;
                          }
                          return is_match;
                      },
                      callback: !$.isFunction(callback) ? $.noop : function() {
                          callback(match);
                      }
                  });
              };
          }

          return opts;
      },

      // single
      getPlaceholder: function() {
          // if a placeholder is specified on a single select without a valid placeholder option ignore it
          if (this.select) {
              if (this.getPlaceholderOption() === undefined) {
                  return undefined;
              }
          }

          return this.parent.getPlaceholder.apply(this, arguments);
      },

      // single
      setPlaceholder: function () {
          var placeholder = this.getPlaceholder();

          if (this.isPlaceholderOptionSelected() && placeholder !== undefined) {

              // check for a placeholder option if attached to a select
              if (this.select && this.getPlaceholderOption() === undefined) return;

              this.selection.find(".select2-chosen").html(this.opts.escapeMarkup(placeholder));

              this.selection.addClass("select2-default");

              this.container.removeClass("select2-allowclear");
          }
      },

      // single
      postprocessResults: function (data, initial, noHighlightUpdate) {
          var selected = 0, self = this, showSearchInput = true;

          // find the selected element in the result list

          this.findHighlightableChoices().each2(function (i, elm) {
              if (equal(self.id(elm.data("select2-data")), self.opts.element.val())) {
                  selected = i;
                  return false;
              }
          });

          // and highlight it
          if (noHighlightUpdate !== false) {
              if (initial === true && selected >= 0) {
                  this.highlight(selected);
              } else {
                  this.highlight(0);
              }
          }

          // hide the search box if this is the first we got the results and there are enough of them for search

          if (initial === true) {
              var min = this.opts.minimumResultsForSearch;
              if (min >= 0) {
                  this.showSearch(countResults(data.results) >= min);
              }
          }
      },

      // single
      showSearch: function(showSearchInput) {
          if (this.showSearchInput === showSearchInput) return;

          this.showSearchInput = showSearchInput;

          this.dropdown.find(".select2-search").toggleClass("select2-search-hidden", !showSearchInput);
          this.dropdown.find(".select2-search").toggleClass("select2-offscreen", !showSearchInput);
          //add "select2-with-searchbox" to the container if search box is shown
          $(this.dropdown, this.container).toggleClass("select2-with-searchbox", showSearchInput);
      },

      // single
      onSelect: function (data, options) {

          if (!this.triggerSelect(data)) { return; }

          var old = this.opts.element.val(),
              oldData = this.data();

          this.opts.element.val(this.id(data));
          this.updateSelection(data);

          this.opts.element.trigger({ type: "select2-selected", val: this.id(data), choice: data });

          this.lastSearchTerm = this.search.val();
          this.close();

          if ((!options || !options.noFocus) && this.opts.shouldFocusInput(this)) {
              this.focusser.focus();
          }

          if (!equal(old, this.id(data))) {
              this.triggerChange({ added: data, removed: oldData });
          }
      },

      // single
      updateSelection: function (data) {

          var container=this.selection.find(".select2-chosen"), formatted, cssClass;

          this.selection.data("select2-data", data);

          container.empty();
          if (data !== null) {
              formatted=this.opts.formatSelection(data, container, this.opts.escapeMarkup);
          }
          if (formatted !== undefined) {
              container.append(formatted);
          }
          cssClass=this.opts.formatSelectionCssClass(data, container);
          if (cssClass !== undefined) {
              container.addClass(cssClass);
          }

          this.selection.removeClass("select2-default");

          if (this.opts.allowClear && this.getPlaceholder() !== undefined) {
              this.container.addClass("select2-allowclear");
          }
      },

      // single
      val: function () {
          var val,
              triggerChange = false,
              data = null,
              self = this,
              oldData = this.data();

          if (arguments.length === 0) {
              return this.opts.element.val();
          }

          val = arguments[0];

          if (arguments.length > 1) {
              triggerChange = arguments[1];

              if (this.opts.debug && console && console.warn) {
                  console.warn(
                      'Select2: The second option to `select2("val")` is not supported in Select2 4.0.0. ' +
                      'The `change` event will always be triggered in 4.0.0.'
                  );
              }
          }

          if (this.select) {
              if (this.opts.debug && console && console.warn) {
                  console.warn(
                      'Select2: Setting the value on a <select> using `select2("val")` is no longer supported in 4.0.0. ' +
                      'You can use the `.val(newValue).trigger("change")` method provided by jQuery instead.'
                  );
              }

              this.select
                  .val(val)
                  .find("option").filter(function() { return this.selected }).each2(function (i, elm) {
                      data = self.optionToData(elm);
                      return false;
                  });
              this.updateSelection(data);
              this.setPlaceholder();
              if (triggerChange) {
                  this.triggerChange({added: data, removed:oldData});
              }
          } else {
              // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
              if (!val && val !== 0) {
                  this.clear(triggerChange);
                  return;
              }
              if (this.opts.initSelection === undefined) {
                  throw new Error("cannot call val() if initSelection() is not defined");
              }
              this.opts.element.val(val);
              this.opts.initSelection(this.opts.element, function(data){
                  self.opts.element.val(!data ? "" : self.id(data));
                  self.updateSelection(data);
                  self.setPlaceholder();
                  if (triggerChange) {
                      self.triggerChange({added: data, removed:oldData});
                  }
              });
          }
      },

      // single
      clearSearch: function () {
          this.search.val("");
          this.focusser.val("");
      },

      // single
      data: function(value) {
          var data,
              triggerChange = false;

          if (arguments.length === 0) {
              data = this.selection.data("select2-data");
              if (data == undefined) data = null;
              return data;
          } else {
              if (this.opts.debug && console && console.warn) {
                  console.warn(
                      'Select2: The `select2("data")` method can no longer set selected values in 4.0.0, ' +
                      'consider using the `.val()` method instead.'
                  );
              }

              if (arguments.length > 1) {
                  triggerChange = arguments[1];
              }
              if (!value) {
                  this.clear(triggerChange);
              } else {
                  data = this.data();
                  this.opts.element.val(!value ? "" : this.id(value));
                  this.updateSelection(value);
                  if (triggerChange) {
                      this.triggerChange({added: value, removed:data});
                  }
              }
          }
      }
  });

  MultiSelect2 = clazz(AbstractSelect2, {

      // multi
      createContainer: function () {
          var container = $(document.createElement("div")).attr({
              "class": "select2-container select2-container-multi"
          }).html([
              "<ul class='select2-choices'>",
              "  <li class='select2-search-field'>",
              "    <label for='' class='select2-offscreen'></label>",
              "    <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input'>",
              "  </li>",
              "</ul>",
              "<div class='select2-drop select2-drop-multi select2-display-none'>",
              "   <ul class='select2-results'>",
              "   </ul>",
              "</div>"].join(""));
          return container;
      },

      // multi
      prepareOpts: function () {
          var opts = this.parent.prepareOpts.apply(this, arguments),
              self=this;

          // TODO validate placeholder is a string if specified
          if (opts.element.get(0).tagName.toLowerCase() === "select") {
              // install the selection initializer
              opts.initSelection = function (element, callback) {

                  var data = [];

                  element.find("option").filter(function() { return this.selected && !this.disabled }).each2(function (i, elm) {
                      data.push(self.optionToData(elm));
                  });
                  callback(data);
              };
          } else if ("data" in opts) {
              // install default initSelection when applied to hidden input and data is local
              opts.initSelection = opts.initSelection || function (element, callback) {
                  var ids = splitVal(element.val(), opts.separator, opts.transformVal);
                  //search in data by array of ids, storing matching items in a list
                  var matches = [];
                  opts.query({
                      matcher: function(term, text, el){
                          var is_match = $.grep(ids, function(id) {
                              return equal(id, opts.id(el));
                          }).length;
                          if (is_match) {
                              matches.push(el);
                          }
                          return is_match;
                      },
                      callback: !$.isFunction(callback) ? $.noop : function() {
                          // reorder matches based on the order they appear in the ids array because right now
                          // they are in the order in which they appear in data array
                          var ordered = [];
                          for (var i = 0; i < ids.length; i++) {
                              var id = ids[i];
                              for (var j = 0; j < matches.length; j++) {
                                  var match = matches[j];
                                  if (equal(id, opts.id(match))) {
                                      ordered.push(match);
                                      matches.splice(j, 1);
                                      break;
                                  }
                              }
                          }
                          callback(ordered);
                      }
                  });
              };
          }

          return opts;
      },

      // multi
      selectChoice: function (choice) {

          var selected = this.container.find(".select2-search-choice-focus");
          if (selected.length && choice && choice[0] == selected[0]) {

          } else {
              if (selected.length) {
                  this.opts.element.trigger("choice-deselected", selected);
              }
              selected.removeClass("select2-search-choice-focus");
              if (choice && choice.length) {
                  this.close();
                  choice.addClass("select2-search-choice-focus");
                  this.opts.element.trigger("choice-selected", choice);
              }
          }
      },

      // multi
      destroy: function() {
          $("label[for='" + this.search.attr('id') + "']")
              .attr('for', this.opts.element.attr("id"));
          this.parent.destroy.apply(this, arguments);

          cleanupJQueryElements.call(this,
              "searchContainer",
              "selection"
          );
      },

      // multi
      initContainer: function () {

          var selector = ".select2-choices", selection;

          this.searchContainer = this.container.find(".select2-search-field");
          this.selection = selection = this.container.find(selector);

          var _this = this;
          this.selection.on("click", ".select2-container:not(.select2-container-disabled) .select2-search-choice:not(.select2-locked)", function (e) {
              _this.search[0].focus();
              _this.selectChoice($(this));
          });

          // rewrite labels from original element to focusser
          this.search.attr("id", "s2id_autogen"+nextUid());

          this.search.prev()
              .text($("label[for='" + this.opts.element.attr("id") + "']").text())
              .attr('for', this.search.attr('id'));
          this.opts.element.on('focus.select2', this.bind(function () { this.focus(); }));

          this.search.on("input paste", this.bind(function() {
              if (this.search.attr('placeholder') && this.search.val().length == 0) return;
              if (!this.isInterfaceEnabled()) return;
              if (!this.opened()) {
                  this.open();
              }
          }));

          this.search.attr("tabindex", this.elementTabIndex);

          this.keydowns = 0;
          this.search.on("keydown", this.bind(function (e) {
              if (!this.isInterfaceEnabled()) return;

              ++this.keydowns;
              var selected = selection.find(".select2-search-choice-focus");
              var prev = selected.prev(".select2-search-choice:not(.select2-locked)");
              var next = selected.next(".select2-search-choice:not(.select2-locked)");
              var pos = getCursorInfo(this.search);

              if (selected.length &&
                  (e.which == KEY.LEFT || e.which == KEY.RIGHT || e.which == KEY.BACKSPACE || e.which == KEY.DELETE || e.which == KEY.ENTER)) {
                  var selectedChoice = selected;
                  if (e.which == KEY.LEFT && prev.length) {
                      selectedChoice = prev;
                  }
                  else if (e.which == KEY.RIGHT) {
                      selectedChoice = next.length ? next : null;
                  }
                  else if (e.which === KEY.BACKSPACE) {
                      if (this.unselect(selected.first())) {
                          this.search.width(10);
                          selectedChoice = prev.length ? prev : next;
                      }
                  } else if (e.which == KEY.DELETE) {
                      if (this.unselect(selected.first())) {
                          this.search.width(10);
                          selectedChoice = next.length ? next : null;
                      }
                  } else if (e.which == KEY.ENTER) {
                      selectedChoice = null;
                  }

                  this.selectChoice(selectedChoice);
                  killEvent(e);
                  if (!selectedChoice || !selectedChoice.length) {
                      this.open();
                  }
                  return;
              } else if (((e.which === KEY.BACKSPACE && this.keydowns == 1)
                  || e.which == KEY.LEFT) && (pos.offset == 0 && !pos.length)) {

                  this.selectChoice(selection.find(".select2-search-choice:not(.select2-locked)").last());
                  killEvent(e);
                  return;
              } else {
                  this.selectChoice(null);
              }

              if (this.opened()) {
                  switch (e.which) {
                  case KEY.UP:
                  case KEY.DOWN:
                      this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                      killEvent(e);
                      return;
                  case KEY.ENTER:
                      this.selectHighlighted();
                      killEvent(e);
                      return;
                  case KEY.TAB:
                      this.selectHighlighted({noFocus:true});
                      this.close();
                      return;
                  case KEY.ESC:
                      this.cancel(e);
                      killEvent(e);
                      return;
                  }
              }

              if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e)
               || e.which === KEY.BACKSPACE || e.which === KEY.ESC) {
                  return;
              }

              if (e.which === KEY.ENTER) {
                  if (this.opts.openOnEnter === false) {
                      return;
                  } else if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
                      return;
                  }
              }

              this.open();

              if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                  // prevent the page from scrolling
                  killEvent(e);
              }

              if (e.which === KEY.ENTER) {
                  // prevent form from being submitted
                  killEvent(e);
              }

          }));

          this.search.on("keyup", this.bind(function (e) {
              this.keydowns = 0;
              this.resizeSearch();
          })
          );

          this.search.on("blur", this.bind(function(e) {
              this.container.removeClass("select2-container-active");
              this.search.removeClass("select2-focused");
              this.selectChoice(null);
              if (!this.opened()) this.clearSearch();
              e.stopImmediatePropagation();
              this.opts.element.trigger($.Event("select2-blur"));
          }));

          this.container.on("click", selector, this.bind(function (e) {
              if (!this.isInterfaceEnabled()) return;
              if ($(e.target).closest(".select2-search-choice").length > 0) {
                  // clicked inside a select2 search choice, do not open
                  return;
              }
              this.selectChoice(null);
              this.clearPlaceholder();
              if (!this.container.hasClass("select2-container-active")) {
                  this.opts.element.trigger($.Event("select2-focus"));
              }
              this.open();
              this.focusSearch();
              e.preventDefault();
          }));

          this.container.on("focus", selector, this.bind(function () {
              if (!this.isInterfaceEnabled()) return;
              if (!this.container.hasClass("select2-container-active")) {
                  this.opts.element.trigger($.Event("select2-focus"));
              }
              this.container.addClass("select2-container-active");
              this.dropdown.addClass("select2-drop-active");
              this.clearPlaceholder();
          }));

          this.initContainerWidth();
          this.opts.element.hide();

          // set the placeholder if necessary
          this.clearSearch();
      },

      // multi
      enableInterface: function() {
          if (this.parent.enableInterface.apply(this, arguments)) {
              this.search.prop("disabled", !this.isInterfaceEnabled());
          }
      },

      // multi
      initSelection: function () {
          var data;
          if (this.opts.element.val() === "" && this.opts.element.text() === "") {
              this.updateSelection([]);
              this.close();
              // set the placeholder if necessary
              this.clearSearch();
          }
          if (this.select || this.opts.element.val() !== "") {
              var self = this;
              this.opts.initSelection.call(null, this.opts.element, function(data){
                  if (data !== undefined && data !== null) {
                      self.updateSelection(data);
                      self.close();
                      // set the placeholder if necessary
                      self.clearSearch();
                  }
              });
          }
      },

      // multi
      clearSearch: function () {
          var placeholder = this.getPlaceholder(),
              maxWidth = this.getMaxSearchWidth();

          if (placeholder !== undefined  && this.getVal().length === 0 && this.search.hasClass("select2-focused") === false) {
              this.search.val(placeholder).addClass("select2-default");
              // stretch the search box to full width of the container so as much of the placeholder is visible as possible
              // we could call this.resizeSearch(), but we do not because that requires a sizer and we do not want to create one so early because of a firefox bug, see #944
              this.search.width(maxWidth > 0 ? maxWidth : this.container.css("width"));
          } else {
              this.search.val("").width(10);
          }
      },

      // multi
      clearPlaceholder: function () {
          if (this.search.hasClass("select2-default")) {
              this.search.val("").removeClass("select2-default");
          }
      },

      // multi
      opening: function () {
          this.clearPlaceholder(); // should be done before super so placeholder is not used to search
          this.resizeSearch();

          this.parent.opening.apply(this, arguments);

          this.focusSearch();

          this.prefillNextSearchTerm();
          this.updateResults(true);

          if (this.opts.shouldFocusInput(this)) {
              this.search.focus();
          }
          this.opts.element.trigger($.Event("select2-open"));
      },

      // multi
      close: function () {
          if (!this.opened()) return;
          this.parent.close.apply(this, arguments);
      },

      // multi
      focus: function () {
          this.close();
          this.search.focus();
      },

      // multi
      isFocused: function () {
          return this.search.hasClass("select2-focused");
      },

      // multi
      updateSelection: function (data) {
          var ids = {}, filtered = [], self = this;

          // filter out duplicates
          $(data).each(function () {
              if (!(self.id(this) in ids)) {
                  ids[self.id(this)] = 0;
                  filtered.push(this);
              }
          });

          this.selection.find(".select2-search-choice").remove();
          this.addSelectedChoice(filtered);
          self.postprocessResults();
      },

      // multi
      tokenize: function() {
          var input = this.search.val();
          input = this.opts.tokenizer.call(this, input, this.data(), this.bind(this.onSelect), this.opts);
          if (input != null && input != undefined) {
              this.search.val(input);
              if (input.length > 0) {
                  this.open();
              }
          }

      },

      // multi
      onSelect: function (data, options) {

          if (!this.triggerSelect(data) || data.text === "") { return; }

          this.addSelectedChoice(data);

          this.opts.element.trigger({ type: "selected", val: this.id(data), choice: data });

          // keep track of the search's value before it gets cleared
          this.lastSearchTerm = this.search.val();

          this.clearSearch();
          this.updateResults();

          if (this.select || !this.opts.closeOnSelect) this.postprocessResults(data, false, this.opts.closeOnSelect===true);

          if (this.opts.closeOnSelect) {
              this.close();
              this.search.width(10);
          } else {
              if (this.countSelectableResults()>0) {
                  this.search.width(10);
                  this.resizeSearch();
                  if (this.getMaximumSelectionSize() > 0 && this.val().length >= this.getMaximumSelectionSize()) {
                      // if we reached max selection size repaint the results so choices
                      // are replaced with the max selection reached message
                      this.updateResults(true);
                  } else {
                      // initializes search's value with nextSearchTerm and update search result
                      if (this.prefillNextSearchTerm()) {
                          this.updateResults();
                      }
                  }
                  this.positionDropdown();
              } else {
                  // if nothing left to select close
                  this.close();
                  this.search.width(10);
              }
          }

          // since its not possible to select an element that has already been
          // added we do not need to check if this is a new element before firing change
          this.triggerChange({ added: data });

          if (!options || !options.noFocus)
              this.focusSearch();
      },

      // multi
      cancel: function () {
          this.close();
          this.focusSearch();
      },

      addSelectedChoice: function (data) {
          var val = this.getVal(), self = this;
          $(data).each(function () {
              val.push(self.createChoice(this));
          });
          this.setVal(val);
      },

      createChoice: function (data) {
          var enableChoice = !data.locked,
              enabledItem = $(
                  "<li class='select2-search-choice'>" +
                  "    <div></div>" +
                  "    <a href='#' class='select2-search-choice-close' tabindex='-1'></a>" +
                  "</li>"),
              disabledItem = $(
                  "<li class='select2-search-choice select2-locked'>" +
                  "<div></div>" +
                  "</li>");
          var choice = enableChoice ? enabledItem : disabledItem,
              id = this.id(data),
              formatted,
              cssClass;

          formatted=this.opts.formatSelection(data, choice.find("div"), this.opts.escapeMarkup);
          if (formatted != undefined) {
              choice.find("div").replaceWith($("<div></div>").html(formatted));
          }
          cssClass=this.opts.formatSelectionCssClass(data, choice.find("div"));
          if (cssClass != undefined) {
              choice.addClass(cssClass);
          }

          if(enableChoice){
            choice.find(".select2-search-choice-close")
                .on("mousedown", killEvent)
                .on("click dblclick", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                this.unselect($(e.target));
                this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
                killEvent(e);
                this.close();
                this.focusSearch();
            })).on("focus", this.bind(function () {
                if (!this.isInterfaceEnabled()) return;
                this.container.addClass("select2-container-active");
                this.dropdown.addClass("select2-drop-active");
            }));
          }

          choice.data("select2-data", data);
          choice.insertBefore(this.searchContainer);

          return id;
      },

      // multi
      unselect: function (selected) {
          var val = this.getVal(),
              data,
              index;
          selected = selected.closest(".select2-search-choice");

          if (selected.length === 0) {
              throw "Invalid argument: " + selected + ". Must be .select2-search-choice";
          }

          data = selected.data("select2-data");

          if (!data) {
              // prevent a race condition when the 'x' is clicked really fast repeatedly the event can be queued
              // and invoked on an element already removed
              return;
          }

          var evt = $.Event("select2-removing");
          evt.val = this.id(data);
          evt.choice = data;
          this.opts.element.trigger(evt);

          if (evt.isDefaultPrevented()) {
              return false;
          }

          while((index = indexOf(this.id(data), val)) >= 0) {
              val.splice(index, 1);
              this.setVal(val);
              if (this.select) this.postprocessResults();
          }

          selected.remove();

          this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
          this.triggerChange({ removed: data });

          return true;
      },

      // multi
      postprocessResults: function (data, initial, noHighlightUpdate) {
          var val = this.getVal(),
              choices = this.results.find(".select2-result"),
              compound = this.results.find(".select2-result-with-children"),
              self = this;

          choices.each2(function (i, choice) {
              var id = self.id(choice.data("select2-data"));
              if (indexOf(id, val) >= 0) {
                  choice.addClass("select2-selected");
                  // mark all children of the selected parent as selected
                  choice.find(".select2-result-selectable").addClass("select2-selected");
              }
          });

          compound.each2(function(i, choice) {
              // hide an optgroup if it doesn't have any selectable children
              if (!choice.is('.select2-result-selectable')
                  && choice.find(".select2-result-selectable:not(.select2-selected)").length === 0) {
                  choice.addClass("select2-selected");
              }
          });

          if (this.highlight() == -1 && noHighlightUpdate !== false && this.opts.closeOnSelect === true){
              self.highlight(0);
          }

          //If all results are chosen render formatNoMatches
          if(!this.opts.createSearchChoice && !choices.filter('.select2-result:not(.select2-selected)').length > 0){
              if(!data || data && !data.more && this.results.find(".select2-no-results").length === 0) {
                  if (checkFormatter(self.opts.formatNoMatches, "formatNoMatches")) {
                      this.results.append("<li class='select2-no-results'>" + evaluate(self.opts.formatNoMatches, self.opts.element, self.search.val()) + "</li>");
                  }
              }
          }

      },

      // multi
      getMaxSearchWidth: function() {
          return this.selection.width() - getSideBorderPadding(this.search);
      },

      // multi
      resizeSearch: function () {
          var minimumWidth, left, maxWidth, containerLeft, searchWidth,
              sideBorderPadding = getSideBorderPadding(this.search);

          minimumWidth = measureTextWidth(this.search) + 10;

          left = this.search.offset().left;

          maxWidth = this.selection.width();
          containerLeft = this.selection.offset().left;

          searchWidth = maxWidth - (left - containerLeft) - sideBorderPadding;

          if (searchWidth < minimumWidth) {
              searchWidth = maxWidth - sideBorderPadding;
          }

          if (searchWidth < 40) {
              searchWidth = maxWidth - sideBorderPadding;
          }

          if (searchWidth <= 0) {
            searchWidth = minimumWidth;
          }

          this.search.width(Math.floor(searchWidth));
      },

      // multi
      getVal: function () {
          var val;
          if (this.select) {
              val = this.select.val();
              return val === null ? [] : val;
          } else {
              val = this.opts.element.val();
              return splitVal(val, this.opts.separator, this.opts.transformVal);
          }
      },

      // multi
      setVal: function (val) {
          if (this.select) {
              this.select.val(val);
          } else {
              var unique = [], valMap = {};
              // filter out duplicates
              $(val).each(function () {
                  if (!(this in valMap)) {
                      unique.push(this);
                      valMap[this] = 0;
                  }
              });
              this.opts.element.val(unique.length === 0 ? "" : unique.join(this.opts.separator));
          }
      },

      // multi
      buildChangeDetails: function (old, current) {
          var current = current.slice(0),
              old = old.slice(0);

          // remove intersection from each array
          for (var i = 0; i < current.length; i++) {
              for (var j = 0; j < old.length; j++) {
                  if (equal(this.opts.id(current[i]), this.opts.id(old[j]))) {
                      current.splice(i, 1);
                      i--;
                      old.splice(j, 1);
                      break;
                  }
              }
          }

          return {added: current, removed: old};
      },


      // multi
      val: function (val, triggerChange) {
          var oldData, self=this;

          if (arguments.length === 0) {
              return this.getVal();
          }

          oldData=this.data();
          if (!oldData.length) oldData=[];

          // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
          if (!val && val !== 0) {
              this.opts.element.val("");
              this.updateSelection([]);
              this.clearSearch();
              if (triggerChange) {
                  this.triggerChange({added: this.data(), removed: oldData});
              }
              return;
          }

          // val is a list of ids
          this.setVal(val);

          if (this.select) {
              this.opts.initSelection(this.select, this.bind(this.updateSelection));
              if (triggerChange) {
                  this.triggerChange(this.buildChangeDetails(oldData, this.data()));
              }
          } else {
              if (this.opts.initSelection === undefined) {
                  throw new Error("val() cannot be called if initSelection() is not defined");
              }

              this.opts.initSelection(this.opts.element, function(data){
                  var ids=$.map(data, self.id);
                  self.setVal(ids);
                  self.updateSelection(data);
                  self.clearSearch();
                  if (triggerChange) {
                      self.triggerChange(self.buildChangeDetails(oldData, self.data()));
                  }
              });
          }
          this.clearSearch();
      },

      // multi
      onSortStart: function() {
          if (this.select) {
              throw new Error("Sorting of elements is not supported when attached to <select>. Attach to <input type='hidden'/> instead.");
          }

          // collapse search field into 0 width so its container can be collapsed as well
          this.search.width(0);
          // hide the container
          this.searchContainer.hide();
      },

      // multi
      onSortEnd:function() {

          var val=[], self=this;

          // show search and move it to the end of the list
          this.searchContainer.show();
          // make sure the search container is the last item in the list
          this.searchContainer.appendTo(this.searchContainer.parent());
          // since we collapsed the width in dragStarted, we resize it here
          this.resizeSearch();

          // update selection
          this.selection.find(".select2-search-choice").each(function() {
              val.push(self.opts.id($(this).data("select2-data")));
          });
          this.setVal(val);
          this.triggerChange();
      },

      // multi
      data: function(values, triggerChange) {
          var self=this, ids, old;
          if (arguments.length === 0) {
               return this.selection
                   .children(".select2-search-choice")
                   .map(function() { return $(this).data("select2-data"); })
                   .get();
          } else {
              old = this.data();
              if (!values) { values = []; }
              ids = $.map(values, function(e) { return self.opts.id(e); });
              this.setVal(ids);
              this.updateSelection(values);
              this.clearSearch();
              if (triggerChange) {
                  this.triggerChange(this.buildChangeDetails(old, this.data()));
              }
          }
      }
  });

  $.fn.select2 = function () {

      var args = Array.prototype.slice.call(arguments, 0),
          opts,
          select2,
          method, value, multiple,
          allowedMethods = ["val", "destroy", "opened", "open", "close", "focus", "isFocused", "container", "dropdown", "onSortStart", "onSortEnd", "enable", "disable", "readonly", "positionDropdown", "data", "search"],
          valueMethods = ["opened", "isFocused", "container", "dropdown"],
          propertyMethods = ["val", "data"],
          methodsMap = { search: "externalSearch" };

      this.each(function () {
          if (args.length === 0 || typeof(args[0]) === "object") {
              opts = args.length === 0 ? {} : $.extend({}, args[0]);
              opts.element = $(this);

              if (opts.element.get(0).tagName.toLowerCase() === "select") {
                  multiple = opts.element.prop("multiple");
              } else {
                  multiple = opts.multiple || false;
                  if ("tags" in opts) {opts.multiple = multiple = true;}
              }

              select2 = multiple ? new window.Select2["class"].multi() : new window.Select2["class"].single();
              select2.init(opts);
          } else if (typeof(args[0]) === "string") {

              if (indexOf(args[0], allowedMethods) < 0) {
                  throw "Unknown method: " + args[0];
              }

              value = undefined;
              select2 = $(this).data("select2");
              if (select2 === undefined) return;

              method=args[0];

              if (method === "container") {
                  value = select2.container;
              } else if (method === "dropdown") {
                  value = select2.dropdown;
              } else {
                  if (methodsMap[method]) method = methodsMap[method];

                  value = select2[method].apply(select2, args.slice(1));
              }
              if (indexOf(args[0], valueMethods) >= 0
                  || (indexOf(args[0], propertyMethods) >= 0 && args.length == 1)) {
                  return false; // abort the iteration, ready to return first matched value
              }
          } else {
              throw "Invalid arguments to select2 plugin: " + args;
          }
      });
      return (value === undefined) ? this : value;
  };

  // plugin defaults, accessible to users
  $.fn.select2.defaults = {
      debug: false,
      width: "copy",
      loadMorePadding: 0,
      closeOnSelect: true,
      openOnEnter: true,
      containerCss: {},
      dropdownCss: {},
      containerCssClass: "",
      dropdownCssClass: "",
      formatResult: function(result, container, query, escapeMarkup) {
          var markup=[];
          markMatch(this.text(result), query.term, markup, escapeMarkup);
          return markup.join("");
      },
      transformVal: function(val) {
          return $.trim(val);
      },
      formatSelection: function (data, container, escapeMarkup) {
          return data ? escapeMarkup(this.text(data)) : undefined;
      },
      sortResults: function (results, container, query) {
          return results;
      },
      formatResultCssClass: function(data) {return data.css;},
      formatSelectionCssClass: function(data, container) {return undefined;},
      minimumResultsForSearch: 0,
      minimumInputLength: 0,
      maximumInputLength: null,
      maximumSelectionSize: 0,
      id: function (e) { return e == undefined ? null : e.id; },
      text: function (e) {
        if (e && this.data && this.data.text) {
          if ($.isFunction(this.data.text)) {
            return this.data.text(e);
          } else {
            return e[this.data.text];
          }
        } else {
          return e.text;
        }
      },
      matcher: function(term, text) {
          return stripDiacritics(''+text).toUpperCase().indexOf(stripDiacritics(''+term).toUpperCase()) >= 0;
      },
      separator: ",",
      tokenSeparators: [],
      tokenizer: defaultTokenizer,
      escapeMarkup: defaultEscapeMarkup,
      blurOnChange: false,
      selectOnBlur: false,
      adaptContainerCssClass: function(c) { return c; },
      adaptDropdownCssClass: function(c) { return null; },
      nextSearchTerm: function(selectedObject, currentSearchTerm) { return undefined; },
      searchInputPlaceholder: '',
      createSearchChoicePosition: 'top',
      shouldFocusInput: function (instance) {
          // Attempt to detect touch devices
          var supportsTouchEvents = (('ontouchstart' in window) ||
                                     (navigator.msMaxTouchPoints > 0));

          // Only devices which support touch events should be special cased
          if (!supportsTouchEvents) {
              return true;
          }

          // Never focus the input if search is disabled
          if (instance.opts.minimumResultsForSearch < 0) {
              return false;
          }

          return true;
      }
  };

  $.fn.select2.locales = [];

  $.fn.select2.locales['en'] = {
       formatMatches: function (matches) { if (matches === 1) { return "One result is available, press enter to select it."; } return matches + " results are available, use up and down arrow keys to navigate."; },
       formatNoMatches: function () { return "No matches found"; },
       formatAjaxError: function (jqXHR, textStatus, errorThrown) { return "Loading failed"; },
       formatInputTooShort: function (input, min) { var n = min - input.length; return "Please enter " + n + " or more character" + (n == 1 ? "" : "s"); },
       formatInputTooLong: function (input, max) { var n = input.length - max; return "Please delete " + n + " character" + (n == 1 ? "" : "s"); },
       formatSelectionTooBig: function (limit) { return "You can only select " + limit + " item" + (limit == 1 ? "" : "s"); },
       formatLoadMore: function (pageNumber) { return "Loading more results…"; },
       formatSearching: function () { return "Searching…"; }
  };

  $.extend($.fn.select2.defaults, $.fn.select2.locales['en']);

  $.fn.select2.ajaxDefaults = {
      transport: $.ajax,
      params: {
          type: "GET",
          cache: false,
          dataType: "json"
      }
  };

  // exports
  window.Select2 = {
      query: {
          ajax: ajax,
          local: local,
          tags: tags
      }, util: {
          debounce: debounce,
          markMatch: markMatch,
          escapeMarkup: defaultEscapeMarkup,
          stripDiacritics: stripDiacritics
      }, "class": {
          "abstract": AbstractSelect2,
          "single": SingleSelect2,
          "multi": MultiSelect2
      }
  };

}(jQuery));
/**
*
* jQuery Interdependencies library
* http://miohtama.github.com/jquery-interdependencies/
* Copyright 2012-2013 Mikko Ohtamaa, others
*
* Customized by Codestar
*
*/
(function($) {

  'use strict';

  function Rule(controller, condition, value) {
    this.init(controller, condition, value);
  }

  $.extend(Rule.prototype, {

    init: function(controller, condition, value) {

      this.controller = controller;
      this.condition  = condition;
      this.value      = value;
      this.rules      = [];
      this.controls   = [];

    },

    evalCondition: function(context, control, condition, val1, val2) {

      if( condition == '==' ) {

        return this.checkBoolean(val1) == this.checkBoolean(val2);

      } else if( condition == '!=' ) {

        return this.checkBoolean(val1) != this.checkBoolean(val2);

      } else if( condition == '>=' ) {

        return Number(val2) >= Number(val1);

      } else if( condition == '<=' ) {

        return Number(val2) <= Number(val1);

      } else if( condition == '>' ) {

        return Number(val2) > Number(val1);

      } else if( condition == '<' ) {

        return Number(val2) < Number(val1);

      } else if( condition == '()' ) {

        return window[val1](context, control, val2);

      } else if( condition == 'any' ) {

        if( $.isArray( val2 ) ) {
          for (var i = val2.length - 1; i >= 0; i--) {
            if( $.inArray( val2[i], val1.split(',') ) !== -1 ) {
              return true;
            }
          }
        } else {
          if( $.inArray( val2, val1.split(',') ) !== -1 ) {
            return true;
          }
        }

      } else if( condition == 'not-any' ) {

        if( $.isArray( val2 ) ) {
          for (var i = val2.length - 1; i >= 0; i--) {
            if( $.inArray( val2[i], val1.split(',') ) == -1 ) {
              return true;
            }
          }
        } else {
          if( $.inArray( val2, val1.split(',') ) == -1 ) {
            return true;
          }
        }

      }

      return false;

    },

    checkBoolean: function(value) {

      switch( value ) {

        case true:
        case 'true':
        case 1:
        case '1':
          value = true;
        break;

        case null:
        case false:
        case 'false':
        case 0:
        case '0':
          value = false;
        break;

      }

      return value;
    },

    checkCondition: function( context ) {

      if( !this.condition ) {
        return true;
      }

      var control = context.find(this.controller);

      var control_value = this.getControlValue(context, control);

      if( control_value === undefined ) {
        return false;
      }

      control_value = this.normalizeValue(control, this.value, control_value);

      return this.evalCondition(context, control, this.condition, this.value, control_value);
    },

    normalizeValue: function( control, baseValue, control_value ) {

      if( typeof baseValue == 'number' ) {
        return parseFloat( control_value );
      }

      return control_value;
    },

    getControlValue: function(context, control) {
      if( control.length > 1 && ( control.attr('type') == 'radio' || control.attr('type') == 'checkbox' ) ) {
        return control.filter(':checked').map(function() { return this.value; }).get();
        //return control.attr("value")

      } else if ( control.attr('type') == 'checkbox' || control.attr('type') == 'radio' ) {
        return control.is(':checked');

      }
      return control.val();

    },

    createRule: function(controller, condition, value) {
      var rule = new Rule(controller, condition, value);
      this.rules.push(rule);
      return rule;
    },

    include: function(input) {
      this.controls.push(input);
    },

    applyRule: function(context, enforced) {

      var result;

      if( typeof( enforced ) == 'undefined' ) {
        result = this.checkCondition(context);
      } else {
        result = enforced;
      }

      var controls = $.map(this.controls, function(elem, idx) {
        return context.find(elem);
      });

      if( result ) {

        $(controls).each(function() {
          $(this).removeClass('wpfw-depend-on');
        });

        $(this.rules).each(function() {
          this.applyRule(context);
        });

      } else {

        $(controls).each(function() {
          $(this).addClass('wpfw-depend-on');
        });

        $(this.rules).each(function() {
          this.applyRule(context, false);
        });

      }
    }
  });

  function Ruleset() {
    this.rules = [];
  };

  $.extend(Ruleset.prototype, {

    createRule: function(controller, condition, value) {
      var rule = new Rule(controller, condition, value);
      this.rules.push(rule);
      return rule;
    },

    applyRules: function(context) {
      $(this.rules).each(function() {
        this.applyRule(context);
      });
    }
  });

  $.wpfw_deps = {

    createRuleset: function() {
      return new Ruleset();
    },

    enable: function(selection, ruleset, depends) {

      selection.on('change keyup', function(elem) {

        var depend_id = elem.target.getAttribute('data-depend-id') || elem.target.getAttribute('data-sub-depend-id');

        if( depends.indexOf( depend_id ) !== -1 ) {
          ruleset.applyRules(selection);
        }

      });

      ruleset.applyRules(selection);

      return true;
    }
  };

})(jQuery);

;/**
   * jQuery serializeObject
   * @copyright 2014, macek <paulmacek@gmail.com>
   * @link https://github.com/macek/jquery-serialize-object
   * @license BSD
   * @version 2.5.0
   */
  (function(root, factory) {

    // AMD
    if (typeof define === "function" && define.amd) {
      define(["exports", "jquery"], function(exports, $) {
        return factory(exports, $);
      });
    }

    // CommonJS
    else if (typeof exports !== "undefined") {
      var $ = require("jquery");
      factory(exports, $);
    }

    // Browser
    else {
      factory(root, (root.jQuery || root.Zepto || root.ender || root.$));
    }

  }(this, function(exports, $) {

    //
    // Custom WPFW: Added custom patterns for spesific validate
    //
    var patterns = {
      validate: /^(?!(_nonce|_pseudo))[a-zA-Z0-9_-]*(?:\[(?:\d*|(?!(_nonce|_pseudo))[a-zA-Z0-9_-]+)\])*$/i,
      key: /[a-zA-Z0-9_-]+|(?=\[\])/g,
      named: /^[a-zA-Z0-9_-]+$/,
      push: /^$/,
      fixed: /^\d+$/
    };

    function FormSerializer(helper, $form) {

      // private variables
      var data     = {},
          pushes   = {};

      // private API
      function build(base, key, value) {
        base[key] = value;
        return base;
      }

      function makeObject(root, value) {

        var keys = root.match(patterns.key), k;

        // nest, nest, ..., nest
        while ((k = keys.pop()) !== undefined) {
          // foo[]
          if (patterns.push.test(k)) {
            var idx = incrementPush(root.replace(/\[\]$/, ''));
            value = build([], idx, value);
          }

          // foo[n]
          else if (patterns.fixed.test(k)) {
            value = build([], k, value);
          }

          // foo; foo[bar]
          else if (patterns.named.test(k)) {
            value = build({}, k, value);
          }
        }

        return value;
      }

      function incrementPush(key) {
        if (pushes[key] === undefined) {
          pushes[key] = 0;
        }
        return pushes[key]++;
      }

      function addPair(pair) {
        if (!patterns.validate.test(pair.name)) return this;
        var obj = makeObject(pair.name, pair.value);
        data = helper.extend(true, data, obj);
        return this;
      }

      function addPairs(pairs) {
        if (!helper.isArray(pairs)) {
          throw new Error("formSerializer.addPairs expects an Array");
        }
        for (var i=0, len=pairs.length; i<len; i++) {
          this.addPair(pairs[i]);
        }
        return this;
      }

      function serialize() {
        return data;
      }

      function serializeJSON() {
        return JSON.stringify(serialize());
      }

      // public API
      this.addPair = addPair;
      this.addPairs = addPairs;
      this.serialize = serialize;
      this.serializeJSON = serializeJSON;
    }

    FormSerializer.patterns = patterns;

    FormSerializer.serializeObject = function serializeObject() {
      return new FormSerializer($, this).
        addPairs(this.serializeArray()).
        serialize();
    };

    FormSerializer.serializeJSON = function serializeJSON() {
      return new FormSerializer($, this).
        addPairs(this.serializeArray()).
        serializeJSON();
    };

    //
    // Custom WPFW: Renamed function names for avoid conflicts
    //

    if (typeof $.fn !== "undefined") {
      $.fn.serializeObjectWPFW = FormSerializer.serializeObject;
      $.fn.serializeJSONWPFW   = FormSerializer.serializeJSON;
    }

    exports.FormSerializer = FormSerializer;

    return FormSerializer;
  }));


  /*
	jQuery tagEditor v1.0.21
    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/jQuery-tagEditor
	License: http://www.opensource.org/licenses/mit-license.php
*/// http://code.accursoft.com/caret - 1.3.3
!function(e){e.fn.caret=function(e){var t=this[0],n="true"===t.contentEditable;if(0==arguments.length){if(window.getSelection){if(n){t.focus();var o=window.getSelection().getRangeAt(0),r=o.cloneRange();return r.selectNodeContents(t),r.setEnd(o.endContainer,o.endOffset),r.toString().length}return t.selectionStart}if(document.selection){if(t.focus(),n){var o=document.selection.createRange(),r=document.body.createTextRange();return r.moveToElementText(t),r.setEndPoint("EndToEnd",o),r.text.length}var e=0,c=t.createTextRange(),r=document.selection.createRange().duplicate(),a=r.getBookmark();for(c.moveToBookmark(a);0!==c.moveStart("character",-1);)e++;return e}return t.selectionStart?t.selectionStart:0}if(-1==e&&(e=this[n?"text":"val"]().length),window.getSelection)n?(t.focus(),window.getSelection().collapse(t.firstChild,e)):t.setSelectionRange(e,e);else if(document.body.createTextRange)if(n){var c=document.body.createTextRange();c.moveToElementText(t),c.moveStart("character",e),c.collapse(!0),c.select()}else{var c=t.createTextRange();c.move("character",e),c.select()}return n||t.focus(),e}}(jQuery);
(function($){
  // auto grow input (stackoverflow.com/questions/931207)
  $.fn.tagEditorInput=function(){var t=" ",e=$(this),n=parseInt(e.css("fontSize")),i=$("<span/>").css({position:"absolute",top:-9999,left:-9999,width:"auto",fontSize:e.css("fontSize"),fontFamily:e.css("fontFamily"),fontWeight:e.css("fontWeight"),letterSpacing:e.css("letterSpacing"),whiteSpace:"nowrap"}),s=function(){if(t!==(t=e.val())){i.text(t);var s=i.width()+n;20>s&&(s=20),s!=e.width()&&e.width(s)}};return i.insertAfter(e),e.bind("keyup keydown focus",s)};

  // plugin with val as parameter for public methods
  $.fn.tagEditor = function(options, val, blur){

      // helper
      function escape(tag) {
          return tag.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      }

      // build options dictionary with default values
      var blur_result, o = $.extend({}, $.fn.tagEditor.defaults, options), selector = this;

      // store regex and default delimiter in options for later use
      o.dregex = new RegExp('['+o.delimiter.replace('-', '\-')+']', 'g');

      // public methods
      if (typeof options == 'string') {
          // depending on selector, response may contain tag lists of multiple editor instances
          var response = [];
          selector.each(function(){
              // the editor is the next sibling to the hidden, original field
              var el = $(this), o = el.data('options'), ed = el.next('.tag-editor');
              if (options == 'getTags')
                  response.push({field: el[0], editor: ed, tags: ed.data('tags')});
              else if (options == 'addTag') {
                  if (o.maxTags && ed.data('tags').length >= o.maxTags) return false;
                  // insert new tag
                  $('<li><div class="tag-editor-spacer">&nbsp;'+o.delimiter[0]+'</div><div class="tag-editor-tag"></div><div class="tag-editor-delete"><i></i></div></li>').appendTo(ed).find('.tag-editor-tag')
                      .html('<input type="text" maxlength="'+o.maxLength+'">').addClass('active').find('input').val(val).blur();
                  if (!blur) ed.click();
                  else $('.placeholder', ed).remove();
              } else if (options == 'removeTag') {
                  // trigger delete on matching tag, then click editor to create a new tag
                  $('.tag-editor-tag', ed).filter(function(){return $(this).text()==val;}).closest('li').find('.tag-editor-delete').click();
                  if (!blur) ed.click();
              } else if (options == 'destroy') {
                  el.removeClass('tag-editor-hidden-src').removeData('options').off('focus.tag-editor').next('.tag-editor').remove();
              }
          });
          return options == 'getTags' ? response : this;
      }

      // delete selected tags on backspace, delete, ctrl+x
      if (window.getSelection) $(document).off('keydown.tag-editor').on('keydown.tag-editor', function(e){
          if (e.which == 8 || e.which == 46 || e.ctrlKey && e.which == 88) {
              try {
                  var sel = getSelection(), el = document.activeElement.tagName != 'INPUT' ? $(sel.getRangeAt(0).startContainer.parentNode).closest('.tag-editor') : 0;
              } catch(e){ el = 0; }
              if (sel.rangeCount > 0 && el && el.length) {
                  var tags = [], splits = sel.toString().split(el.prev().data('options').dregex);
                  for (i=0; i<splits.length; i++){ var tag = $.trim(splits[i]); if (tag) tags.push(tag); }
                  $('.tag-editor-tag', el).each(function(){
                      if (~$.inArray($(this).text(), tags)) $(this).closest('li').find('.tag-editor-delete').click();
                  });
                  return false;
              }
          }
      });

      return selector.each(function(){
          var el = $(this), tag_list = []; // cache current tags

          // create editor (ed) instance
          var ed = $('<ul '+(o.clickDelete ? 'oncontextmenu="return false;" ' : '')+'class="tag-editor"></ul>').insertAfter(el);
          el.addClass('tag-editor-hidden-src') // hide original field
              .data('options', o) // set data on hidden field
              .on('focus.tag-editor', function(){ ed.click(); }); // simulate tabindex

          // add dummy item for min-height on empty editor
          ed.append('<li style="width:1px">&nbsp;</li>');

          // markup for new tag
          var new_tag = '<li><div class="tag-editor-spacer">&nbsp;'+o.delimiter[0]+'</div><div class="tag-editor-tag"></div><div class="tag-editor-delete"><i></i></div></li>';

          // helper: update global data
          function set_placeholder(){
              if (o.placeholder && !tag_list.length && !$('.deleted, .placeholder, input', ed).length)
                  ed.append('<li class="placeholder"><div>'+o.placeholder+'</div></li>');
          }

          // helper: update global data
          function update_globals(init){
              var old_tags = tag_list.toString();
              tag_list = $('.tag-editor-tag:not(.deleted)', ed).map(function(i, e) {
                  var val = $.trim($(this).hasClass('active') ? $(this).find('input').val() : $(e).text());
                  if (val) return val;
              }).get();
              ed.data('tags', tag_list);
              el.val(tag_list.join(o.delimiter[0]));
              // change callback except for plugin init
              if (!init) if (old_tags != tag_list.toString()) o.onChange(el, ed, tag_list);
              set_placeholder();
          }

          ed.click(function(e, closest_tag){
              var d, dist = 99999, loc;

              // do not create tag when user selects tags by text selection
              if (window.getSelection && getSelection() != '') return;

              if (o.maxTags && ed.data('tags').length >= o.maxTags) { ed.find('input').blur(); return false; }

              blur_result = true
              $('input:focus', ed).blur();
              if (!blur_result) return false;
              blur_result = true

              // always remove placeholder on click
              $('.placeholder', ed).remove();
              if (closest_tag && closest_tag.length)
                  loc = 'before';
              else {
                  // calculate tag closest to click position
                  $('.tag-editor-tag', ed).each(function(){
                      var tag = $(this), to = tag.offset(), tag_x = to.left, tag_y = to.top;
                      if (e.pageY >= tag_y && e.pageY <= tag_y+tag.height()) {
                          if (e.pageX < tag_x) loc = 'before', d = tag_x - e.pageX;
                          else loc = 'after', d = e.pageX - tag_x - tag.width();
                          if (d < dist) dist = d, closest_tag = tag;
                      }
                  });
              }

              if (loc == 'before') {
                  $(new_tag).insertBefore(closest_tag.closest('li')).find('.tag-editor-tag').click();
              } else if (loc == 'after')
                  $(new_tag).insertAfter(closest_tag.closest('li')).find('.tag-editor-tag').click();
              else // empty editor
                  $(new_tag).appendTo(ed).find('.tag-editor-tag').click();
              return false;
          });

          ed.on('click', '.tag-editor-delete', function(e){
              // delete icon is hidden when input is visible; place cursor near invisible delete icon on click
              if ($(this).prev().hasClass('active')) { $(this).closest('li').find('input').caret(-1); return false; }

              var li = $(this).closest('li'), tag = li.find('.tag-editor-tag');
              if (o.beforeTagDelete(el, ed, tag_list, tag.text()) === false) return false;
              tag.addClass('deleted').animate({width: 0}, o.animateDelete, function(){ li.remove(); set_placeholder(); });
              update_globals();
              return false;
          });

          // delete on right mouse click or ctrl+click
          if (o.clickDelete)
              ed.on('mousedown', '.tag-editor-tag', function(e){
                  if (e.ctrlKey || e.which > 1) {
                      var li = $(this).closest('li'), tag = li.find('.tag-editor-tag');
                      if (o.beforeTagDelete(el, ed, tag_list, tag.text()) === false) return false;
                      tag.addClass('deleted').animate({width: 0}, o.animateDelete, function(){ li.remove(); set_placeholder(); });
                      update_globals();
                      return false;
                  }
              });

          ed.on('click', '.tag-editor-tag', function(e){
              // delete on right click or ctrl+click -> exit
              if (o.clickDelete && (e.ctrlKey || e.which > 1)) return false;

              if (!$(this).hasClass('active')) {
                  var tag = $(this).text();
                  // guess cursor position in text input
                  var left_percent = Math.abs(($(this).offset().left - e.pageX)/$(this).width()), caret_pos = parseInt(tag.length*left_percent),
                      input = $(this).html('<input type="text" maxlength="'+o.maxLength+'" value="'+escape(tag)+'">').addClass('active').find('input');
                      input.data('old_tag', tag).tagEditorInput().focus().caret(caret_pos);
                  if (o.autocomplete) {
                      var aco = $.extend({}, o.autocomplete);
                      // extend user provided autocomplete select method
                      var ac_select = 'select'  in aco ? o.autocomplete.select : '';
                      aco.select = function(e, ui){ if (ac_select) ac_select(e, ui); setTimeout(function(){
                          ed.trigger('click', [$('.active', ed).find('input').closest('li').next('li').find('.tag-editor-tag')]);
                      }, 20); };
                      input.autocomplete(aco);
                  }
              }
              return false;
          });

          // helper: split into multiple tags, e.g. after paste
          function split_cleanup(input){
              var li = input.closest('li'), sub_tags = input.val().replace(/ +/, ' ').split(o.dregex),
                  old_tag = input.data('old_tag'), old_tags = tag_list.slice(0), exceeded = false, cb_val; // copy tag_list
              for (var i=0; i<sub_tags.length; i++) {
                  tag = $.trim(sub_tags[i]).slice(0, o.maxLength);
                  if (o.forceLowercase) tag = tag.toLowerCase();
                  cb_val = o.beforeTagSave(el, ed, old_tags, old_tag, tag);
                  tag = cb_val || tag;
                  if (cb_val === false || !tag) continue;
                  // remove duplicates
                  if (o.removeDuplicates && ~$.inArray(tag, old_tags))
                      $('.tag-editor-tag', ed).each(function(){ if ($(this).text() == tag) $(this).closest('li').remove(); });
                  old_tags.push(tag);
                  li.before('<li><div class="tag-editor-spacer">&nbsp;'+o.delimiter[0]+'</div><div class="tag-editor-tag">'+escape(tag)+'</div><div class="tag-editor-delete"><i></i></div></li>');
                  if (o.maxTags && old_tags.length >= o.maxTags) { exceeded = true; break; }
              }
              input.attr('maxlength', o.maxLength).removeData('old_tag').val('')
              if (exceeded) input.blur(); else input.focus();
              update_globals();
          }

          ed.on('blur', 'input', function(e){
              e.stopPropagation();
              var input = $(this), old_tag = input.data('old_tag'), tag = $.trim(input.val().replace(/ +/, ' ').replace(o.dregex, o.delimiter[0]));
              if (!tag) {
                  if (old_tag && o.beforeTagDelete(el, ed, tag_list, old_tag) === false) {
                      input.val(old_tag).focus();
                      blur_result = false;
                      update_globals();
                      return;
                  }
                  try { input.closest('li').remove(); } catch(e){}
                  if (old_tag) update_globals();
              }
              else if (tag.indexOf(o.delimiter[0])>=0) { split_cleanup(input); return; }
              else if (tag != old_tag) {
                  if (o.forceLowercase) tag = tag.toLowerCase();
                  cb_val = o.beforeTagSave(el, ed, tag_list, old_tag, tag);
                  tag = cb_val || tag;
                  if (cb_val === false) {
                      if (old_tag) {
                          input.val(old_tag).focus();
                          blur_result = false;
                          update_globals();
                          return;
                      }
                      try { input.closest('li').remove(); } catch(e){}
                      if (old_tag) update_globals();
                  }
                  // remove duplicates
                  else if (o.removeDuplicates)
                      $('.tag-editor-tag:not(.active)', ed).each(function(){ if ($(this).text() == tag) $(this).closest('li').remove(); });
              }
              input.parent().html(escape(tag)).removeClass('active');
              if (tag != old_tag) update_globals();
              set_placeholder();
          });

          var pasted_content;
          ed.on('paste', 'input', function(e){
              $(this).removeAttr('maxlength');
              pasted_content = $(this);
              setTimeout(function(){ split_cleanup(pasted_content); }, 30);
          });

          // keypress delimiter
          var inp;
          ed.on('keypress', 'input', function(e){
              if (o.delimiter.indexOf(String.fromCharCode(e.which))>=0) {
                  inp = $(this);
                  setTimeout(function(){ split_cleanup(inp); }, 20);
              }
          });

          ed.on('keydown', 'input', function(e){
              var $t = $(this);

              // left/up key + backspace key on empty field
              if ((e.which == 37 || !o.autocomplete && e.which == 38) && !$t.caret() || e.which == 8 && !$t.val()) {
                  var prev_tag = $t.closest('li').prev('li').find('.tag-editor-tag');
                  if (prev_tag.length) prev_tag.click().find('input').caret(-1);
                  else if ($t.val() && !(o.maxTags && ed.data('tags').length >= o.maxTags)) $(new_tag).insertBefore($t.closest('li')).find('.tag-editor-tag').click();
                  return false;
              }
              // right/down key
              else if ((e.which == 39 || !o.autocomplete && e.which == 40) && ($t.caret() == $t.val().length)) {
                  var next_tag = $t.closest('li').next('li').find('.tag-editor-tag');
                  if (next_tag.length) next_tag.click().find('input').caret(0);
                  else if ($t.val()) ed.click();
                  return false;
              }
              // tab key
              else if (e.which == 9) {
                  // shift+tab
                  if (e.shiftKey) {
                      var prev_tag = $t.closest('li').prev('li').find('.tag-editor-tag');
                      if (prev_tag.length) prev_tag.click().find('input').caret(0);
                      else if ($t.val() && !(o.maxTags && ed.data('tags').length >= o.maxTags)) $(new_tag).insertBefore($t.closest('li')).find('.tag-editor-tag').click();
                      // allow tabbing to previous element
                      else {
                          el.attr('disabled', 'disabled');
                          setTimeout(function(){ el.removeAttr('disabled'); }, 30);
                          return;
                      }
                      return false;
                  // tab
                  } else {
                      var next_tag = $t.closest('li').next('li').find('.tag-editor-tag');
                      if (next_tag.length) next_tag.click().find('input').caret(0);
                      else if ($t.val()) ed.click();
                      else return; // allow tabbing to next element
                      return false;
                  }
              }
              // del key
              else if (e.which == 46 && (!$.trim($t.val()) || ($t.caret() == $t.val().length))) {
                  var next_tag = $t.closest('li').next('li').find('.tag-editor-tag');
                  if (next_tag.length) next_tag.click().find('input').caret(0);
                  else if ($t.val()) ed.click();
                  return false;
              }
              // enter key
              else if (e.which == 13) {
                  ed.trigger('click', [$t.closest('li').next('li').find('.tag-editor-tag')]);

                  // trigger blur if maxTags limit is reached
                  if (o.maxTags && ed.data('tags').length >= o.maxTags) ed.find('input').blur();

                  return false;
              }
              // pos1
              else if (e.which == 36 && !$t.caret()) ed.find('.tag-editor-tag').first().click();
              // end
              else if (e.which == 35 && $t.caret() == $t.val().length) ed.find('.tag-editor-tag').last().click();
              // esc
              else if (e.which == 27) {
                  $t.val($t.data('old_tag') ? $t.data('old_tag') : '').blur();
                  return false;
              }
          });

          // create initial tags
          var tags = o.initialTags.length ? o.initialTags : el.val().split(o.dregex);
          for (var i=0; i<tags.length; i++) {
              if (o.maxTags && i >= o.maxTags) break;
              var tag = $.trim(tags[i].replace(/ +/, ' '));
              if (tag) {
                  if (o.forceLowercase) tag = tag.toLowerCase();
                  tag_list.push(tag);
                  ed.append('<li><div class="tag-editor-spacer">&nbsp;'+o.delimiter[0]+'</div><div class="tag-editor-tag">'+escape(tag)+'</div><div class="tag-editor-delete"><i></i></div></li>');
              }
          }
          update_globals(true); // true -> no onChange callback

          // init sortable
          if (o.sortable && $.fn.sortable) ed.sortable({
              distance: 5, cancel: '.tag-editor-spacer, input', helper: 'clone',
              update: function(){ update_globals(); }
          });
      });
  };

  $.fn.tagEditor.defaults = {
      initialTags: [],
      maxTags: 0,
      maxLength: 50,
      delimiter: ',;',
      placeholder: '',
      forceLowercase: true,
      removeDuplicates: true,
      clickDelete: false,
      animateDelete: 175,
      sortable: true, // jQuery UI sortable
      autocomplete: null, // options dict for jQuery UI autocomplete

      // callbacks
      onChange: function(){},
      beforeTagSave: function(){},
      beforeTagDelete: function(){}
  };
}(jQuery));





/**
 * Tiny Autocomplete
 * Small and fast autocomplete plugin for Zepto and jQuery.
 * Written by Johan Halse, https://twitter.com/hejsna, johan@varvet.se
 * Contributions by Juha Tauriainen, https://github.com/JuhQ and
 * Phoebe Bright, https://github.com/phoebebright
 * License: http://johanhalse.mit-license.org
 * @version 1.0.0
 * @return {object}         Self
 */

var factory = function($, window) {
  var TinyAutocomplete = function(el, options) {
    var that = this; // This is just to minify better
    that.field = $(el);
    that.el = null;
    that.json = null;
    that.items = [];
    that.selectedItem = null;
    that.list = $('<ul class="autocomplete-list" />');
    that.lastSearch = null;
    that.options = options;
  };

  TinyAutocomplete.prototype = {
    defaults: {
      minChars: 2,
      markAsBold: true,
      grouped: false,
      queryProperty: "q",
      queryParameters: {},
      method: "get",
      scrollOnFocus: "auto",
      maxItems: 100,
      keyboardDelay: 300,
      lastItemTemplate: null,
      closeOnSelect: true,
      groupContentName: ".autocomplete-items",
      groupTemplate:
        '<li class="autocomplete-group"><span class="autocomplete-group-header">{{title}}</span><ul class="autocomplete-items" /></li>',
      itemTemplate: '<li class="autocomplete-item">{{title}}</li>',
      showNoResults: false,
      noResultsTemplate:
        '<li class="autocomplete-item">No results for {{title}}</li>',
      wrapClasses: "autocomplete"
    },

    /**
     * Constructor
     * @return {null}
     */
    init: function() {
      this.defaults.templateMethod = this.template;
      this.settings = $.extend({}, this.defaults, this.options);
      this.setupSettings();
      this.setupMarkup();
      this.setupEvents();

      return this;
    },

    /**
     * Micro-templating utility
     * @param  {string} template Template string with mustache-style curly braces
     * @param  {object} vars     Contains values to interpolate with
     * @return {string}          Interpolated string
     */
    template: function(template, vars) {
      return template.replace(/{{\s*[\w]+\s*}}/g, function(v) {
        return vars[v.substr(2, v.length - 4)];
      });
    },

    /**
     * Debounce function from http://davidwalsh.name/javascript-debounce-function
     * @param  {function} func       function to execute
     * @param  {number}   wait       delay in milliseconds
     * @param  {boolean}  immediate  whether to fire on trailing or leading
     * @return {function}            debounced function
     */
    debounce: function(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this,
          args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    },

    /**
     * Tweak settings a bit, since we don't have any private functions
     * defined at constructor time.
     * @return {null}
     */
    setupSettings: function() {
      if (this.settings.scrollOnFocus == "auto") {
        this.settings.scrollOnFocus = this.isTouchDevice();
      }

      // We might be on a mobile device and have little in the way of
      // vertical real estate to work with. Cap it! This check needs a
      // bit more intelligence to it.
      if (window.innerWidth < 700) {
        this.settings.maxItems = Math.min(this.settings.maxItems, 3);
      }

      // Using local data or remote url?
      if (this.settings.data) {
        this.request = this.localRequest;
      } else {
        this.request = this.remoteRequest;
      }

      // Set the keyboard delay before search fires
      if (this.settings.keyboardDelay != null) {
        this.request = this.debounce(this.request, this.settings.keyboardDelay);
      }
    },

    /**
     * Register initial callbacks
     * @return {null}
     */
    setupEvents: function() {
      this.el.on("keyup", ".autocomplete-field", $.proxy(this.onKeyUp, this));
      this.el.on(
        "keydown",
        ".autocomplete-field",
        $.proxy(this.onKeyDown, this)
      );
      this.el.on(
        "mousedown",
        ".autocomplete-item",
        $.proxy(this.onClickItem, this)
      );

      this.el.on("blur", ".autocomplete-field", $.proxy(this.closeList, this));

      // Scroll to field if we're on a small device, we need that
      // screen real estate!
      if (this.settings.scrollOnFocus) {
        this.field.on("focus", function() {
          var h = $(this).offset().top;
          setTimeout(function() {
            window.scrollTo(0, h);
          }, 0);
        });
      }
    },

    /**
     * Wrap field in required markup and set up this.el
     * @return {null}
     */
    setupMarkup: function() {
      this.field.addClass("autocomplete-field");
      this.field.attr("autocomplete", "off");
      this.field.wrap('<div class="' + this.settings.wrapClasses + '" />');
      this.el = this.field.parent();
    },

    /**
     * Fire request to specified url
     * @param  {string} val Value to search for
     * @return {null}
     */
    remoteRequest: function(val) {
      this.field.trigger("beforerequest", [this, val]);
      var data = {};
      $.extend(data, this.settings.queryParameters);
      data[this.settings.queryProperty] = val;
      $.ajax({
        method: this.settings.method,
        url: this.settings.url,
        dataType: "json",
        data: data,
        success: $.proxy(this.beforeReceiveData, this)
      });
    },

    /**
     * Match request in local data instead of remote url
     * @param  {string} val Value to search for
     * @return {null}
     */
    localRequest: function(val) {
      if (this.settings.grouped) {
        this.beforeReceiveData(this.matchLocalPatternGrouped(val));
      } else {
        this.beforeReceiveData(this.matchLocalPatternFlat(val));
      }
    },

    /**
     * Match the data in a flat array and return the objects where a
     * hit was found.
     * @param  {string} val Value to search for
     * @return {array}      Array of hits
     */
    matchLocalPatternFlat: function(val) {
      return this.matchArray(val, this.settings.data);
    },

    /**
     * Match the data in a grouped array and return the objects where a
     * hit was found, in the same manner
     * @param  {string} val Value to search for
     * @return {array}      Array of hits
     */
    matchLocalPatternGrouped: function(val) {
      var r = $.extend(true, [], this.settings.data);

      for (var i = 0; i < r.length; i++) {
        var a = this.matchArray(val, r[i].data);
        if (a.length == 0) {
          r.splice(i, 1);
          i--;
        } else {
          r[i].data = a;
        }
      }

      return r;
    },

    /**
     * Return an array of matched values from a source array
     * @param  {string} val String to search for
     * @param  {array} arr  Array to search in
     * @return {array}      Matched array
     */
    matchArray: function(val, arr) {
      var r = [];
      for (var i = 0; i < arr.length; i++) {
        for (var j in arr[i]) {
          if (
            (arr[i][j].toLowerCase &&
              arr[i][j].toLowerCase().indexOf(val.toLowerCase()) > -1) ||
            arr[i][j] == val
          ) {
            r.push(arr[i]);
            break;
          }
        }
      }

      return r;
    },

    /**
     * Find DOM object at specified index
     * @param  {number} i Index
     * @return {object}   DOM object
     */
    itemAt: function(i) {
      if (i == null) {
        return $();
      }

      return this.el.find(".autocomplete-item").eq(i);
    },

    /**
     * Find item number for clicked item
     * @param  {object} o The clicked object
     * @return {number}   Item's id in array
     */
    clickedItemAt: function(o) {
      for (var i = 0; i < this.items.length; i++) {
        if (
          o ==
          this.el
            .find(".autocomplete-item")
            .eq(i)
            .get(0)
        ) {
          return i;
        }
      }
      return null;
    },

    /**
     * Select previous item
     * @return {null}
     */
    prevItem: function() {
      this.selectedItem--;
      if (this.selectedItem < 0) {
        this.selectedItem = null;
      }

      this.markSelected(this.selectedItem);
    },

    /**
     * Select next item
     * @return {null}
     */
    nextItem: function() {
      if (this.selectedItem == null) {
        this.selectedItem = -1;
      }
      this.selectedItem++;

      var l = this.settings.lastItemTemplate
        ? this.items.length
        : this.items.length - 1;
      if (this.selectedItem >= l) {
        this.selectedItem = l;
      }

      this.markSelected(this.selectedItem);
    },

    /**
     * Mark an item as selected
     * @param  {number} i Item's id in items array
     * @return {null}
     */
    markSelected: function(i) {
      this.el.find(".active").removeClass("active");
      this.itemAt(i).addClass("active");
    },

    /**
     * Iterate through data, adding <strong> tags for every hit.
     * Splits strings into words using whitespace and matches each
     * word separately.
     * @param  {object} v   Data to operate on
     * @param  {string} str String to search for
     * @return {object}     Processed data object
     */
    markHitText: function(v, str) {
      var words = str.split(" ");
      for (var i in v) {
        if (typeof v[i] == "string" && i != "template") {
          var replacements = [str];
          for (var j = 0; j < words.length; j++) {
            var word = words[j].trim().replace(/[^a-ö0-9]/gi, ""); // Remove non-alphanumerics
            if (word.length > 0) {
              replacements.push(word);
            }
          }
          v[i] = v[i].replace(
            new RegExp("(" + replacements.join("|") + ")", "gi"),
            "<strong>$1</strong>"
          );
        }
      }
      return v;
    },

    /**
     * Render groups. This must be done before calling
     * renderItemsInGroups, since it resets the list markup and
     * attaches a new this.list object.
     * @return {null}
     */
    renderGroups: function() {
      this.list.remove();
      this.list = $('<ul class="autocomplete-list" />');
      for (var i in this.json) {
        this.list.append(
          this.settings.templateMethod(
            this.settings.groupTemplate,
            this.json[i]
          )
        );
      }

      this.el.append(this.list);
    },

    /**
     * Iterates through items and attaches them to their respective
     * groups.
     * @return {null}
     */
    renderItemsInGroups: function() {
      var v = this.field.val();
      for (var i = 0; i < this.json.length; i++) {
        var group = this.el.find(this.settings.groupContentName).eq(i);
        for (
          var j = 0;
          j < this.json[i].data.length && j < this.settings.maxItems;
          j++
        ) {
          var jsonData = $.extend({}, this.json[i].data[j]);
          // Strongify hits
          if (this.settings.markAsBold) {
            jsonData = this.markHitText(jsonData, v);
          }
          group.append(
            this.settings.templateMethod(
              this.json[i].template || this.settings.itemTemplate,
              jsonData
            )
          );
        }
      }
    },

    /**
     * If we're not dealing with groups, just attach items to the list.
     * @return {null}
     */
    renderItemsFlat: function() {
      this.list.remove();
      this.list = $('<ul class="autocomplete-list" />');
      var v = this.field.val();
      for (var i = 0; i < this.json.length && i < this.settings.maxItems; i++) {
        var jsonData = $.extend({}, this.json[i]);
        // Strongify hits
        if (this.settings.markAsBold) {
          jsonData = this.markHitText(jsonData, v);
        }
        this.list.append(
          this.settings.templateMethod(
            this.json[i].template || this.settings.itemTemplate,
            jsonData
          )
        );
      }
      this.el.append(this.list);
    },

    /**
     * If there's a last "find all results for..." item, this function
     * gets called.
     * @return {null}
     */
    renderLastItem: function() {
      this.list.append(
        this.settings.templateMethod(this.settings.lastItemTemplate, {
          title: this.field.val()
        })
      );
    },

    /**
     * If there's a "no results found for..." item, this function
     * gets called.
     * @return {null}
     */
    renderNoResults: function() {
      this.list.append(
        this.settings.templateMethod(this.settings.noResultsTemplate, {
          title: this.field.val()
        })
      );
    },

    /**
     * Removes list from DOM and resets state.
     * @return {null}
     */
    closeList: function() {
      $("html").off("click");
      this.list.remove();
      this.selectedItem = null;
    },

    /**
     * Since groups aren't selectable, we need to fetch the actual
     * selectable items and keep them around in our this.items list.
     * @return {array} List of selectable items
     */
    getItemsFromGroups: function() {
      var r = [];
      for (var i in this.json) {
        for (var j = 0; j < this.json[i].data.length; j++) {
          if (j < this.settings.maxItems) {
            r.push(this.json[i].data[j]);
          }
        }
      }

      return r;
    },

    /**
     * Check whether a value has changed. Used to determine whether or
     * not we fire a new request, since all keypresses generate an
     * event.
     * @return {boolean} True if value has changed since last request
     */
    valueHasChanged: function() {
      if (this.field.val() != this.lastSearch) {
        this.lastSearch = this.field.val();
        return true;
      }
      return false;
    },

    /**
     * A naive implementation of touch detection. In this day and age
     * with Microsoft Surfaces and whatnot, this should probably be
     * replaced with something more intelligent. But let's do that when
     * we find the time.
     * @return {boolean} Whether or not this is a touch device
     */
    isTouchDevice: function() {
      return !!("ontouchstart" in window);
    },

    /**
     * This is mostly an opportunity to hook into the data served by
     * server to do your own thing
     * @param  {object} data JSON from server
     * @param  {object} xhr  XHR object
     * @return {null}
     */
    beforeReceiveData: function(data, xhr) {
      this.json = data;
      this.field.trigger("receivedata", [this, data, xhr]);
      this.onReceiveData(this.json);
    },

    /**
     * Data received from server, determine what to do with it and
     * render everything.
     * @param  {object} data JSON from server
     * @return {null}
     */
    onReceiveData: function(data) {
      this.selectedItem = null;
      if (this.settings.grouped) {
        // First, render groups
        this.renderGroups();

        // Then, render the selectable items
        this.items = this.getItemsFromGroups();
        this.renderItemsInGroups();
      } else {
        this.items = this.json;
        this.renderItemsFlat();
      }

      // If no results, render no results message, if applicable
      if (!this.items.length) {
        if (this.settings.showNoResults) {
          this.renderNoResults();
        }
      }

      // Render last item, if applicable
      if (this.settings.lastItemTemplate) {
        this.renderLastItem();
      }

      // Click outside should close the list
      $("html").one("click", $.proxy(this.closeList, this));
    },

    /**
     * Keyup handler. If value has changed and contains min number of chars,
     * fire the (debounced) request.
     * @param  {object} e Normalized Event object
     * @return {null}
     */
    onKeyUp: function(e) {
      if (
        this.field.val().length >= this.settings.minChars &&
        this.valueHasChanged()
      ) {
        this.request(this.field.val());
      }
      if (this.field.val() == "") {
        this.lastSearch = "";
        this.closeList();
      }
    },

    /**
     * Keydown handler to take care of keyboard navigation.
     * @param  {object} e Normalized event object
     * @return {null}
     */
    onKeyDown: function(e) {
      if (e.keyCode == 38) {
        // Up
        e.preventDefault();
        this.prevItem();
      }
      if (e.keyCode == 40) {
        // Down
        e.preventDefault();
        this.nextItem();
      }
      if (e.keyCode == 13) {
        // Enter
        this.onPressEnter(e);
      }
      if (e.keyCode == 27) {
        // Esc
        e.preventDefault();
        this.closeList();
      }
    },

    /**
     * Click handler, handle mouse/touch selection of items.
     * @param  {object} e Normalized event object
     * @return {null}
     */
    onClickItem: function(e) {
      var i = this.clickedItemAt(e.currentTarget);
      this.onSelect(e.currentTarget, this.items[i]);
    },

    /**
     * User has pressed enter, select object or perform search.
     * @return {null}
     */
    onPressEnter: function(e) {
      // If field is filled in but no item is selected, we don't block
      // submit
      if (this.selectedItem === null) {
        return true;
      }

      e.preventDefault();
      this.onSelect(
        this.itemAt(this.selectedItem),
        this.items[this.selectedItem]
      );
    },

    /**
     * User has selected an object with mouse or keyboard - act on it
     * and fire any user-supplied callback.
     * @param  {object} item DOM object for the field
     * @param  {object} val  Item value from server
     * @return {null}
     */
    onSelect: function(item, val) {
      if (this.settings.onSelect) {
        this.settings.onSelect.apply(this.field, [item, val]);
      }
      this.lastSearch = this.field.val();
      if (this.settings.closeOnSelect) {
        this.closeList();
      }
    }
  };

  TinyAutocomplete.defaults = TinyAutocomplete.prototype.defaults;

  jQuery.fn.tinyAutocomplete = function(settings) {
    return this.each(function() {
      if (this.tinyAutocomplete) {
        // Prevent TinyAutocomplete from creating a new object. Instead,
        // just update the settings object
        $.extend(this.tinyAutocomplete.settings, settings);
        return this;
      }

      var d = new TinyAutocomplete(this, settings).init();

      // Expose "tinyAutocomplete.settings" to the cold outside
      this.tinyAutocomplete = { settings: d.settings };
    });
  };
};

if (typeof exports !== "undefined") {
  module.exports = factory;
} else {
  factory($, window);
}