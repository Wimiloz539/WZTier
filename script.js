let allPlayers = []; 
const API = "https://tiers.onrender.com"; // Asegurate que este sea el link de Render sin /players al final

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
        
        // Guardamos en la variable global para que el admin pueda leerlos
        allPlayers = players;

        // Si estamos en la página de Ranking
        if (document.getElementById("rankingBody")) {
            renderRanking(players);
        }
        
        // Si estamos en la página de Admin
        if (document.getElementById("playersAdmin")) {
            renderAdmin(players);
        }
    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

// --- RENDERIZADO ---

function renderRanking(players) {
    const tbody = document.getElementById("rankingBody");
    players.sort((a, b) => (b.points || 0) - (a.points || 0));
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

// --- FUNCIONES DE PERFIL (MODAL) ---

async function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    document.getElementById("modalName").innerText = p.name;
    const regionText = p.region && p.region !== "None" ? p.region : "No Region";
    const pIndex = allPlayers.sort((a, b) => (b.points || 0) - (a.points || 0)).findIndex(x => x.name === name);

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
    
    const avatarImg = document.getElementById("playerAvatar");
    if(avatarImg) avatarImg.src = `https://mc-heads.net/avatar/${p.name}/100`;

    const stats = document.getElementById("modalStats");
    stats.innerHTML = "";
    modes.forEach(m => {
        const val = p[m] || "None";
        stats.innerHTML += `
            <div class="tier-item">
                <div class="tier-info-text">
                    <span class="tier-name">${m.toUpperCase()}</span>
                    <span class="tier-value">${val}</span>
                </div>
            </div>`;
    });

    document.getElementById("playerModal").style.display = "flex";
}

function closeModal() { 
    document.getElementById("playerModal").style.display = "none"; 
}

// --- ACCIONES DE ADMIN ---

async function addPlayer() {
    const nameInput = document.getElementById("playerName");
    const name = nameInput.value.trim();
    if (!name) return alert("Escribí un nombre");

    try {
        await fetch(`${API}/player`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, region: "None", points: 0 })
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
    
    let html = `
        <div style="grid-column: 1 / -1; background: #21262d; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #30363d; text-align: left;">
            <b style="display: block; margin-bottom: 8px; color: #58a6ff; font-size: 0.8rem;">REGIÓN</b>
            <select id="edit_region" style="width: 100%; padding: 8px; border-radius: 4px; background: #0d1117; color: white; border: 1px solid #30363d;">
                <option value="None" ${!p.region || p.region === "None" ? "selected" : ""}>Select Region</option>
                ${regions.map(reg => `<option value="${reg}" ${p.region === reg ? "selected" : ""}>${reg}</option>`).join('')}
            </select>
        </div>`;

    modes.forEach(m => {
        html += `
            <div class="modality">
                <b>${m.toUpperCase()}</b>
                <select id="edit_${m}">
                    ${Object.keys(levelPoints).map(lvl => 
                        `<option value="${lvl}" ${p[m] === lvl ? "selected" : ""}>${lvl}</option>`
                    ).join('')}
                </select>
            </div>`;
    });

    document.getElementById("editModes").innerHTML = html;
    document.getElementById("editModal").style.display = "flex";
}

async function saveEdit() {
    let data = { 
        region: document.getElementById("edit_region").value,
        points: 0 
    };

    modes.forEach(m => { 
        const val = document.getElementById("edit_" + m).value;
        data[m] = val;
        data.points += levelPoints[val] || 0;
    });

    try {
        await fetch(`${API}/player/${editingPlayer}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        closeEditModal();
        loadData();
    } catch (e) { alert("Error al guardar"); }
}

function closeEditModal() { 
    document.getElementById("editModal").style.display = "none"; 
}

async function deletePlayer(name) {
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    try {
        await fetch(`${API}/player/${name}`, { method: "DELETE" });
        loadData();
    } catch (e) { console.error(e); }
}

// --- ARRANQUE ---
loadData();
