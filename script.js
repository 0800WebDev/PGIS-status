async function loadSites() {
    const container = document.querySelector("#sites");

    try {
        const response = await fetch("sites.json", {
            cache: "no-store"
        });

        const data = await response.json();

        container.innerHTML = "";

        for (const site of data.sites) {
            for (const link of site.links) {
                const result = await checkSite(link, site);

                const element = document.createElement("div");
                element.className = "link-status";

                const linkElement = document.createElement("span");
                linkElement.className = "site-link";
                linkElement.textContent = new URL(link.url).hostname;

                const nameElement = document.createElement("span");
                nameElement.className = "site-name";
                nameElement.textContent = site.name;

                const statusElement = document.createElement("span");
                statusElement.className = `site-status ${
                    result.up ? "status-up" : "status-down"
                }`;

                statusElement.textContent = result.up ? "Up" : "Down";

                element.appendChild(linkElement);
                element.appendChild(nameElement);
                element.appendChild(statusElement);

                if (link.note || site.note || result.reason) {
                    const noteElement = document.createElement("span");
                    noteElement.className = "site-note";
                    noteElement.textContent =
                        link.note ||
                        site.note ||
                        result.reason ||
                        "";

                    element.appendChild(noteElement);
                }

                container.appendChild(element);
            }
        }
    } catch (error) {
        console.error("Failed to load sites.json:", error);
    }
}

async function checkSite(link, site) {
    if (link.status === "up") {
        return {
            up: true,
            reason: "Manually set to up"
        };
    }

    if (link.status === "down") {
        return {
            up: false,
            reason: "Manually set to down"
        };
    }

    if (site.status === "up") {
        return {
            up: true,
            reason: "Manually set to up"
        };
    }

    if (site.status === "down") {
        return {
            up: false,
            reason: "Manually set to down"
        };
    }

    const keywords = [
        "this deployment is temporarily paused",
        "deployment is temporarily paused",
        "application error",
        "internal server error",
        "bad gateway",
        "service unavailable",
        "site not found",
        "page not found",
        "deployment not found",
        "project not found"

    ];

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(link.url, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal
        });

        clearTimeout(timeout);

        const text = await response.text();
        const content = text.toLowerCase();

        const matchedKeyword = keywords.find(keyword =>
            content.includes(keyword.toLowerCase())
        );

        if (!response.ok) {
            return {
                up: false,
                reason: `HTTP ${response.status}`
            };
        }

        if (matchedKeyword) {
            return {
                up: false,
                reason: matchedKeyword
            };
        }

        return {
            up: true,
            reason: null
        };

    } catch (error) {
        return {
            up: false,
            reason: error.name === "AbortError"
                ? "Timeout"
                : "Connection failed"
        };
    }
}

loadSites();

function openSiteInfo(site) {
  console.log(site)
}



//small box hover effect

document.querySelectorAll('.small-box').forEach(box => {
    box.addEventListener('mousemove', e => {
        const rect = box.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateX = (0.5 - y) * 20;
        const rotateY = (x - 0.5) * 20;

        box.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    });

    box.addEventListener('mouseleave', () => {
        box.style.transform = '';
    });
});
