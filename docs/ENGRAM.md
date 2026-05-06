# Engram — AI persistent memory in this repository

This repository is **prepared to use Engram** with Cursor (and other MCP-compatible editors). The configuration is already present so that once you install the Engram CLI, your AI agent can use persistent memory across sessions.

## Repository setup

In the **root of this repository** you will find:

- **`.cursor/mcp.json`** — MCP configuration that registers the Engram server with Cursor.

```json
{
  "mcpServers": {
    "engram": {
      "command": "engram",
      "args": ["mcp"]
    }
  }
}
```

## How to install Engram

Install the Engram CLI using [npm](https://www.npmjs.com/) or [Homebrew](https://brew.sh/), then verify `engram --version` works in your terminal. See the official [Engram documentation](https://www.engram.fyi/docs) for setup and privacy notes.

## How to use

After installation, enable MCP in Cursor and ensure the `engram` server appears in your MCP list. The agent can then use remember/recall flows across sessions. All data stays local unless you opt into optional embedding features (see Engram docs).

## References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Engram](https://www.engram.fyi/docs)
