const ADMIN_KEY = "WZ21TIERS539";
const API = "https://tiers.onrender.com";
let allPlayers = [];
let currentTab = 'overall';
let editingPlayer = null;

// Puntuación y Configuración
const levelPoints = {
    HT1: 60, RHT1: 30, LT1: 45, RLT1: 25, HT2: 30, RHT2: 15, LT2: 20, RLT2: 1O, HT3: 10, LT3: 6, HT4: 4, LT4: 3, HT5: 2, LT5: 1, None: 0
};

const modeIcons = {
    sword: "⚔️", axe: "🪓", crystal: "💎", uhc: "❤️",
    smp: "🌍", nethpot: "🧪", diamondpot: "🥵", mace: "🔨"
};

const modes = Object.keys(modeIcons);
const regions = ["NA", "EU", "SA", "AS", "OC"]

// Carga inicial de datos
async function loadData() {
    try {
        const res = await fetch(`${API}/players`);
        const data = await res.json();
        
        // Calcular puntos y ordenar
        allPlayers = data.map(p => {
            let pts = 0;
            modes.forEach(m => pts += (levelPoints[p[m]] || 0));
            return { ...p, points: pts };
        });

        // Solo renderiza si los contenedores existen en la página actual
        if (document.getElementById("rankingContainer")) {
            renderRanking();
        }
        if (document.getElementById("playersAdmin")) {
            renderAdminTable();
        }
    } catch (e) { 
        console.error("Error cargando datos:", e); 
    }
}

// --- RANKING (index.html) ---
function switchTab(tab, event) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (event) event.target.classList.add('active');
    renderRanking();
}

function renderRanking() {
    const container = document.getElementById("rankingContainer");
    if (!container) return;
    container.innerHTML = "";

    let sorted = [...allPlayers];
    if (currentTab === 'overall') {
        sorted.sort((a, b) => b.points - a.points);
    } else {
        sorted = sorted.filter(p => p[currentTab] && p[currentTab] !== "None");
        sorted.sort((a, b) => levelPoints[b[currentTab]] - levelPoints[a[currentTab]]);
    }

    sorted.forEach((p, i) => {
        let activeTiers = modes
            .filter(m => p[m] && p[m] !== "None")
            .map(m => ({ mode: m, rank: p[m], pts: levelPoints[p[m]] }))
            .sort((a, b) => b.pts - a.pts);

        let tiersHtml = activeTiers.map(t => `
            <div class="tier-circle border-${t.rank}">
                <span class="m-icon">${modeIcons[t.mode]}</span>
                <span class="m-rank">${t.rank}</span>
            </div>`).join("");

        for (let j = activeTiers.length; j < 8; j++) {
            tiersHtml += `<div class="tier-circle empty"></div>`;
        }

        const row = document.createElement("div");
        row.className = "player-row";
        row.onclick = () => viewPlayer(p.name);
        row.innerHTML = `
            <span class="rank-index">#${i + 1}</span>
            <img src="https://mc-heads.net/avatar/${p.name}/40" class="p-icon">
            <div class="name-box">
                <span class="p-name">${p.name}</span>
                <span class="p-pts">${p.points || 0} PTS</span>
            </div>
            <div class="region-tag">${p.region || 'SA'}</div>
            <div class="tiers-container">${tiersHtml}</div>
        `;
        container.appendChild(row);
    });
}

function viewPlayer(name) {
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;

    const modal = document.getElementById("playerModal");
    if (!modal) return;

    document.getElementById("modalName").innerText = p.name;
    const avatarImg = document.getElementById("playerAvatar");
    if (avatarImg) avatarImg.src = `https://mc-heads.net/body/${p.name}/right`;
    
    if (document.getElementById("modalRegionTag")) {
        document.getElementById("modalRegionTag").innerText = p.region || "SA";
    }

    const stats = document.getElementById("modalStats");
    if (stats) {
        stats.innerHTML = "";
        modes.forEach(m => {
            if(p[m] && p[m] !== "None") {
                stats.innerHTML += `
                    <div class="tier-circle border-${p[m]}" style="width:60px; height:60px;">
                        <span style="font-size:1.5rem">${modeIcons[m]}</span>
                        <span class="m-rank" style="font-size:0.8rem">${p[m]}</span>
                    </div>`;
            }
        });
    }

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("playerModal");
    if (modal) modal.style.display = "none";
}

// --- ADMIN (admin.html) ---
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
            <td><button onclick="deletePlayer('${p.name}')" style="background:#da3633; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">🗑️ Borrar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function addPlayer() {
    const nameInput = document.getElementById("playerName");
    const name = nameInput.value.trim();
    if (!name) return alert("Escribí un nombre");

    try {
        const res = await fetch(`${API}/player`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "admin-key": ADMIN_KEY },
            body: JSON.stringify({ name, region: "SA" })
        });
        if (res.ok) {
            nameInput.value = "";
            loadData();
        }
    } catch (e) { alert("Error al conectar con el servidor"); }
}

function editPlayer(name) {
    editingPlayer = name;
    const p = allPlayers.find(x => x.name === name);
    if (!p) return;
    
    document.getElementById("editName").innerText = p.name;
    
    let html = `
        <div style="grid-column: 1/-1; background:#21262d; padding:15px; border-radius:8px; margin-bottom:10px;">
            <b style="color:#58a6ff;">REGIÓN</b>
            <select id="edit_region" style="width:100%; background:#0d1117; color:white; padding:5px; border:1px solid #30363d;">
                ${regions.map(r => `<option value="${r}" ${p.region === r ? 'selected':''}>${r}</option>`).join('')}
            </select>
        </div>`;

    modes.forEach(m => {
        html += `
            <div class="modality" style="background:#161b22; padding:10px; border-radius:8px; border:1fr solid #30363d;">
                <b style="font-size:11px;">${m.toUpperCase()}</b><br>
                <select id="edit_${m}" style="width:100%; background:#0d1117; color:white; border:none;">
                    ${Object.keys(levelPoints).map(lvl => `<option value="${lvl}" ${p[m]===lvl?'selected':''}>${lvl}</option>`).join('')}
                </select>
            </div>`;
    });
    
    document.getElementById("editModes").innerHTML = html;
    document.getElementById("editModal").style.display = "flex";
}

async function saveEdit() {
    let data = { region: document.getElementById("edit_region").value };
    modes.forEach(m => data[m] = document.getElementById("edit_" + m).value);

    try {
        const res = await fetch(`${API}/player/${editingPlayer}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "admin-key": ADMIN_KEY },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            closeEditModal();
            loadData();
        }
    } catch (e) { alert("Error al guardar cambios"); }
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

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

// Carga inicial
loadData();
