async function guardarJugador() {
    const password = document.getElementById('adminPassword').value;
    const nuevoJugador = {
        name: document.getElementById('name').value,
        sword: document.getElementById('swordTier').value,
        region: document.getElementById('region').value
        // ... agregá todos los modos acá
    };

    const response = await fetch("https://tu-app.onrender.com/player", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "admin-key": password // Acá mandás la clave
        },
        body: JSON.stringify(nuevoJugador)
    });

    if (response.ok) {
        alert("¡Jugador guardado!");
    } else {
        alert("Error: Clave incorrecta o fallo del servidor");
    }
}
