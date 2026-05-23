import { FC } from 'hono/jsx'
import { Layout } from '../layout'
import { Icon } from '../icons'
import { SessionUser } from '../../types'

type Addr = { id: string; address: string; display_name: string; created_at: string }

const AddressCard: FC<{ addr: Addr }> = ({ addr }) => {
  const [local, domain] = addr.address.split('@')
  return (
    <div class="address-card" id={`addr-card-${addr.id}`} onclick={`toggleAddr('${addr.id}')`}>
      <div class="address-icon">
        <Icon name="at" size={18} />
      </div>
      <div class="address-info">
        <div class="address-addr">
          {local}<span class="domain">@{domain}</span>
        </div>
        <div class="address-desc">{addr.display_name} · {addr.created_at.slice(0, 10)}</div>
      </div>
      <div class="address-state">
        <Icon name="chevronRight" size={14} stroke="var(--mid)" />
      </div>
    </div>
  )
}

const AddressCardExpanded: FC<{ addr: Addr }> = ({ addr }) => {
  const [local, domain] = addr.address.split('@')
  return (
    <div class="address-card expanded" id={`addr-card-${addr.id}`}>
      <div class="address-icon-row" onclick={`toggleAddr('${addr.id}')`} style="cursor:pointer">
        <div class="address-icon">
          <Icon name="at" size={18} />
        </div>
        <div class="address-info">
          <div class="address-addr">
            {local}<span class="domain">@{domain}</span>
          </div>
          <div class="address-desc">{addr.display_name}</div>
        </div>
        <div class="address-state">
          <Icon name="chevronDown" size={14} stroke="var(--mid)" />
        </div>
      </div>
      <div class="address-detail">
        <div>
          <div class="detail-label">オーナー</div>
          <div style="font-size:13px;font-weight:500">{addr.display_name}</div>
        </div>
        <div>
          <div class="detail-label">作成日</div>
          <div style="font-size:13px">{addr.created_at.slice(0, 10)}</div>
        </div>
        <div style="grid-column:span 2;display:flex;justify-content:flex-end;padding-top:8px;border-top:1px solid var(--line-soft)">
          <button
            class="btn-ghost"
            style="color:var(--red);border-color:var(--red)"
            hx-post={`/admin/addresses/${addr.id}/delete`}
            hx-target={`#addr-card-${addr.id}`}
            hx-swap="outerHTML swap:0.3s"
            hx-confirm={`${addr.address} を削除しますか？`}
          >
            <Icon name="trash" size={14} />
            削除
          </button>
        </div>
      </div>
    </div>
  )
}

