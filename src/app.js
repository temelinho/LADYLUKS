/**
 * Lady Luks Spa Aydın - Interactive App Engine
 */

const LANGUAGE_FLAGS = { tr: "tr", en: "en", ru: "ru", de: "de" };
function preferredLanguage() {
  const contentLanguage = document.body.dataset.contentLanguage;
  if (Object.hasOwn(LANGUAGE_FLAGS, contentLanguage)) return contentLanguage;
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (Object.hasOwn(LANGUAGE_FLAGS, fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem("ladyLuksLanguage");
    if (Object.hasOwn(LANGUAGE_FLAGS, saved)) return saved;
  } catch {
    /* Local files may not allow storage; navigation still carries the language. */
  }
  return "tr";
}
let currentLang = preferredLanguage();
let modalTrigger = null;
let inertStates = [];
let previousOverflow = "";
let currentCurrency = "TRY";
let currentMainTab = "services";
let currentSubCategory = "all";
let searchQuery = "";
let currentSort = "featured";

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) window.lucide.createIcons();
  setupMobileNavigation();
  setupLanguageSelector();
  setupCurrencySelector();
  setupSearch();
  setupSort();
  setupModal();
  updateLanguageUI();
  renderCatalog();
});

/* ==========================================
   LANGUAGE & CURRENCY CONTROLLERS
   ========================================== */

function setupMobileNavigation() {
  const header = document.querySelector(".main-header");
  const toggle = document.querySelector(".mobile-nav-toggle");
  const navigation = document.getElementById("site-navigation");
  if (!header || !toggle || !navigation) return;
  const smallScreen = window.matchMedia("(max-width: 768px)");
  header.classList.add("nav-enhanced");
  const utilities = document.createElement("div");
  utilities.className = "mobile-menu-utilities";
  navigation.append(utilities);
  // Move the existing controls so IDs, language state and listeners stay unique.
  const utilitySlots = [".top-info", ".top-selectors"].map((selector) => {
    const element = document.querySelector(`.top-bar ${selector}`);
    if (!element) return null;
    const placeholder = document.createComment("Desktop utility position");
    element.before(placeholder);
    return { element, placeholder };
  }).filter(Boolean);
  const placeUtilities = () => {
    utilitySlots.forEach(({ element, placeholder }) => {
      if (smallScreen.matches) utilities.append(element);
      else placeholder.after(element);
    });
    document.body.classList.add("mobile-nav-ready");
  };
  const closeLanguage = () => {
    document.getElementById("langDropdownMenu")?.classList.remove("show");
    document.getElementById("langDropdownTrigger")?.setAttribute("aria-expanded", "false");
  };
  const setOpen = (open) => {
    navigation.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    const labelKey = open ? "menu_close" : "menu_open";
    toggle.dataset.i18nAria = labelKey;
    toggle.setAttribute("aria-label", UI_TRANSLATIONS[currentLang][labelKey]);
    if (!open) closeLanguage();
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(open);
    closeLanguage();
  });
  navigation
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle.getAttribute("aria-expanded") === "true"
    ) {
      // Escape closes the nested language picker before the main menu.
      if (document.getElementById("langDropdownMenu")?.classList.contains("show")) return;
      setOpen(false);
      toggle.focus();
    }
  });
  document
    .getElementById("langDropdownTrigger")
    ?.addEventListener("click", (event) => {
      if (!navigation.contains(event.currentTarget)) setOpen(false);
    });
  smallScreen.addEventListener("change", () => {
    setOpen(false);
    placeUtilities();
  });
  placeUtilities();
}

function setupLanguageSelector() {
  const trigger = document.getElementById("langDropdownTrigger");
  const menu = document.getElementById("langDropdownMenu");
  if (!trigger || !menu) return;
  trigger.setAttribute("aria-controls", "langDropdownMenu");
  trigger.setAttribute("aria-expanded", "false");
  const closeMenu = () => {
    menu.classList.remove("show");
    trigger.setAttribute("aria-expanded", "false");
  };
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = !menu.classList.contains("show");
    menu.classList.toggle("show", open);
    trigger.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("show")) {
      closeMenu();
      trigger.focus();
    }
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      currentLang = button.dataset.lang;
      try {
        localStorage.setItem("ladyLuksLanguage", currentLang);
      } catch {}
      closeMenu();
      try {
        const pageUrl = new URL(window.location.href);
        if (currentLang === "tr") pageUrl.searchParams.delete("lang");
        else pageUrl.searchParams.set("lang", currentLang);
        history.replaceState(history.state, "", pageUrl.href);
      } catch {
        /* Navigation links still preserve the selected language. */
      }
      updateLanguageUI();
      renderCatalog();
    });
  });
}

