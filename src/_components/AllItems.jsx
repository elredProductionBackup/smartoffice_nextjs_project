import ActionItem from "./ActionItem";

export default function AllItems({ items, onToggle,handleDelete,onOpen }) {


  return (
    <div className="flex flex-col gap-[20px] w-full">
        {items.map((item) => (
            <ActionItem
               key={item.actionableId}
              item={item}
              onCheck={() => onToggle(item)}
              onOpen={() => onOpen(item)}
              handleDelete={()=>handleDelete(item.actionableId)}
            />
        ))}
    </div>
  );
}
