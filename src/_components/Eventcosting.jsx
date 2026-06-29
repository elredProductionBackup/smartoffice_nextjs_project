import { EventCostingTab } from './EventCosting/Eventcostingtab'

const Eventcosting = () => {
  return (
    <EventCostingTab
      totalBudget={500000}
      categories={[
        { name: "Workshops & Training", percentage: 33 },
        { name: "Speaker Sessions", percentage: 28 },
        { name: "Books & Resources", percentage: 19 },
        { name: "Certification Programs", percentage: 20 },
      ]}
    />
  )
}

export default Eventcosting