function setupCurrencySelector() {
  const triggerBtn = document.getElementById("currDropdownTrigger");
  const menu = document.getElementById("currDropdownMenu");
  const currBtns = document.querySelectorAll("[data-curr]");

  if (triggerBtn && menu) {
    triggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const langMenu = document.getElementById("langDropdownMenu");
      if (langMenu) langMenu.classList.remove("show");
      menu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  }

  currBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentCurrency = btn.getAttribute("data-curr");

      // Update header button label
      const currObj = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.TRY;
      const symbolEl = document.getElementById("headerCurrentSymbol");
      const currEl = document.getElementById("headerCurrentCurr");
      if (symbolEl) symbolEl.textContent = currObj.symbol;
      if (currEl) currEl.textContent = currentCurrency;

      // Update active state
      document.querySelectorAll("[data-curr]").forEach((b) => {
        b.classList.toggle(
          "active",
          b.getAttribute("data-curr") === currentCurrency,
        );
      });

      if (menu) menu.classList.remove("show");

      renderCatalog();
    });
  });
}

function updateLanguageUI() {
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.tr;

  // Text contents
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const value = dict[element.dataset.i18nAria];
    if (value) element.setAttribute("aria-label", value);
  });
  const flag = document.getElementById("headerCurrentFlag");
  if (flag) {
    const picture = document.createElement("img");
    picture.src = `./src/images/flags/${LANGUAGE_FLAGS[currentLang]}.svg`;
    picture.alt = "";
    picture.width = 20;
    picture.height = 14;
    flag.replaceChildren(picture);
  }
  const languageLabel = document.getElementById("headerCurrentLang");
  if (languageLabel) languageLabel.textContent = currentLang.toUpperCase();
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.lang === currentLang),
    );
  });
  // Carry the same language between pages, including direct file:// previews.
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!/^(?:\.\/)?(?:index|paketler|tanitim)\.html(?:[?#]|$)/.test(href))
      return;
    const destination = new URL(href, window.location.href);
    if (currentLang === "tr") destination.searchParams.delete("lang");
    else destination.searchParams.set("lang", currentLang);
    link.setAttribute(
      "href",
      destination.pathname.split("/").pop() +
        destination.search +
        destination.hash,
    );
  });
  document.documentElement.lang = currentLang;
}

/* ==========================================
   FORMATTING HELPERS
   ========================================== */

function formatPrice(priceTRY) {
  const currObj = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.TRY;
  const converted = new Intl.NumberFormat(
    currentLang === "tr" ? "tr-TR" : currentLang,
  ).format(Math.round(priceTRY * currObj.rate));

  if (currObj.position === "before") {
    return `${currObj.symbol}${converted}`;
  } else {
    return `${converted} ${currObj.symbol}`;
  }
}

/* ==========================================
   TABS & SUB-CATEGORY FILTERS
   ========================================== */

function renderSubCategories() {
  const container = document.getElementById("subCategoryFilters");
  if (!container) return;

  const subs = SUB_CATEGORIES[currentMainTab] || SUB_CATEGORIES.all;
  container.innerHTML = "";

  subs.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = `sub-pill ${item.key === currentSubCategory ? "active" : ""}`;
    btn.textContent = item.label[currentLang] || item.label.tr;

    btn.addEventListener("click", () => {
      container
        .querySelectorAll(".sub-pill")
        .forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      currentSubCategory = item.key;
      renderCatalog();
    });

    container.appendChild(btn);
  });
}

/* ==========================================
   SEARCH & SORT
   ========================================== */

