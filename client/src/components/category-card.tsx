import { ReactNode } from "react";

interface CategoryCardProps {
  name: string;
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
  href: string;
}

export default function CategoryCard({ name, icon, bgColor, iconColor, href }: CategoryCardProps) {
  return (
    <a href={href} className="bg-white p-4 rounded-lg text-center shadow-sm hover:shadow transition-all duration-200">
      <div className={`w-12 h-12 mx-auto ${bgColor} rounded-lg flex items-center justify-center mb-3`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <h3 className="font-medium text-slate-800">{name}</h3>
    </a>
  );
}
