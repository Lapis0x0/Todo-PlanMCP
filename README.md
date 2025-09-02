[简体中文](README_zh.md) | [English](README.md)

---

# Todo & Plan MCP Server

A simple task management server based on the Model Context Protocol (MCP), focusing on task management and learning progress tracking.

## 🌟 Features

- ✅ **Task Management**: Create, update, delete tasks
- ✅ **Batch Operations**: Add multiple tasks at once
- ✅ **Status Management**: Task status transitions (pending / in_progress / completed / archived)
- ✅ **Priority Management**: High/Medium/Low priority classification
- ✅ **Multi-Agent Support**: Isolate task lists for different agents via the optional `agent` field
- ✅ **Persistent Storage**: Local storage with SQLite database
- ✅ **Cross-Platform Support**: Run locally + deploy remotely
- ✅ **Note Management (Notes)**: Save/query/update/delete notes as records, support aggregation by `agent`, and provide the `notes://all` resource for context reading

## 🚀 Quick Start

This guide will help you set up and run this project on your local machine or a remote server.

### 1. Local Development

Run the server on your local machine.

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Build the Project**
    ```bash
    npm run build
    ```

3.  **Run Tests (Optional)**
    ```bash
    npx tsx test-final.ts
    ```

### 2. Remote Deployment (Docker)

We recommend using Docker for remote deployment as it provides a stable and portable runtime environment.

#### Option 1: Automated Deployment with GitHub Actions (Recommended)

Each time you push code to the `main` branch, GitHub Actions will automatically build and publish a Docker image to the GitHub Container Registry (ghcr.io).

1.  **Fork this repository** to your GitHub account.
2.  **Push your code**: After making any changes, push them to the `main` branch of your own repository.
    ```bash
    git push origin main
    ```
3.  **Check the build**: In the `Actions` tab of your repository, you can see the status of the `Build and Push Docker Image` workflow.
4.  **Deploy the image**: Once the build is successful, the image will be published to `ghcr.io/your-github-username/todo-planmcp`. We recommend using the `:main` tag as it always corresponds to the latest code on the `main` branch. The `:latest` tag is only updated under specific conditions and may not be the most recent.

#### Option 2: Manual Deployment to a VPS

You can also manually deploy the service on your own VPS.

1.  **Prepare the environment**: Ensure your server has Docker and Docker Compose installed.
    ```bash
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    # Install Docker Compose
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
    ```

2.  **Create `docker-compose.yml`**:
    Create a directory on your server and create a `docker-compose.yml` file within it.
    ```bash
    mkdir -p /opt/todo-plan-mcp && cd /opt/todo-plan-mcp
    ```
    ```yaml
    # docker-compose.yml
    version: '3.8'
    services:
      todo-plan-mcp:
        # It is recommended to use the :main tag to get the latest stable build
        image: ghcr.io/lapis0x0/todo-planmcp:main
        container_name: todo-plan-mcp
        restart: unless-stopped
        ports:
          - "3002:3000"
        environment:
          # Required: Security token for client authentication
          - MCP_AUTH_TOKEN=your-secret-token
          # Optional: Ensure the service runs in HTTP mode
          - NODE_ENV=production
          - MCP_HOST=0.0.0.0
          - MCP_PORT=3000
        volumes:
          # Persist the database file to the host machine
          - ./data:/app/data
        healthcheck:
          # Check if the service is still running
          test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
          interval: 1m30s
          timeout: 10s
          retries: 3
    ```

3.  **Start the service**:
    ```bash
    docker compose up -d
    ```

4.  **Update the service**:
    When you want to update to the latest version, run the following commands:
    ```bash
    # Pull the latest image
    docker compose pull
    # Force recreate the container to apply updates
    docker compose up -d --force-recreate
    ```

### 3. Quick Verification

After deployment, you can use `curl` to quickly check if the service is working correctly. Please replace `your-vps-ip` and `your-secret-token` with your actual values.

