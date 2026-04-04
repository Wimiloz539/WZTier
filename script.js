const ADMIN_KEY = "WZ21TIERS539";
let allPlayers = []; 
const API = "https://tiers.onrender.com";

const levelPoints = {
    HT1: 60, LT1: 45, HT2: 30, LT2: 20,
    HT3: 10, LT3: 6, HT4: 4, LT4: 3,
    HT5: 2, LT5: 1, None: 0
};

const modes = ["sword", "axe", "crystal", "uhc", "smp", "nethpot", "diamondpot", "mace"];
const regions = ["South America", "Europe", "North America", "Asia", "Africa", "Oceania"];

let editingPlayer = null;

// --- CARGA DE DATOS ---
async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        const players = await res.json();
        allPlayers = players;

        if (document.getElementById("rankingBody")) renderRanking(players);
        if (document.getElementById("playersAdmin")) renderAdmin(players);
    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

// --- RENDERIZADO ---
function renderRanking(players) {
    const tbody = document.getElementById("rankingBody");
    tbody.innerHTML = "";
    players.forEach((p, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.points || 0}</td>
                <td><button onclick="viewPlayer('${p.name}')">Ver Perfil</button></td>
            </tr>`;
    });
}

function renderAdmin(players) {
    const tbody = document.getElementById("playersAdmin");
    tbody.innerHTML = "";
    players.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>${p.region || "None"}</td>
                <td><button class="btn-edit" onclick="editPlayer('${p.name}')">Editar</button></td>
                <td><button class="btn-delete" onclick="deletePlayer('${p.name}')">Eliminar</button></td>
            </tr>`;
    });
}

// --- PERFIL (MODAL) ---
async function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    document.getElementById("modalName").innerText = p.name;
    const regionText = p.region && p.region !== "None" ? p.region : "No Region";
    const pIndex = allPlayers.findIndex(x => x.name === name);

    document.getElementById("modalRank").innerHTML = `
        <div class="region-text">${regionText}</div>
        <div class="position-container">
            <div class="rank-side">#${pIndex + 1}</div>
            <div class="info-side">
                <span class="trophy">🏆</span> 
                <strong>OVERALL</strong> 
                <span class="points-text">(${p.points || 0} points)</span>
            </div>
        </div>
    `;
    
    if(document.getElementById("playerAvatar")) {
        document.getElementById("playerAvatar").src = `https://mc-heads.net/avatar/${p.name}/100`;
    }

    const stats = document.getElementById("modalStats");
    stats.innerHTML = "";
    modes.forEach(m => {
        stats.innerHTML += `
            <div class="tier-item">
                <div class="tier-info-text">
                    <span class="tier-name">${m.toUpperCase()}</span>
                    <span class="tier-value">${p[m] || "None"}</span>
                </div>
            </div>`;
    });

    document.getElementById("playerModal").style.display = "flex";
}

function closeModal() { document.getElementById("playerModal").style.display = "none"; }

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

// --- SEGURIDAD DE ACCESO AL PANEL ---

// --- NUEVO SISTEMA DE LOGIN SEGURO ---

function tryLogin() {
    const enteredPass = document.getElementById("adminPassInput").value;

    if (enteredPass === ADMIN_KEY) {
        // Si es correcta, ocultamos el login y mostramos el admin
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("adminContent").style.display = "block";
        loadData();
    } else {
        alert("Clave incorrecta");
    }
}

// Esta función ahora solo verifica si estamos en la página de admin
function initAdmin() {
    if (document.getElementById("playersAdmin")) {
        // No hacemos nada, esperamos a que el usuario use el botón "Entrar"
    } else {
        loadData(); // Carga normal si es el ranking
    }
}

initAdmin();
// Reemplazamos el loadData() seco por la validación
checkAdminAccess();
