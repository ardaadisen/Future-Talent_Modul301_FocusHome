import { useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function App() {
  const [taskInput, setTaskInput] = useState(
    "Tomorrow at 3 PM I will study algorithms for 45 minutes.",
  );
  const [backendStatus, setBackendStatus] = useState("Not checked");
  const [parsedTask, setParsedTask] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function checkBackendHealth() {
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setBackendStatus(`${data.status} (${data.service})`);
    } catch (error) {
      setBackendStatus("unreachable");
      setErrorMessage("Backend is not reachable. Start backend on port 8000.");
    }
  }

  async function createFocusTask() {
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/parse-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: taskInput }),
      });
      const data = await response.json();
      setParsedTask(data);
    } catch (error) {
      setErrorMessage("Could not create task. Check backend and try again.");
    }
  }

  return (
    <main className="container">
      <h1>FocusHome</h1>
      <p>Temporary web scaffold for backend integration. Final product remains Flutter/mobile-focused.</p>

      <section className="card">
        <h2>Backend Status</h2>
        <p>{backendStatus}</p>
        <button type="button" onClick={checkBackendHealth}>
          Check Backend Health
        </button>
      </section>

      <section className="card">
        <h2>Create Focus Task</h2>
        <textarea
          value={taskInput}
          onChange={(event) => setTaskInput(event.target.value)}
          rows={4}
          placeholder="Describe your task in natural language..."
        />
        <button type="button" onClick={createFocusTask}>
          Create Focus Task
        </button>
      </section>

      {errorMessage ? (
        <section className="card error">{errorMessage}</section>
      ) : null}

      {parsedTask ? (
        <section className="card">
          <h2>Mock Parsed Task</h2>
          <pre>{JSON.stringify(parsedTask, null, 2)}</pre>
        </section>
      ) : null}
    </main>
  );
}
