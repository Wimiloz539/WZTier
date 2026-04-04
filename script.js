const API = "https://tiers.onrender.com/players"; 

const levelPoints = {
    HT1: 60, LT1: 45, HT2: 30, LT2: 20,
    HT3: 10, LT3: 6, HT4: 4, LT4: 3,
    HT5: 2, LT5: 1, None: 0
};

const modes = ["sword", "axe", "crystal", "uhc", "smp", "nethpot", "diamondpot", "mace"];
const regions = ["South America", "Europe", "North America", "Asia", "Africa", "Oceania"];

let editingPlayer = null;

async function loadRanking() {
    const tbody = document.getElementById("rankingBody");
    if (!tbody) return;
    try {
        const res = await fetch(API);
        const players = await res.json();
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
    } catch (e) { console.error(e); }
}

async function viewPlayer(name) {
    try {
        const res = await fetch(API);
        const players = await res.json();
        players.sort((a, b) => (b.points || 0) - (a.points || 0));
        const pIndex = players.findIndex(x => x.name === name);
        const p = players[pIndex];
        if (!p) return;

        document.getElementById("modalName").innerText = p.name;
        
        const regionText = p.region && p.region !== "None" ? p.region : "No Region";
        
        // Estructura exacta de la imagen: Region arriba y un solo cuadro de Overall
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
    } catch (e) { console.error(e); }
}

function closeModal() { document.getElementById("playerModal").style.display = "none"; }

async function loadAdmin() {
    const tbody = document.getElementById("playersAdmin");
    if (!tbody) return;
    try {
        const res = await fetch(API);
        const players = await res.json();
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
    } catch (e) { console.error(e); }
}

async function editPlayer(name) {
    editingPlayer = name;
    try {
        const res = await fetch(API);
        const players = await res.json();
        const p = players.find(x => x.name === name);
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
    } catch (e) { console.error(e); }
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
        await fetch(`http://localhost:3000/player/${editingPlayer}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        closeEditModal();
        loadAdmin();
        loadRanking();
    } catch (e) { alert("Error al guardar"); }
}

function closeEditModal() { document.getElementById("editModal").style.display = "none"; }

async function addPlayer() {
    const nameInput = document.getElementById("playerName");
    const name = nameInput.value.trim();
    if (!name) return alert("Escribí un nombre");
    try {
        await fetch("http://localhost:3000/player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, region: "None", points: 0 })
        });
        nameInput.value = "";
        loadAdmin();
    } catch (e) { alert("Error al conectar"); }
}

async function deletePlayer(name) {
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    try {
        await fetch(`http://localhost:3000/player/${name}`, { method: "DELETE" });
        loadAdmin();
    } catch (e) { console.error(e); }
}

loadRanking();
loadAdmin();

// --- FUNCIONES DE ADMIN ---

// Cargar la tabla de admin al entrar
if (document.getElementById('playersAdmin')) {
    window.addEventListener('load', loadAdminTable);
}

async function loadAdminTable() {
    const res = await fetch(`${API}/players`);
    const players = await res.json();
    const tbody = document.getElementById('playersAdmin');
    tbody.innerHTML = "";

    players.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>${p.region || 'N/A'}</td>
                <td><button class="btn-edit" onclick="openEditModal('${p.name}')">📝 Editar</button></td>
                <td><button class="btn-delete" onclick="deletePlayer('${p.name}')">🗑️ Borrar</button></td>
            </tr>
        `;
    });
}

// Agregar jugador nuevo
async function addPlayer() {
    const name = document.getElementById('playerName').value;
    if (!name) return alert("Falta el nombre");

    const newPlayer = {
        name: name,
        sword: "None", axe: "None", crystal: "None", uhc: "None",
        smp: "None", nethpot: "None", diamondpot: "None", mace: "None",
        region: "South America"
    };

    const res = await fetch(`${API}/player`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'admin-key': ADMIN_KEY 
        },
        body: JSON.stringify(newPlayer)
    });

    if (res.ok) {
        alert("Agregado!");
        loadAdminTable();
    }
}

// Abrir modal para editar tiers
let currentPlayerName = "";
async function openEditModal(name) {
    const res = await fetch(`${API}/players`);
    const players = await res.json();
    const p = players.find(x => x.name === name);
    
    currentPlayerName = name;
    document.getElementById('editName').innerText = name;
    const container = document.getElementById('editModes');
    container.innerHTML = "";

    modes.forEach(m => {
        container.innerHTML += `
            <div class="edit-field">
                <label>${m.toUpperCase()}:</label>
                <input type="text" id="edit-${m}" value="${p[m] || 'None'}">
            </div>
        `;
    });
    // Agregar campo de región
    container.innerHTML += `
        <div class="edit-field">
            <label>REGIÓN:</label>
            <input type="text" id="edit-region" value="${p.region || 'South America'}">
        </div>
    `;

    document.getElementById('editModal').style.display = "flex";
}

// Guardar cambios del modal
async function saveEdit() {
    const updated = {};
    modes.forEach(m => updated[m] = document.getElementById(`edit-${m}`).value);
    updated.region = document.getElementById('edit-region').value;

    const res = await fetch(`${API}/player/${currentPlayerName}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'admin-key': ADMIN_KEY 
        },
        body: JSON.stringify(updated)
    });

    if (res.ok) {
        alert("Actualizado!");
        closeEditModal();
        loadAdminTable();
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = "none";
}

async function deletePlayer(name) {
    if (!confirm(`¿Borrar a ${name}?`)) return;
    await fetch(`${API}/player/${name}`, {
        method: 'DELETE',
        headers: { 'admin-key': ADMIN_KEY }
    });
    loadAdminTable();
}
