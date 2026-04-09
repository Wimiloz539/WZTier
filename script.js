const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = [];
let currentTab = 'overall';

// Puntuación para ordenar de mayor a menor
const levelPoints = {
    HT1: 100, LT1: 90, HT2: 80, LT2: 70, HT3: 60, LT3: 50, HT4: 40, LT4: 30, HT5: 20, LT5: 10, None: 0
};

const modeIcons = {
    sword: "⚔️", vanilla: "📦", uhc: "❤️", pot: "🧪", 
    smp: "🌍", axe: "🪓", mace: "🔨", crystal: "💎"
};

async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        allPlayers = await res.json();
        renderRanking();
    } catch (e) { console.error("Error cargando datos:", e); }
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderRanking();
}

function renderRanking() {
    const container = document.getElementById("rankingContainer");
    container.innerHTML = "";

    // Ordenar jugadores por puntos totales
    allPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));

    allPlayers.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "player-row";
        row.onclick = () => viewPlayer(p.name);

        // Lógica de Tiers: Filtrar, Ordenar y Rellenar
        let activeTiers = Object.keys(modeIcons)
            .filter(m => p[m] && p[m] !== "None")
            .map(m => ({ mode: m, rank: p[m], pts: levelPoints[p[m]] }))
            .sort((a, b) => b.pts - a.pts); // Ordenar de mayor a menor

        let tiersHtml = "";
        // 1. Dibujar tiers activos
        activeTiers.forEach(t => {
            tiersHtml += `
                <div class="tier-circle border-${t.rank}">
                    <span class="m-icon">${modeIcons[t.mode]}</span>
                    <span class="m-rank">${t.rank}</span>
                </div>`;
        });

        // 2. Rellenar con círculos vacíos hasta 8
        for (let j = activeTiers.length; j < 8; j++) {
            tiersHtml += `<div class="tier-circle empty"></div>`;
        }

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

function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("playerAvatar").src = `https://mc-heads.net/body/${p.name}/right`;
    
    const stats = document.getElementById("modalStats");
    stats.innerHTML = "";

    Object.keys(modeIcons).forEach(m => {
        if(p[m] && p[m] !== "None") {
            stats.innerHTML += `
                <div class="tier-circle border-${p[m]}" style="width:60px; height:60px;">
                    <span style="font-size:1.5rem">${modeIcons[m]}</span>
                    <span class="m-rank" style="font-size:0.8rem">${p[m]}</span>
                </div>`;
        }
    });

    document.getElementById("playerModal").style.display = "flex";
}

function closeModal() { document.getElementById("playerModal").style.display = "none"; }

loadData();
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
