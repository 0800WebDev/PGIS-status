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
                    result.up === true
                    ? "status-up"
                    : result.up === false
                    ? "status-down"
                    : "status-unknown"
                }`;

statusElement.textContent =
    result.up === true ? "Up" :
    result.up === false ? "Down" :
    "Unknown";

statusElement.textContent =
    result.up === true ? "Up" :
    result.up === false ? "Down" :
    "Unknown";

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
    const manualStatus = link.status ?? site.status;

    if (manualStatus === "up" || manualStatus === "down") {
        return {
            up: manualStatus === "up",
            reason: "Manually set"
        };
    }

    const keywords = [
        "suspended",
        "this deployment is temporarily paused",
        "application error",
        "internal server error",
        "bad gateway",
        "service unavailable",
        "site not found",
        "deployment not found",
        "project not found"
    ];

    const checkUrl = new URL(link.url, window.location.href);

    if (checkUrl.protocol === "http:" && location.protocol === "https:") {
        return {
            up: null,
            reason: "HTTP blocked by HTTPS page"
        };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        try {
            const response = await fetch(checkUrl.href, {
                method: "GET",
                mode: "cors",
                cache: "no-store",
                signal: controller.signal
            });

            if (!response.ok) {
                return {
                    up: false,
                    reason: `HTTP ${response.status}`
                };
            }

            try {
                const content = (await response.text()).toLowerCase();

                const matchedKeyword = keywords.find(keyword =>
                    content.includes(keyword)
                );

                if (matchedKeyword) {
                    return {
                        up: false,
                        reason: matchedKeyword
                    };
                }
            } catch {
                return {
                    up: true,
                    reason: null
                };
            }

            return {
                up: true,
                reason: null
            };

        } catch (error) {
            if (controller.signal.aborted) {
                return {
                    up: null,
                    reason: "Timeout"
                };
            }

            const response = await fetch(checkUrl.href, {
                method: "GET",
                mode: "no-cors",
                cache: "no-store",
                signal: controller.signal
            });

            if (response.type === "opaque") {
                return {
                    up: true,
                    reason: "Unverified (CORS restricted)"
                };
            }

            return {
                up: null,
                reason: "Unable to verify"
            };
        }

    } catch (error) {
        return {
            up: null,
            reason: controller.signal.aborted
                ? "Timeout"
                : "Connection failed or blocked"
        };
    } finally {
        clearTimeout(timeout);
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
