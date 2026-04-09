const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = [];
let currentTab = 'overall';

const levelPoints = { HT1: 60, LT1: 45, HT2: 30, LT2: 20, HT3: 10, LT3: 6, HT4: 4, LT4: 3, HT5: 2, LT5: 1, None: 0 };
const modeIcons = { sword: "⚔️", vanilla: "📦", uhc: "❤️", pot: "🧪", smp: "🌍", axe: "🪓", mace: "🔨", crystal: "💎" };
const modes = Object.keys(modeIcons);

async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        const data = await res.json();
        
        allPlayers = data.map(p => {
            let pts = 0;
            modes.forEach(m => pts += (levelPoints[p[m]] || 0));
            return { ...p, points: pts };
        });

        render();
    } catch (e) { console.error("Error:", e); }
}

function changeTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(tab));
    });
    render();
}

function render() {
    const container = document.getElementById("rankingContainer");
    let playersToShow = [...allPlayers];

    // Si no es "overall", filtramos y ordenamos por esa modalidad específica
    if (currentTab !== 'overall') {
        playersToShow = playersToShow.filter(p => p[currentTab] && p[currentTab] !== "None");
        playersToShow.sort((a, b) => levelPoints[b[currentTab]] - levelPoints[a[currentTab]]);
    } else {
        playersToShow.sort((a, b) => b.points - a.points);
    }

    container.innerHTML = playersToShow.map((p, index) => {
        // Generar tiers ordenados para la fila
        let playerTiers = modes
            .map(m => ({ mode: m, rank: p[m] || 'None', pts: levelPoints[p[m]] || 0 }))
            .filter(t => t.rank !== 'None')
            .sort((a, b) => b.pts - a.pts); // Ordenar de mayor a menor

        let tiersHtml = playerTiers.map(t => `
            <div class="tier-pill border-${t.rank}">
                <span>${modeIcons[t.mode]}</span>
                <span class="rank-text">${t.rank}</span>
            </div>
        `).join("");

        return `
            <div class="player-row" onclick="viewPlayer('${p.name}')">
                <div class="rank-num">#${index + 1}</div>
                <img class="p-head" src="https://mc-heads.net/avatar/${p.name}/32">
                <div class="p-info">
                    <span class="p-name">${p.name}</span>
                    <span class="p-pts-sub">${p.points} pts</span>
                </div>
                <div class="p-tiers-line">${tiersHtml}</div>
            </div>`;
    }).join("");
}

async function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalRegion").innerText = p.region || "South America";
    // Skin 3D de cuerpo completo (Frontal)
    document.getElementById("playerBody").src = `https://mc-heads.net/body/${p.name}/right`;
    document.getElementById("modalNameMC").href = `https://namemc.com/search?q=${p.name}`;
    
    const globalRank = allPlayers.findIndex(x => x.name === name) + 1;
    document.getElementById("modalRankSide").innerText = `#${globalRank} Overall`;
    document.getElementById("modalPoints").innerText = `${p.points} Points`;

    const statsContainer = document.getElementById("modalStats");
    
    // Tiers ordenados para el modal
    let sortedTiers = modes
        .map(m => ({ mode: m, rank: p[m] || 'None', pts: levelPoints[p[m]] || 0 }))
        .filter(t => t.rank !== 'None')
        .sort((a, b) => b.pts - a.pts);

    statsContainer.innerHTML = sortedTiers.map(t => `
        <div class="modal-tier-card border-${t.rank}">
            <div class="m-icon">${modeIcons[t.mode]}</div>
            <div class="m-mode-name">${t.mode.toUpperCase()}</div>
            <div class="m-rank-val">${t.rank}</div>
        </div>
    `).join("");

    document.getElementById("playerModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("playerModal").style.display = "none";
}

loadData();

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
