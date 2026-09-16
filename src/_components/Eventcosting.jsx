import { EventCostingTab } from './EventCosting/Eventcostingtab'

const Eventcosting = ({ eventId, eventBudget, event }) => {
  return (
    <EventCostingTab
      eventId={eventId}
      event={event}
      totalBudget={eventBudget ?? 0}

    />
  )
}

export default Eventcosting