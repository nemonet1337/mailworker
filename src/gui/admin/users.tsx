import { FC } from 'hono/jsx'
import { Layout } from '../layout'
import { Icon } from '../icons'
import { SessionUser } from '../../types'

type UserRow = SessionUser & { created_at: string }

export const UsersPage: FC<{ currentUser: SessionUser; users: UserRow[] }> = ({
  currentUser,
  users,
}) => {
  const adminCount = users.filter((u) => u.is_admin === 1).length
  return (
    <Layout title="ユーザー管理" user={currentUser} active="users">
      <div class="page">
        <div class="page-inner">
          <div class="page-header">
            <div>
              <h1 class="page-title">ユーザー管理</h1>
              <div class="page-subtitle">全 {users.length}名 · {adminCount} admin</div>
            </div>
            <div class="page-actions">
              <button
                class="btn-primary"
                onclick="document.getElementById('invite-dialog').style.display='flex'"
              >
                <Icon name="plus" size={14} />
                招待
              </button>
            </div>
          </div>

          <div class="filter-row">
            <input
              class="search-input filter-search"
              type="search"
              placeholder="名前・メールで検索..."
              oninput="filterUsers(this.value,'all')"
            />
            <span class="pill active" id="pill-all" onclick="filterUsers(document.querySelector('.filter-search').value,'all')">全員</span>
            <span class="pill" id="pill-admin" onclick="filterUsers(document.querySelector('.filter-search').value,'admin')">管理者のみ</span>
          </div>

          <div class="table-wrap">
            <table class="dt">
              <thead>
                <tr>
                  <th>名前</th>
                  <th>ログインID</th>
                  <th>権限</th>
                  <th>作成日</th>
                  <th class="col-actions"></th>
                </tr>
              </thead>
              <tbody id="users-tbody">
                {users.map((u) => (
                  <tr key={u.id} id={`user-row-${u.id}`} data-name={u.display_name.toLowerCase()} data-email={u.email.toLowerCase()} data-role={u.is_admin === 1 ? 'admin' : 'member'}>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar" style="flex-shrink:0">
                          {u.display_name.split(/\s+/).map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?'}
                        </div>
                        <span style="font-weight:500">{u.display_name}</span>
                      </div>
                    </td>
                    <td style="font-family:var(--font-mono);font-size:12.5px;color:var(--sub)">{u.email}</td>
                    <td>
                      {u.is_admin === 1 ? (
                        <span class="tag coral-soft">
                          <Icon name="crown" size={10} stroke="var(--coral-deep)" strokeWidth={2.2} />
                          admin
                        </span>
                      ) : (
                        <span class="tag">member</span>
                      )}
                    </td>
                    <td style="color:var(--sub);font-size:12.5px">{u.created_at.slice(0, 10)}</td>
                    <td class="col-actions">
                      {u.id !== currentUser.id && (
                        <button
                          class="icon-btn"
                          title="削除"
                          hx-post={`/admin/users/${u.id}/delete`}
                          hx-target={`#user-row-${u.id}`}
                          hx-swap="outerHTML swap:0.3s"
                          hx-confirm="このユーザーを削除しますか？"
                          style="color:var(--sub)"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        class="overlay"
        id="invite-dialog"
        style="display:none"
        onclick="if(event.target===this)this.style.display='none'"
      >
        <div class="dialog">
          <h3>ユーザーを招待</h3>
          <p>新しいユーザーアカウントを作成します。</p>
          <form
            hx-post="/admin/users"
            hx-target="#invite-result"
            hx-swap="innerHTML"
            {...({
              'hx-on::after-request': "if(event.detail.successful){document.getElementById('invite-dialog').style.display='none';location.reload()}",
            } as object)}
          >
            <div class="form-field">
              <label class="form-label">表示名</label>
              <input class="form-input" name="display_name" type="text" required placeholder="山田 太郎" />
            </div>
            <div class="form-field">
              <label class="form-label">メールアドレス（ログインID）</label>
              <input class="form-input" name="email" type="email" required placeholder="taro@example.com" />
            </div>
            <div class="form-field">
              <label class="form-label">初期パスワード</label>
              <input class="form-input" name="password" type="password" required minlength={8} placeholder="8文字以上" />
            </div>
            <div class="form-field" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" name="is_admin" id="is-admin-check" style="width:15px;height:15px" />
              <label for="is-admin-check" style="font-size:13px;cursor:pointer">管理者権限を付与する</label>
            </div>
            <div id="invite-result" style="margin-bottom:12px;font-size:12px" />
            <div class="dialog-actions">
              <button
                type="button"
                class="btn-ghost"
                onclick="document.getElementById('invite-dialog').style.display='none'"
              >
                キャンセル
              </button>
              <button type="submit" class="btn-primary">作成</button>
            </div>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        var _activeFilter = 'all';
        function filterUsers(q, role) {
          if (role) {
            _activeFilter = role;
            document.getElementById('pill-all').className = 'pill' + (role === 'all' ? ' active' : '');
            document.getElementById('pill-admin').className = 'pill' + (role === 'admin' ? ' active' : '');
          }
          var ql = (q || '').toLowerCase();
          document.querySelectorAll('#users-tbody tr').forEach(function(row) {
            var matchRole = _activeFilter === 'all' || row.dataset.role === _activeFilter;
            var matchQ = !ql || (row.dataset.name || '').includes(ql) || (row.dataset.email || '').includes(ql);
            row.style.display = matchRole && matchQ ? '' : 'none';
          });
        }
      `}} />
    </Layout>
  )
}