function setupSearch() {
  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  if (!input || !clearBtn) return;

  input.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    clearBtn.style.display = searchQuery ? "flex" : "none";
    renderCatalog();
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    searchQuery = "";
    clearBtn.style.display = "none";
    renderCatalog();
  });

  const resetBtn = document.getElementById("resetFilterBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      input.value = "";
      searchQuery = "";
      clearBtn.style.display = "none";
      currentMainTab = "services";
      currentSubCategory = "all";

      document.querySelectorAll("[data-main-tab]").forEach((b) => {
        b.classList.toggle(
          "active",
          b.getAttribute("data-main-tab") === "services",
        );
      });

      renderSubCategories();
      renderCatalog();
    });
  }
}

function setupSort() {
  const select = document.getElementById("sortSelect");
  if (!select) return;
  select.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderCatalog();
  });
}

/* ==========================================
   CATALOG GRID RENDERING
   ========================================== */

function normalizeSearch(value) {
  return value
    .toLocaleLowerCase(currentLang)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
function getFilteredItems() {
  return CATALOG_ITEMS.filter((item) => {
    if (item.mainCategory !== "services") return false;

    // Filter Sub Category
    if (currentSubCategory !== "all") {
      if (
        item.subCategory !== currentSubCategory &&
        item.mainCategory !== currentSubCategory
      ) {
        return false;
      }
    }

    // Search Filter
    if (searchQuery) {
      const title = normalizeSearch(item.title[currentLang] || item.title.tr);
      const desc = normalizeSearch(
        item.shortDesc[currentLang] || item.shortDesc.tr,
      );
      const query = normalizeSearch(searchQuery);
      return title.includes(query) || desc.includes(query);
    }

    return true;
  }).sort((a, b) => {
    const titleA = (a.title[currentLang] || a.title.tr).toLowerCase();
    const titleB = (b.title[currentLang] || b.title.tr).toLowerCase();

    if (currentSort === "price-asc") {
      return a.priceTRY - b.priceTRY;
    } else if (currentSort === "price-desc") {
      return b.priceTRY - a.priceTRY;
    } else if (currentSort === "name") {
      return titleA.localeCompare(titleB, currentLang);
    }
    return 0; // default featured
  });
}

function renderCatalog() {
  const grid = document.getElementById("catalogGrid");
  const emptyState = document.getElementById("emptyState");
  const resultsCount = document.getElementById("resultsCount");
  if (!grid) return;

  const items = getFilteredItems();
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.tr;

  if (resultsCount) {
    resultsCount.textContent = `${items.length} ${dict.tab_all || "öğe gösteriliyor"}`;
  }

  if (items.length === 0) {
    grid.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  if (emptyState) emptyState.style.display = "none";
  const cards = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "catalog-card";
    card.id = item.id;

    const titleText = item.title[currentLang] || item.title.tr;
    const descText = item.shortDesc[currentLang] || item.shortDesc.tr;
    const priceFormatted = formatPrice(item.priceTRY);

    let durationHTML = "";
    if (item.duration) {
      durationHTML = `
        <div class="card-duration">
          <i data-lucide="clock"></i>
          <span>${item.duration} ${dict.minutes}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${item.image}" alt="${titleText} — ${dict.image_note}" class="card-image" style="object-position: ${item.imagePosition || "50% 50%"}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='./src/images/hamam_massage.webp';" />
        ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ""}
        ${durationHTML}
      </div>
      <div class="card-body">
        <h3 class="card-title"><a href="aydin-masaj-rehberi.html#${item.id}">${titleText}</a></h3>
        <p class="card-desc">${descText}</p>
        <div class="card-footer">
          <span class="card-price">${priceFormatted}</span>
          <button class="btn-card-detail" type="button" data-item-id="${item.id}" aria-label="${titleText} — ${dict.detail_btn}">
            <span>${dict.detail_btn}</span>
            <i data-lucide="arrow-right"></i>
          </button>
        </div>
      </div>
    `;

    // Click handler for card details
    card.querySelector(".btn-card-detail").addEventListener("click", () => {
      openModal(item);
    });

    cards.appendChild(card);
  });

  // Keep the HTML service cards visible until their interactive replacements are ready.
  grid.replaceChildren(cards);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ==========================================
   MODAL DRAWER SYSTEM
   ========================================== */

function setupModal() {
  const backdrop = document.getElementById("modalBackdrop");
  const closeBtn = document.getElementById("modalCloseBtn");
  if (!backdrop || !closeBtn) return;

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });

  backdrop.inert = true;
  document.addEventListener("keydown", (event) => {
    if (!backdrop.classList.contains("active")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
    if (event.key !== "Tab") return;
    const controls = [
      ...backdrop.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex="0"]',
      ),
    ];
    const first = controls[0],
      last = controls[controls.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !backdrop.contains(document.activeElement))
    ) {
      event.preventDefault();
      last?.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        !backdrop.contains(document.activeElement))
    ) {
      event.preventDefault();
      first?.focus();
    }
  });
}

