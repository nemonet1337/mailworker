import { FC } from 'hono/jsx'
import { Layout } from '../layout'
import { Icon } from '../icons'
import { SessionUser } from '../../types'

type DailyCount = { day: string; cnt: number }
type AddrStat = { to_address: string; cnt: number }
type RecentEmail = { id: string; from_: string; subject: string; received_at: string; is_read: number }

const Spark: FC<{ data: DailyCount[]; width?: number; height?: number }> = ({
  data,
  width = 80,
  height = 32,
}) => {
  if (data.length < 2) return <svg width={width} height={height} />
  const max = Math.max(...data.map((d) => d.cnt), 1)
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.cnt / max) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const poly = [...pts, `${width},${height}`, `0,${height}`].join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style="overflow:visible">
      <polygon points={poly} fill="oklch(0.94 0.035 30)" stroke="none" />
      <polyline points={pts.join(' ')} fill="none" stroke="var(--coral)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  )
}

const KpiTile: FC<{ label: string; value: number; sub?: string; spark?: DailyCount[] }> = ({
  label,
  value,
  sub,
  spark,
}) => (
  <div class="kpi-tile">
    <div class="kpi-label">{label}</div>
    <div class="kpi-value">{value.toLocaleString()}</div>
    {sub && <div class="kpi-sub">{sub}</div>}
    {spark && spark.length > 0 && (
      <div style="position:absolute;right:12px;bottom:12px;opacity:0.85">
        <Spark data={spark} />
      </div>
    )}
  </div>
)

export const DashboardPage: FC<{
  currentUser: SessionUser
  receivedCount: number
  unreadCount: number
  userCount: number
  addressCount: number
  dailyData: DailyCount[]
  addrStats: AddrStat[]
  recentEmails: RecentEmail[]
}> = ({
  currentUser,
  receivedCount,
  unreadCount,
  userCount,
  addressCount,
  dailyData,
  addrStats,
  recentEmails,
}) => {
  const maxAddrCnt = Math.max(...addrStats.map((a) => a.cnt), 1)

  return (
    <Layout title="ダッシュボード" user={currentUser} active="dashboard">
      <div class="page">
        <div class="page-inner">
          <div class="page-header">
            <div>
              <h1 class="page-title">ダッシュボード</h1>
              <div class="page-subtitle">過去30日間の統計</div>
            </div>
            <div class="page-actions">
              <button class="icon-btn" title="更新" onclick="location.reload()">
                <Icon name="refresh" size={16} />
              </button>
            </div>
          </div>

          <div class="kpi-grid">
            <KpiTile
              label="受信メール（30日）"
              value={receivedCount}
              sub="通"
              spark={dailyData}
            />
            <KpiTile label="未読" value={unreadCount} sub="通" />
            <KpiTile label="ユーザー数" value={userCount} sub="名" />
            <KpiTile label="アドレス数" value={addressCount} sub="個" />
          </div>

          {addrStats.length > 0 && (
            <div class="section-card" style="margin-bottom:20px">
              <div class="section-card-header">
                <span class="section-card-title">アドレス別受信数（30日）</span>
                <span class="section-card-sub">上位{addrStats.length}件</span>
              </div>
              {addrStats.map((a) => (
                <div key={a.to_address} class="addr-bar-row">
                  <div class="addr-bar-label" title={a.to_address}>
                    {a.to_address.split('@')[0]}
                  </div>
                  <div class="addr-bar-track">
                    <div
                      class="addr-bar-fill"
                      style={`width:${Math.round((a.cnt / maxAddrCnt) * 100)}%`}
                    />
                  </div>
                  <div class="addr-bar-count">{a.cnt}</div>
                </div>
              ))}
            </div>
          )}

          {recentEmails.length > 0 && (
            <div class="section-card">
              <div class="section-card-header">
                <span class="section-card-title">最近の受信</span>
              </div>
              <table class="dt">
                <thead>
                  <tr>
                    <th></th>
                    <th>差出人</th>
                    <th>件名</th>
                    <th>受信日時</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmails.map((e) => (
                    <tr key={e.id}>
                      <td style="width:24px;padding:14px 8px 14px 16px">
                        {e.is_read === 0 && (
                          <div style="width:6px;height:6px;border-radius:3px;background:var(--coral)" />
                        )}
                      </td>
                      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        {e.from_}
                      </td>
                      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500">
                        {e.subject || '(件名なし)'}
                      </td>
                      <td style="white-space:nowrap;color:var(--sub);font-size:12px">
                        {e.received_at.slice(0, 16).replace('T', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