export const AddressesPage: FC<{
  currentUser: SessionUser
  users: SessionUser[]
  addresses: Addr[]
  domain: string
}> = ({ currentUser, users, addresses, domain }) => (
  <Layout title="メールアドレス管理" user={currentUser} active="addresses">
    <div class="page">
      <div class="page-inner">
        <div class="page-header">
          <div>
            <h1 class="page-title">アドレス管理</h1>
            <div class="page-subtitle">全 {addresses.length}件</div>
          </div>
          <div class="page-actions">
            <button
              class="btn-primary"
              onclick="document.getElementById('add-addr-dialog').style.display='flex'"
            >
              <Icon name="plus" size={14} />
              アドレス追加
            </button>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:20px">
          <span class="pill active">@{domain}</span>
        </div>

        <div id="addr-list">
          {addresses.map((a) => (
            <AddressCard key={a.id} addr={a} />
          ))}
        </div>
      </div>
    </div>

    <div
      class="overlay"
      id="add-addr-dialog"
      style="display:none"
      onclick="if(event.target===this)this.style.display='none'"
    >
      <div class="dialog">
        <h3>アドレスを追加</h3>
        <p>新しいメールアドレスをユーザーに割り当てます。</p>
        <form
          hx-post="/admin/addresses"
          hx-target="#add-addr-result"
          hx-swap="innerHTML"
          {...({
            'hx-on::after-request': "if(event.detail.successful){document.getElementById('add-addr-dialog').style.display='none';location.reload()}",
          } as object)}
        >
          <div class="form-field">
            <label class="form-label">ローカルパート</label>
            <div style="display:flex;align-items:center;gap:8px">
              <input
                class="form-input"
                name="local"
                type="text"
                required
                placeholder="username"
                style="flex:1"
              />
              <span style="font-size:14px;color:var(--sub);white-space:nowrap;font-family:var(--font-mono)">@{domain}</span>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">オーナー</label>
            <select class="form-input form-select" name="user_id" required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.display_name}</option>
              ))}
            </select>
          </div>
          <div id="add-addr-result" style="margin-bottom:12px;font-size:12px" />
          <div class="dialog-actions">
            <button
              type="button"
              class="btn-ghost"
              onclick="document.getElementById('add-addr-dialog').style.display='none'"
            >
              キャンセル
            </button>
            <button type="submit" class="btn-primary">追加</button>
          </div>
        </form>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      var _expandedId = null;
      var _addrData = ${JSON.stringify(addresses)};
      function toggleAddr(id) {
        var card = document.getElementById('addr-card-' + id);
        if (!card) return;
        if (_expandedId === id) {
          _expandedId = null;
          var a = _addrData.find(function(x){return x.id===id});
          if (a) card.outerHTML = buildCollapsed(a);
        } else {
          if (_expandedId) {
            var prev = document.getElementById('addr-card-' + _expandedId);
            var pa = _addrData.find(function(x){return x.id===_expandedId});
            if (prev && pa) prev.outerHTML = buildCollapsed(pa);
          }
          _expandedId = id;
          var a = _addrData.find(function(x){return x.id===id});
          if (a) card.outerHTML = buildExpanded(a);
        }
      }
      function buildCollapsed(a) {
        var parts = a.address.split('@');
        return '<div class="address-card" id="addr-card-' + a.id + '" onclick="toggleAddr(\\'' + a.id + '\\')">' +
          '<div class="address-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg></div>' +
          '<div class="address-info"><div class="address-addr">' + parts[0] + '<span class="domain">@' + parts[1] + '</span></div>' +
          '<div class="address-desc">' + a.display_name + ' · ' + a.created_at.slice(0,10) + '</div></div>' +
          '<div class="address-state"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mid)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '</div>';
      }
      function buildExpanded(a) {
        var parts = a.address.split('@');
        return '<div class="address-card expanded" id="addr-card-' + a.id + '">' +
          '<div class="address-icon-row" onclick="toggleAddr(\\'' + a.id + '\\')" style="cursor:pointer">' +
          '<div class="address-icon" style="background:var(--coral);color:var(--white);border-color:var(--ink)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg></div>' +
          '<div class="address-info"><div class="address-addr">' + parts[0] + '<span class="domain">@' + parts[1] + '</span></div>' +
          '<div class="address-desc">' + a.display_name + '</div></div>' +
          '<div class="address-state"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mid)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg></div>' +
          '</div>' +
          '<div class="address-detail">' +
          '<div><div class="detail-label">オーナー</div><div style="font-size:13px;font-weight:500">' + a.display_name + '</div></div>' +
          '<div><div class="detail-label">作成日</div><div style="font-size:13px">' + a.created_at.slice(0,10) + '</div></div>' +
          '<div style="grid-column:span 2;display:flex;justify-content:flex-end;padding-top:8px;border-top:1px solid var(--line-soft)">' +
          '<button class="btn-ghost" style="color:var(--red);border-color:var(--red)" hx-post="/admin/addresses/' + a.id + '/delete" hx-target="#addr-card-' + a.id + '" hx-swap="outerHTML swap:0.3s" hx-confirm="' + a.address + ' を削除しますか？" onclick="htmx.process(this)">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          '削除</button></div>' +
          '</div></div>';
      }
    `}} />
  </Layout>
)
