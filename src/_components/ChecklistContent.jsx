import React from 'react'
import ButtonComp from './ButtonComp'

const ChecklistContent = () => {
  return (
    <div>


    
      {/* =============== Event List and empty Condition ================  */}
      {true && ( // condition
      <div className="flex flex-col items-center justify-center py-24 w-full">
        <img
          src="/image/Events_checklist.svg"
          alt="No Logistics Info"
          className="w-[80px] h-[80px] mb-6 object-contain"
        />
        <div className=" text-lg mb-2 text-[24px] font-semibold">No information yet</div>
        <div className="text-gray-500 text-base text-[16px] font-normal">Looks like no information about Logistics yet</div>
      </div>
    )}
    </div>
  )
}

export default ChecklistContent