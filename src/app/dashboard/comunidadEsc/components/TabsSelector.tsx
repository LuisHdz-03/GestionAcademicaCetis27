"use client";

interface TabsSelectorProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: "docentes", label: "Docentes" },
  { id: "alumnos", label: "Alumnos" },
  { id: "administradores", label: "Administradores" },
];

export default function TabsSelector({ activeTab, setActiveTab }: TabsSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === tab.id
              ? "bg-[#691C32] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
