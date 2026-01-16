/*
 * AnimeLib to Pointauc Extension
 * Author: Kustrica
 * Telegram: @Kustrica
 */
(() => {
    const CONTAINER_ID = 'al-pointauc-container';
    
    // Determine site color based on domain
    function getSiteColor() {
        const host = window.location.hostname.toLowerCase();
        if (host.includes('mangalib')) return '#FF9100';
        if (host.includes('hentailib')) return '#B71C1C';
        if (host.includes('slashlib')) return '#AD1457';
        if (host.includes('ranobelib')) return '#2196F3';
        return '#5E35B1'; // Default (AnimeLib)
    }

    // Initialize extension logic
    function init() {
        if (!shouldShowButton()) {
            removeContainer();
            return;
        }

        if (document.getElementById(CONTAINER_ID)) return;

        const container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.style.setProperty('--al-pointauc-color', getSiteColor());
        
        // Wheel Button (Top)
        const wheelBtn = document.createElement('button');
        wheelBtn.id = 'al-pointauc-wheel-btn';
        wheelBtn.className = 'al-pointauc-btn al-pointauc-sub-btn';
        wheelBtn.onclick = () => window.open('https://test.pointauc.com', '_blank');

        const wheelIconUrl = chrome.runtime.getURL('icon/wheel-256.png');
        const wheelImg = document.createElement('img');
        wheelImg.src = wheelIconUrl;
        wheelImg.alt = 'wheel';
        
        const wheelText = document.createElement('span');
        wheelText.textContent = 'Pointauc'; // Or localize if needed

        wheelBtn.appendChild(wheelImg);
        wheelBtn.appendChild(wheelText);

        // JSON Button
        const jsonBtn = document.createElement('button');
        jsonBtn.id = 'al-pointauc-json-btn';
        jsonBtn.className = 'al-pointauc-btn al-pointauc-sub-btn';
        jsonBtn.onclick = () => handleAction('download');
        // SVG Icon
        const jsonIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        jsonIcon.setAttribute("viewBox", "0 0 24 24");
        jsonIcon.innerHTML = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>';
        
        const jsonText = document.createElement('span');
        jsonText.textContent = chrome.i18n.getMessage('btnJson');
        
        jsonBtn.appendChild(jsonIcon);
        jsonBtn.appendChild(jsonText);

        // CSV Button
        const copyBtn = document.createElement('button');
        copyBtn.id = 'al-pointauc-copy-btn';
        copyBtn.className = 'al-pointauc-btn al-pointauc-sub-btn';
        copyBtn.onclick = () => handleAction('copy');

        const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        copyIcon.setAttribute("viewBox", "0 0 24 24");
        copyIcon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
        
        const copyText = document.createElement('span');
        copyText.textContent = chrome.i18n.getMessage('btnCsv');

        copyBtn.appendChild(copyIcon);
        copyBtn.appendChild(copyText);


        // Main Button
        const mainBtn = document.createElement('button');
        mainBtn.id = 'al-pointauc-main-btn';
        mainBtn.className = 'al-pointauc-btn'; // Always pill shape
        mainBtn.title = chrome.i18n.getMessage('btnMainTitle');
        mainBtn.onclick = toggleMenu;

        const iconUrl = chrome.runtime.getURL('icon/hammer-240.png');
        const img = document.createElement('img');
        img.src = iconUrl;
        img.alt = 'icon';
        
        const text = document.createElement('span');
        text.textContent = 'Pointauc'; // Changed from PointAuc
        
        mainBtn.appendChild(img);
        mainBtn.appendChild(text);

        container.appendChild(wheelBtn);
        container.appendChild(jsonBtn);
        container.appendChild(copyBtn);
        container.appendChild(mainBtn);
        
        document.body.appendChild(container);

        // Click outside listener
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target) && container.classList.contains('open')) {
                container.classList.remove('open');
            }
        });
    }

    // Check if button should be shown on current page
    function shouldShowButton() {
        const url = window.location.href.toLowerCase();
        return url.includes('/user/') || url.includes('catalog');
    }

    // Remove button container from DOM
    function removeContainer() {
        const container = document.getElementById(CONTAINER_ID);
        if (container) container.remove();
    }

    // Toggle menu open/close state
    function toggleMenu() {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) return;
        
        container.classList.toggle('open');
    }

    // Scrape anime/manga list from page
    function getAnimeList() {
        // Different selectors for different sites
        const selectors = [
            // AnimeLib
            '.card-item .card-item-caption__main', 
            '.media-card .media-card__title', 
            '.item-block .item-block__name',
            // RanobeLib List View
            '.book-list[data-view="list"] .ack_ao .ack_acl',
            '.ack_ao .ack_acl',
            // MangaLib/SlashLib/HentaiLib/RanobeLib (potential new classes)
            '.media-card .media-card__title', 
            '.media-card__body .media-card__title',
            '.item-link .item-link__title',
            'a.media-card' // sometimes title is in aria-label or just text
        ];
        
        let items = [];
        // First try to find explicit title elements
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                items = Array.from(elements)
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0);
                if (items.length > 0) break;
            }
        }

        // If no items found, try fallback for MangaLib/others specific structure
        if (items.length === 0) {
             const mediaCards = document.querySelectorAll('.media-card');
             if (mediaCards.length > 0) {
                 items = Array.from(mediaCards).map(card => {
                     // Try finding title inside
                     const titleEl = card.querySelector('.media-card__title');
                     if (titleEl) return titleEl.textContent.trim();
                     // Fallback to data attributes or other properties if needed
                     return card.getAttribute('data-name') || '';
                 }).filter(t => t.length > 0);
             }
        }
        
        // List view fallback check if not caught by selectors above
        if (items.length === 0) {
             const listItems = document.querySelectorAll('.ack_ao .ack_acl');
             if (listItems.length > 0) {
                  items = Array.from(listItems).map(el => el.textContent.trim()).filter(t => t.length > 0);
             }
        }

        if (items.length === 0) return null;

        return items
            .map(name => ({
                name: name,
                amount: null,
                investors: []
            }));
    }

    // Get formatted date string for filename
    function getFormattedDate() {
        const now = new Date();
        const pad = (num) => String(num).padStart(2, '0');
        const day = pad(now.getDate());
        const month = pad(now.getMonth() + 1);
        const year = now.getFullYear();
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        return `${day}_${month}_${year}-${hours}_${minutes}`;
    }

    // Handle CSV copy or JSON download action
    async function handleAction(type) {
        const lots = getAnimeList();
        
        if (!lots || lots.length === 0) {
            showNotification(chrome.i18n.getMessage('msgNotFound'), true);
            return;
        }

        if (type === 'copy') {
            const csvContent = lots.map(l => l.name).join("\n");
            try {
                await navigator.clipboard.writeText(csvContent);
                showNotification(chrome.i18n.getMessage('msgCopied'));
            } catch (err) {
                console.error('Failed to copy: ', err);
                showNotification(chrome.i18n.getMessage('msgError'), true);
            }
            // toggleMenu();
        } else if (type === 'download') {
            const exportData = { lots };
            const jsonString = JSON.stringify(exportData, null, 2);
            const dateStr = getFormattedDate();
            const filename = `libToPointauc-${dateStr}.json`;
            downloadJSON(jsonString, filename);
            // toggleMenu();
        }
    }

    // Trigger download of JSON file
    function downloadJSON(content, filename) {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Show toast notification
    function showNotification(message, isError = false) {
        const id = 'al-pointauc-notification';
        let notif = document.getElementById(id);
        
        if (!notif) {
            notif = document.createElement('div');
            notif.id = id;
            notif.style.cssText = `
                position: fixed;
                bottom: 90px;
                right: 30px;
                background: #333;
                color: #fff;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 2147483648;
                transition: opacity 0.3s;
                font-family: sans-serif;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(notif);
        }

        notif.textContent = message;
        notif.style.background = isError ? '#d32f2f' : '#43a047';
        notif.style.opacity = '1';

        setTimeout(() => {
            notif.style.opacity = '0';
        }, 3000);
    }

    init();

    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            if (!shouldShowButton()) {
                removeContainer();
            } else {
                const container = document.getElementById(CONTAINER_ID);
                if (container) container.classList.remove('open');
                init();
            }
        }
        
        if (shouldShowButton() && !document.getElementById(CONTAINER_ID)) {
            init();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Fallback for SPA transitions to ensure button appears
    setInterval(() => {
        if (shouldShowButton() && !document.getElementById(CONTAINER_ID)) {
            init();
        }
    }, 1000);

})();