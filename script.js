const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = [];

const levelPoints = {
    HT1: 60, LT1: 45, HT2: 30, LT2: 20, HT3: 10, LT3: 6, HT4: 4, LT4: 3, HT5: 2, LT5: 1, None: 0
};

const modeIcons = {
    sword: "⚔️", vanilla: "📦", uhc: "❤️", pot: "🧪", 
    smp: "🌍", axe: "🪓", mace: "🔨", crystal: "💎"
};

// ... (loadData, switchTab, renderOverall se mantienen igual que en tu código actual)

async function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    // 1. Datos Básicos
    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalRegion").innerText = p.region || "No Region";
    document.getElementById("playerAvatar").src = `https://mc-heads.net/avatar/${p.name}/120`;
    document.getElementById("modalNameMC").href = `https://namemc.com/search?q=${p.name}`;

    // 2. Datos de Posición y Puntos (Cuadro Dorado)
    const pIndex = allPlayers.findIndex(x => x.name === name);
    document.getElementById("modalRankSide").innerText = `${pIndex + 1}.`;
    document.getElementById("modalPoints").innerText = `(${p.points || 0} points)`;

    // 3. Tiers Horizontales y Ordenados
    const stats = document.getElementById("modalStats");
    stats.innerHTML = "";

    let activeTiers = Object.keys(modeIcons)
        .filter(m => p[m] && p[m] !== "None")
        .map(m => ({ mode: m, rank: p[m], pts: levelPoints[p[m]] }))
        .sort((a, b) => b.pts - a.pts);

    activeTiers.forEach(t => {
        stats.innerHTML += `
            <div class="tier-circle-v2 border-v2-${t.rank}">
                <span class="m-icon-v2">${modeIcons[t.mode]}</span>
                <span class="m-rank-v2">${t.rank}</span>
            </div>`;
    });

    // 4. Llenar vacíos con círculos vacíos
    for (let j = activeTiers.length; j < 8; j++) {
        stats.innerHTML += `<div class="tier-circle-v2 empty-v2"></div>`;
    }

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
