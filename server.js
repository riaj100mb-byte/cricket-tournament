const $ = id => document.getElementById(id);

async function api(url, options = {}) {
  const response = await fetch(url, options);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}


/* =========================
   LOAD TEAMS
========================= */

async function loadTeams() {
  try {
    const teams = await api("/api/teams");

    const playerTeam = $("playerTeam");
    const viewTeam = $("viewTeam");
    const teamsList = $("teamsList");

    playerTeam.innerHTML =
      '<option value="">Select Team</option>';

    viewTeam.innerHTML =
      '<option value="">Select Team</option>';

    if (teams.length === 0) {
      teamsList.innerHTML = "<p>No teams added yet.</p>";
      return;
    }

    teamsList.innerHTML = teams.map(team => `
      <div class="row">
        <div>
          <b>🏏 ${team.name}</b><br>
          👑 Captain: ${team.captain}<br>
          📱 ${team.phone}
        </div>

        <button onclick="deleteTeam(${team.id})">
          🗑️ Delete
        </button>
      </div>
    `).join("");

    teams.forEach(team => {
      playerTeam.innerHTML +=
        `<option value="${team.id}">${team.name}</option>`;

      viewTeam.innerHTML +=
        `<option value="${team.id}">${team.name}</option>`;
    });

  } catch (error) {
    $("teamsList").innerHTML =
      "<p>Failed to load teams.</p>";
  }
}


/* =========================
   CREATE TEAM
========================= */

$("teamForm").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    await api("/api/teams", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name: $("teamName").value,
        captain: $("captainName").value,
        phone: $("captainPhone").value
      })
    });

    $("teamForm").reset();

    alert("Team created successfully!");

    loadTeams();

  } catch (error) {
    alert(error.message);
  }
});


/* =========================
   DELETE TEAM
========================= */

async function deleteTeam(id) {
  if (!confirm("Delete this team and all players?")) {
    return;
  }

  try {
    await api("/api/teams/" + id, {
      method: "DELETE"
    });

    alert("Team deleted!");

    $("playersList").innerHTML =
      "<p>Select a team to see players.</p>";

    loadTeams();

  } catch (error) {
    alert(error.message);
  }
}


/* =========================
   ADD PLAYER
========================= */

$("playerForm").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const formData = new FormData();

    formData.append("team_id", $("playerTeam").value);
    formData.append("name", $("playerName").value);
    formData.append("phone", $("playerPhone").value);
    formData.append("age", $("playerAge").value);
    formData.append("village", $("playerVillage").value);

    const photo = $("playerPhoto").files[0];

    if (!photo) {
      alert("Please select a player photo");
      return;
    }

    formData.append("photo", photo);

    const response = await fetch("/api/players", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add player");
    }

    alert("Player added successfully!");

    const teamId = $("playerTeam").value;

    $("playerForm").reset();

    loadPlayers(teamId);

  } catch (error) {
    alert(error.message);
  }
});


/* =========================
   VIEW PLAYERS
========================= */

$("viewTeam").addEventListener("change", e => {
  const teamId = e.target.value;

  if (teamId) {
    loadPlayers(teamId);
  } else {
    $("playersList").innerHTML =
      "<p>Select a team to see players.</p>";
  }
});


async function loadPlayers(teamId) {
  try {
    const team = await api("/api/teams/" + teamId);

    const players = team.players;

    if (!players.length) {
      $("playersList").innerHTML =
        "<p>No players added yet.</p>";

      return;
    }

    $("playersList").innerHTML = players.map(player => `
      <div class="row">

        <div>
          ${player.photo
            ? `<img src="${player.photo}"
                 style="width:60px;height:60px;object-fit:cover;border-radius:50%;">`
            : ""
          }

          <br>

          <b>👤 ${player.name}</b><br>

          📱 ${player.phone}<br>

          🎂 Age: ${player.age}<br>

          🏠 ${player.village}
        </div>

        <div class="actions">

          <button onclick="openEditModal(${player.id})">
            ✏️ Edit
          </button>

          <button onclick="deletePlayer(${player.id})">
            🗑️ Delete
          </button>

        </div>

      </div>
    `).join("");

  } catch (error) {
    $("playersList").innerHTML =
      "<p>Failed to load players.</p>";
  }
}


/* =========================
   DELETE PLAYER
========================= */

async function deletePlayer(id) {
  if (!confirm("Delete this player?")) {
    return;
  }

  try {
    await api("/api/players/" + id, {
      method: "DELETE"
    });

    alert("Player deleted!");

    const teamId = $("viewTeam").value;

    if (teamId) {
      loadPlayers(teamId);
    }

  } catch (error) {
    alert(error.message);
  }
}


/* =========================
   EDIT PLAYER
========================= */

async function openEditModal(id) {
  alert(
    "Edit feature requires selecting the player data. " +
    "For now, player can be edited within 24 hours through the API."
  );
}


/* =========================
   START
========================= */

loadTeams();
