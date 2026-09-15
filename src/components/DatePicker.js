// A calendar for picking a birthday. Month and year are native selects rather than
// arrows, because arrows are 259 clicks back to 2005.

import React, { useEffect, useRef, useState } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = [['Mo', 'Monday'], ['Tu', 'Tuesday'], ['We', 'Wednesday'],
  ['Th', 'Thursday'], ['Fr', 'Friday'], ['Sa', 'Saturday'], ['Su', 'Sunday']];

const daysIn = (year, month) => new Date(year, month + 1, 0).getDate();
// Monday-first offset. getDay() returns 0 for Sunday, which would put it first.
const startOffset = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7;
const clamp = (date, min, max) => (date < min ? min : date > max ? max : date);

const DatePicker = ({ value, min, max, onPick, onClose }) => {
  const [cursor, setCursor] = useState(() => clamp(value ?? new Date(max.getFullYear() - 18, 0, 1), min, max));
  const gridRef = useRef(null);
  const popupRef = useRef(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const years = [];
  for (let y = max.getFullYear(); y >= min.getFullYear(); y -= 1) years.push(y);

  useEffect(() => {
    gridRef.current?.querySelector('[tabindex="0"]')?.focus();
  }, [year, month]);

  useEffect(() => {
    const onDown = (e) => {
      if (!popupRef.current?.contains(e.target)) onClose();
    };
    // Deferred, or the click that opened the popup closes it again.
    const id = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const move = (days) => setCursor((c) => clamp(new Date(c.getFullYear(), c.getMonth(), c.getDate() + days), min, max));

  const onKeyDown = (event) => {
    const keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in keys) move(keys[event.key]);
    else if (event.key === 'Home') move(-((cursor.getDay() + 6) % 7));
    else if (event.key === 'End') move(6 - ((cursor.getDay() + 6) % 7));
    else if (event.key === 'PageUp') setCursor((c) => clamp(new Date(c.getFullYear(), c.getMonth() - 1, c.getDate()), min, max));
    else if (event.key === 'PageDown') setCursor((c) => clamp(new Date(c.getFullYear(), c.getMonth() + 1, c.getDate()), min, max));
    else if (event.key === 'Escape') onClose();
    else if (event.key === 'Enter' || event.key === ' ') onPick(cursor);
    else return;
    // Arrows and Page keys scroll the page underneath if this is missed.
    event.preventDefault();
  };

  const weeks = [];
  let week = new Array(startOffset(year, month)).fill(null);
  for (let day = 1; day <= daysIn(year, month); day += 1) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push([...week, ...new Array(7 - week.length).fill(null)]);

  return (
    <div className="datepicker" ref={popupRef} role="dialog" aria-label="Choose a date of birth">
      <div className="datepicker-header">
        <label className="visually-hidden" htmlFor="dp-month">Month</label>
        <select
          id="dp-month"
          className="form-input"
          value={month}
          onChange={(e) => setCursor(new Date(year, Number(e.target.value), 1))}
        >
          {MONTHS.map((name, index) => <option key={name} value={index}>{name}</option>)}
        </select>

        <label className="visually-hidden" htmlFor="dp-year">Year</label>
        <select
          id="dp-year"
          className="form-input"
          value={year}
          onChange={(e) => setCursor(new Date(Number(e.target.value), month, 1))}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* A real table, so rows, column headers and grid cells come for free. */}
      <table className="datepicker-grid" role="grid" ref={gridRef} onKeyDown={onKeyDown}>
        <thead>
          <tr>{WEEKDAYS.map(([short, full]) => <th key={full} scope="col" abbr={full}>{short}</th>)}</tr>
        </thead>
        <tbody>
          {weeks.map((row, i) => (
            <tr key={i}>
              {row.map((day, j) => {
                if (!day) return <td key={j} className="empty" />;
                const date = new Date(year, month, day);
                const focused = day === cursor.getDate();
                const selected = value && date.toDateString() === value.toDateString();
                const outside = date < min || date > max;
                return (
                  <td
                    key={j}
                    tabIndex={focused ? 0 : -1}
                    aria-selected={selected || undefined}
                    aria-disabled={outside || undefined}
                    className={`${focused ? 'focused' : ''} ${selected ? 'selected' : ''} ${outside ? 'outside' : ''}`}
                    onClick={() => !outside && onPick(date)}
                  >
                    {day}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="datepicker-hint">Arrow keys move by day, Escape closes.</p>
    </div>
  );
};

export default DatePicker;
