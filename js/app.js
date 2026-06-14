document.addEventListener("DOMContentLoaded", () => {
  // --- LANGUAGE SWITCHER ---
  let currentLang = localStorage.getItem("lang") || "ja";

  const updateLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem("lang", lang);

    // Update active state of language buttons
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      if (btn.getAttribute("data-lang") === lang) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update body class for specific language layout tweaks
    document.body.className = `lang-${lang}`;

    // Translate DOM elements
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    // Also update form placeholders if any
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[lang] && translations[lang][key]) {
        el.setAttribute("placeholder", translations[lang][key]);
      }
    });

    // Re-render calendars to update month headings or markers if needed
    renderCalendars();
  };

  // Add click listeners to language buttons
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      updateLanguage(lang);
    });
  });

  // --- MOBILE NAVIGATION ---
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking links
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }

  // --- AUTOMATIC CALENDAR GENERATION ---
  // List of holidays and custom class cancellations (Obon, New Year, etc.)
  // Format: 'YYYY-MM-DD'
  const inactiveDates = [
    // 2026 National Holidays
    "2026-01-01", // 元日
    "2026-01-12", // 成人の日
    "2026-02-11", // 建国記念の日
    "2026-02-23", // 天皇誕生日
    "2026-03-20", // 春分の日
    "2026-04-29", // 昭和の日
    "2026-05-03", // 憲法記念日
    "2026-05-04", // みどりの日
    "2026-05-05", // こどもの日
    "2026-05-06", // 振替休日
    "2026-07-20", // 海の日
    "2026-08-11", // 山の日
    "2026-09-21", // 敬老の日
    "2026-09-22", // 国民の休日
    "2026-09-23", // 秋分の日
    "2026-10-12", // スポーツの日
    "2026-11-03", // 文化の日
    "2026-11-23", // 勤労感謝の日

    // 2026 Custom Class Holidays (Summer Obon and Year-End)
    "2026-08-19", // お盆期間休み
    "2026-08-26", // 夏休み
    "2026-12-30", // 年末年始休み

    // 2027 National Holidays
    "2027-01-01", // 元日
    "2027-01-11", // 成人の日
    "2027-02-11", // 建国記念の日
    "2027-02-23", // 天皇誕生日
    "2027-03-21", // 春分の日
    "2027-03-22", // 振替休日
    "2027-04-29", // 昭和の日
    "2027-05-03", // 憲法記念日
    "2027-05-04", // みどりの日
    "2027-05-05", // こどもの日
    "2027-07-19", // 海の日
    "2027-08-11", // 山の日
    "2027-09-20", // 敬老の日
    "2027-09-23", // 秋分の日
    "2027-10-11", // スポーツの日
    "2027-11-03", // 文化の日
    "2027-11-23", // 勤労感謝の日

    // 2027 Custom Class Holidays (New Year / Obon)
    "2027-01-06", // 年末年始休み
    "2027-08-18", // お盆休み
    "2027-08-25", // 夏休み
    "2027-12-29"  // 年末年始休み
  ];

  function renderCalendars() {
    const calendarContainer = document.getElementById("calendar-grid");
    if (!calendarContainer) return;

    calendarContainer.innerHTML = "";

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    // Render current month and next month
    const monthsToRender = [
      { year: currentYear, month: currentMonth },
      { year: currentMonth === 11 ? currentYear + 1 : currentYear, month: (currentMonth + 1) % 12 }
    ];

    monthsToRender.forEach((mInfo) => {
      calendarContainer.appendChild(createMonthTable(mInfo.year, mInfo.month));
    });
  }

  function createMonthTable(year, month) {
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "calendar-card";

    // Header displaying Year and Month
    const title = document.createElement("h4");
    title.className = "calendar-month-title";
    title.textContent = `${year} / ${month + 1}`;
    tableWrapper.appendChild(title);

    const table = document.createElement("table");
    table.className = "calendar-table";

    // Day of the week header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const daysOfWeek = {
      ja: ["日", "月", "火", "水", "木", "金", "土"],
      "ja-easy": ["にち", "げつ", "か", "すい", "もく", "きん", "ど"],
      en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    };

    const activeDays = daysOfWeek[currentLang] || daysOfWeek["ja"];
    activeDays.forEach((day) => {
      const th = document.createElement("th");
      th.textContent = day;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Calculate days
    const firstDay = new Date(year, month, 1).getDay(); // Day of week (0 = Sun, 6 = Sat)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Number of days in month

    let date = 1;
    for (let i = 0; i < 6; i++) { // Max 6 rows in calendar
      const row = document.createElement("tr");

      for (let j = 0; j < 7; j++) {
        const cell = document.createElement("td");
        
        if (i === 0 && j < firstDay) {
          // Empty cells before start of month
          cell.className = "empty-day";
          cell.innerHTML = "&nbsp;";
        } else if (date > totalDays) {
          // Empty cells after end of month
          cell.className = "empty-day";
          cell.innerHTML = "&nbsp;";
        } else {
          // Date number container
          const dateDiv = document.createElement("div");
          dateDiv.className = "date-num";
          dateDiv.textContent = date;

          // Status marker container
          const statusDiv = document.createElement("div");
          statusDiv.className = "date-status";

          // Format date string for checking
          const monthStr = String(month + 1).padStart(2, "0");
          const dateStr = String(date).padStart(2, "0");
          const formattedDate = `${year}-${monthStr}-${dateStr}`;

          // Check if Sunday (0) or Saturday (6)
          const dayOfWeek = j;
          if (dayOfWeek === 0) {
            dateDiv.classList.add("sunday");
          } else if (dayOfWeek === 6) {
            dateDiv.classList.add("saturday");
          }

          // Check if Wednesday (3) - Class Day
          if (dayOfWeek === 3) {
            cell.classList.add("class-day");

            // Check if holiday/cancelled
            if (inactiveDates.includes(formattedDate)) {
              statusDiv.textContent = "✖";
              statusDiv.classList.add("closed");
            } else {
              statusDiv.textContent = "〇";
              statusDiv.classList.add("held");
            }
          } else {
            statusDiv.innerHTML = "&nbsp;";
          }

          cell.appendChild(dateDiv);
          cell.appendChild(statusDiv);
          date++;
        }
        row.appendChild(cell);
      }
      tbody.appendChild(row);
      if (date > totalDays) break;
    }

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    return tableWrapper;
  }

  // --- INITIALIZATION ---
  updateLanguage(currentLang);
});
