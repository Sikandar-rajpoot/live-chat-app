document.addEventListener("DOMContentLoaded", function () {
    const logsContainer = document.getElementById("logs-container");
    const userSelect = document.getElementById("user-select");
    const downloadButton = document.getElementById("download-logs");

    async function fetchLogs(userId) {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/logs/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch logs");

            const data = await response.json();
            logsContainer.innerHTML = data.logs.map(log => `<p>${log}</p>`).join("");
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    }

    async function fetchAllUsers() {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/logs/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch user list");

            const data = await response.json();
            userSelect.innerHTML = Object.keys(data).map(userId =>
                `<option value="${userId}">User ${userId}</option>`).join("");

            userSelect.addEventListener("change", () => fetchLogs(userSelect.value));
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    downloadButton.addEventListener("click", function () {
        const selectedUser = userSelect.value;
        if (!selectedUser) return alert("Select a user first");

        const link = document.createElement("a");
        link.href = `/logs/${selectedUser}`;
        link.download = `user_${selectedUser}_logs.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    fetchAllUsers();
});
