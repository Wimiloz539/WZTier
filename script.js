const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = []; 
let currentTab = 'overall';

const levelPoints = {
    HT1: 60, LT1: 45, HT2: 30, LT2: 20,
    HT3: 10, LT3: 6, HT4: 4, LT4: 3,
    HT5: 2, LT5: 1, None: 0
};

const modeIcons = {
    sword: "⚔️", axe: "🪓", crystal: "💎", uhc: "❤️", 
    smp: "🟢", nethpot: "🧪", diamondpot: "🛡️", mace: "🔨"
};

const modes = Object.keys(modeIcons);
const regions = ["South America", "Europe", "North America", "Asia", "Africa", "Oceania"];

async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        allPlayers = await res.json();
        
        // Renderizar según donde estemos
        if (document.getElementById("playersAdmin")) renderAdmin(allPlayers);
        switchTab(currentTab);
    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tab));
    });

    const container = document.getElementById("rankingContainer");
    container.innerHTML = "";

    if (tab === 'overall') {
        renderOverall(container);
    } else {
        renderModeColumns(tab, container);
    }
}

function renderOverall(container) {
    allPlayers.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "player-row";
        row.onclick = () => viewPlayer(p.name);
        
        let tiersHtml = "";
        modes.forEach(m => {
            if (p[m] && p[m] !== "None") {
                tiersHtml += `<div class="tier-pill"><span class="tier-tag tier-${p[m]}">${p[m]}</span></div>`;
            }
        });

        row.innerHTML = `
            <div class="rank-num">#${i + 1}</div>
            <img src="https://mc-heads.net/avatar/${p.name}/32" class="mini-avatar">
            <div class="player-info">
                <span class="player-name">${p.name}</span>
                <span class="player-points">${p.points || 0} pts</span>
            </div>
            <div class="linear-tiers">${tiersHtml}</div>
        `;
        container.appendChild(row);
    });
}

function renderModeColumns(mode, container) {
    const grid = document.createElement("div");
    grid.className = "tier-columns-grid";

    for (let i = 1; i <= 5; i++) {
        const col = document.createElement("div");
        col.className = "tier-column";
        col.innerHTML = `<h3>Tier ${i}</h3>`;
        
        const filtered = allPlayers.filter(p => p[mode] && p[mode].includes(i.toString()));
        filtered.forEach(p => {
            col.innerHTML += `
                <div class="mini-player-card" onclick="viewPlayer('${p.name}')">
                    <img src="https://mc-heads.net/avatar/${p.name}/24">
                    <span>${p.name}</span>
                </div>`;
        });
        grid.appendChild(col);
    }
    container.appendChild(grid);
}

// Perfil Modal
async function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("playerAvatar").src = `https://mc-heads.net/body/${p.name}/120`;
    
    const stats = document.getElementById("modalStats");
    stats.innerHTML = "";
    modes.forEach(m => {
        if(p[m] && p[m] !== "None") {
            stats.innerHTML += `
                <div class="tier-item">
                    <span class="tier-name">${m.toUpperCase()}</span>
                    <span class="tier-tag tier-${p[m]}">${p[m]}</span>
                </div>`;
        }
    });
    document.getElementById("playerModal").style.display = "flex";
}

function closeModal() { document.getElementById("playerModal").style.display = "none"; }

// Lógica de Admin (Login y Edición)
function tryLogin() {
    if (document.getElementById("adminPassInput").value === ADMIN_KEY) {
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("adminContent").style.display = "block";
        loadData();
    } else { alert("Clave incorrecta"); }
}

// Mantén tus funciones de addPlayer, editPlayer, saveEdit, deletePlayer igual que antes...
// Pero asegúrate de que al final llamen a loadData();

// --- ACCIONES ADMIN ---
async function addPlayer() {
    const nameInput = document.getElementById("playerName");
    const name = nameInput.value.trim();
    if (!name) return alert("Escribí un nombre válido");

    try {
        await fetch(`${API}/player`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "admin-key": ADMIN_KEY },
            body: JSON.stringify({ name, region: "None" })
        });
        nameInput.value = "";
        loadData();
    } catch (e) { alert("Error al conectar"); }
}

function editPlayer(name) {
    editingPlayer = name;
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;
    document.getElementById("editName").innerText = p.name;
    
    let html = `<div style="grid-column: 1/-1; background:#21262d; padding:15px; border-radius:8px; margin-bottom:10px;">
        <b style="color:#58a6ff;">REGIÓN</b>
        <select id="edit_region" style="width:100%; background:#0d1117; color:white;">
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
    } catch (e) { console.error(e); }
}

loadData();

// --- SISTEMA DE LOGIN ---

function tryLogin() {
    const enteredPass = document.getElementById("adminPassInput").value;

    if (enteredPass === ADMIN_KEY) {
        // Mostramos el panel y ocultamos el login
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("adminContent").style.display = "block";
        loadData();
    } else {
        alert("Clave incorrecta");
    }
}

// Inicialización
function init() {
    // Si NO hay panel de admin (estamos en el index), cargamos datos normal
    if (!document.getElementById("playersAdmin")) {
        loadData();
    }
}

init();
