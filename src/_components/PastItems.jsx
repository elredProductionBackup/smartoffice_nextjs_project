import ActionItem from "./ActionItem";

export default function PastItems({ items, onToggle }) {
  return (
    <div className="flex flex-col gap-[20px] w-full">
      {items.map((item) => (
        <ActionItem
          key={item.id}
          {...item}
          completed
          onCheck={() => onToggle(item.id)} 
        />
      ))}
    </div>
  );
}