1.  **Health Check** (Expect HTTP 200 OK)
    ```bash
    curl -i http://your-vps-ip:3002/health
    ```

2.  **MCP Initialize** (Expect JSON-RPC result)
    ```bash
    curl -i -sS -H 'Content-Type: application/json' \
      -H 'X-MCP-Auth: your-secret-token' \
      -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0"}}' \
      http://your-vps-ip:3002/
    ```

3.  **MCP Notification** (Expect HTTP 204 No Content)
    ```bash
    curl -i -sS -H 'Content-Type: application/json' \
      -H 'X-MCP-Auth: your-secret-token' \
      -d '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}' \
      http://your-vps-ip:3002/
    ```

4.  **List Tools** (Expect `todo_` series tools)
    ```bash
    curl -sS -H 'Content-Type: application/json' \
      -H 'X-MCP-Auth: your-secret-token' \
      -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
      http://your-vps-ip:3002/
    ```

## ⚙️ Client Configuration (Cherry Studio)

### Mode 1: Local Development (STDIO)

For local development and debugging, the client communicates directly with the `index.js` script via standard input/output.

**Configuration:**
```json
{
  "mcpServers": {
    "todo-plan-manager-local": {
      "command": "node",
      "args": [
        "/path/to/your/Todo&PlanMCP/dist/index.js"
      ],
      "cwd": "/path/to/your/Todo&PlanMCP"
    }
  }
}
```
> **Note**: Please ensure you use the **absolute path** to your project locally. In this mode, **do not** set `NODE_ENV=production`, otherwise the service will switch to HTTP mode.

### Mode 2: Remote Connection (HTTP)

For connecting to a service already deployed on a server.

**Configuration:**
```json
{
  "mcpServers": {
    "todo-plan-manager-remote": {
      "type": "streamableHttp",
      "url": "http://your-vps-ip:3002",
      "headers": {
        "X-MCP-Auth": "your-secret-token"
      }
    }
  }
}
```
> **Note**: The `url` and `X-MCP-Auth` values must match your server's configuration.

## 🛠️ API Reference

| Tool | Description | Parameters |
| :--- | :--- | :--- |
| `todo_add` | Add a single task | `title`, `priority?`, `agent?` |
| `todo_add_batch` | Add tasks in batch | `todos[]` (each: `title`, `priority?`, `agent?`) |
| `todo_list` | View the task list | `status?`, `priority?`, `agent?` |
| `todo_update` | Update a task | `id`, `title?`, `status?`, `priority?`, `agent?` |
| `todo_delete` | Delete a task | `id` |
| `note_add` | Add a note | `content`, `agent?` |
| `note_list` | List notes (supports filtering by Agent) | `agent?` |
| `note_update` | Update a note | `id`, `content?`, `agent?` |
| `note_delete` | Delete a note | `id` |

### Resources

- `notes://all`: Returns all notes from all agents (aggregated in Markdown).
  - You can guide the model in the system prompt to "read this resource first for context."

### Usage Examples

```bash
# Add a task (specify Agent)
> Use the todo_add tool to create a high-priority task "Learn React Hooks", agent=agent_1

# View tasks (filter by Agent / status)
> Call the todo_list tool to filter for tasks with agent=agent_1 and status=pending

# Update a task (change status, priority, or Agent)
> Use the todo_update tool to change the status of task 1 to "in_progress"
```

## 🗂️ Project Structure

```
├── src/                # Source code directory
│   ├── index.ts        # Main MCP server file
│   ├── database.ts     # Database management
│   ├── todo.ts         # Task management logic
│   └── note.ts         # Note management logic (record-style)
├── .github/workflows/  # GitHub Actions CI/CD
│   └── docker-build.yml
├── deploy/             # Deployment scripts and documentation
├── Dockerfile          # Docker image build file
├── docker-compose.yml  # Docker Compose configuration file
└── ...
```

## 🤝 Contributing

Contributions are welcome via Issues or Pull Requests.

## 📄 License

[MIT](LICENSE)