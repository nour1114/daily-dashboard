# Daylight — Daily Dashboard

A responsive personal dashboard built with semantic HTML, CSS, and vanilla JavaScript for a Web Development Bootcamp final project.

## Run it

1. Extract the ZIP folder.
2. Open `index.html` in a modern browser.
3. Keep an internet connection available for Google Fonts, the YouTube embed, the audio sample, and live weather data.

If the weather request is blocked when opening the page directly, run it through a local development server (for example, VS Code Live Server).

## Features

- Live 24-hour clock, date, weekday, and time-zone display.
- Light/dark theme switch, remembered using `localStorage`.
- Add, complete, and delete tasks; clear completed tasks. Tasks persist with `localStorage`.
- Add assignment deadlines with a live countdown that updates every second; deadlines persist with `localStorage`.
- Completion percentage and progress bar.
- Live weather for Cairo using the free Open-Meteo forecast API, including current conditions, feels-like temperature, humidity, wind, high/low, and upcoming hourly forecast.
- Motivational quote picker.
- Responsive YouTube `iframe` and HTML audio player.
- Responsive layout using CSS Grid and Flexbox, plus sticky navigation on larger screens and positioned decorative elements.
- Accessible form labels, button labels, status messages, semantic landmarks, and reduced reliance on color alone.

## Rubric mapping

| Requirement | Where it appears |
|---|---|
| Semantic HTML | `header`, `nav`, `main`, `section`, `article`, `footer`, forms and lists in `index.html` |
| Embedded iframe | Motivational video section |
| Media attachment | HTML `<audio>` player with a sample MP3 |
| Custom fonts, colors, spacing | Google Fonts (DM Sans, Space Grotesk), CSS variables, spacing system |
| At least two Grid/Flexbox layouts | Main shell, hero cards, task layout, weather cards, deadline form, and navigation |
| CSS positioning | Sticky sidebar, positioned clock decoration, absolute iframe, positioned quote button |
| Responsive | CSS breakpoints at 1100px, 760px, and 380px |
| Dark/light mode | Theme button, saved in `localStorage` |
| Live clock/date | Top clock card |
| Assignment countdowns | Deadline tracker, updates each second |
| Task list with localStorage | To-do list |
| Free weather API | Open-Meteo, no API key required |

## Weather API

This project uses Open-Meteo: https://open-meteo.com/ . The example coordinates are set to Cairo, Egypt. Change the `latitude`, `longitude`, and `timezone` values in `script.js` to use another city.

## Project files

- `index.html` — page structure and content
- `style.css` — theme, layouts, responsive rules, and visual design
- `script.js` — clock, tasks, deadlines, theme, quotes, and weather
