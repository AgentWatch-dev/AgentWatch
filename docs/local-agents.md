# Local & No-Code Agents

AgentWatch doesn't require an SDK or any changes to your code. This means you can enforce strict session budgets and log telemetry for **third-party, off-the-shelf AI agents** like Cursor, AutoGPT, and Cline.

## How it Works

Most AI agents and IDE plugins use standard OpenAI or Anthropic SDKs under the hood. These SDKs are hardcoded to respect standard environment variables. By overriding these variables on your local machine, you force the agent to route all its traffic through your AgentWatch proxy.

## Setting up CLI Agents

Before running your agent in the terminal, export the custom base URL and combined API key.

### OpenAI-based Tools

```bash
export OPENAI_BASE_URL="http://localhost:8787/v1/proxy/openai"
export OPENAI_API_KEY="aw_live_your_token:sk-proj-your-real-openai-key"

# Now run your agent normally!
auto-gpt run
```

### Anthropic-based Tools

```bash
export ANTHROPIC_BASE_URL="http://localhost:8787/v1/proxy/anthropic"
export ANTHROPIC_API_KEY="aw_live_your_token:sk-ant-your-real-anthropic-key"

# Now run your agent normally!
claude-code
```

## IDE Plugins (Cursor, Continue.dev)

For visual agents or IDE plugins that have a settings interface, you can usually configure a **Custom Provider** or **OpenAI Compatible Endpoint**.

1. Open your extension's settings.
2. Select **Custom OpenAI Compatible Endpoint**.
3. Enter the following configuration:
   - **Base URL / Endpoint:** `http://localhost:8787/v1/proxy/openai`
   - **API Key:** `aw_live_your_token:sk-proj-your-real-openai-key`
   - **Model:** `gpt-4o` (or your preferred model)

The agent will operate exactly as it did before, but now every prompt and completion is proxied through AgentWatch, protecting you from runaway loops and unexpected bills!
