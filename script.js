const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = [];
let editingPlayer = null;

const modes = ["sword", "vanilla", "uhc", "pot", "smp", "axe", "mace", "crystal"];
const regions = ["NA", "EU", "SA", "AS", "OC"];
const levelPoints = { HT1: 100, LT1: 90, HT2: 80, LT2: 70, HT3: 60, LT3: 50, HT4: 40, LT4: 30, HT5: 20, LT5: 10, None: 0 };

// 1. Cargar Datos
async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        allPlayers = await res.json();
        
        // Si existe la tabla de admin, la llenamos
        if (document.getElementById("playersAdmin")) {
            renderAdminTable();
        }
    } catch (e) { 
        console.error("Error cargando datos:", e); 
    }
}

// 2. Dibujar Tabla en Admin
function renderAdminTable() {
    const tbody = document.getElementById("playersAdmin");
    if (!tbody) return;
    tbody.innerHTML = "";

    allPlayers.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.region || 'None'}</td>
            <td><button onclick="editPlayer('${p.name}')">📝 Editar</button></td>
            <td><button onclick="deletePlayer('${p.name}')" style="background:#da3633; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">🗑️ Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Login
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

// 4. Agregar Jugador
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

// 5. Editar (Abrir Modal)
function editPlayer(name) {
    editingPlayer = name;
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;
    
    document.getElementById("editName").innerText = p.name;
    
    let html = `
        <div style="margin-bottom:15px;">
            <label><b>REGIÓN</b></label><br>
            <select id="edit_region" style="width:100%; padding:8px; background:#161b22; color:white; border:1px solid #30363d;">
                ${regions.map(r => `<option value="${r}" ${p.region === r ? 'selected':''}>${r}</option>`).join('')}
            </select>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
    `;

    modes.forEach(m => {
        html += `
            <div class="modality">
                <label style="font-size:12px;">${m.toUpperCase()}</label><br>
                <select id="edit_${m}" style="width:100%; padding:5px; background:#0d1117; color:white; border:1px solid #30363d;">
                    ${Object.keys(levelPoints).map(lvl => `<option value="${lvl}" ${p[m]===lvl?'selected':''}>${lvl}</option>`).join('')}
                </select>
            </div>`;
    });
    
    html += `</div>`;
    document.getElementById("editModes").innerHTML = html;
    document.getElementById("editModal").style.display = "flex";
}

// 6. Guardar Edición
async function saveEdit() {
    let data = { region: document.getElementById("edit_region").value };
    modes.forEach(m => data[m] = document.getElementById("edit_" + m).value);

    try {
        const res = await fetch(`${API}/player/${editingPlayer}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "admin-key": ADMIN_KEY },
            body: JSON.stringify(data)
        });
        if(res.ok) {
            closeEditModal();
            loadData();
        } else { alert("Error en el servidor"); }
    } catch (e) { alert("Error al guardar"); }
}

function closeEditModal() { document.getElementById("editModal").style.display = "none"; }

// 7. Eliminar
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

// Iniciar
loadData();
