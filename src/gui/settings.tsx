import { FC } from 'hono/jsx'
import { Layout } from './layout'
import { SessionUser } from '../types'

const pushScript = `
(function() {
  var btn = document.getElementById('push-btn');
  var status = document.getElementById('push-status');
  if (!btn || !status) return;

  function updateUI(subscribed) {
    if (subscribed) {
      btn.textContent = '通知を無効化';
      btn.dataset.subscribed = '1';
      status.textContent = '有効';
      status.style.color = '#22c55e';
    } else {
      btn.textContent = '通知を有効化';
      btn.dataset.subscribed = '0';
      status.textContent = '無効';
      status.style.color = '#94a3b8';
    }
  }

  async function getCurrentSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    var reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }

  async function init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      status.textContent = 'このブラウザはプッシュ通知に対応していません';
      btn.disabled = true;
      return;
    }
    if (Notification.permission === 'denied') {
      status.textContent = 'ブラウザの設定で通知がブロックされています';
      btn.disabled = true;
      return;
    }
    var sub = await getCurrentSubscription();
    updateUI(!!sub);
  }

  btn.addEventListener('click', async function() {
    btn.disabled = true;
    try {
      var sub = await getCurrentSubscription();
      if (sub) {
        // Unsubscribe
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
        updateUI(false);
      } else {
        // Subscribe
        var permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          status.textContent = '通知の許可が拒否されました';
          return;
        }
        var keyRes = await fetch('/api/push/vapid-key');
        if (!keyRes.ok) { status.textContent = 'サーバーの設定が未完了です'; return; }
        var keyData = await keyRes.json();
        var publicKey = keyData.publicKey;

        // base64url -> Uint8Array
        var pad = publicKey.replace(/-/g, '+').replace(/_/g, '/');
        while (pad.length % 4) pad += '=';
        var raw = atob(pad);
        var arr = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

        var reg = await navigator.serviceWorker.ready;
        var newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: arr,
        });

        var json = newSub.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });
        updateUI(true);
      }
    } catch(err) {
      status.textContent = 'エラー: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  });

  init();
})();
`

export const SettingsPage: FC<{ currentUser: SessionUser }> = ({ currentUser }) => (
  <Layout title="設定" user={currentUser} active="settings">
    <div class="page">
      <div class="page-inner">
        <div class="page-header">
          <div>
            <h1 class="page-title">設定</h1>
          </div>
        </div>

        <div class="section-card" style="max-width:480px">
          <div class="section-card-header">
            <span class="section-card-title">パスワード変更</span>
          </div>
          <div style="padding:20px">
            <form
              hx-post="/settings/password"
              hx-target="#pw-result"
              hx-swap="innerHTML"
              {...({'hx-on::after-request': "if(event.detail.successful) this.reset()"} as object)}
            >
              <div class="form-field">
                <label class="form-label">現在のパスワード</label>
                <input name="current_password" type="password" required placeholder="現在のパスワード" class="form-input" />
              </div>
              <div class="form-field">
                <label class="form-label">新しいパスワード</label>
                <input name="new_password" type="password" required minlength={8} placeholder="8文字以上" class="form-input" />
              </div>
              <button type="submit" class="btn-primary">変更する</button>
            </form>
            <div id="pw-result" style="margin-top:12px"></div>
          </div>
        </div>

        <div class="section-card" style="max-width:480px;margin-top:20px">
          <div class="section-card-header">
            <span class="section-card-title">プッシュ通知</span>
          </div>
          <div style="padding:20px">
            <p style="margin:0 0 12px;color:var(--text-secondary);font-size:14px">
              新着メールをブラウザ / PWA で受け取ります。
            </p>
            <div style="display:flex;align-items:center;gap:12px">
              <button id="push-btn" class="btn-primary" type="button">通知を有効化</button>
              <span style="font-size:14px">状態: <span id="push-status" style="color:#94a3b8">確認中...</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: pushScript }} />
  </Layout>
)