function openModal(item) {
  const backdrop = document.getElementById("modalBackdrop");
  const content = document.getElementById("modalContent");

  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.tr;
  const titleText = item.title[currentLang] || item.title.tr;
  const longDescText = item.longDesc[currentLang] || item.longDesc.tr;
  const priceFormatted = formatPrice(item.priceTRY);
  const includedItems = item.included
    ? item.included[currentLang] || item.included.tr
    : [];

  // WhatsApp Pre-filled message generator
  const waMsg = encodeURIComponent(
    `Merhaba Lady Luks Spa Aydın! Kataloğunuzdan şu masaj için bilgi ve randevu talep etmek istiyorum:\n\n*${titleText}*\nAfişteki kampanya fiyatı: ${priceFormatted}\n\nGüncel fiyat ve müsaitlik durumunu öğrenebilir miyim?`,
  );
  const waUrl = `https://wa.me/905392342268?text=${waMsg}`;

  let metaHTML = "";
  if (item.duration) {
    metaHTML += `
      <div class="modal-meta-item">
        <i data-lucide="clock"></i>
        <span>${item.duration} ${dict.minutes}</span>
      </div>
    `;
  }
  if (item.badge) {
    metaHTML += `
      <div class="modal-meta-item">
        <i data-lucide="award"></i>
        <span>${item.badge}</span>
      </div>
    `;
  }

  let includedListHTML = "";
  if (includedItems.length > 0) {
    includedListHTML = `
      <h4 class="modal-section-title">${item.duration ? dict.included : dict.features}</h4>
      <ul class="modal-included-list">
        ${includedItems.map((inc) => `<li><i data-lucide="check-circle2"></i> ${inc}</li>`).join("")}
      </ul>
    `;
  }

  content.innerHTML = `
    <div class="modal-img-wrapper">
      <img src="${item.image}" alt="${titleText} — ${dict.image_note}" style="object-position: ${item.imagePosition || "50% 50%"}" onerror="this.onerror=null; this.src='./src/images/hamam_massage.webp';" />
    </div>
    <div class="modal-inner">
      <div class="modal-header-info">
        <h2 class="modal-title" id="modalTitle">${titleText}</h2>
        <span class="modal-price-tag">${priceFormatted}</span>
      </div>

      <div class="modal-meta-list">
        ${metaHTML}
      </div>

      <p class="modal-desc-full">${longDescText}</p>

      ${includedListHTML}

      <div class="modal-action-bar">
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-modal-reserve">
          <i data-lucide="message-circle"></i>
          <span>${dict.reserve_now}</span>
        </a>
      </div>
    </div>
  `;

  modalTrigger = document.activeElement;
  previousOverflow = document.body.style.overflow;
  inertStates = [...document.body.children]
    .filter((element) => element !== backdrop && element.tagName !== "SCRIPT")
    .map((element) => [element, element.inert]);
  inertStates.forEach(([element]) => {
    element.inert = true;
  });
  backdrop.inert = false;
  backdrop.setAttribute("aria-hidden", "false");
  backdrop.setAttribute("aria-labelledby", "modalTitle");
  backdrop.classList.add("active");
  document.body.style.overflow = "hidden";
  document.getElementById("modalCloseBtn").focus({ preventScroll: true });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeModal() {
  const backdrop = document.getElementById("modalBackdrop");
  if (!backdrop?.classList.contains("active")) return;
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("active");
  backdrop.inert = true;
  document.body.style.overflow = previousOverflow;
  inertStates.forEach(([element, wasInert]) => {
    element.inert = wasInert;
  });
  inertStates = [];
  if (modalTrigger?.isConnected) modalTrigger.focus({ preventScroll: true });
}
