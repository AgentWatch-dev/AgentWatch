export function getOnboardingHtml(siteUrl: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Get Started | AgentWatch</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#080A12;color:#e4e4e7;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:40px 24px;overflow-y:auto}
body::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 0%,rgba(88,166,255,0.08) 0%,rgba(57,210,192,0.04) 40%,transparent 70%);pointer-events:none;z-index:0}
.container{position:relative;z-index:1;width:100%;max-width:560px}
.progress-wrap{display:flex;gap:6px;margin-bottom:40px}
.progress-bar{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,0.06);transition:all 0.4s cubic-bezier(0.4,0,0.2,1)}
.progress-bar.done{background:linear-gradient(90deg,#58A6FF,#3b82f6)}
.step{display:none;animation:fadeSlideIn 0.5s cubic-bezier(0.4,0,0.2,1)}
.step.active{display:block}
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
h1{font-size:2.2rem;font-weight:900;margin-bottom:12px;letter-spacing:-0.03em;background:linear-gradient(135deg,#fff 0%,#a1a1aa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{color:#71717a;font-size:15px;margin-bottom:32px;line-height:1.6}
.glass{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px;margin-bottom:20px;transition:border-color 0.3s,box-shadow 0.3s}
.glass:hover{border-color:rgba(255,255,255,0.1);box-shadow:0 8px 32px rgba(0,0,0,0.2)}
.glass-label{display:block;font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px}
.key-input-wrap{position:relative}
.key-input{width:100%;padding:14px 120px 14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.4);color:#60a5fa;font-family:'JetBrains Mono',monospace;font-size:14px;transition:border-color 0.2s;outline:none}
.key-input:focus{border-color:rgba(88,166,255,0.4)}
.copy-btn{position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;background:rgba(88,166,255,0.1);color:#58A6FF;border:1px solid rgba(88,166,255,0.2);cursor:pointer;transition:all 0.2s}
.copy-btn:hover{background:rgba(88,166,255,0.2);border-color:rgba(88,166,255,0.4)}
.copy-btn.copied{background:rgba(34,197,94,0.15);color:#22c55e;border-color:rgba(34,197,94,0.3)}
pre{background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:20px;overflow-x:auto;font-size:13px;color:#a1a1aa;margin:0;font-family:'JetBrains Mono',monospace;line-height:1.7}
code{color:#e4e4e7}
.code-tag{display:inline-block;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px}
.code-tag.py{background:rgba(59,130,246,0.12);color:#60a5fa}
.code-tag.ts{background:rgba(234,179,8,0.12);color:#eab308}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);text-decoration:none}
.btn-primary{background:linear-gradient(135deg,#58A6FF,#3b82f6);color:#fff;box-shadow:0 4px 16px rgba(88,166,255,0.25)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(88,166,255,0.35)}
.btn-primary:active{transform:translateY(0)}
.btn-ghost{background:transparent;color:#71717a;border:1px solid rgba(255,255,255,0.08)}
.btn-ghost:hover{color:#e4e4e7;border-color:rgba(255,255,255,0.15)}
.btn-full{width:100%}
.flex{display:flex}.gap-3{gap:12px}.justify-between{justify-content:space-between}.items-center{align-items:center}
.mt-6{margin-top:24px}
.text-sm{font-size:13px}.text-muted{color:#52525b}
.skip-link{color:#52525b;font-size:13px;text-decoration:none;transition:color 0.2s}
.skip-link:hover{color:#a1a1aa}
.test-box{position:relative;overflow:hidden}
.test-box::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(88,166,255,0.3),transparent)}
#testResult{display:none;margin-top:16px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.04);border-radius:10px;padding:16px;font-size:12px;color:#a1a1aa;white-space:pre-wrap;max-height:200px;overflow:auto;font-family:'JetBrains Mono',monospace;animation:fadeSlideIn 0.3s ease}
.success-msg{text-align:center;padding:20px;color:#22c55e;font-weight:600}
.step-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:rgba(88,166,255,0.1);color:#58A6FF;font-size:12px;font-weight:700;margin-bottom:16px}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.warning-box{background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.3);border-radius:12px;padding:16px;margin-bottom:20px}
.warning-box p{color:#eab308;font-size:13px;line-height:1.5}
.next-steps{text-align:left}
.next-steps li{color:#a1a1aa;font-size:14px;line-height:2;list-style:none;padding-left:20px;position:relative}
.next-steps li::before{content:'\\2713';position:absolute;left:0;color:#22c55e;font-weight:700}
@media(max-width:480px){h1{font-size:1.6rem}.glass{padding:18px}}
</style></head><body><div class="container">
<div class="progress-wrap"><div class="progress-bar done" id="p1"></div><div class="progress-bar" id="p2"></div><div class="progress-bar" id="p3"></div><div class="progress-bar" id="p4"></div></div>
<div class="step active" id="s1">
<div class="step-num">1</div><h1>Your API Key</h1><p class="subtitle">Copy this key — you'll need it to connect your app to AgentWatch.</p>
<div class="glass"><div class="glass-label">API Key</div><div class="key-input-wrap"><input type="password" class="key-input" id="apiKey" value="" readonly><button class="copy-btn" onclick="copyKey(this)">Copy</button></div><p style="margin-top:12px;font-size:12px;color:#52525b">Shown once. Save it somewhere safe. Clear localStorage after saving.</p></div>
<div class="warning-box"><p><strong>You also need a provider API key</strong> (OpenAI, Anthropic, etc.) to use AgentWatch. AgentWatch proxies your requests — you pay your own provider bill directly.</p></div>
<div class="flex justify-between items-center"><a href="/" class="skip-link" onclick="localStorage.setItem('agentwatch_onboarding_done','1')">Skip for now</a><button class="btn btn-primary" onclick="go(2)">Next: Configure &rarr;</button></div>
</div>
<div class="step" id="s2">
<div class="step-num">2</div><h1>Configure Your App</h1><p class="subtitle">Change your base URL and combine your keys. No SDK needed.</p>
<div class="glass"><div class="code-tag py">Python (OpenAI)</div><pre><code>from openai import OpenAI

client = OpenAI(
    base_url="${siteUrl}/v1/proxy/openai",
    api_key="YOUR_AGENTWATCH_KEY:sk-proj-your-openai-key"
)</code></pre></div>
<div class="glass"><div class="code-tag ts">TypeScript (OpenAI)</div><pre><code>import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: "${siteUrl}/v1/proxy/openai",
    apiKey: "YOUR_AGENTWATCH_KEY:sk-proj-your-openai-key"
});</code></pre></div>

<div class="glass"><div class="glass-label">Optional: Set a budget</div><pre><code>response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "..."}],
    extra_headers={
        "x-agentwatch-budget-usd": "2.00",
        "x-agentwatch-session-id": "my-session"
    }
)</code></pre></div>
<div class="flex justify-between items-center"><button class="btn btn-ghost" onclick="go(1)">&larr; Back</button><button class="btn btn-primary" onclick="go(3)">Next: Test &rarr;</button></div>
</div>
<div class="step" id="s3">
<div class="step-num">3</div><h1>Test Your Integration</h1><p class="subtitle">Paste your provider API key below to run a live test through AgentWatch.</p>
<div class="glass"><div class="glass-label">Your OpenAI API Key</div><div class="key-input-wrap"><input type="password" class="key-input" id="providerKey" placeholder="sk-proj-..." style="padding-right:16px"></div><p style="margin-top:12px;font-size:12px;color:#52525b">Your key is sent directly to OpenAI — AgentWatch never stores it.</p></div>
<div class="glass test-box"><button class="btn btn-primary btn-full" onclick="testRequest()" id="testBtn">Run Test Request</button><div id="testResult"></div></div>
<div class="flex justify-between items-center"><button class="btn btn-ghost" onclick="go(2)">&larr; Back</button><button class="btn btn-primary" onclick="go(4)">Next: You're Ready &rarr;</button></div>
</div>
<div class="step" id="s4">
<div class="step-num">4</div><h1>You're All Set!</h1><p class="subtitle">AgentWatch is now protecting your LLM spending. Here's what to do next.</p>
<div class="glass"><div class="glass-label">Quick Next Steps</div><ul class="next-steps">
<li>Open your <a href="/v1/dashboard" style="color:#58A6FF">Dashboard</a> to see real-time usage</li>
<li>Set budget limits with <code style="color:#60a5fa">x-agentwatch-budget-usd</code> header</li>
<li>Add your team members under the <a href="/v1/dashboard" style="color:#58A6FF">Keys page</a></li>
<li>Read the <a href="${siteUrl}/docs" style="color:#58A6FF">Docs</a> for advanced features</li>
</ul></div>
<div class="glass"><div class="glass-label">Your AgentWatch Key</div><div class="key-input-wrap"><input type="text" class="key-input" id="finalKey" value="" readonly><button class="copy-btn" onclick="copyFinalKey(this)">Copy</button></div></div>
<div class="mt-6" style="text-align:center"><a href="/v1/dashboard" onclick="localStorage.setItem('agentwatch_onboarding_done','1')" class="btn btn-primary">Go to Dashboard &rarr;</a></div>
</div>
</div>
<script>
// Read API key from URL fragment (not logged server-side)
(function(){
  const hash = window.location.hash;
  if (hash && hash.startsWith('#key=')) {
    const key = decodeURIComponent(hash.substring(5));
    const apiKeyInput = document.getElementById('apiKey');
    const finalKeyInput = document.getElementById('finalKey');
    if (apiKeyInput) apiKeyInput.value = key;
    if (finalKeyInput) finalKeyInput.value = key;
    // Clear fragment for security
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
})();
function go(n){document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));const step=document.getElementById('s'+n);step.classList.add('active');for(let i=1;i<=4;i++){const bar=document.getElementById('p'+i);bar.className='progress-bar'+(i<=n?' done':'');}}function copyKey(btn){const input=document.getElementById('apiKey');navigator.clipboard.writeText(input.value);btn.textContent='Copied!';btn.classList.add('copied');setTimeout(()=>{btn.textContent='Copy';btn.classList.remove('copied');},2000);}function copyFinalKey(btn){const input=document.getElementById('finalKey');navigator.clipboard.writeText(input.value);btn.textContent='Copied!';btn.classList.add('copied');setTimeout(()=>{btn.textContent='Copy';btn.classList.remove('copied');},2000);}async function testRequest(){const btn=document.getElementById('testBtn');const res=document.getElementById('testResult');const providerKey=document.getElementById('providerKey').value.trim();if(!providerKey){res.style.display='block';res.textContent='Please enter your OpenAI API key to run the test.';return;}btn.innerHTML='<span class="spinner"></span>Sending...';btn.disabled=true;res.style.display='none';try{const awKey=document.getElementById('apiKey').value;const r=await fetch('/v1/proxy/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+awKey+':'+providerKey},body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'user',content:'Say hello in one word'}],max_tokens:10})});const d=await r.json();res.style.display='block';if(r.ok){res.innerHTML='<div class="success-msg">&#10003; Integration successful!</div><pre style="margin-top:12px">'+JSON.stringify(d,null,2)+'<\/pre>';}else{res.textContent=JSON.stringify(d,null,2);}}catch(e){res.style.display='block';res.textContent='Error: '+e.message;}btn.innerHTML='Run Test Request';btn.disabled=false;}</script></body></html>`;
}
