import { EVERY_CALLER } from './callerTable'
import { MoodFace } from './calendarParts'
import { nameOf } from './privacy'
import { MOOD } from './engine/tasks'

export function EveryCaller({ reveal }: { reveal: boolean }) {
  return (
    <>
      <div className="legend">
        {Object.values(MOOD).map((m) => (
          <span className="mlg" key={m.label}>
            {m.e} <b>{m.label}</b>: {m.tip}
          </span>
        ))}
      </div>
      <div className="wrap">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Mood</th>
              <th style={{ textAlign: 'center' }}>Calls</th>
              <th>Reason</th>
              <th>What Jade did</th>
              <th>Urgent?</th>
              <th>Booked / review on</th>
            </tr>
          </thead>
          <tbody>
            {EVERY_CALLER.map(([k, title, rows]) => [
              <tr className={`gh k-${k}`} key={`g-${title}`}>
                <td colSpan={7}>
                  {title} ({rows.length})
                </td>
              </tr>,
              ...rows.map((r, i) => {
                const [main, warn] = r[6].split(' ⚠')
                return (
                  <tr className={`row k-${k}`} key={`${title}-${i}`}>
                    <td className="nm">{nameOf(r[0], reveal)}</td>
                    <td className="md">
                      <MoodFace mood={r[1]} /> {MOOD[r[1]].label}
                    </td>
                    <td className="c">{r[2]}</td>
                    <td>{r[3]}</td>
                    <td>{r[4]}</td>
                    <td>
                      <span className={`pill ${r[5] ? 'yes' : 'no'}`}>
                        {r[5] ? 'Urgent' : 'Not urgent'}
                      </span>
                    </td>
                    <td>
                      {main}
                      {warn !== undefined && (
                        <span className="warn">⚠{warn}</span>
                      )}
                    </td>
                  </tr>
                )
              }),
            ])}
          </tbody>
        </table>
      </div>
      <div className="foot">
        Clinical detail is summarised as a category on purpose. Names are
        shortened and phone numbers masked unless revealed, because anyone at
        the front desk can see this screen. "Urgent" means it needs action
        today: an urgent patient or an unanswered repeat complaint. Jade's own
        "priority" flags are re-checked by the final pass, which is why Kevin
        Turner is "Not urgent". Weekdays follow the dates in the call data.
      </div>
    </>
  )
}
