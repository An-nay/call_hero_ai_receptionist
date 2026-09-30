import { ActionDialog } from './features/action-dialog/ActionDialog'
import { ActionList } from './features/actions/ActionList'
import { OperationsCalendar } from './features/calendars/OperationsCalendar'
import { DashboardShell } from './features/shell/DashboardShell'
import { SummaryBar } from './features/summary/SummaryBar'
import { DashboardProvider } from './state/DashboardContext'

export function App() {
  return (
    <DashboardProvider>
      <DashboardShell
        summary={<SummaryBar />}
        calendar={<OperationsCalendar />}
        actions={<ActionList />}
      />
      <ActionDialog />
    </DashboardProvider>
  )
}
