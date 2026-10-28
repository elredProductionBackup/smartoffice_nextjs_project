import React from 'react'

const Heading = ({title, margin}) => {
  return (
    <div className={`font-heading text-5xl font-semibold text-[#333333] ${margin}`}>{title}</div>
  )
}

export default Heading