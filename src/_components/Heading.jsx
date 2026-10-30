import React from 'react'

const Heading = ({title, margin}) => {
  return (
    <div className={`font-heading text-4xl sm:text-5xl font-semibold text-center text-[#333333] ${margin}`}>{title}</div>
  )
}

export default Heading