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

    const teamSelect = $("playerTeam");
    const viewSelect = $("viewTeam");
    const teamsList = $("teamsList");

    teamSelect.innerHTML =
      '<option value="">Select Team</option>';

    viewSelect.innerHTML =
      '<option value="">Select Team</option>';

    if (teams.length === 0) {
      teamsList.innerHTML = "<p>No teams added yet.</p>";
      return;
    }

    teamsList.innerHTML = teams.map(team => `
      <div class="row">
        <div>
          <b>🏏 ${team.name}</b>
          <br>
          👑 Captain: ${team.captain_name}
          <br>
          📱 ${team.captain_phone}
        </div>

        <div class="actions">
          <button onclick="deleteTeam('${team._id}')">
            🗑️ Delete
          </button>
        </div>
      </div>
    `).join("");

    teams.forEach(team => {
      teamSelect.innerHTML += `
        <option value="${team._id}">
          ${team.name}
        </option>
      `;

      viewSelect.innerHTML += `
        <option value="${team._id}">
          ${team.name}
        </option>
      `;
    });

  } catch (error) {
    console.error(error);
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
        captain_name: $("captainName").value,
        captain_phone: $("captainPhone").value
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

    alert("Team deleted successfully!");

    loadTeams();

    $("playersList").innerHTML =
      "<p>Select a team to see players.</p>";

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

    const teamId = $("playerTeam").value;

    if (!teamId) {
      alert("Please select a team");
      return;
    }

    await api("/api/players", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        team_id: teamId,
        name: $("playerName").value,
        phone: $("playerPhone").value,
        age: Number($("playerAge").value),
        village: $("playerVillage").value
      })
    });

    $("playerForm").reset();

    alert("Player added successfully!");

    loadPlayers(teamId);

  } catch (error) {
    alert(error.message);
  }
});


/* =========================
   LOAD PLAYERS
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

    const players =
      await api("/api/players?team_id=" + teamId);

    if (players.length === 0) {
      $("playersList").innerHTML =
        "<p>No players added yet.</p>";

      return;
    }

    $("playersList").innerHTML =
      players.map(player => `

      <div class="row">

        <div>

          <b>👤 ${player.name}</b>

          <br>

          📱 ${player.phone}

          <br>

          🎂 Age: ${player.age}

          <br>

          🏠 ${player.village}

        </div>

        <div class="actions">

          <button onclick="openEditModal('${player._id}')">
            ✏️ Edit
          </button>

          <button onclick="deletePlayer('${player._id}')">
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

  try {

    const player =
      await api("/api/players/" + id);

    $("editPlayerId").value = player._id;

    $("editName").value = player.name;
    $("editPhone").value = player.phone;
    $("editAge").value = player.age;
    $("editVillage").value = player.village;

    $("editModal").style.display = "block";

  } catch (error) {
    alert(error.message);
  }

}


function closeEditModal() {

  $("editModal").style.display = "none";

}


$("editPlayerForm").addEventListener("submit", async e => {

  e.preventDefault();

  const id = $("editPlayerId").value;

  try {

    await api("/api/players/" + id, {

      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        name: $("editName").value,

        phone: $("editPhone").value,

        age: Number($("editAge").value),

        village: $("editVillage").value

      })

    });

    closeEditModal();

    const teamId = $("viewTeam").value;

    if (teamId) {
      loadPlayers(teamId);
    }

    alert("Player updated successfully!");

  } catch (error) {

    alert(error.message);

  }

});


/* =========================
   START
========================= */

loadTeams();
