const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = []; 
let currentTab = 'overall';

const levelPoints = {
    HT1: 60, LT1: 45, HT2: 30, LT2: 20,
    HT3: 10, LT3: 6, HT4: 4, LT4: 3,
    HT5: 2, LT5: 1, None: 0
};

// Mapeo de iconos (puedes cambiarlos por URLs de imágenes de items de MC)
const modeIcons = {
    sword: "⚔️", axe: "🪓", crystal: "💎", uhc: "❤️", 
    smp: "🟢", nethpot: "🧪", diamondpot: "🛡️", mace: "🔨"
};

const modes = Object.keys(modeIcons);
const regions = ["South America", "Europe", "North America", "Asia", "Africa", "Oceania"];

// --- CARGA DE DATOS ---
async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        allPlayers = await res.json();
        
        // Si estamos en la página de Admin
        if (document.getElementById("playersAdmin")) {
            renderAdmin(allPlayers);
        } else {
            // Si estamos en el Index, refrescamos la pestaña actual
            switchTab(currentTab);
        }
    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

// --- LÓGICA DE PESTAÑAS ---
function switchTab(tab) {
    currentTab = tab;
    
    // Actualizar botones UI
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    const container = document.getElementById("rankingContainer");
    if (!container) return;
    container.innerHTML = "";

    if (tab === 'overall') {
        renderOverall(allPlayers, container);
    } else {
        renderModeColumns(tab, container);
    }
}

// --- RENDERIZADO GLOBAL (Línea Recta) ---
function renderOverall(players, container) {
    players.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "player-card";
        row.onclick = () => viewPlayer(p.name);
        
        // Generamos la línea de tiers optimizada
        let tiersHtml = "";
        modes.forEach(m => {
            if (p[m] && p[m] !== "None") {
                tiersHtml += `
                    <div class="tier-pill">
                        <span class="mode-icon">${modeIcons[m]}</span>
                        <span class="tier-tag tier-${p[m]}">${p[m]}</span>
                    </div>`;
            }
        });

        row.innerHTML = `
            <div class="rank-num">#${i + 1}</div>
            <img src="https://mc-heads.net/avatar/${p.name}/40" class="mini-avatar">
            <div class="player-main">
                <span class="player-name">${p.name}</span>
                <span class="player-points">${p.points || 0} pts</span>
            </div>
            <div class="region-badge">${p.region || 'NA'}</div>
            <div class="linear-tiers">${tiersHtml}</div>
        `;
        container.appendChild(row);
    });
}

// --- RENDERIZADO POR MODALIDAD (Columnas) ---
function renderModeColumns(mode, container) {
    const grid = document.createElement("div");
    grid.className = "tier-columns-grid";

    for (let i = 1; i <= 5; i++) {
        const col = document.createElement("div");
        col.className = "tier-column";
        col.innerHTML = `<h3>Tier ${i}</h3>`;
        
        const tierKey = `HT${i}`; // O LT según tu lógica, aquí filtramos si contiene el número
        const filtered = allPlayers.filter(p => p[mode] && p[mode].includes(i));

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

// --- PERFIL (MODAL OPTIMIZADO) ---
async function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("playerAvatar").src = `https://mc-heads.net/body/${p.name}/150`;

    // Tiers en línea recta dentro del perfil
    const stats = document.getElementById("modalStats");
    stats.innerHTML = "";
    stats.className = "linear-tiers-profile";

    modes.forEach(m => {
        if (p[m] && p[m] !== "None") {
            stats.innerHTML += `
                <div class="tier-pill-large">
                    <span class="mode-icon">${modeIcons[m]}</span>
                    <span class="mode-name">${m.toUpperCase()}</span>
                    <span class="tier-tag tier-${p[m]}">${p[m]}</span>
                </div>`;
        }
    });

    document.getElementById("playerModal").style.display = "flex";
}

// --- MANTENEMOS TUS FUNCIONES DE ADMIN IGUALES ---
// (addPlayer, editPlayer, saveEdit, deletePlayer, tryLogin se mantienen igual que en tu código)
// Solo asegúrate de llamar a loadData() al final de cada acción exitosa.

function closeModal() { document.getElementById("playerModal").style.display = "none"; }
function closeEditModal() { document.getElementById("editModal").style.display = "none"; }

// Inicialización
loadData();
