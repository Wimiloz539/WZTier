const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = [];
let editingPlayer = null;

const levelPoints = {
    HT1: 100, LT1: 90, HT2: 80, LT2: 70, HT3: 60, LT3: 50, HT4: 40, LT4: 30, HT5: 20, LT5: 10, None: 0
};

const modeIcons = {
    sword: "⚔️", vanilla: "📦", uhc: "❤️", pot: "🧪", 
    smp: "🌍", axe: "🪓", mace: "🔨", crystal: "💎"
};

const modes = Object.keys(modeIcons);
const regions = ["NA", "EU", "SA", "AS", "OC"];

async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        allPlayers = await res.json();
        
        // Calculamos puntos dinámicamente si no vienen de la API
        allPlayers = allPlayers.map(p => {
            let pts = 0;
            modes.forEach(m => pts += (levelPoints[p[m]] || 0));
            return { ...p, points: pts };
        });

        // Detectar en qué página estamos para renderizar lo correcto
        if (document.getElementById("rankingContainer")) {
            renderRanking();
        }
        if (document.getElementById("playersAdmin")) {
            renderAdmin();
        }
    } catch (e) { console.error("Error cargando datos:", e); }
}

// --- RENDERIZADO DEL RANKING (INDEX) ---
function renderRanking() {
    const container = document.getElementById("rankingContainer");
    if (!container) return;
    container.innerHTML = "";

    allPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));

    allPlayers.forEach((p, i) => {
        let activeTiers = modes
            .filter(m => p[m] && p[m] !== "None")
            .map(m => ({ mode: m, rank: p[m], pts: levelPoints[p[m]] }))
            .sort((a, b) => b.pts - a.pts);

        let tiersHtml = activeTiers.map(t => `
            <div class="tier-circle border-${t.rank}">
                <span class="m-icon">${modeIcons[t.mode]}</span>
                <span class="m-rank">${t.rank}</span>
            </div>`).join("");

        for (let j = activeTiers.length; j < 8; j++) {
            tiersHtml += `<div class="tier-circle empty"></div>`;
        }

        const row = document.createElement("div");
        row.className = "player-row";
        row.onclick = () => viewPlayer(p.name);
        row.innerHTML = `
            <span class="rank-index">#${i + 1}</span>
            <img src="https://mc-heads.net/avatar/${p.name}/40" class="p-icon">
            <div class="name-box">
                <span class="p-name">${p.name}</span>
                <span class="p-pts">${p.points || 0} PTS</span>
            </div>
            <div class="region-tag">${p.region || 'NA'}</div>
            <div class="tiers-container">${tiersHtml}</div>
        `;
        container.appendChild(row);
    });
}

// --- RENDERIZADO DEL ADMIN (TABLA) ---
function renderAdmin() {
    const tbody = document.getElementById("playersAdmin");
    if (!tbody) return;
    tbody.innerHTML = "";

    allPlayers.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.region || 'None'}</td>
            <td><button onclick="editPlayer('${p.name}')">📝 Editar</button></td>
            <td><button onclick="deletePlayer('${p.name}')" style="background:#da3633">🗑️ Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- FUNCIONES DE ACCIÓN ---

function tryLogin() {
    const enteredPass = document.getElementById("adminPassInput").value;
    if (enteredPass === ADMIN_KEY) {
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("adminContent").style.display = "block";
        loadData();
    } else {
        alert("Clave incorrecta");
    }
}

async function addPlayer() {
    const nameInput = document.getElementById("playerName");
    const name = nameInput.value.trim();
    if (!name) return alert("Escribí un nombre");

    try {
        await fetch(`${API}/player`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "admin-key": ADMIN_KEY },
            body: JSON.stringify({ name, region: "SA" })
        });
        nameInput.value = "";
        loadData();
    } catch (e) { alert("Error al agregar"); }
}

function editPlayer(name) {
    editingPlayer = name;
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;
    document.getElementById("editName").innerText = p.name;
    
    let html = `
        <div style="grid-column: 1/-1; margin-bottom:10px;">
            <b>REGIÓN</b>
            <select id="edit_region" style="width:100%">
                ${regions.map(r => `<option value="${r}" ${p.region === r ? 'selected':''}>${r}</option>`).join('')}
            </select>
        </div>`;

    modes.forEach(m => {
        html += `
            <div class="modality">
                <b>${m.toUpperCase()}</b>
                <select id="edit_${m}">
                    ${Object.keys(levelPoints).map(lvl => `<option value="${lvl}" ${p[m]===lvl?'selected':''}>${lvl}</option>`).join('')}
                </select>
            </div>`;
    });
    document.getElementById("editModes").innerHTML = html;
    document.getElementById("editModal").style.display = "flex";
}

async function saveEdit() {
    let data = { region: document.getElementById("edit_region").value };
    modes.forEach(m => data[m] = document.getElementById("edit_" + m).value);

    try {
        await fetch(`${API}/player/${editingPlayer}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "admin-key": ADMIN_KEY },
            body: JSON.stringify(data)
        });
        closeEditModal();
        loadData();
    } catch (e) { alert("Error al guardar"); }
}

function closeEditModal() { document.getElementById("editModal").style.display = "none"; }

async function deletePlayer(name) {
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    try {
        await fetch(`${API}/player/${name}`, {
            method: "DELETE",
            headers: { "admin-key": ADMIN_KEY }
        });
        loadData();
    } catch (e) { alert("Error al borrar"); }
}

// Inicialización
loadData();
