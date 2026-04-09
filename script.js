const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = [];
let editingPlayer = null;

const levelPoints = {
    HT1: 60, LT1: 45, HT2: 30, LT2: 20, HT3: 10, LT3: 6, HT4: 4, LT4: 3, HT5: 2, LT5: 1, None: 0
};

const modeIcons = {
    sword: "⚔️", vanilla: "📦", uhc: "❤️", pot: "🧪", 
    smp: "🌍", axe: "🪓", mace: "🔨", crystal: "💎"
};

const modes = Object.keys(modeIcons);
const regions = ["NA", "EU", "SA", "AS", "OC"];

// --- CARGA DE DATOS ---
async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        const data = await res.json();
        
        allPlayers = data.map(p => {
            let pts = 0;
            modes.forEach(m => pts += (levelPoints[p[m]] || 0));
            return { ...p, points: pts };
        });

        allPlayers.sort((a, b) => b.points - a.points);

        if (document.getElementById("rankingContainer")) renderRanking();
        if (document.getElementById("playersAdminList")) renderAdmin();
    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

// --- RENDERIZAR RANKING (INDEX) ---
function renderRanking() {
    const container = document.getElementById("rankingContainer");
    container.innerHTML = allPlayers.map((p, index) => {
        let tiersHtml = modes.map(m => {
            if (!p[m] || p[m] === "None") return '';
            return `<div class="tier-circle-v2 border-v2-${p[m]}" style="width:25px; height:25px; font-size:10px;">
                        <span>${modeIcons[m]}</span>
                    </div>`;
        }).join("");

        return `
            <div class="player-row" onclick="viewPlayer('${p.name}')">
                <div class="rank-index">${index + 1}</div>
                <img class="p-icon" src="https://mc-heads.net/avatar/${p.name}/40" style="margin-left:15px">
                <div class="name-box">
                    <span class="p-name">${p.name}</span>
                    <span class="p-pts">${p.points} pts</span>
                </div>
                <div class="region-tag">${p.region || 'SA'}</div>
                <div class="tiers-container">${tiersHtml}</div>
            </div>`;
    }).join("");
}

// --- VER PERFIL (MODAL) ---
async function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalRegion").innerText = p.region || "South America";
    document.getElementById("playerAvatar").src = `https://mc-heads.net/avatar/${p.name}/120`;
    document.getElementById("modalNameMC").href = `https://namemc.com/search?q=${p.name}`;
    
    const pIndex = allPlayers.findIndex(x => x.name === name);
    document.getElementById("modalRankSide").innerText = `${pIndex + 1}.`;
    document.getElementById("modalPoints").innerText = `(${p.points} points)`;

    const stats = document.getElementById("modalStats");
    stats.innerHTML = "";

    let activeTiers = modes.filter(m => p[m] && p[m] !== "None")
        .map(m => ({ mode: m, rank: p[m], pts: levelPoints[p[m]] }))
        .sort((a, b) => b.pts - a.pts);

    activeTiers.forEach(t => {
        stats.innerHTML += `
            <div class="tier-circle-v2 border-v2-${t.rank}">
                <span class="m-icon-v2">${modeIcons[t.mode]}</span>
                <span class="m-rank-v2">${t.rank}</span>
            </div>`;
    });

    for (let j = activeTiers.length; j < 8; j++) {
        stats.innerHTML += `<div class="tier-circle-v2 empty-v2"></div>`;
    }

    document.getElementById("playerModal").style.display = "flex";
}

function closeModal() { document.getElementById("playerModal").style.display = "none"; }

// --- FUNCIONES ADMIN ---
function tryLogin() {
    if (document.getElementById("adminPassInput").value === ADMIN_KEY) {
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("adminContent").style.display = "block";
        loadData();
    } else { alert("Clave incorrecta"); }
}

function renderAdmin() {
    const list = document.getElementById("playersAdminList");
    list.innerHTML = allPlayers.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#161b22; border:1px solid #30363d; margin-top:8px; border-radius:8px;">
            <b style="color:white">${p.name}</b>
            <div style="display:flex; gap:10px;">
                <button onclick="editPlayer('${p.name}')" class="btn-edit">Editar</button>
                <button onclick="deletePlayer('${p.name}')" class="btn-delete">Borrar</button>
            </div>
        </div>`).join("");
}

async function addPlayer() {
    const name = document.getElementById("playerName").value.trim();
    if (!name) return;
    await fetch(`${API}/player`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "admin-key": ADMIN_KEY },
        body: JSON.stringify({ name, region: "SA" })
    });
    document.getElementById("playerName").value = "";
    loadData();
}

function editPlayer(name) {
    editingPlayer = name;
    const p = allPlayers.find(x => x.name === name);
    let html = `<div style="grid-column: 1/-1; background:#0d1117; padding:10px; border-radius:8px; border:1px solid #30363d;">
        <b style="color:#8b949e; font-size:10px;">REGION</b>
        <select id="edit_region" style="width:100%; padding:5px; background:#161b22; color:white; border:none;">
            ${regions.map(r => `<option value="${r}" ${p.region === r ? 'selected':''}>${r}</option>`).join('')}
        </select></div>`;

    modes.forEach(m => {
        html += `<div class="modality"><b>${m.toUpperCase()}</b>
            <select id="edit_${m}">
                ${Object.keys(levelPoints).map(lvl => `<option value="${lvl}" ${p[m]===lvl?'selected':''}>${lvl}</option>`).join('')}
            </select></div>`;
    });
    document.getElementById("editModes").innerHTML = html;
    document.getElementById("editModal").style.display = "flex";
}

async function saveEdit() {
    let data = { region: document.getElementById("edit_region").value };
    modes.forEach(m => data[m] = document.getElementById("edit_" + m).value);
    await fetch(`${API}/player/${editingPlayer}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "admin-key": ADMIN_KEY },
        body: JSON.stringify(data)
    });
    document.getElementById("editModal").style.display = "none";
    loadData();
}

function closeEditModal() { document.getElementById("editModal").style.display = "none"; }

async function deletePlayer(name) {
    if (!confirm(`¿Borrar a ${name}?`)) return;
    await fetch(`${API}/player/${name}`, {
        method: "DELETE",
        headers: { "admin-key": ADMIN_KEY }
    });
    loadData();
}

// Inicializar
loadData();
