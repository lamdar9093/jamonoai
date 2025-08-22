import { useMemo } from "react";

interface SkillBadgeProps {
  skill: string;
}

export default function SkillBadge({ skill }: SkillBadgeProps) {
  // Map skills to colors
  const colorMapping = useMemo(() => {
    const colors = {
      // DevOps & CI/CD
      docker: "bg-blue-100 text-blue-800",
      kubernetes: "bg-blue-100 text-blue-800",
      jenkins: "bg-purple-100 text-purple-800",
      cicd: "bg-purple-100 text-purple-800",
      gitlab: "bg-orange-100 text-orange-800",
      github: "bg-gray-100 text-gray-800",

      // Cloud
      aws: "bg-yellow-100 text-yellow-800",
      gcp: "bg-red-100 text-red-800",
      azure: "bg-indigo-100 text-indigo-800",
      cloud: "bg-blue-100 text-blue-800",
      
      // Infrastructure
      terraform: "bg-green-100 text-green-800",
      ansible: "bg-red-100 text-red-800",
      pulumi: "bg-purple-100 text-purple-800",
      
      // System Administration
      linux: "bg-blue-100 text-blue-800",
      networking: "bg-gray-100 text-gray-800",
      security: "bg-orange-100 text-orange-800",
      monitoring: "bg-green-100 text-green-800",
      
      // Programming
      javascript: "bg-yellow-100 text-yellow-800",
      typescript: "bg-blue-100 text-blue-800",
      python: "bg-indigo-100 text-indigo-800",
      go: "bg-blue-100 text-blue-800",
      java: "bg-red-100 text-red-800",
      
      // Databases
      sql: "bg-blue-100 text-blue-800",
      mongodb: "bg-green-100 text-green-800",
      postgres: "bg-indigo-100 text-indigo-800",
      redis: "bg-red-100 text-red-800",
      
      // Defaults
      default: "bg-gray-100 text-gray-800"
    };
    
    // Convert all keys to lowercase for case-insensitive matching
    return Object.entries(colors).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    }, {} as Record<string, string>);
  }, []);
  
  // Get the color class based on the skill (case-insensitive)
  const getColorClass = (skillName: string): string => {
    const lowerSkill = skillName.toLowerCase();
    
    // Try exact match first
    if (colorMapping[lowerSkill]) {
      return colorMapping[lowerSkill];
    }
    
    // Try partial match
    for (const [key, value] of Object.entries(colorMapping)) {
      if (lowerSkill.includes(key)) {
        return value;
      }
    }
    
    // Return default if no match
    return colorMapping.default;
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass(skill)}`}>
      {skill}
    </span>
  );
}
