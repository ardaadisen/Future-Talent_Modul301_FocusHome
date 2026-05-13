import { useEffect, useMemo, useState } from "react";
import AppButton from "./components/AppButton";
import Dashboard from "./pages/Dashboard";
import CreateTask from "./pages/CreateTask";
import FocusTimer from "./pages/FocusTimer";
import HomeBuilder from "./pages/HomeBuilder";
import { initialGrid, initialInventory, initialTodayTasks } from "./data/mockData";
import { BACKEND_UNAVAILABLE, fetchHealth, getApiBaseUrl } from "./services/api";
import { createGoogleCalendarTemplateUrl } from "./utils/calendar";
import { calcLevel, getRewardForDifficulty } from "./utils/rewards";

export default function App() {
  const [backendHealth, setBackendHealth] = useState({ state: "loading" });
  const [activePage, setActivePage] = useState("dashboard");
  const [tasks, setTasks] = useState(initialTodayTasks);
  const [inventory, setInventory] = useState(initialInventory);
  const [grid, setGrid] = useState(initialGrid);
  const [selectedTask, setSelectedTask] = useState(initialTodayTasks[0]);
  const [remainingSeconds, setRemainingSeconds] = useState(initialTodayTasks[0].durationMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionMessage, setSessionMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchHealth();
        if (cancelled) {
          return;
        }
        setBackendHealth({
          state: "ok",
          service: data.service,
          baseUrl: getApiBaseUrl(),
        });
      } catch {
        if (!cancelled) {
          setBackendHealth({ state: "error", message: BACKEND_UNAVAILABLE });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!timerRunning || remainingSeconds <= 0) {
      return undefined;
    }
    const id = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      setSessionMessage("Timer finished. You can now claim reward.");
    }
  }, [remainingSeconds, timerRunning]);

  const calendarUrl = useMemo(() => createGoogleCalendarTemplateUrl(selectedTask || {}), [selectedTask]);

  const selectTask = (task) => {
    setSelectedTask(task);
    setRemainingSeconds(task.durationSeconds ?? task.durationMinutes * 60);
    setTimerRunning(false);
    setSessionMessage("");
    setActivePage("timer");
  };

  const addTask = (task, source = "MANUAL") => {
    const newTask = {
      id: task.id || crypto.randomUUID(),
      status: task.status || "PENDING",
      startTime: "2026-05-07T15:00:00+03:00",
      endTime: "2026-05-07T16:00:00+03:00",
      ...task,
      source,
    };
    setTasks((prev) => [newTask, ...prev]);
    setSelectedTask(newTask);
    setRemainingSeconds(newTask.durationSeconds ?? newTask.durationMinutes * 60);
    setTimerRunning(false);
    setSessionMessage("");
  };

  const completeFocus = () => {
    if (!selectedTask || remainingSeconds > 0) {
      return;
    }
    const reward = getRewardForDifficulty(selectedTask.difficulty);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === selectedTask.id ? { ...task, status: "COMPLETED" } : task,
      ),
    );
    setInventory((prev) => {
      const nextXp = prev.xp + reward.xp;
      return {
        ...prev,
        xp: nextXp,
        level: calcLevel(nextXp),
        bricks: prev.bricks + reward.bricks,
      };
    });
    setTimerRunning(false);
    setSessionMessage("Task completed! Reward earned.");
  };

  const cancelFocus = () => {
    if (!selectedTask) {
      return;
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.id === selectedTask.id ? { ...task, status: "ABANDONED" } : task,
      ),
    );
    setTimerRunning(false);
    setSessionMessage("Session cancelled. No reward earned.");
  };

  const placeMockAsset = (rowIndex, colIndex) => {
    setGrid((prev) =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx !== rowIndex || cIdx !== colIndex) {
            return cell;
          }
          if (cell !== "empty") {
            return cell;
          }
          return "wall";
        }),
      ),
    );
  };

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <AppButton variant={activePage === "dashboard" ? "primary" : "secondary"} onClick={() => setActivePage("dashboard")}>
          Dashboard
        </AppButton>
        <AppButton variant={activePage === "create" ? "primary" : "secondary"} onClick={() => setActivePage("create")}>
          Create Task
        </AppButton>
        <AppButton variant={activePage === "timer" ? "primary" : "secondary"} onClick={() => setActivePage("timer")}>
          Focus Timer
        </AppButton>
        <AppButton variant={activePage === "builder" ? "primary" : "secondary"} onClick={() => setActivePage("builder")}>
          Home Builder
        </AppButton>
      </nav>

      {activePage === "dashboard" ? (
        <Dashboard
          inventory={inventory}
          tasks={tasks}
          backendHealth={backendHealth}
          onGotoCreate={() => setActivePage("create")}
          onGotoTimer={() => setActivePage("timer")}
          onSelectTask={selectTask}
        />
      ) : null}

      {activePage === "create" ? (
        <CreateTask
          onCreateManual={(task) => addTask(task, "MANUAL")}
          onConfirmAiTask={(task) => addTask(task, "AI")}
        />
      ) : null}

      {activePage === "timer" ? (
        <FocusTimer
          selectedTask={selectedTask}
          remainingSeconds={remainingSeconds}
          running={timerRunning}
          sessionMessage={sessionMessage}
          onStart={() => {
            setTimerRunning(true);
            setSessionMessage("");
          }}
          onPause={() => setTimerRunning(false)}
          onComplete={completeFocus}
          onCancel={cancelFocus}
        />
      ) : null}

      {activePage === "builder" ? (
        <HomeBuilder grid={grid} onPlaceAsset={placeMockAsset} calendarUrl={calendarUrl} />
      ) : null}
    </main>
  );
}
