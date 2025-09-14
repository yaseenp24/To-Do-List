import os
import sqlite3
from typing import Iterable, Optional, Tuple

from flask import Flask, jsonify, redirect, render_template, request, url_for


APP_ROOT = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(APP_ROOT, "todos.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn: 
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
            );
            """
        )
        conn.commit()


def query(
    sql: str,
    params: Optional[Iterable] = None,
    *,
    fetchone: bool = False,
    fetchall: bool = False,
) -> Optional[Iterable[sqlite3.Row]]:
    params = params or []
    with get_connection() as conn:
        cur = conn.execute(sql, params)
        rows = None
        if fetchone:
            rows = cur.fetchone()
        if fetchall:
            rows = cur.fetchall()
        conn.commit()
        return rows


def execute(sql: str, params: Optional[Iterable] = None) -> int:
    params = params or []
    with get_connection() as conn:
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid


app = Flask(__name__)
init_db()


@app.after_request
def _log_request(response):
    try:
        app.logger.info("%s %s -> %s", request.method, request.path, response.status_code)
    except Exception:
        pass
    return response


@app.get("/")
def index():
    tasks = query(
        "SELECT id, title, completed FROM tasks ORDER BY created_at DESC",
        fetchall=True,
    )
    return render_template("index.html", tasks=tasks or [])


@app.get("/api/tasks")
def api_tasks():
    rows = query(
        "SELECT id, title, completed, created_at FROM tasks ORDER BY created_at DESC",
        fetchall=True,
    )
    tasks = [
        {
            "id": int(r["id"]),
            "title": r["title"],
            "completed": int(r["completed"]),
            "created_at": r["created_at"],
        }
        for r in (rows or [])
    ]
    return jsonify(tasks)


@app.post("/add")
def add_task():
    title = None
    if request.is_json:
        data = request.get_json(silent=True) or {}
        title = (data.get("title") or "").strip()
    else:
        title = (request.form.get("title") or "").strip()

    if not title:
        if request.is_json:
            return jsonify({"ok": False, "error": "Title is required"}), 400
        return redirect(url_for("index"))

    task_id = execute("INSERT INTO tasks (title) VALUES (?)", [title])

    if request.is_json:
        return jsonify({"ok": True, "id": task_id, "title": title, "completed": 0})

    return redirect(url_for("index"))


@app.post("/toggle/<int:task_id>")
def toggle_task(task_id: int):
    row = query("SELECT completed FROM tasks WHERE id = ?", [task_id], fetchone=True)
    if not row:
        return jsonify({"ok": False, "error": "Not found"}), 404

    new_completed = 0 if int(row["completed"]) else 1
    execute("UPDATE tasks SET completed = ? WHERE id = ?", [new_completed, task_id])
    return jsonify({"ok": True, "id": task_id, "completed": new_completed})


@app.post("/delete/<int:task_id>")
def delete_task(task_id: int):
    execute("DELETE FROM tasks WHERE id = ?", [task_id])
    return jsonify({"ok": True, "id": task_id})


if __name__ == "__main__":
    # For local development. In production, use a real WSGI server.
    app.run(host="127.0.0.1", port=5000, debug=True)


