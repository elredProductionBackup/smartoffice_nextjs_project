import ActionItem from "./ActionItem";

export default function AllItems({ items, onToggle }) {


  return (
    <div className="flex flex-col gap-[20px] w-full">
        {items.map((item) => (
            <ActionItem
              key={item.id}
              {...item}
              completed={false}
              onCheck={() => onToggle(item.id)}
            />
        ))}
    </div>
  );
}
